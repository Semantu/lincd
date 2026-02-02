import type {IQueryStore} from '../interfaces/IQueryStore.js';
import type {CreateQuery} from '../queries/CreateQuery.js';
import type {DeleteQuery} from '../queries/DeleteQuery.js';
import type {SelectQuery} from '../queries/SelectQuery.js';
import type {UpdateQuery} from '../queries/UpdateQuery.js';
import {QueryParser} from '../queries/QueryParser.js';
import {Shape} from '../shapes/Shape.js';

export class LinkedStorage {
  private static defaultStore?: IQueryStore;
  private static shapeToStore: Map<typeof Shape, IQueryStore> = new Map();
  private static initialized = false;

  static init() {
    if (!this.initialized) {
      Shape.queryParser = QueryParser;
      this.initialized = true;
    }
  }

  static setDefaultStore(store: IQueryStore) {
    this.defaultStore = store;
    this.init();
  }

  static getDefaultStore() {
    return this.defaultStore;
  }

  static setStoreForShapes(store: IQueryStore, ...shapes: (typeof Shape)[]) {
    shapes.forEach((shape) => this.shapeToStore.set(shape, store));
    this.init();
  }

  static reset() {
    this.defaultStore = undefined;
    this.shapeToStore.clear();
  }

  static getStoreForShape(shape?: typeof Shape): IQueryStore {
    if (shape && this.shapeToStore.has(shape)) {
      return this.shapeToStore.get(shape);
    }
    if (this.defaultStore) {
      return this.defaultStore;
    }
    throw new Error('No default store configured for LinkedStorage');
  }

  static selectQuery<ResultType>(query: SelectQuery, shape?: typeof Shape) {
    return this.getStoreForShape(shape).selectQuery<ResultType>(query);
  }

  static createQuery<ResultType>(query: CreateQuery, shape?: typeof Shape) {
    return this.getStoreForShape(shape).createQuery<ResultType>(query);
  }

  static updateQuery<ResultType>(query: UpdateQuery, shape?: typeof Shape) {
    return this.getStoreForShape(shape).updateQuery<ResultType>(query);
  }

  static deleteQuery<ResultType>(query: DeleteQuery, shape?: typeof Shape) {
    return this.getStoreForShape(shape).deleteQuery<ResultType>(query);
  }
}
