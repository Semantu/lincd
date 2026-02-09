import type {CreateQuery} from 'linked-js/queries/CreateQuery.js';
import type {DeleteQuery} from 'linked-js/queries/DeleteQuery.js';
import type {SelectQuery} from 'linked-js/queries/SelectQuery.js';
import type {UpdateQuery} from 'linked-js/queries/UpdateQuery.js';
import {Graph, NamedNode, Quad} from '../models.js';
import {QuadSet} from '../collections/QuadSet.js';
import {QuadArray} from '../collections/QuadArray.js';
import type {ICoreIterable} from '../interfaces/ICoreIterable.js';
import type {NodeSet} from '../collections/NodeSet.js';
import type {CoreMap} from '../collections/CoreMap.js';
import type {IQuadStore} from '../interfaces/IQuadStore.js';
import {createLocal, deleteLocal, resolveLocal, updateLocal} from '../utils/LocalQueryResolver.js';

export class InMemoryStore implements IQuadStore {
  /**
   * You can use this to define (overwrite) which graph this store uses for its quads
   */
  public targetGraph: Graph;
  protected contents: QuadSet;
  private initPromise: Promise<any> | null = null;
  public namedNode: NamedNode;

  constructor(uri?: string) {
    this.namedNode = uri ? NamedNode.getOrCreate(uri) : NamedNode.create();
  }

  init(): Promise<any> {
    if (!this.initPromise) {
      this.initPromise = this.loadContents();
    }
    return this.initPromise;
  }

  loadContents(): Promise<QuadSet> {
    this.contents = new QuadSet();
    return Promise.resolve(this.contents);
  }

  /**
   * returns the contents of the InMemoryStore as a QuadSet
   * do NOT modify the returned QuadSet directly. Add or remove contents to this store instead
   */
  getContents(): QuadSet {
    return this.contents;
  }

  updateQuery<RType>(query: UpdateQuery<RType>): Promise<RType> {
    return Promise.resolve(updateLocal(query));
  }

  createQuery<R>(query: CreateQuery<R>): Promise<R> {
    return Promise.resolve(createLocal(query));
  }

  deleteQuery<ResultType>(query: DeleteQuery): Promise<ResultType> {
    return Promise.resolve(deleteLocal(query) as ResultType);
  }

  selectQuery<ResultType>(query: SelectQuery): Promise<ResultType> {
    return Promise.resolve(resolveLocal(query)) as Promise<ResultType>;
  }

  /** @deprecated Legacy quad-level API. */
  update(
    toAdd: ICoreIterable<Quad>,
    toRemove: ICoreIterable<Quad>,
  ): Promise<any> {
    return this.init().then(() => {
      if (toAdd) {
        this._addMultiple(toAdd);
      }
      if (toRemove) {
        this._deleteMultiple(toRemove as QuadArray);
      }
      return this.onContentsUpdated();
    });
  }

  /** @deprecated Legacy quad-level API. */
  getDefaultGraph(): Graph {
    return Graph.getOrCreate(this.namedNode.uri);
  }

  /** @deprecated Legacy quad-level API. */
  add(quad: Quad): Promise<any> {
    return this.init().then(() => {
      this.addNewContents(new QuadArray(quad));
      this.onContentsUpdated();
      return true;
    });
  }

  /** @deprecated Legacy quad-level API. */
  addMultiple(quads: QuadSet): Promise<any> {
    return this.init().then(() => {
      this._addMultiple(quads);
      this.onContentsUpdated();
      return true;
    });
  }

  /** @deprecated Legacy quad-level API. */
  delete(quad: Quad): Promise<any> {
    return this.init().then(() => {
      this._deleteMultiple(new QuadArray(quad));
      this.onContentsUpdated();
      return true;
    });
  }

  /** @deprecated Legacy quad-level API. */
  deleteMultiple(quads: QuadSet): Promise<any> {
    return this.init().then(() => {
      this._deleteMultiple(quads);
      this.onContentsUpdated();
      return true;
    });
  }

  /** @deprecated Legacy quad-level API. */
  clearProperties(
    subjectToPredicates: CoreMap<NamedNode, NodeSet<NamedNode>>,
  ): Promise<boolean> {
    return this.init().then(() => {
      const toDelete = new QuadSet();
      this.contents.forEach((q) => {
        if (
          subjectToPredicates.has(q.subject) &&
          subjectToPredicates.get(q.subject).has(q.predicate)
        ) {
          toDelete.add(q);
        }
      });
      if (toDelete.size > 0) {
        return this.deleteMultiple(toDelete);
      }
      return false;
    });
  }

  /** @deprecated Legacy URI management API. */
  setURIs(
    _nodeToCurrentUriMap: CoreMap<NamedNode, string>,
  ): Promise<[string, string][]> {
    return Promise.resolve([]);
  }

  /** @deprecated Legacy cleanup API. */
  removeNodes(_nodes: ICoreIterable<NamedNode>): Promise<any> {
    return Promise.resolve(true);
  }

  /** @deprecated Legacy load API. */
  loadShape(_shapeInstance: any, _request: any): Promise<QuadArray> {
    return this.init().then(() => new QuadArray());
  }

  /** @deprecated Legacy load API. */
  loadShapes(_shapeInstances: any, _request: any): Promise<QuadArray> {
    return this.init().then(() => new QuadArray());
  }

  protected onContentsUpdated(): Promise<boolean> {
    return Promise.resolve(false);
  }

  protected addNewContents(quads: QuadArray | QuadSet) {
    const graph = this.getDefaultGraph();
    const toAdd =
      quads instanceof QuadArray ? quads : new QuadArray(...Array.from(quads));
    toAdd.forEach((quad) => {
      this.contents.add(quad.moveToGraph(graph));
    });
  }

  protected _addMultiple(quads: ICoreIterable<Quad>) {
    const graph = this.getDefaultGraph();
    for (const quad of quads) {
      this.contents.add(quad.moveToGraph(graph));
    }
  }

  protected _deleteMultiple(quads: ICoreIterable<Quad>) {
    for (const quad of quads) {
      this.contents.delete(quad);
    }
  }
}
