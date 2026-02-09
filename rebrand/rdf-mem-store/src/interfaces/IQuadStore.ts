import type {QuadSet} from '../collections/QuadSet.js';
import type {Graph, NamedNode, Quad} from '../models.js';
import type {NodeSet} from '../collections/NodeSet.js';
import type {ICoreIterable} from './ICoreIterable.js';
import type {CoreMap} from '../collections/CoreMap.js';
import type {QuadArray} from '../collections/QuadArray.js';
import type {CreateQuery} from '@_linked/core/queries/CreateQuery.js';
import type {DeleteQuery} from '@_linked/core/queries/DeleteQuery.js';
import type {SelectQuery} from '@_linked/core/queries/SelectQuery.js';
import type {UpdateQuery} from '@_linked/core/queries/UpdateQuery.js';

export interface IQuadStore {
  /**
   * Prepares the store to be used.
   */
  init?(): Promise<any>;

  updateQuery?<RType>(q: UpdateQuery<RType>): Promise<RType>;
  createQuery?<R>(q: CreateQuery<R>): Promise<R>;
  selectQuery<ResultType>(query: SelectQuery): Promise<ResultType>;

  deleteQuery?(query: DeleteQuery): Promise<unknown>;

  /** @deprecated Legacy quad-level API. */
  update?(
    toAdd: ICoreIterable<Quad>,
    toRemove: ICoreIterable<Quad>,
  ): Promise<any>;

  /** @deprecated Legacy quad-level API. */
  add?(quad: Quad): Promise<any>;

  /** @deprecated Legacy quad-level API. */
  addMultiple?(quads: QuadSet): Promise<any>;

  /** @deprecated Legacy quad-level API. */
  delete?(quad: Quad): Promise<any>;

  /** @deprecated Legacy quad-level API. */
  deleteMultiple?(quads: QuadSet): Promise<any>;

  /** @deprecated Legacy URI management API. */
  setURIs?(
    nodeToCurrentUriMap: CoreMap<NamedNode, string>,
  ): Promise<[string, string][]>;

  /** @deprecated Legacy graph API. */
  getDefaultGraph?(): Graph;

  /** @deprecated Legacy cleanup API. */
  removeNodes?(nodes: ICoreIterable<NamedNode>, quads?: QuadSet): Promise<any>;

  /** @deprecated Legacy quad-level API. */
  clearProperties?(
    subjectToPredicates: CoreMap<NamedNode, NodeSet<NamedNode>>,
  ): Promise<boolean>;

  /** @deprecated Legacy load API. */
  loadShape?(shapeInstance: any, shape: any): Promise<QuadArray>;

  /** @deprecated Legacy load API. */
  loadShapes?(shapeSet: any, shape: any): Promise<QuadArray>;
}
