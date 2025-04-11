import {
  GetQueryResponseType,
  LinkedSelectQuery,
  QueryResponseToResultType,
} from '../queries/LinkedSelectQuery';
import { Shape } from '../shapes/Shape.js';
import { UpdatePartial,AddId } from '../queries/LinkedQuery.js';

export interface IStorageController {

  query<ShapeType extends Shape,ResponseType,Source,ResultType = QueryResponseToResultType<
    GetQueryResponseType<LinkedSelectQuery<ShapeType, ResponseType>>,
    ShapeType
  >[]>(
    query: LinkedSelectQuery<ShapeType,ResponseType,Source>
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
