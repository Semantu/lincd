import type {CreateQueryFactory} from '../queries/CreateQuery.js';
import type {DeleteQueryFactory} from '../queries/DeleteQuery.js';
import type {SelectQueryFactory} from '../queries/SelectQuery.js';
import type {UpdateQueryFactory} from '../queries/UpdateQuery.js';
import type {Shape} from '../shapes/Shape.js';

export interface IQueryParser {
  selectQuery<ResultType>(
    query: SelectQueryFactory<Shape>,
  ): Promise<ResultType>;
  createQuery<ResultType>(
    query: CreateQueryFactory<Shape>,
  ): Promise<ResultType>;
  updateQuery<ResultType>(
    query: UpdateQueryFactory<Shape>,
  ): Promise<ResultType>;
  deleteQuery<ResultType>(
    query: DeleteQueryFactory<Shape>,
  ): Promise<ResultType>;
}
