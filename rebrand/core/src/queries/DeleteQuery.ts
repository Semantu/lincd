import {Shape} from '../shapes/Shape.js';
import {NodeShape} from '../shapes/SHACL.js';
import {LinkedQuery} from './SelectQuery.js';
import {NodeReferenceValue, UpdatePartial} from './QueryFactory.js';
import {MutationQueryFactory, NodeId} from './MutationQuery.js';

export interface DeleteQuery extends LinkedQuery {
  type: 'delete';
  shape: NodeShape;
  ids: NodeReferenceValue[];
}

export type DeleteResponse = {
  /**
   * The IDs of the items that were successfully deleted.
   */
  deleted: NodeReferenceValue[];
  /**
   * The number of successfully deleted items.
   */
  count: number;
  /**
   * The IDs of the items that couldn't be deleted.
   */
  failed?: NodeReferenceValue[];
  /**
   * A mapping of IDs to error messages for the items that couldn't be deleted.
   */
  errors?: Record<string, string>;
};

export class DeleteQueryFactory<
  ShapeType extends Shape,
  U extends UpdatePartial<ShapeType>,
> extends MutationQueryFactory {
  readonly id: string;
  readonly ids: NodeReferenceValue[];

  constructor(
    public shapeClass: typeof Shape,
    ids: NodeId[] | NodeId,
  ) {
    super();
    this.ids = this.convertNodeReferences(ids);
  }

  getQueryObject(): DeleteQuery {
    return {
      type: 'delete',
      shape: this.shapeClass.shape,
      ids: this.ids,
    };
  }
}
