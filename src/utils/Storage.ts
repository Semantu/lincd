import {IQuadStore} from '../interfaces/IQuadStore';
import {defaultGraph, Graph, NamedNode, Quad, Node} from '../models';
import {QuadSet} from '../collections/QuadSet';
import {CoreMap} from '../collections/CoreMap';
import {NodeSet} from '../collections/NodeSet';
import {Shape} from '../shapes/Shape';
import {NodeShape, PropertyShape} from '../shapes/SHACL';
import {ICoreIterable} from '../interfaces/ICoreIterable';
import {eventBatcher} from '../events/EventBatcher';
import nextTick from 'next-tick';
import {QuadArray} from '../collections/QuadArray';
import {CoreSet} from '../collections/CoreSet';
import {ShapeSet} from '../collections/ShapeSet';
import {LinkedDataRequest, TransformedLinkedDataResponse} from '../interfaces/Component';
import {getShapeClass, getSuperShapesClasses} from './ShapeClass';

export abstract class Storage {
  private static defaultStore: IQuadStore;
  private static _initialized: boolean;
  private static graphToStore: CoreMap<Graph, IQuadStore> = new CoreMap();
  private static shapesToGraph: CoreMap<typeof Shape, Graph> = new CoreMap();
  private static nodeShapesToGraph: CoreMap<NamedNode, Graph> = new CoreMap();
  private static defaultStorageGraph: Graph;
  private static processingPromise: {
    promise: Promise<void>;
    resolve?: any;
    reject?: any;
  };
  private static storedEvents: any;
  private static nodeToPropertyRequests: CoreMap<Node, CoreMap<NamedNode, true | Promise<any>>> = new CoreMap();
  private static propShapeMap: Map<NamedNode, PropertyShape[]>;

