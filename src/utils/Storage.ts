import {IQuadStore} from '../interfaces/IQuadStore';
import {defaultGraph, Graph, NamedNode, Quad} from '../models';
import {QuadSet} from '../collections/QuadSet';
import {CoreMap} from '../collections/CoreMap';
import {NodeSet} from '../collections/NodeSet';
import {Shape} from '../shapes/Shape';
import {NodeShape} from '../shapes/SHACL';
import {ICoreIterable} from '../interfaces/ICoreIterable';
import {eventBatcher} from '../events/EventBatcher';
import nextTick from 'next-tick';
import {QuadArray} from '../collections/QuadArray';
import {CoreSet} from '../collections/CoreSet';
import {ShapeSet} from '../collections/ShapeSet';
import {LinkedDataRequest} from '../interfaces/Component';

export abstract class Storage {
  private static defaultStore: IQuadStore;
  private static _initialized: boolean;
  private static graphToStore: CoreMap<Graph, IQuadStore> = new CoreMap();
  private static shapesToGraph: CoreMap<typeof Shape, Graph> = new CoreMap();
  private static nodeShapesToGraph: CoreMap<NodeShape, Graph> = new CoreMap();
  private static defaultStorageGraph: Graph;
  private static processingPromise: {
    promise: Promise<void>;
    resolve?: any;
    reject?: any;
  };
  private static storedEvents: any;

  static init() {
    if (!this._initialized) {
      //listen to any quad changes in local memory
      // Quad.emitter.on(Quad.QUADS_CREATED,(...args) =>
      //   this.onQuadsCreated.apply(this,args),
      // );
      // Quad.emitter.on(Quad.QUADS_REMOVED,this.onQuadsRemoved.bind(this));

      Quad.emitter.on(Quad.QUADS_ALTERED, this.onEvent.bind(this, Quad.QUADS_ALTERED));
      NamedNode.emitter.on(NamedNode.STORE_NODES, this.onEvent.bind(this, NamedNode.STORE_NODES));

      // Quad.emitter.on(Quad.QUADS_ALTERED,this.onQuadsAltered.bind(this));
      // NamedNode.emitter.on(NamedNode.STORE_NODES,this.onStoreNodes.bind(this));

      NamedNode.emitter.on(NamedNode.REMOVE_NODES, this.onEvent.bind(this, NamedNode.REMOVE_NODES));
      NamedNode.emitter.on(NamedNode.CLEARED_PROPERTIES, this.onEvent.bind(this, NamedNode.CLEARED_PROPERTIES));

      this._initialized = true;
    }
  }

  /**
   * Returns true if Storage is set up to use any specific store
   * returns false if storage is managed manually, and no call like Storage.setDefaultStore has been made
   */
  static isInitialised() {
    return this.defaultStore && true;
  }

  static onEvent(eventType, ...args) {
    //so either a TRIPLES_ALTERED, CLEARED_PROPERTIES, STORE_RESOURCES or REMOVE_RESOURCES event comes in

    //if we havn't stored any events yet
    if (!this.storedEvents) {
      //start storing
      this.storedEvents = {};

      //and if we're not already in an active processing cycle
      //then let's start processing whatever we store in this event cycle on the next tick
      if (!this.processingPromise) {
        this.startProcessingOnNextTick();
      }
    }

    //save the event to be processed later
    if (!this.storedEvents[eventType]) {
      this.storedEvents[eventType] = [];
    }
    this.storedEvents[eventType].push(args);
  }

  private static startProcessingOnNextTick() {
    //create the processing promise, so that any request for promiseUpdate() will already get the promise that resolves after these events are handled
    var resolve, reject;
    var promise = new Promise<any>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.processingPromise = {promise, resolve, reject};

    //start processing the stored events on the next tick
    nextTick(() => {
      this.processStoredEvents();
    });
  }

