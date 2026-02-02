import {CreateQueryFactory} from '../queries/CreateQuery.js';
import {DeleteQueryFactory} from '../queries/DeleteQuery.js';
import {SelectQueryFactory} from '../queries/SelectQuery.js';
import {UpdateQueryFactory} from '../queries/UpdateQuery.js';
import type {IQueryParser} from '../interfaces/IQueryParser.js';
import {NodeShape} from './ShapeDefinition.js';

export class Shape {
  static queryParser: IQueryParser;
  static shape: NodeShape;

  static select<ShapeType extends Shape, ResultType = unknown[]>(
    this: {new (): ShapeType; queryParser: IQueryParser},
    subjectOrSelectFn?: ShapeType | {id: string} | ((shape: ShapeType) => unknown),
    selectFn?: (shape: ShapeType) => unknown,
  ): Promise<ResultType> {
    const subject =
      typeof subjectOrSelectFn === 'function' || !subjectOrSelectFn
        ? undefined
        : subjectOrSelectFn;
    const queryBuildFn =
      typeof subjectOrSelectFn === 'function' ? subjectOrSelectFn : selectFn;
    const query = new SelectQueryFactory(
      this as unknown as typeof Shape,
      queryBuildFn,
      subject as ShapeType,
    );
    const result = this.queryParser.selectQuery(
      query as SelectQueryFactory<ShapeType>,
    );
    return query.patchResultPromise(result) as Promise<ResultType>;
  }

  static create<ShapeType extends Shape, ResultType = unknown>(
    this: {new (): ShapeType; queryParser: IQueryParser},
    updateObject: Record<string, unknown>,
  ): Promise<ResultType> {
    const query = new CreateQueryFactory(
      this as unknown as typeof Shape,
      updateObject,
    );
    return this.queryParser.createQuery(query as CreateQueryFactory<ShapeType>);
  }

  static update<ShapeType extends Shape, ResultType = unknown>(
    this: {new (): ShapeType; queryParser: IQueryParser},
    id: {id: string} | {uri: string} | string,
    updateObject: Record<string, unknown>,
  ): Promise<ResultType> {
    const query = new UpdateQueryFactory(
      this as unknown as typeof Shape,
      id,
      updateObject,
    );
    return this.queryParser.updateQuery(query as UpdateQueryFactory<ShapeType>);
  }

  static delete<ShapeType extends Shape, ResultType = unknown>(
    this: {new (): ShapeType; queryParser: IQueryParser},
    ids: {id: string} | {uri: string} | string | Array<{id: string} | {uri: string} | string>,
  ): Promise<ResultType> {
    const query = new DeleteQueryFactory(
      this as unknown as typeof Shape,
      ids,
    );
    return this.queryParser.deleteQuery(query as DeleteQueryFactory<ShapeType>);
  }
}
