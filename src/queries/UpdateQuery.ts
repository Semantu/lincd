import {Shape} from '../shapes/Shape.js';
import type {AddId, NodeDescriptionValue, UpdatePartial} from './QueryFactory.js';
import {NodeShape} from '../shapes/SHACL.js';
import {MutationQueryFactory} from './MutationQuery.js';

export type UpdateQuery<ResponseType = null> = {
  type: 'update';
  id: string;
  shape: NodeShape;
  updates: NodeDescriptionValue;
};

export class UpdateQueryFactory<
  ShapeType extends Shape,
  U extends UpdatePartial<ShapeType>,
> extends MutationQueryFactory {
  readonly id: string;
  readonly fields: NodeDescriptionValue;

  constructor(
    public shapeClass: typeof Shape,
    id:
      | string
      | {id: string}
      | {
          uri: string;
        },
    updateObjectOrFn: U,
  ) {
    super();
    this.id = (
      typeof id === 'string' ? id : (id as any).id || (id as any).uri
    ) as string;
    this.fields = this.convertUpdateObject(
      updateObjectOrFn,
      this.shapeClass.shape,
    );
  }

  getQueryObject(): UpdateQuery<AddId<U>> {
    return {
      type: 'update',
      id: this.id,
      shape: this.shapeClass.shape,
      updates: this.fields,
    };
  }
}
