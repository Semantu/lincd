import {IQuadStore} from '../interfaces/IQuadStore';
import {Graph, NamedNode, Quad} from '../models';
import {QuadSet} from '../collections/QuadSet';
import {CoreMap} from '../collections/CoreMap';

export abstract class StoreController {
	private static defaultStore: IQuadStore;
	private static _initialized: boolean;
	private static graphStores: CoreMap<Graph, IQuadStore> = new CoreMap();
	private static typeStores: CoreMap<NamedNode, IQuadStore> = new CoreMap();

	static setDefault(store: IQuadStore) {
		this.defaultStore = store;
		this.init();
	}

	static init() {
		if (!this._initialized) {
			Quad.emitter.on(Quad.QUADS_CREATED, (...args) =>
				this.onQuadsCreated.apply(this, args),
			);
			Quad.emitter.on(Quad.QUADS_REMOVED, this.onQuadsRemoved.bind(this));

			this._initialized = true;
		}
	}

	static setGraphStore(graph: Graph, store: IQuadStore) {
		this.graphStores.set(graph, store);
		this.init();
	}

	// static setTypeStore(type: NamedNode, store: IQuadStore) {
	// 	this.typeStores.set(type, store);
	//
	// 	type.onChangeInverse(rdf.type,)
	//
	// 	this.init();
	// }

	private static onQuadsCreated(quads: QuadSet) {
		quads.forEach((quad) => {
			if (this.graphStores.has(quad.graph)) {
				this.graphStores.get(quad.graph).add(quad);
			} else {
				this.defaultStore.add(quad);
			}
		});
	}

	private static onQuadsRemoved(quads: QuadSet) {
		quads.forEach((quad) => {
			if (this.graphStores.has(quad.graph)) {
				this.graphStores.get(quad.graph).delete(quad);
			} else {
				this.defaultStore.delete(quad);
			}
		});
	}
}
