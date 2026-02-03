import {CreateQueryFactory} from '../queries/CreateQuery.js';
import {DeleteQueryFactory} from '../queries/DeleteQuery.js';
import {
  GetQueryResponseType,
  PatchedQueryPromise,
  QResult,
  QShape,
  QueryResponseToResultType,
  SelectQueryFactory,
} from '../queries/SelectQuery.js';
import {UpdateQueryFactory} from '../queries/UpdateQuery.js';
import type {IQueryParser} from '../interfaces/IQueryParser.js';
import {NodeShape} from './ShapeDefinition.js';

export class Shape {
  declare protected __shapeBrand: void;
  static queryParser: IQueryParser;
  static shape: NodeShape;

  static select<
    ShapeType extends Shape,
    S = unknown,
    ResultType = QueryResponseToResultType<S, ShapeType>[],
  >(
    this: {new (): ShapeType; queryParser: IQueryParser},
    selectFn: (shape: QShape<ShapeType>) => S,
  ): PatchedQueryPromise<ResultType, ShapeType>;
  static select<
    ShapeType extends Shape,
    S = unknown,
    ResultType = QueryResponseToResultType<
      GetQueryResponseType<SelectQueryFactory<ShapeType, S>>,
      ShapeType
    >[],
  >(this: {
    new (): ShapeType;
    queryParser: IQueryParser;
  }): PatchedQueryPromise<ResultType, ShapeType>;
  static select<
    ShapeType extends Shape,
    S = unknown,
    ResultType = QueryResponseToResultType<
      GetQueryResponseType<SelectQueryFactory<ShapeType, S>>,
      ShapeType
    >,
  >(
    this: {new (): ShapeType; queryParser: IQueryParser},
    subjects?: ShapeType | QResult<ShapeType>,
    selectFn?: (shape: QShape<ShapeType>) => S,
  ): PatchedQueryPromise<ResultType, ShapeType>;
  static select<
    ShapeType extends Shape,
    S = unknown,
    ResultType = QueryResponseToResultType<
      GetQueryResponseType<SelectQueryFactory<ShapeType, S>>,
      ShapeType
    >[],
  >(
    this: {new (): ShapeType; queryParser: IQueryParser},
    subjects?: ShapeType[] | QResult<ShapeType>[],
    selectFn?: (shape: QShape<ShapeType>) => S,
  ): PatchedQueryPromise<ResultType, ShapeType>;
  static select<
    ShapeType extends Shape,
    S = unknown,
    ResultType = QueryResponseToResultType<
      GetQueryResponseType<SelectQueryFactory<ShapeType, S>>,
      ShapeType
    >[],
  >(
    this: {new (): ShapeType; queryParser: IQueryParser},
    targetOrSelectFn?: ShapeType | ((shape: QShape<ShapeType>) => S),
    selectFn?: (shape: QShape<ShapeType>) => S,
  ): PatchedQueryPromise<ResultType, ShapeType> {
    let _selectFn;
    let subject;
    if (selectFn) {
      _selectFn = selectFn;
      subject = targetOrSelectFn;
    } else {
      _selectFn = targetOrSelectFn;
    }

    const query = new SelectQueryFactory<ShapeType, S>(
      this as unknown as {new (): ShapeType},
      _selectFn,
      subject as ShapeType,
    );
    const result = this.queryParser.selectQuery(
      query as SelectQueryFactory<ShapeType, S>,
    ) as Promise<ResultType>;
    return query.patchResultPromise(result);
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
