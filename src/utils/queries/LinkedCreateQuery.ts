import { Shape } from '../../shapes/Shape.js';
import { NodeShape } from '../../shapes/SHACL.js';
import { LinkedQueryObject } from './LinkedSelectQuery';
import { AddId,LinkedQuery,NodeDescriptionValue,UpdatePartial } from './LinkedQuery';

export interface CreateQuery<ResponseType=null> extends LinkedQueryObject {
  type:'create',
  shape:NodeShape,
  updates:NodeDescriptionValue;
}

export class LinkedCreateQuery<
  ShapeType extends Shape,
  U extends UpdatePartial<ShapeType>
> extends LinkedQuery
{
  readonly id:string;
  readonly fields:NodeDescriptionValue;
  constructor(public shapeClass: typeof Shape,updateObjectOrFn:U)
  {
    super();
    this.fields = this.convertUpdateObject(updateObjectOrFn,this.shapeClass.shape);
  }
  getQueryObject():CreateQuery<AddId<U>> {
    return {
      type:'create',
      shape:this.shapeClass.shape,
      updates:this.fields
    }
  }
}