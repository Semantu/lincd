import {
  GetQueryResponseType,
  LinkedQuery,
  QueryResponseToResultType,
} from '../utils/LinkedQuery.js';
import { Shape } from '../shapes/Shape.js';
import { Node } from '../models';
import { LinkedUpdateQuery,UpdatePartial,WithId } from '../utils/queries/LinkedUpdateQuery';

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
    query:LinkedUpdateQuery<ShapeType,U>
  ): Promise<WithId<U>>;
}



/* class decorator */
export function staticImplements<T>() {
  return <U extends T>(constructor: U) => {
    constructor;
  };
}
