import {
  GetQueryResponseType,
  SelectQueryFactory,
  QueryResponseToResultType,
} from '../queries/SelectQuery';
import { Shape } from '../shapes/Shape.js';
import { UpdatePartial,AddId } from '../queries/QueryFactory';

export interface IQueryParser
{

  selectQuery<ShapeType extends Shape,ResponseType,Source,ResultType = QueryResponseToResultType<
    GetQueryResponseType<SelectQueryFactory<ShapeType, ResponseType>>,
    ShapeType
  >[]>(
    query: SelectQueryFactory<ShapeType,ResponseType,Source>
  ): Promise<ResultType>;

  updateQuery<
    ShapeType extends Shape,
    U extends UpdatePartial<ShapeType>,
  >(
    id:string|{id:string}|{uri:string},
    updateObjectOrFn: U,
    shapeClass: typeof Shape,
  ): Promise<AddId<U>>;

  createQuery<
    ShapeType extends Shape,
    U extends UpdatePartial<ShapeType>,
  >(
    updateObjectOrFn: U,
    shapeClass: typeof Shape,
  ): Promise<AddId<U>>;
}



/* class decorator */
export function staticImplements<T>() {
  return <U extends T>(constructor: U) => {
    constructor;
  };
}
