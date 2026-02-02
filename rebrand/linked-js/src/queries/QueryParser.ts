import type {CreateQueryFactory} from './CreateQuery.js';
import type {DeleteQueryFactory} from './DeleteQuery.js';
import type {SelectQueryFactory} from './SelectQuery.js';
import type {UpdateQueryFactory} from './UpdateQuery.js';
import type {Shape} from '../shapes/Shape.js';
import {LinkedStorage} from '../utils/LinkedStorage.js';

export class QueryParser {
  static selectQuery<ResultType>(query: SelectQueryFactory<Shape>) {
    const queryObject = query.getQueryObject();
    return LinkedStorage.selectQuery<ResultType>(
      queryObject,
      queryObject.shape,
    );
  }

  static createQuery<ResultType>(query: CreateQueryFactory<Shape>) {
    const queryObject = query.getQueryObject();
    return LinkedStorage.createQuery<ResultType>(
      queryObject,
      query.shapeClass,
    );
  }

  static updateQuery<ResultType>(query: UpdateQueryFactory<Shape>) {
    const queryObject = query.getQueryObject();
    return LinkedStorage.updateQuery<ResultType>(
      queryObject,
      query.shapeClass,
    );
  }

  static deleteQuery<ResultType>(query: DeleteQueryFactory<Shape>) {
    const queryObject = query.getQueryObject();
    return LinkedStorage.deleteQuery<ResultType>(
      queryObject,
      query.shapeClass,
    );
  }
}
