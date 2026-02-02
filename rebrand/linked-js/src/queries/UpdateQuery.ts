import {Shape} from '../shapes/Shape.js';
import type {QResult} from './SelectQuery.js';
import type {NodeShape} from '../shapes/ShapeDefinition.js';
import {MutationQueryFactory, NodeDescriptionValue, NodeId} from './MutationQuery.js';

export type UpdateQuery<ResponseType = null> = {
  type: 'update';
  id: string;
  shape: QResult<NodeShape>;
  updates: NodeDescriptionValue;
};

export class UpdateQueryFactory<ShapeType extends Shape> extends MutationQueryFactory {
  readonly id: string;
  readonly updates: NodeDescriptionValue;

  constructor(
    public shapeClass: typeof Shape,
    id: NodeId,
    updateObject: Record<string, unknown>,
  ) {
    super();
    this.id = this.convertNodeReference(id).id;
    this.updates = this.convertUpdateObject(
      updateObject,
      this.shapeClass.shape,
    );
  }

  getQueryObject(): UpdateQuery {
    return {
      type: 'update',
      id: this.id,
      shape: this.shapeClass.shape,
      updates: this.updates,
    };
  }
}
