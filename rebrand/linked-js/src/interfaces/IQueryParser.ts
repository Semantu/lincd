import type {SelectQueryFactory} from '../queries/SelectQuery.js';
import type {Shape} from '../shapes/Shape.js';

export interface IQueryParser {
  selectQuery<ResultType>(
    query: SelectQueryFactory<Shape>,
  ): Promise<ResultType>;
}
