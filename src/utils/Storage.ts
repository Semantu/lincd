import {IQuadStore} from '../interfaces/IQuadStore';
import {defaultGraph,Graph,NamedNode,Quad} from '../models';
import {QuadSet} from '../collections/QuadSet';
import {CoreMap} from '../collections/CoreMap';
import {NodeSet} from '../collections/NodeSet';
import {Shape} from '../shapes/Shape';
import {NodeShape} from '../shapes/SHACL';
import {ICoreIterable} from '../interfaces/ICoreIterable';
import {eventBatcher} from '../events/EventBatcher';

export abstract class Storage
{
  private static defaultStore: IQuadStore;
  private static _initialized: boolean;
  private static graphToStore: CoreMap<Graph,IQuadStore> = new CoreMap();
  private static typeStores: CoreMap<NamedNode,IQuadStore> = new CoreMap();
  private static shapesToGraph: CoreMap<typeof Shape,Graph> = new CoreMap();
  private static nodeShapesToGraph: CoreMap<NodeShape,Graph> = new CoreMap();
  private static defaultStorageGraph: Graph;
  private static processingPromise: { promise: Promise<void>; resolve?: any; reject?: any };

  static init()
  {
    if (!this._initialized)
    {
      //listen to any quad changes in local memory
      // Quad.emitter.on(Quad.QUADS_CREATED,(...args) =>
      //   this.onQuadsCreated.apply(this,args),
      // );
      // Quad.emitter.on(Quad.QUADS_REMOVED,this.onQuadsRemoved.bind(this));
      Quad.emitter.on(Quad.QUADS_ALTERED,this.onQuadsAltered.bind(this));
      NamedNode.emitter.on(NamedNode.STORE_NODES,this.onStoreNodes.bind(this));
      // NamedNode.emitter.on(NamedNode.REMOVE_NODES,this.onStoreNodes.bind(this));

      this._initialized = true;
    }
  }

  static setDefaultStore(store: IQuadStore)
  {
    this.defaultStore = store;
    let defaultGraph = store.getDefaultGraph();
    if(defaultGraph)
    {
      this.setDefaultStorageGraph(defaultGraph);
      this.setStoreForGraph(store,defaultGraph);
    }
    else
    {
      console.warn("Default store did not return a default graph.")
    }
    this.init();
  }

  static setDefaultStorageGraph(graph: Graph)
  {
    this.defaultStorageGraph = graph;
  }

  static storeShapesInGraph(graph: Graph,...shapeClasses: (typeof Shape)[])
  {
    shapeClasses.forEach(shapeClass => {
      this.shapesToGraph.set(shapeClass,graph);
      if (shapeClass['shape'])
      {
        this.nodeShapesToGraph.set(shapeClass['shape'],graph);
      }
    });
    this.init();
  }

  static setStoreForGraph(store:IQuadStore,graph)
  {
    this.graphToStore.set(graph,store);
  }

  /**
   * Set the target store for instances of these shapes
   * @param store
   * @param shapes
   */
  static storeShapesInStore(store: IQuadStore,...shapes: (typeof Shape)[])
  {
    let graph = store.getDefaultGraph();
    this.storeShapesInGraph(graph,...shapes);
  }

  private static assignQuadsToGraph(quads: ICoreIterable<Quad>)
  {
    let map = this.getTargetGraphMap(quads);
    let alteredNodes = new CoreMap<NamedNode,Graph>();
    map.forEach((quads,graph) => {
      quads.forEach(quad => {
        //move the quad to the target graph (both old and new graph will be updated)
        if(quad.graph !== graph)
        {
          quad.graph = graph;
          //also keep track of which nodes had a quad that moved to a different graph
          if(!alteredNodes.has(quad.subject))
          {
            alteredNodes.set(quad.subject,graph);
          }
        }
      })
    })

    //now that all quads have been updated, we need to check one more thing
    //changes in quads MAY have changed which shapes the subject nodes are an instance of
    //thus the target graph of the whole node may have changed, so:
    this.moveAllQuadsOfNodeIfRequired(alteredNodes);
  }
  private static moveAllQuadsOfNodeIfRequired(alteredNodes:CoreMap<NamedNode,Graph>)
  {
    //for all subjects who have a quad that moved to a different graph
    alteredNodes.forEach((graph,subjectNode) => {
      //go over each quad of that node
      subjectNode.getAllQuads().forEach(quad => {
        //and if that quad is not in the same graph as the target graph that we just determined for that node
        if(quad.graph !== graph)
        {
          //then update it
          quad.graph = graph;
        }
      })
    })
  }

