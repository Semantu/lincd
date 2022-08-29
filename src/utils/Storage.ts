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
			Quad.emitter.on(Quad.QUADS_CREATED, (...args) =>
				this.onQuadsCreated.apply(this, args),
			);
			Quad.emitter.on(Quad.QUADS_REMOVED, this.onQuadsRemoved.bind(this));
      NamedNode.emitter.on(NamedNode.STORE_NODES, this.onStoreNodes.bind(this));

			this._initialized = true;
		}
	}

	static setGraphStore(graph: Graph, store: IQuadStore) {
		this.graphStores.set(graph, store);
		this.init();
	}

	private static onQuadsCreated(quads: QuadSet) {
		quads.forEach((quad) => {
      //if there is a registered store that stores this graph
			if (this.graphStores.has(quad.graph)) {
        //let that store handle adding this quad
				this.graphStores.get(quad.graph).add(quad);
			} else if(this.defaultStore) {
        //by default, let the default store handle it
				this.defaultStore.add(quad);
			}
		});
	}

	private static onStoreNodes(nodes: NodeSet<NamedNode>) {
    //TODO: no need to convert to QuadSet once we phase out QuadArray
    let nodesWithTempURIs = nodes.filter(node => node.uri.indexOf(NamedNode.TEMP_URI_BASE) === 0);
    this.defaultStore.generateURIs(nodesWithTempURIs
    this.defaultStore.addMultiple(new QuadSet(nodes.getAllQuads()));
  }

	private static onQuadsRemoved(quads: QuadSet) {
		quads.forEach((quad) => {
      //if there is a registered store that stores this graph
			if (this.graphStores.has(quad.graph)) {
        //let that store handle adding this quad
				this.graphStores.get(quad.graph).delete(quad);
			} else if(this.defaultStore) {
        //by default, let the default store handle it
				this.defaultStore.delete(quad);
			}
		});
	}
}
