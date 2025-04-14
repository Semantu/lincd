import { Shape } from '../shapes/Shape';
import { NodeShape } from '../shapes/SHACL';
import { LinkedQuery } from './SelectQuery';
import { AddId,QueryFactory,NodeDescriptionValue,UpdatePartial } from './QueryFactory';
import { MutationQueryFactory } from './MutationQuery';

export interface CreateQuery<ResponseType=null> extends LinkedQuery {
  type:'create',
  shape:NodeShape,
  description:NodeDescriptionValue;
}

export type CreateResponse<U> = AddId<U,true>;

export class CreateQueryFactory<
  ShapeType extends Shape,
  U extends UpdatePartial<ShapeType>
> extends MutationQueryFactory
{
  readonly id:string;
  readonly description:NodeDescriptionValue;
  constructor(public shapeClass: typeof Shape,updateObjectOrFn:U)
  {
    super();
    this.description = this.convertUpdateObject(updateObjectOrFn,this.shapeClass.shape);
  }
  getQueryObject():CreateQuery<AddId<U,true>> {
    return {
      type:'create',
      shape:this.shapeClass.shape,
      description:this.description
    }
  }
}