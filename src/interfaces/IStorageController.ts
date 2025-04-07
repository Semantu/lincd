import {
  GetQueryResponseType,
  LinkedQuery,
  QueryResponseToResultType,
} from '../utils/LinkedQuery.js';
import { Shape } from '../shapes/Shape.js';
import { LinkedUpdateQuery,UpdatePartial,AddId } from '../utils/queries/LinkedUpdateQuery.js';

export interface IStorageController {

  query<ShapeType extends Shape,ResponseType,Source,ResultType = QueryResponseToResultType<
    GetQueryResponseType<LinkedQuery<ShapeType, ResponseType>>,
    ShapeType
  >[]>(
    query: LinkedQuery<ShapeType,ResponseType,Source>
  ): Promise<ResultType>;

  updateQuery<
    ShapeType extends Shape,
    U extends UpdatePartial<ShapeType>,
  >(
    // this: {new (node: Node): ShapeType; targetClass: any},
    id:string|{id:string}|{uri:string},
    updateObjectOrFn?: U,
    // query:LinkedUpdateQuery<ShapeType,U>
  ): Promise<AddId<U>>;
}



/* class decorator */
export function staticImplements<T>() {
  return <U extends T>(constructor: U) => {
    constructor;
  };
}
