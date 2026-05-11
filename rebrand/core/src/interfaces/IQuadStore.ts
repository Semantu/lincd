import {CreateQuery} from '../queries/CreateQuery.js';
import {DeleteQuery, DeleteResponse} from '../queries/DeleteQuery.js';
import {SelectQuery} from '../queries/SelectQuery.js';
import {UpdateQuery} from '../queries/UpdateQuery.js';

export interface IQuadStore {
  /**
   * Prepares the store to be used.
   */
  init?(): Promise<any>;

  selectQuery<ResultType>(query: SelectQuery<any>): Promise<ResultType>;
  updateQuery?<RType>(q: UpdateQuery<RType>): Promise<RType>;
  createQuery?<R>(q: CreateQuery<R>): Promise<R>;
  deleteQuery?(query: DeleteQuery): Promise<DeleteResponse>;
}
