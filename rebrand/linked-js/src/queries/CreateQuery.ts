import {Shape} from '../shapes/Shape.js';
import type {QResult} from './SelectQuery.js';
import type {NodeShape} from '../shapes/ShapeDefinition.js';
import {MutationQueryFactory, NodeDescriptionValue} from './MutationQuery.js';

export type CreateQuery<ResponseType = null> = {
  type: 'create';
  shape: QResult<NodeShape>;
  description: NodeDescriptionValue;
};

export class CreateQueryFactory<ShapeType extends Shape> extends MutationQueryFactory {
  readonly description: NodeDescriptionValue;

  constructor(
    public shapeClass: typeof Shape,
    updateObject: Record<string, unknown>,
  ) {
    super();
    this.description = this.convertUpdateObject(
      updateObject,
      this.shapeClass.shape,
      true,
    );
  }

  getQueryObject(): CreateQuery {
    return {
      type: 'create',
      shape: this.shapeClass.shape,
      description: this.description,
    };
  }
}