  static init() {
    if (!this._initialized) {
      Quad.emitter.on(Quad.QUADS_ALTERED, this.onEvent.bind(this, Quad.QUADS_ALTERED));
      NamedNode.emitter.on(NamedNode.STORE_NODES, this.onEvent.bind(this, NamedNode.STORE_NODES));

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

    //if we have not stored any events yet
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

  static getDefaultStore() {
    return this.defaultStore;
  }
  static setDefaultStore(store: IQuadStore) {
    this.defaultStore = store;
    this.defaultStore.init();
    let defaultGraph = store.getDefaultGraph();
    if (defaultGraph) {
      this.setDefaultStorageGraph(defaultGraph);
      this.setStoreForGraph(store, defaultGraph);
    } else {
      // console.warn('Default store did not return a default graph.');
    }

    this.init();
  }

  static setDefaultStorageGraph(graph: Graph) {
    this.defaultStorageGraph = graph;
  }

  static setGraphForShapes(graph: Graph, ...shapeClasses: (typeof Shape)[]) {
    shapeClasses.forEach((shapeClass) => {
      this.shapesToGraph.set(shapeClass, graph);
      if (shapeClass['shape']) {
        this.nodeShapesToGraph.set(shapeClass['shape'].namedNode, graph);
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

  static getStores(): CoreSet<IQuadStore> {
    return new CoreSet([...this.graphToStore.values()]);
  }
  /**
   * Set the target store for instances of these shapes
   * @param store
   * @param shapes
   */
  static setStoreForShapes(store: IQuadStore, ...shapes: (typeof Shape)[]) {
    let graph = store.getDefaultGraph();
    this.setStoreForGraph(store, graph);
    this.setGraphForShapes(graph, ...shapes);
  }

  private static assignQuadsToGraph(quads: QuadSet | QuadArray, removeFromSet: boolean = false) {
    let map = this.getTargetGraphMap(quads);
    let alteredNodes = new CoreMap<NamedNode, Graph>();
    let movedQuads = new QuadSet();
    map.forEach((graphQuads, graph) => {
      graphQuads.forEach((quad) => {
        if (quad.graph !== graph) {
          //move the quad to the target graph (both old and new graph will be updated)
          //this will trigger a QUADS_ALTERED event --> onQuadsAltered
          quad.moveToGraph(graph);

          //we also remove the quad from the set it was in, if requested
          //this prevents moved quads from still being added to the store of the old graph
          if (removeFromSet) {
            quads instanceof QuadSet ? quads.delete(quad) : quads.splice(quads.indexOf(quad), 1);
          }
          movedQuads.add(quad);
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
    return movedQuads.concat(this.moveAllQuadsOfNodeIfRequired(alteredNodes));
  }

  private static moveAllQuadsOfNodeIfRequired(alteredNodes: CoreMap<NamedNode, Graph>): QuadSet {
    let movedQuads = new QuadSet();
    //for all subjects who have a quad that moved to a different graph
    alteredNodes.forEach((graph, subjectNode) => {
      //go over each quad of that node
      subjectNode.getAllQuads().forEach((quad) => {
        //and if that quad is not in the same graph as the target graph that we just determined for that node
        if (quad.graph !== graph) {
          //then update it
          quad.moveToGraph(graph);
          movedQuads.add(quad);
        }
      });
    });
    return movedQuads;
  }

  static async promiseUpdated(): Promise<void> {
    if (this.defaultStore) {
      await this.defaultStore.init();
    }
    //we wait till all events are dispatched
    return eventBatcher.promiseDone().then(() => {
      //if that triggered a storage update
      if (this.processingPromise) {
        //we will wait for that
        return this.processingPromise.promise;
      }
    });
  }

  private static onQuadsAltered(quadsCreated: QuadSet, quadsRemoved: QuadSet, baseStoreOnSubject: boolean = false) {
    //quads may have been removed since they have been created and emitted filter that out here
    let addMap, removeMap;
    if (quadsCreated) {
      quadsCreated = quadsCreated.filter((q) => !q.isRemoved);

      //first see if any new quads need to move to the right graphs (note that this will possibly add "mimiced" quads (with the previous graph as their graph) to quadsRemoved)
      //true, signals that we want to remove the quads from quadsCreated if they get moved
      this.assignQuadsToGraph(quadsCreated, true);
      if (baseStoreOnSubject) {
        addMap = this.getStoreMapForNodes(quadsCreated.getSubjects());
      } else {
        //default: get the right stores based on the graph of the quads
        addMap = this.getTargetStoreMap(quadsCreated);
      }
    }
    if (quadsRemoved) {
      if (baseStoreOnSubject) {
        removeMap = this.getStoreMapForNodes(quadsRemoved.getSubjects());
      } else {
        //default: get the right stores based on the graph of the quads
        removeMap = this.getTargetStoreMap(quadsRemoved);
      }
    }

    //combine the keys of both maps (which are stores)
    let stores = [...(addMap ? addMap.keys() : []), ...(removeMap ? removeMap.keys() : [])];

    //go over each store that has added/removed quads
    return Promise.all(
      stores.map(async (store) => {
        let storeAddQuads, storeRemoveQuads;
        if (baseStoreOnSubject) {
          //in case we looked up target stores based on the subject of the quads,
          // we need to still filter the quads to get only those that are relevant for this store
          let storeAddSubjects = addMap?.get(store);
          let storeRemoveSubjects = removeMap?.get(store);
          storeAddQuads = storeAddSubjects ? quadsCreated.filter((q) => storeAddSubjects.includes(q.subject)) : null;
          storeRemoveQuads = storeRemoveSubjects
            ? quadsRemoved.filter((q) => storeRemoveSubjects.includes(q.subject))
            : null;
        } else {
          storeAddQuads = addMap?.get(store) || null;
          storeRemoveQuads = removeMap?.get(store) || null;
        }
        return store.update(storeAddQuads, storeRemoveQuads);
      }),
    )
      .then((res) => {
        return res;
      })
      .catch((err) => {
        console.warn('Error during storage update: ' + err);
      });
  }

  static getGraphForNode(subject: NamedNode, checkShapes: boolean = true): Graph {
    if (checkShapes) {
      let subjectShapes = NodeShape.getShapesOf(subject);

      //see if any of these shapes has a specific target graph
      for (let shape of subjectShapes) {
        if (this.nodeShapesToGraph.has(shape.namedNode)) {
          //currently, the target graph of the very first shape that has a target graph is returned
          return this.nodeShapesToGraph.get(shape.namedNode);
        }
      }
    }

    //if it's not a temporary node, and we have a default graph for permanent storage, then use that
    if (!subject.isTemporaryNode && this.defaultStorageGraph) {
      return this.defaultStorageGraph;
    }

    //if no shape defined a target graph OR if the node is a temporary node
    //then use the default graph (which is usually not connected to any store, and just lives in local memory)
    //this prevents temporary local nodes from being automatically stored
    return defaultGraph;
  }

  static getDefaultStorageGraph() {
    return this.defaultStorageGraph || defaultGraph;
  }

  private static async onClearedProperties(
    clearProperties: CoreMap<NamedNode, [NamedNode, QuadArray][]>,
  ): Promise<any> {
    let subjects = new NodeSet<NamedNode>(clearProperties.keys());

    //get a map of where each of these nodes are stored
    let storeMap = this.getStoreMapForNodes(subjects);

    //call on each store to remove the appropriate nodes
    await Promise.all(
      [...storeMap.entries()].map(([store, subjects]) => {
        let storeClearMap: CoreMap<NamedNode, NodeSet<NamedNode>> = new CoreMap();
        subjects.forEach((subject) => {
          let subjectClearMap = new NodeSet<NamedNode>();
          clearProperties.get(subject).forEach(([clearedProperty, quads]) => {
            //TODO: if we ever need access to the LOCALLY cleared quads in the remote stores, grab & send them from here
            // However, if we don't, we can reshape the NamedNode model so that quads don't get sent in these events anymore
            subjectClearMap.add(clearedProperty);
          });
          storeClearMap.set(subject, subjectClearMap);
        });
        return store.clearProperties(storeClearMap);
      }),
    )
      .then((res) => {
        return res;
      })
      .catch((err) => {
        console.warn('Could not clear properties: ' + err);
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
    let storeMap = this.getStoreMapForNodes(nodes);

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
        console.warn('Could not remove nodes from storage: ' + err);
      });
  }

  private static async onStoreNodes(nodes: CoreSet<NamedNode>): Promise<any> {
    //TODO: no need to convert to QuadSet once we phase out QuadArray
    let nodesWithTempURIs = nodes.filter((node) => node.uri.indexOf(NamedNode.TEMP_URI_BASE) === 0);

    let storeMap = this.getStoreMapForNodes(nodesWithTempURIs);
    await Promise.all(
      [...storeMap.entries()].map(([store, temporaryNodes]) => {
        let nodeUriMap: CoreMap<NamedNode, string> = new CoreMap();
        temporaryNodes.forEach((node) => {
          nodeUriMap.set(node, node.uri);
        });
        //let the store determine the URI's for these nodes
        return store.setURIs(nodeUriMap).then((uriUpdates) => {
          //and THEN update them (yes this currently needs to be separate because the frontend requests new uri's before sending data,so this URI request should not change any URI's on the backend)
          uriUpdates.forEach(([oldUri, newUri]) => {
            let currentNode = NamedNode.getNamedNode(oldUri);
            //currently, when a node is saved and removed in the same event cycle, it will not be in the store anymore
            if (currentNode) {
              currentNode.uri = newUri;
            }
          });
        });
      }),
    );

    //now that their URI's are updated we can indicate that they are no longer temporary nodes
    //NOTE though that the code below will move the nodes to the right graphs, which will trigger update events (which ACTUALLY stores the nodes)
    //if in the meantime requests get made that involve this node as a value of a property, then the data of this node will no longer be sent over
    //even though it may NOT be known yet on the server. If this is a problem, we may want to (somehow) wait with setting temporaryNode to false untill after all the quads are moved AND stored
    nodes.forEach((node) => {
      // node.isTemporaryNode = false;
      //this may need to move to a later point, after quads are stored
      //this also resolves the promise that was returned when the node was .saved()
      node.isStoring = false;
    });

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

  static getStoreForNode(node: NamedNode) {
    let graph = this.getGraphForNode(node);
    return this.getStoreForGraph(graph);
  }

  static getStoreForGraph(graph: Graph) {
    return this.graphToStore.get(graph);
    // if(this.graphToStore.has(graph))
    // {
    // }
    // return this.defaultStore;
  }

  private static groupQuadsBySubject(quads: ICoreIterable<Quad>): CoreMap<NamedNode, QuadArray> {
    let subjectsToQuads: CoreMap<NamedNode, QuadArray> = new CoreMap();
    quads.forEach((quad) => {
      if (!subjectsToQuads.has(quad.subject)) {
        subjectsToQuads.set(quad.subject, new QuadArray());
      }
      subjectsToQuads.get(quad.subject).push(quad);
    });
    return subjectsToQuads;
  }

  private static getTargetGraphMap(quads: ICoreIterable<Quad>): CoreMap<Graph, QuadArray> {
    let graphMap: CoreMap<Graph, QuadArray> = new CoreMap();
    let quadsBySubject = this.groupQuadsBySubject(quads);
    quadsBySubject.forEach((quads, subjectNode) => {
      let targetGraph = this.getGraphForNode(subjectNode);
      if (!graphMap.has(targetGraph)) {
        graphMap.set(targetGraph, new QuadArray());
      }
      graphMap.set(targetGraph, new QuadArray(...graphMap.get(targetGraph).concat(quads)));
    });
    return graphMap;
  }

  static getStoreMapForNodes(nodes: ICoreIterable<NamedNode>): CoreMap<IQuadStore, NamedNode[]> {
    return this.getStoreMapForIGraphObjects(nodes) as CoreMap<IQuadStore, NamedNode[]>;
  }
  static getStoreMapForShapes(shapes: ShapeSet): CoreMap<IQuadStore, Shape[]> {
    return this.getStoreMapForIGraphObjects(shapes) as CoreMap<IQuadStore, Shape[]>;
  }
  private static getStoreMapForIGraphObjects(objects: ShapeSet | ICoreIterable<NamedNode>) {
    let storeMap: CoreMap<IQuadStore, (NamedNode | Shape)[]> = new CoreMap();
    objects.forEach((object) => {
      let store = this.getStoreForNode(object.node || object);
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

  private static getTargetStoreMap(quads: ICoreIterable<Quad>): CoreMap<IQuadStore, QuadArray> {
    let storeMap: CoreMap<IQuadStore, QuadArray> = new CoreMap();
    quads.forEach((quad) => {
      let store = this.getStoreForGraph(quad.graph);
      //if store is null, this means no store is observing this quad. This will usually happen for the default graph which contains temporary nodes
      if (store) {
        if (!storeMap.has(store)) {
          storeMap.set(store, new QuadArray());
        }
        storeMap.get(store).push(quad);
      }
    });
    return storeMap;
  }

  static async setURIs(nodeUriMap: CoreMap<NamedNode, string>): Promise<[string, string][]> {
    //organise the nodes by their appropriate store
    //and because these are nodes that are about to receive a URI so they can be stored
    //we temporarily make them non-temporary :)
    //this way the store map will contain the right target store for STORED nodes
    //so that THAT store can determine the URI
    let nodes: NodeSet<NamedNode> = new NodeSet();
    nodeUriMap.forEach((currentEnvironmentURI, node) => {
      node['tmp'] = node.isTemporaryNode;
      node.isTemporaryNode = false;
      nodes.add(node);
    });

    let storeMap = this.getStoreMapForNodes(nodes);
    nodes.forEach((node) => {
      node.isTemporaryNode = node['tmp'];
    });

    let promises = [];
    //let each store update the URI's
    storeMap.forEach((nodes, store) => {
      let storeNodeUriMap: CoreMap<NamedNode, string> = new CoreMap();
      nodes.forEach((node) => {
        storeNodeUriMap.set(node, nodeUriMap.get(node));
      });
      promises.push(store.setURIs(storeNodeUriMap));
    });
    //combine the results to return an array of old to new URI's
    return Promise.all(promises).then((results) => {
      let combinedResults: [string, string][] = [].concat(...results);
      return combinedResults;
    });
  }

  static update(toAdd: QuadSet, toRemove: QuadSet): Promise<void | any> {
    // let storeMap = this.getStoreMapForNodes(toRemove.getSubjects());
    // storeMap.forEach((nodes, store) => {
    //   let quads = toRemove.filter(q => nodes.includes(q.subject));
    //   store.deleteMultiple(quads);
    //
    // });
    return this.onQuadsAltered(toAdd, toRemove, true);
  }

  static clearProperties(subjectToPredicates: CoreMap<NamedNode, NodeSet<NamedNode>>): Promise<boolean> {
    let subjects = [...subjectToPredicates.keys()];
    let storeMap = this.getStoreMapForNodes(subjects);
    let promises = [];
    storeMap.forEach((nodes, store) => {
      let map = new CoreMap(
        nodes.map((node) => {
          return [node, subjectToPredicates.get(node)];
        }),
      );
      promises.push(store.clearProperties(map));
    });
    return Promise.all(promises).then((results) => {
      return results.every((result: boolean) => result === true);
    });
  }

  static loadShapes(
    shapeSet: ShapeSet,
    shapeOrRequest: LinkedDataRequest,
    byPassCache: boolean = false,
  ): Promise<QuadArray> {
    let nodes = shapeSet.getNodes();
    if (!byPassCache) {
      let cachedResult = this.nodesAreLoaded(nodes, shapeOrRequest);
      if (cachedResult) {
        //return the load promise that's already in progress,
        // or a promise that resolves to true straight away if it's already been loaded
        return cachedResult === true ? Promise.resolve(true) : cachedResult;
      }
    }

    let storeMap = this.getStoreMapForShapes(shapeSet);
    let storePromises = [];
    storeMap.map((shapes, store) => {
      storePromises.push(store.loadShapes(new ShapeSet(shapes), shapeOrRequest));
    });
    let loadPromise = Promise.all(storePromises).then((results) => {
      // return new QuadArray();
      let quads = new QuadArray();
      results.forEach((result) => {
        if (result instanceof QuadArray) {
          quads.push(...(result as any));
        }
      });
      //update the cache to indicate these property shapes have finished loading for these nodes
      this.setNodesLoaded(nodes, shapeOrRequest, true);
      return quads;
    });
    //update the cache to indicate these property shapes are being loaded for these nodes
    Storage.setNodesLoaded(nodes, shapeOrRequest, loadPromise);
    return loadPromise;
  }

  /**
   * Loads the requested Shape(s) from storage for a specific node.
   * To form a request see the LinkedDataRequest interface
   * Returns a promise that resolves when the loading has completed.
   * Requests are cached so the second time you request the same data you will get the same answer. Use byPassCache if you want to ensure the data is loaded again.
   * The returned promise resolves to null if no target store was found for this node (the app may not have a defaultStore set up then)
   * @param shapeInstance
   * @param shapeOrRequest
   * @param byPassCache
   */
  static loadShape(
    shapeInstance: Shape,
    shapeOrRequest?: LinkedDataRequest,
    byPassCache: boolean = false,
  ): Promise<QuadArray> {
    //if no shape is requested then we automatically request all properties of the shape
    if (!shapeOrRequest) {
      //TODO: maybe we can optimise requests by not sending all the shapes and letting the backend fill in the property shapes
      shapeOrRequest = [...shapeInstance.nodeShape.getPropertyShapes()];
      //also add the property shapes of all classes that extend this shape
      let shapeClass = getShapeClass(shapeInstance.nodeShape.namedNode);
      let superShapes: (typeof Shape)[] = getSuperShapesClasses(shapeClass);
      superShapes.forEach((superShapeClass) => {
        shapeOrRequest.push(...superShapeClass.shape.getPropertyShapes());
      });
    }
    //@TODO: optimise the shapeOrRequest. Currently if the same property is requested twice, but once with more sub properties, then both will be requested.
    // This can be merged into 1 shape request because the longer one automatically loads the shorter one

    let node = shapeInstance.node;
    if (!byPassCache) {
      let cachedResult = this.isLoaded(node, shapeOrRequest);
      if (cachedResult) {
        //return the load promise that's already in progress,
        // or a promise that resolves to true straight away if it's already been loaded
        return cachedResult === true ? Promise.resolve(true) : cachedResult;
      }
    }
    let store = this.getStoreForNode(shapeInstance.namedNode);
    if (store) {
      let promise = store.loadShape(shapeInstance, shapeOrRequest).then((res) => {
        //indicate that these property shapes have finished loading for this node
        this.setNodeLoaded(node, shapeOrRequest);
        return res;
      });
      //indicate that these property shapes are being loaded for this node
      this.setNodeLoaded(node, shapeOrRequest, promise);
      return promise;
    } else {
      //NOTE: if we ever need to know that we could not find a store to load this node from
      //then we could setNodeLoaded to false, and we need to account for the possibility of a false value in other places
      //any place using cached results would need to differentiate between null and false
      this.setNodeLoaded(node, shapeOrRequest);
      return Promise.resolve(null);
    }
  }

  static nodesAreLoaded(nodes: NodeSet, dataRequest): boolean | Promise<any> {
    let stillLoading = [];
    if (
      !nodes.every((node) => {
        let cached = this.isLoaded(node, dataRequest);
        if (!cached) {
          return false;
        }
        if (cached !== true) {
          //then it's a promise, this node is still loading
          stillLoading.push(node);
        }
        return true;
      })
    ) {
      return false;
    }
    return stillLoading ? Promise.all(stillLoading) : true;
  }
  static isLoaded(node: Node, dataRequest: LinkedDataRequest): boolean | Promise<any> {
    if (!this.nodeToPropertyRequests.has(node)) {
      return false;
    }
    let propertiesRequested = this.nodeToPropertyRequests.get(node);
    //return true if every top level property request has been loaded for this source
    let stillLoading = [];
    if (
      !dataRequest.every((propertyRequest) => {
        let propertyReqResult;
        //for sub requests
        if (Array.isArray(propertyRequest)) {
          //first check that property shape (that is the first entry) is loaded (same as for non-sub requests)
          propertyReqResult = propertiesRequested.get(propertyRequest[0].namedNode);
          //then let check if the subRequest is also loaded for each currently available value
          if (propertyReqResult) {
            //if not every currently loaded value for this property-shape is loaded, then the subRequest is not loaded
            if (
              !propertyRequest[0].resolveFor(node as NamedNode).every((valueNode) => {
                let subRequestLoaded = this.isLoaded(valueNode, propertyRequest[1]);
                if (!subRequestLoaded) {
                  return false;
                }
                //if the sub request is still loading that's fine, we add it to the array of promises to wait for
                if (subRequestLoaded !== true) {
                  stillLoading.push(subRequestLoaded);
                }
                return true;
              })
            ) {
              propertyReqResult = false;
            }
          }
        } else {
          propertyReqResult = propertiesRequested.get(propertyRequest.namedNode);
        }
        if (!propertyReqResult) {
          //not every propertyRequest is loaded, return false, which stops the every() loop and resolves it to false
          return false;
        }
        if (propertyReqResult !== true) {
          stillLoading.push(propertyReqResult);
        }
        //if not false, continue to evaluate the next propertyRequest
        return true;
      })
    ) {
      return false;
    }
    //all propertyRequests had an entry, if some are still loading, return the promise that resolves when they're all loaded
    //else return true (everything is loaded)
    return stillLoading.length > 0 ? Promise.all(stillLoading) : true;
  }

  private static getPredicateToPropertyShapesMap(): Map<NamedNode, PropertyShape[]> {
    if (!this.propShapeMap) {
      this.propShapeMap = new Map();
      PropertyShape.getLocalInstances().forEach((propertyShape) => {
        if (!this.propShapeMap.has(propertyShape.path)) {
          this.propShapeMap.set(propertyShape.path, []);
        }
        this.propShapeMap.get(propertyShape.path).push(propertyShape);
      });
    }
    return this.propShapeMap;
  }
  /**
   * Sets all the property paths of the subject nodes to be loaded
   * Handy for example when the server returned data already and you don't want the automatic loading to kick in.
   * WARNING: this assumes that ALL the values of each subject-predicate pair are loaded.
   * If the server returned just one and there are more, using this method means the other values will not automatically be loaded.
   */
  static setQuadsLoaded(quads: QuadSet) {
    let propShapeMap = this.getPredicateToPropertyShapesMap();
    //build a map of subject to property shapes
    let subjectToPropShapes = new Map<NamedNode, PropertyShape[]>();
    quads.forEach((quad) => {
      if (!subjectToPropShapes.has(quad.subject)) {
        subjectToPropShapes.set(quad.subject, []);
      }
      let currentPropShapes = subjectToPropShapes.get(quad.subject);
      //get all the property shapes that match this predicate and add them to the property shapes of this subject
      if (propShapeMap.has(quad.predicate)) {
        propShapeMap.get(quad.predicate).forEach((propShape) => currentPropShapes.push(propShape));
      }
    });

    subjectToPropShapes.forEach((propertyShapes, subject) => {
      this.setNodeLoaded(subject, propertyShapes);
    });
  }
  static setNodesLoaded(nodes: NodeSet, dataRequest: LinkedDataRequest, requestState: true | Promise<any> = true) {
    nodes.forEach((source) => {
      this.setNodeLoaded(source, dataRequest, requestState);
    });
  }

  static setNodeLoaded(node: Node, request: LinkedDataRequest, requestState: true | Promise<any> = true) {
    if (!this.nodeToPropertyRequests.get(node)) {
      this.nodeToPropertyRequests.set(node, new CoreMap());
    }
    let requestedProperties = this.nodeToPropertyRequests.get(node);

    request.map((propertyRequest) => {
      if (Array.isArray(propertyRequest)) {
        //propertyRequest is of the shape [propertyShape,subRequest]
        //update the cache for the property-shapes that regard this source
        requestedProperties.set(propertyRequest[0].namedNode, requestState);

        //if loading has finished
        if (requestState === true) {
          //then resolve the property shape for this node (so follow the property shape from this node)
          //then update the cache to indicate that the subRequest has been loaded
          // for each of the nodes you get to from that property shape
          this.setNodesLoaded(propertyRequest[0].resolveFor(node as NamedNode), propertyRequest[1], requestState);
        }
      } else {
        //propertyRequest is a PropertyShape
        requestedProperties.set(propertyRequest.namedNode, requestState);
      }
    });
  }
}
