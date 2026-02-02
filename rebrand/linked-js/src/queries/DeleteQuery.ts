import {Shape} from '../shapes/Shape.js';
import type {QResult} from './SelectQuery.js';
import type {NodeShape} from '../shapes/ShapeDefinition.js';
import {MutationQueryFactory, NodeId, NodeReferenceValue} from './MutationQuery.js';

export type DeleteQuery = {
  type: 'delete';
  shape: QResult<NodeShape>;
  ids: NodeReferenceValue[];
};

export class DeleteQueryFactory<ShapeType extends Shape> extends MutationQueryFactory {
  readonly ids: NodeReferenceValue[];

  constructor(
    public shapeClass: typeof Shape,
    ids: NodeId | NodeId[],
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