  static async processStoredEvents() {
    let storedEvents = this.storedEvents;
    this.storedEvents = null;

    //we store and then process events, so we can determine in which order we process them.
    //the order of this array determines the order.
    //each entry in the array that is looped is an event type + handler
    let processOrder: [string, Function][] = [
      [NamedNode.REMOVE_NODES, this.onRemoveNodes],
      [NamedNode.CLEARED_PROPERTIES, this.onClearedProperties],
      [NamedNode.STORE_NODES, this.onStoreNodes],
      [Quad.QUADS_ALTERED, this.onQuadsAltered],
    ];

    //combine multiple events that want to add/remove quads into 1
    if (storedEvents[Quad.QUADS_ALTERED] && storedEvents[Quad.QUADS_ALTERED].length > 1) {
      let created = new QuadSet();
      let removed = new QuadSet();
      storedEvents[Quad.QUADS_ALTERED].forEach(([quadsCreated, quadsRemoved]: [QuadSet, QuadSet]) => {
        quadsCreated.forEach((q) => created.add(q));
        quadsRemoved.forEach((q) => removed.add(q));
      });
      //remove things that have been created & removed during the previous execution cycle
      removed.forEach((q) => {
        if (created.has(q)) {
          removed.delete(q);
          created.delete(q);
        }
      });
      //replace stored events with one stored event that has again 2 args, the combined sets
      storedEvents[Quad.QUADS_ALTERED] = [[created, removed]];
    }
    //combine the Sets of multiple STORE_NODES/REMOVE_NODES/CLEARED_PROPERTIES events into one Set each
    // note that since they have slightly different values, this will convert NodeSets of STORE_NODES  to a CoreSet (note a NodeSet)
    [NamedNode.STORE_NODES, NamedNode.REMOVE_NODES].forEach((eventType) => {
      if (storedEvents[eventType] && storedEvents[eventType].length > 1) {
        let mergedNodes = new CoreSet();
        storedEvents[eventType].forEach(([nodesCreated]: [CoreSet<any>]) => {
          nodesCreated.forEach((n) => mergedNodes.add(n));
        });
        //replace stored events with one stored event that has again 2 args, the combined sets
        storedEvents[eventType] = [[mergedNodes]];
      }
    });

    let success = true;
    for (const [eventType, handler] of processOrder) {
      if (storedEvents[eventType]) {
        success =
          success &&
          (await Promise.all(
            storedEvents[eventType].map((args) => {
              return handler.apply(this, args);
            }),
          )
            .then(() => true)
            .catch((err) => {
              console.warn('Error whilst processing ' + eventType, err);
              return false;
            }));
      }
    }

    this.finalizeProcess(success);
  }

  private static finalizeProcess(success: boolean) {
    if (success) {
      //if we changed graphs in the process, there may be more events waiting
      if (eventBatcher.hasBatchedEvents()) {
        //let's make sure we process those as well before resolving
        eventBatcher.dispatchBatchedEvents();
      }
      //if we now have work to do
      if (this.storedEvents) {
        //do that and come back here later
        this.processStoredEvents();
      } else {
        //no more storage work to do for sure! let's resolve
        this.processingPromise.resolve();
        this.processingPromise = null;
      }
    } else {
      this.processingPromise.reject();
      this.processingPromise = null;
    }
  }

  static setDefaultStore(store: IQuadStore) {
    this.defaultStore = store;
    this.defaultStore.init();
    let defaultGraph = store.getDefaultGraph();
    if (defaultGraph) {
      this.setDefaultStorageGraph(defaultGraph);
      this.setStoreForGraph(store, defaultGraph);
    } else {
      console.warn('Default store did not return a default graph.');
    }
    this.init();
  }

  static setDefaultStorageGraph(graph: Graph) {
    this.defaultStorageGraph = graph;
  }

  static storeShapesInGraph(graph: Graph, ...shapeClasses: typeof Shape[]) {
    shapeClasses.forEach((shapeClass) => {
      this.shapesToGraph.set(shapeClass, graph);
      if (shapeClass['shape']) {
        this.nodeShapesToGraph.set(shapeClass['shape'], graph);
      }
    });
    this.init();
  }

  static setStoreForGraph(store: IQuadStore, graph) {
    this.graphToStore.set(graph, store);
  }

  static getGraphForStore(store: IQuadStore): Graph {
    for (let [graph, targetStore] of this.graphToStore) {
      //shapes don't have to be the same instance, but they share the same node
      if (store['node'] === targetStore['node']) {
        return graph;
      }
    }
  }

  /**
   * Set the target store for instances of these shapes
   * @param store
   * @param shapes
   */
  static storeShapesInStore(store: IQuadStore, ...shapes: typeof Shape[]) {
    let graph = store.getDefaultGraph();
    this.setStoreForGraph(store, graph);
    this.storeShapesInGraph(graph, ...shapes);
  }

  private static assignQuadsToGraph(quads: ICoreIterable<Quad>) {
    let map = this.getTargetGraphMap(quads);
    let alteredNodes = new CoreMap<NamedNode, Graph>();
    map.forEach((quads, graph) => {
      quads.forEach((quad) => {
        //move the quad to the target graph (both old and new graph will be updated)
        if (quad.graph !== graph) {
          quad.moveToGraph(graph);
          //also keep track of which nodes had a quad that moved to a different graph
          if (!alteredNodes.has(quad.subject)) {
            alteredNodes.set(quad.subject, graph);
          }
        }
      });
    });

    //now that all quads have been updated, we need to check one more thing
    //changes in quads MAY have changed which shapes the subject nodes are an instance of
    //thus the target graph of the whole node may have changed, so:
    this.moveAllQuadsOfNodeIfRequired(alteredNodes);
  }

