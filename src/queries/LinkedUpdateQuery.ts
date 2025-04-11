import { Shape } from '../shapes/Shape';
import { AddId,LinkedQuery,NodeDescriptionValue,UpdatePartial } from './LinkedQuery';
import { NodeShape } from '../shapes/SHACL';

export type UpdateQuery<ResponseType = null> = {
  type: 'update',
  id: string,
  shape: NodeShape,
  updates: NodeDescriptionValue;
}

export class LinkedUpdateQuery<ShapeType extends Shape,U extends UpdatePartial<ShapeType>> extends LinkedQuery {
  readonly id:string;
  readonly fields:NodeDescriptionValue;

  constructor(public shapeClass: typeof Shape,id:string|{id:string}|{uri:string},updateObjectOrFn:U)
  {
    super();
    this.id = (typeof id === 'string' ? id : ((id as any).id || (id as any).uri)) as string;
    this.fields = this.convertUpdateObject(updateObjectOrFn,this.shapeClass.shape);
  }

  getQueryObject():UpdateQuery<AddId<U>> {
    return {
      type:'update',
      id:this.id,
      shape:this.shapeClass.shape,
      updates:this.fields
    }
  }
}