  static promiseUpdated():Promise<void>
  {
    //if we're already processing storage updates
    // if (this.processingPromise) {
    //   //they can simply wait for that
    //   return this.processingPromise.promise;
    // }
    //if not...
    //we wait till all events are dispatched
    return eventBatcher.promiseDone().then(() => {
      //if that triggered a storage update
      if (this.processingPromise) {
        //we will wait for that
        return this.processingPromise.promise;
      }
      // else {
        //if not.. there was nothing to update, so the promise will resolve
      // }
    });
  }
  private static onQuadsAltered(quadsCreated:QuadSet,quadsRemoved:QuadSet)
  {
    var resolve, reject;
    var promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.processingPromise = { promise, resolve, reject };

    //first see if any new quads need to move to the right graphs (note that this will possibly add "mimiced" quads (with the previous graph as their graph) to quadsRemoved)
    this.assignQuadsToGraph(quadsCreated);

    //next, notify the right stores about these changes
    let addMap = this.getTargetStoreMap(quadsCreated);
    let removeMap = this.getTargetStoreMap(quadsRemoved);

    //combine the keys of both maps (which are stores)
    let stores = [...addMap.keys(),...removeMap.keys()]

    //go over each store that has added/removed quads
    Promise.all(stores.map(store => {
      store.update(addMap.get(store) || [] ,removeMap.get(store) || []);
    })).then(() => {
      //storage update is now complete
      resolve();
    }).catch(err => {
      console.warn("Error during storage update: "+err);
      reject();
    })

  }
  // private static onQuadsCreated(quads: QuadSet)
  // {
  //   this.assignQuadsToGraph(quads);
    /*
        subjectsToQuads.forEach((quads,subject) => {
          let graph:Graph = this.getTargetGraph(subject);
          graph.addMultiple(quads);
        })


        let storeMap: CoreMap<IQuadStore,QuadSet> = this.getTargetStoreMap(quads);
        storeMap.forEach((quads,store) => {
          store.addMultiple(quads);
        })*/
  // }

  private static getTargetGraph(subject: NamedNode): Graph
  {
    let subjectShapes = NodeShape.getShapesOf(subject);

    //see if any of these shapes has a specific target graph
    for (let shape of subjectShapes)
    {
      if (this.nodeShapesToGraph.has(shape))
      {
        //currently, the target graph of the very first shape that has a target graph is returned
        return this.nodeShapesToGraph.get(shape);
      }
    }

    if (!subject.isTemporaryNode && this.defaultStorageGraph)
    {
      return this.defaultStorageGraph;
    }

    //if no shape defined a target graph OR if the node is a temporary node
    //then use the default graph
    return defaultGraph;
  }

  // private static onQuadsRemoved(quads: QuadSet)
  // {
    // let storeMap: CoreMap<IQuadStore,QuadSet> = this.getTargetStoreMap(quads);
    // storeMap.forEach((quads,store) => {
    //   store.deleteMultiple(quads);
    // })
  // }

  private static onStoreNodes(nodes: NodeSet<NamedNode>)
  {
    //TODO: no need to convert to QuadSet once we phase out QuadArray
    let nodesWithTempURIs = nodes.filter(node => node.uri.indexOf(NamedNode.TEMP_URI_BASE) === 0);

    nodesWithTempURIs.forEach((node) => {
      let targetStore = this.getTargetStoreForNode(node);
      targetStore.setURI(node);
    });

    //move all the quads to the right graph.
    //note that IF this is a new graph, this will trigger onQuadsAltered, which will notify the right stores to store these quads
    this.assignQuadsToGraph(nodes.getAllQuads());
  }

  private static getTargetStoreForNode(node:NamedNode)
  {
    let graph = this.getTargetGraph(node);
    return this.getTargetStoreForGraph(graph);
  }
  private static getTargetStoreForGraph(graph:Graph)
  {
    return this.graphToStore.get(graph);
    // if(this.graphToStore.has(graph))
    // {
    // }
    // return this.defaultStore;
  }
  private static groupQuadsBySubject(quads: ICoreIterable<Quad>): CoreMap<NamedNode,Quad[]>
  {
    let subjectsToQuads: CoreMap<NamedNode,Quad[]> = new CoreMap();
    quads.forEach(quad => {
      if (!subjectsToQuads.has(quad.subject))
      {
        subjectsToQuads.set(quad.subject,[]);
      }
      subjectsToQuads.get(quad.subject).push(quad);
    });
    return subjectsToQuads;
  }

  private static getTargetGraphMap(quads: ICoreIterable<Quad>): CoreMap<Graph,Quad[]>
  {
    let graphMap:CoreMap<Graph,Quad[]> = new CoreMap();
    let quadsBySubject = this.groupQuadsBySubject(quads);
    quadsBySubject.forEach((quads,subjectNode) => {
      let targetGraph = this.getTargetGraph(subjectNode);
      if(!graphMap.has(targetGraph))
      {
        graphMap.set(targetGraph,[])
      }
      graphMap.set(targetGraph,graphMap.get(targetGraph).concat(quads));
    });
    return graphMap;
  }
  private static getTargetStoreMap(quads: ICoreIterable<Quad>): CoreMap<IQuadStore,Quad[]>
  {
    let storeMap:CoreMap<IQuadStore,Quad[]> = new CoreMap();
    quads.forEach((quad) => {
      let store = this.getTargetStoreForGraph(quad.graph);
      //if store is null, this means no store is observing this quad. This will usually happen for the default graph which contains temporary nodes
      if(store)
      {
        if (!storeMap.has(store))
        {
          storeMap.set(store,[]);
        }
        storeMap.get(store).push(quad);
      }
    });
    return storeMap;

    /*//if we already created a targetGraphMap
    if(targetGraphMap)
    {
      //then we can save some work and just translate graphs to stores
      targetGraphMap.forEach((quads,graph) => {
        storeMap.set(this.getTargetStoreForGraph(graph),quads);
      })
      return storeMap;
    }

    //if not, we make from scratch:
    let quadsBySubject = this.groupQuadsBySubject(quads);
    quadsBySubject.forEach((quads,subjectNode) => {
      let targetStore = this.getTargetStoreForNode(subjectNode);
      if(!storeMap.has(targetStore))
      {
        storeMap.set(targetStore,[])
      }
      storeMap.set(targetStore,storeMap.get(targetStore).concat(quads));
    });
    return storeMap;*/
  }
}
