import {IQuadStore} from '@_linked/core/interfaces/IQuadStore';
import {SelectQuery} from '@_linked/core/queries/SelectQuery';
import {UpdateQuery} from '@_linked/core/queries/UpdateQuery';
import {CreateQuery} from '@_linked/core/queries/CreateQuery';
import {DeleteQuery, DeleteResponse} from '@_linked/core/queries/DeleteQuery';
import {
  resolveLocal,
  createLocal,
  updateLocal,
  deleteLocal,
} from './utils/LocalQueryResolver';
import {defaultGraph, Graph, Quad} from './models';
import {QuadSet} from './collections/QuadSet';
import {QuadArray} from './collections/QuadArray';

export class InMemoryStore implements IQuadStore {
  /**
   * You can use this to define (overwrite) which graph this store uses for its quads
   */
  public targetGraph: Graph;
  protected contents: QuadSet;
  private initPromise: Promise<any>;

  init(): Promise<any> {
    if (!this.initPromise) {
      this.initPromise = this.loadContents();
    }
    return this.initPromise;
  }

  loadContents(): Promise<QuadSet> {
    //by default an in-memory store starts empty - it has no permanent storage
    //overwrite this method to change that
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

  selectQuery<ResultType>(query: SelectQuery<any>): Promise<ResultType> {
    return Promise.resolve(resolveLocal(query)).catch((e) => {
      console.error('Error in query', e);
      return new QuadArray();
    }) as Promise<ResultType>;
  }

  updateQuery?<RType>(query: UpdateQuery<RType>): Promise<RType> {
    return Promise.resolve(updateLocal(query));
  }

  createQuery?<R>(q: CreateQuery<R>): Promise<R> {
    return Promise.resolve(createLocal(q));
  }

  deleteQuery(query: DeleteQuery): Promise<DeleteResponse> {
    return Promise.resolve(deleteLocal(query)) as Promise<DeleteResponse>;
  }

  add(quad: Quad): Promise<any> {
    return this.init().then(() => {
      this.addNewContents(new QuadArray(quad));
      this.onContentsUpdated();
      return Promise.resolve(true);
    });
  }

  addMultiple(quads: QuadSet): Promise<any> {
    return this.init().then(() => {
      this._addMultiple(quads);
      this.onContentsUpdated();
      return Promise.resolve(true);
    });
  }

  delete(quad: Quad): Promise<any> {
    return this.init().then(() => {
      this._deleteMultiple(new QuadArray(quad));
      this.onContentsUpdated();
      return true;
    });
  }

  deleteMultiple(quads: QuadSet): Promise<any> {
    return this.init().then(() => {
      this._deleteMultiple(quads);
      this.onContentsUpdated();
      return true;
    });
  }

  protected onContentsUpdated(): Promise<boolean> {
    //by default in memory store does nothing here. Extending classes could choose to sync to a more permanent form of storage
    return Promise.resolve(false);
  }

  protected addNewContents(quads: QuadArray | QuadSet) {
    let graph = this.targetGraph || defaultGraph;
    if (graph) {
      quads = quads.moveTo(graph, false);
    }
    this.contents.addFrom(quads);
    return quads;
  }

  private _addMultiple(quads: QuadSet | QuadArray): void {
    this.addNewContents(quads as QuadArray);
  }

  private _deleteMultiple(quads: QuadArray | QuadSet): void {
    let graph = this.targetGraph || defaultGraph;
    if (graph) {
      quads = quads.moveTo(graph, false);
    }
    quads.forEach((quad) => {
      this.contents.delete(quad);
      quad.remove(false);
    });
  }
}
