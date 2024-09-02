import {
  GetQueryResponseType,
  LinkedQuery,
  QueryResponseToResultType,
} from '../utils/LinkedQuery.js';
import { Shape } from '../shapes/Shape.js';

export interface IStorageController {

  query<ShapeType extends Shape,ResponseType,Source,ResultType = QueryResponseToResultType<
    GetQueryResponseType<LinkedQuery<ShapeType, ResponseType>>,
    ShapeType
  >[]>(
    query: LinkedQuery<ShapeType,ResponseType,Source>
  ): Promise<ResultType>;
}



/* class decorator */
export function staticImplements<T>() {
  return <U extends T>(constructor: U) => {
    constructor;
  };
}
