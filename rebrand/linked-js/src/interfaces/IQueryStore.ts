import type {CreateQuery} from '../queries/CreateQuery.js';
import type {DeleteQuery} from '../queries/DeleteQuery.js';
import type {SelectQuery} from '../queries/SelectQuery.js';
import type {UpdateQuery} from '../queries/UpdateQuery.js';

export interface IQueryStore {
  selectQuery<ResultType>(query: SelectQuery): Promise<ResultType>;
  createQuery<ResultType>(query: CreateQuery): Promise<ResultType>;
  updateQuery<ResultType>(query: UpdateQuery): Promise<ResultType>;
  deleteQuery<ResultType>(query: DeleteQuery): Promise<ResultType>;
}