  private static moveAllQuadsOfNodeIfRequired(alteredNodes: CoreMap<NamedNode, Graph>) {
    //for all subjects who have a quad that moved to a different graph
    alteredNodes.forEach((graph, subjectNode) => {
      //go over each quad of that node
      subjectNode.getAllQuads().forEach((quad) => {
        //and if that quad is not in the same graph as the target graph that we just determined for that node
        if (quad.graph !== graph) {
          //then update it
          quad.moveToGraph(graph);
        }
      });
    });
  }

  static promiseUpdated(): Promise<void> {
    //we wait till all events are dispatched
    return eventBatcher.promiseDone().then(() => {
      //if that triggered a storage update
      if (this.processingPromise) {
        //we will wait for that
        return this.processingPromise.promise;
      }
    });
  }

  private static onQuadsAltered(quadsCreated: QuadSet, quadsRemoved: QuadSet) {
    //quads may have been removed since they have been created and emitted filter that out here
    quadsCreated = quadsCreated.filter((q) => !q.isRemoved);

    //first see if any new quads need to move to the right graphs (note that this will possibly add "mimiced" quads (with the previous graph as their graph) to quadsRemoved)
    this.assignQuadsToGraph(quadsCreated);

    //next, notify the right stores about these changes
    let addMap = this.getTargetStoreMap(quadsCreated);
    let removeMap = this.getTargetStoreMap(quadsRemoved);

    //combine the keys of both maps (which are stores)
    let stores = [...addMap.keys(), ...removeMap.keys()];

    //go over each store that has added/removed quads
    return Promise.all(
      stores.map((store) => {
        return store.update(addMap.get(store) || [], removeMap.get(store) || []);
      }),
    )
      .then((res) => {
        return res;
      })
      .catch((err) => {
        console.warn('Error during storage update: ' + err);
      });
  }

  private static getTargetGraph(subject: NamedNode): Graph {
    let subjectShapes = NodeShape.getShapesOf(subject);

    //see if any of these shapes has a specific target graph
    for (let shape of subjectShapes) {
      if (this.nodeShapesToGraph.has(shape)) {
        //currently, the target graph of the very first shape that has a target graph is returned
        return this.nodeShapesToGraph.get(shape);
      }
    }

    if (!subject.isTemporaryNode && this.defaultStorageGraph) {
      return this.defaultStorageGraph;
    }

    //if no shape defined a target graph OR if the node is a temporary node
    //then use the default graph
    return defaultGraph;
  }

  private static async onClearedProperties(clearProperties: CoreMap<NamedNode,[NamedNode,QuadArray][]>): Promise<any> {

    let subjects = new NodeSet<NamedNode>(clearProperties.keys());

    //get a map of where each of these nodes are stored
    let storeMap = this.getTargetStoreMapForNodes(subjects);

    //call on each store to remove the appropriate nodes
    await Promise.all(
      [...storeMap.entries()].map(([store, subjects]) => {
        let storeClearMap:CoreMap<NamedNode,NodeSet<NamedNode>> = new CoreMap()
        subjects.forEach(subject => {
          let subjectClearMap = new NodeSet<NamedNode>();
          clearProperties.get(subject).forEach(([clearedProperty,quads]) => {
            //TODO: if we ever need access to the LOCALLY cleared quads in the remote stores, grab & send them from here
            // However, if we don't, we can reshape the NamedNode model so that quads don't get sent in these events anymore
            subjectClearMap.add(clearedProperty);
          })
          storeClearMap.set(subject,subjectClearMap)
        })
        return store.clearProperties(storeClearMap);
      }),
    )
      .then((res) => {
        return res;
      })
      .catch((err) => {
        console.warn('Error during removal of nodes from storage: ' + err);
      });
  }
  private static async onRemoveNodes(nodesAndQuads: CoreSet<[NamedNode, QuadArray]>): Promise<any> {
    //turn all the removed quads back on (as if they were still in the graph)
    //this allows us to read the properties of the node as they were just before the node was removed.
    let nodes = new NodeSet<NamedNode>();
    nodesAndQuads.forEach(([node, quads]) => {
      quads.turnOn();
      nodes.add(node);
    });

    //get a map of where each of these nodes are stored
    let storeMap = this.getTargetStoreMapForNodes(nodes);

    //turn the quads back off (they should be removed after all)
    nodesAndQuads.forEach(([node, quads]) => {
      quads.turnOff();
    });

    //call on each store to remove the appropriate nodes
    await Promise.all(
      [...storeMap.entries()].map(([store, nodesToRemove]) => {
        return store.removeNodes(nodesToRemove);
      }),
    )
      .then((res) => {
        return res;
      })
      .catch((err) => {
        console.warn('Error during removal of nodes from storage: ' + err);
      });
  }

