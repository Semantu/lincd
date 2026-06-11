import {
  type GetQueryResponseType,
  type QueryResponseToResultType,
  SelectQueryFactory,
} from '../queries/SelectQuery.js';
import {Shape} from '../shapes/Shape.js';
import type {
  AddId,
  NodeReferenceValue,
  UpdatePartial,
} from '../queries/QueryFactory.js';
import type {CreateResponse} from '../queries/CreateQuery.js';
import type {NodeId} from '../queries/MutationQuery.js';
import type {DeleteResponse} from '../queries/DeleteQuery.js';

export interface IQueryParser {
  selectQuery<
    ShapeType extends Shape,
    ResponseType,
    Source,
    ResultType = QueryResponseToResultType<
      GetQueryResponseType<SelectQueryFactory<ShapeType, ResponseType>>,
      ShapeType
    >[],
  >(
    query: SelectQueryFactory<ShapeType, ResponseType, Source>,
  ): Promise<ResultType>;

  updateQuery<ShapeType extends Shape, U extends UpdatePartial<ShapeType>>(
    id: string | {id: string} | {uri: string},
    updateObjectOrFn: U,
    shapeClass: typeof Shape,
  ): Promise<AddId<U>>;

  createQuery<ShapeType extends Shape, U extends UpdatePartial<ShapeType>>(
    updateObjectOrFn: U,
    shapeClass: typeof Shape,
  ): Promise<CreateResponse<U>>;

  deleteQuery(
    id: NodeId | NodeId[] | NodeReferenceValue[],
    shapeClass: typeof Shape,
  ): Promise<DeleteResponse>;
}

/* class decorator */
export function staticImplements<T>() {
  return <U extends T>(constructor: U) => {
    constructor;
  };
}
