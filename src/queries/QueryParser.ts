import { IQueryParser,staticImplements } from '../interfaces/IQueryParser';
import { GetQueryResponseType,QueryResponseToResultType,SelectQueryFactory } from './SelectQuery';
import { AddId,UpdatePartial } from './QueryFactory';
import { Shape } from '../shapes/Shape';
import { LinkedStorage } from '../utils/LinkedStorage';
import { UpdateQueryFactory } from './UpdateQuery';
import { CreateQueryFactory } from './CreateQuery';

Shape.queryParser = this;

@staticImplements<IQueryParser>() /* this class implements this interface with static methods */
export class QueryParser {

  static selectQuery<ShapeType extends Shape,ResponseType,Source,ResultType = QueryResponseToResultType<
    GetQueryResponseType<SelectQueryFactory<ShapeType, ResponseType>>,
    ShapeType
  >[]>(
    query: SelectQueryFactory<ShapeType,ResponseType,Source>
  ): Promise<ResultType> {
    let queryObject = query.getQueryObject();
    return LinkedStorage.selectQuery(queryObject);
  }

  static updateQuery<
    ShapeType extends Shape,
    U extends UpdatePartial<ShapeType>,
  >(
    id:string|{id:string}|{uri:string},
    updateObjectOrFn: U,
    shapeClass:typeof Shape,
  ): Promise<AddId<U>> {
    const query = new UpdateQueryFactory<ShapeType, U>(shapeClass, id,updateObjectOrFn);
    let queryObject = query.getQueryObject();
    return LinkedStorage.updateQuery(queryObject);
  }

  static createQuery<
    ShapeType extends Shape,
    U extends UpdatePartial<ShapeType>,
  >(
    updateObjectOrFn: U,
    shapeClass:typeof Shape,
  ): Promise<AddId<U>> {
    const query = new CreateQueryFactory<ShapeType, U>(shapeClass, updateObjectOrFn);
    let queryObject = query.getQueryObject();
    return LinkedStorage.createQuery(queryObject);
  }

}