  private static async onStoreNodes(nodes: CoreSet<NamedNode>): Promise<any> {
    //TODO: no need to convert to QuadSet once we phase out QuadArray
    let nodesWithTempURIs = nodes.filter((node) => node.uri.indexOf(NamedNode.TEMP_URI_BASE) === 0);

    let storeMap = this.getTargetStoreMapForNodes(nodesWithTempURIs);
    await Promise.all(
      [...storeMap.entries()].map(([store, temporaryNodes]) => {
        return store.setURI(...temporaryNodes);
      }),
    );
    //move all the quads to the right graph.
    //note that IF this is a new graph, this will trigger onQuadsAltered, which will notify the right stores to store these quads
    let quads = new QuadSet();
    nodes.forEach((node) => {
      node.getAllQuads().forEach((quad) => {
        quads.add(quad);
      });
    });
    this.assignQuadsToGraph(quads);
  }

  private static getTargetStoreForNode(node: NamedNode) {
    let graph = this.getTargetGraph(node);
    return this.getTargetStoreForGraph(graph);
  }

  private static getTargetStoreForGraph(graph: Graph) {
    return this.graphToStore.get(graph);
    // if(this.graphToStore.has(graph))
    // {
    // }
    // return this.defaultStore;
  }

  private static groupQuadsBySubject(quads: ICoreIterable<Quad>): CoreMap<NamedNode, Quad[]> {
    let subjectsToQuads: CoreMap<NamedNode, Quad[]> = new CoreMap();
    quads.forEach((quad) => {
      if (!subjectsToQuads.has(quad.subject)) {
        subjectsToQuads.set(quad.subject, []);
      }
      subjectsToQuads.get(quad.subject).push(quad);
    });
    return subjectsToQuads;
  }

  private static getTargetGraphMap(quads: ICoreIterable<Quad>): CoreMap<Graph, Quad[]> {
    let graphMap: CoreMap<Graph, Quad[]> = new CoreMap();
    let quadsBySubject = this.groupQuadsBySubject(quads);
    quadsBySubject.forEach((quads, subjectNode) => {
      let targetGraph = this.getTargetGraph(subjectNode);
      if (!graphMap.has(targetGraph)) {
        graphMap.set(targetGraph, []);
      }
      graphMap.set(targetGraph, graphMap.get(targetGraph).concat(quads));
    });
    return graphMap;
  }

  private static getTargetStoreMapForNodes(nodes: CoreSet<NamedNode>): CoreMap<IQuadStore, NamedNode[]> {
    return this.getStoreMapForIGraphObjects(nodes) as CoreMap<IQuadStore, NamedNode[]>;
  }
  private static getTargetStoreMapForShapes(shapes: ShapeSet): CoreMap<IQuadStore, Shape[]>
  {
    return this.getStoreMapForIGraphObjects(shapes) as CoreMap<IQuadStore, Shape[]>;
  }
  private static getStoreMapForIGraphObjects(objects:ShapeSet|CoreSet<NamedNode>)
  {
    let storeMap: CoreMap<IQuadStore, (NamedNode|Shape)[]> = new CoreMap();
    objects.forEach((object) => {
      let store = this.getTargetStoreForNode(object.node || object);
      //if store is null, this means no store is observing this node. This will usually happen for the default graph which contains temporary nodes
      if (store) {
        if (!storeMap.has(store)) {
          storeMap.set(store, []);
        }
        storeMap.get(store).push(object);
      }
    });
    return storeMap;
  }

  private static getTargetStoreMap(quads: ICoreIterable<Quad>): CoreMap<IQuadStore, Quad[]> {
    let storeMap: CoreMap<IQuadStore, Quad[]> = new CoreMap();
    quads.forEach((quad) => {
      let store = this.getTargetStoreForGraph(quad.graph);
      //if store is null, this means no store is observing this quad. This will usually happen for the default graph which contains temporary nodes
      if (store) {
        if (!storeMap.has(store)) {
          storeMap.set(store, []);
        }
        storeMap.get(store).push(quad);
      }
    });
    return storeMap;
  }

  static loadShapes(shapeSet: ShapeSet, shapeOrRequest: LinkedDataRequest): Promise<QuadArray> {
    let storeMap = this.getTargetStoreMapForShapes(shapeSet);
    return Promise.all(storeMap.map((shapes,store) => {
      return store.loadShapes(new ShapeSet(shapes),shapeOrRequest);
    })).then((results) => {
      // return new QuadArray();
      let quads = new QuadArray();
      results.forEach(result => {
        quads.push(...result as any);
      });
      return quads;
    })
  }
  static loadShape(shapeInstance: Shape, shapeOrRequest: LinkedDataRequest): Promise<QuadArray> {
    let store = this.getTargetStoreForNode(shapeInstance.namedNode);
    if(store)
    {
      return store.loadShape(shapeInstance, shapeOrRequest);
    }
    else
    {
      return Promise.resolve(null);
    }
  }
}
