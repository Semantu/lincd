import {IQuadStore} from '../interfaces/IQuadStore';
import {Graph, NamedNode, Quad} from '../models';
import {QuadSet} from '../collections/QuadSet';
import {CoreMap} from '../collections/CoreMap';
import {NodeSet} from '../collections/NodeSet';

export abstract class Storage {
	private static defaultStore: IQuadStore;
	private static _initialized: boolean;
	private static graphStores: CoreMap<Graph, IQuadStore> = new CoreMap();
	private static typeStores: CoreMap<NamedNode, IQuadStore> = new CoreMap();

	static setDefaultStore(store: IQuadStore) {
		this.defaultStore = store;
		this.init();
	}

	static init() {
		if (!this._initialized) {
      //listen to any quad changes in local memory
			// Quad.emitter.on(Quad.QUADS_CREATED, (...args) =>
			// 	this.onQuadsCreated.apply(this, args),
			// );
			// Quad.emitter.on(Quad.QUADS_REMOVED, this.onQuadsRemoved.bind(this));
      NamedNode.emitter.on(NamedNode.STORE_NODES, this.onStoreNodes.bind(this));

			this._initialized = true;
		}
	}

	static setGraphStore(graph: Graph, store: IQuadStore) {
		this.graphStores.set(graph, store);
		this.init();
	}

	private static onQuadsCreated(quads: QuadSet) {
    let storeMap: CoreMap<IQuadStore,QuadSet> = this.getTargetStoreMap(quads);
    storeMap.forEach((quads,store) => {
      store.addMultiple(quads);
    })
	}

	private static onQuadsRemoved(quads: QuadSet)
  {
    let storeMap: CoreMap<IQuadStore,QuadSet> = this.getTargetStoreMap(quads);
    storeMap.forEach((quads,store) => {
      store.deleteMultiple(quads);
    })
  }

  private static onStoreNodes(nodes: NodeSet<NamedNode>) {
    //TODO: no need to convert to QuadSet once we phase out QuadArray
    let nodesWithTempURIs = nodes.filter(node => node.uri.indexOf(NamedNode.TEMP_URI_BASE) === 0);
    this.defaultStore.generateURIs(nodesWithTempURIs);
    this.defaultStore.addMultiple(new QuadSet(nodes.getAllQuads()));
  }

  private static getTargetStoreMap(quads:QuadSet):CoreMap<IQuadStore,QuadSet>
  {
    let storeMap:CoreMap<IQuadStore,QuadSet> = new CoreMap();
    quads.forEach((quad) => {
      //if there is a registered store that stores this graph
      let store;
      if (this.graphStores.has(quad.graph)) {
        //let that store handle adding this quad
        store = this.graphStores.get(quad.graph);
      } else if(this.defaultStore) {
        //by default, let the default store handle it
        store = this.defaultStore;
      }
      //build up a map of new quads per store
      if(!storeMap.has(store))
      {
        storeMap.set(store,new QuadSet());
      }
      storeMap.get(store).add(quad);
    });

    return storeMap;
	}
}
