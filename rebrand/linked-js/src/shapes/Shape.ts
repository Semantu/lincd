import {SelectQueryFactory} from '../queries/SelectQuery.js';
import type {IQueryParser} from '../interfaces/IQueryParser.js';
import {ShapeDefinition} from './ShapeDefinition.js';

export class Shape {
  static queryParser: IQueryParser;
  static shape: ShapeDefinition;

  static select<ShapeType extends Shape, ResultType = unknown[]>(
    this: {new (): ShapeType; queryParser: IQueryParser},
    selectFn?: (shape: ShapeType) => unknown,
  ): Promise<ResultType> {
    const query = new SelectQueryFactory(
      this as unknown as typeof Shape,
      selectFn,
    );
    return this.queryParser.selectQuery(query as SelectQueryFactory<ShapeType>);
  }
}
