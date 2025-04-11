import { Shape } from '../shapes/Shape';
import { NodeShape } from '../shapes/SHACL';
import { LinkedQueryObject } from './LinkedSelectQuery';
import { AddId,LinkedQuery,NodeDescriptionValue,UpdatePartial } from './LinkedQuery';
import { MutationQuery } from './MutationQuery';

export interface CreateQuery<ResponseType=null> extends LinkedQueryObject {
  type:'create',
  shape:NodeShape,
  description:NodeDescriptionValue;
}

export class LinkedCreateQuery<
  ShapeType extends Shape,
  U extends UpdatePartial<ShapeType>
> extends MutationQuery
{
  readonly id:string;
  readonly description:NodeDescriptionValue;
  constructor(public shapeClass: typeof Shape,updateObjectOrFn:U)
  {
    super();
    this.description = this.convertUpdateObject(updateObjectOrFn,this.shapeClass.shape);
  }
  getQueryObject():CreateQuery<AddId<U>> {
    return {
      type:'create',
      shape:this.shapeClass.shape,
      description:this.description
    }
  }
}