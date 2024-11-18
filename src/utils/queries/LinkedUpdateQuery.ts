import { Shape } from '../../shapes/Shape';
import { ShapeValuesSet } from '../../collections/ShapeValuesSet';
import { SelectQuery } from '../LinkedQuery';
import { NodeShape,PropertyShape } from '../../shapes/SHACL';

export type Prettify<T> = T extends infer R
  ? {
    [K in keyof R]: R[K];
  }
  : never;

export type WithId<U> = Prettify<{
  [K in keyof U]: U[K] extends Array<infer T> ? Array<WithId<T>> :
    U[K] extends String ? U[K] :
      U[K] extends Number ? U[K] :
        U[K] extends Boolean ? U[K] :
          WithId<U[K]>
} & {id:string}>;


// type UpdatePartial<Shape> = WithoutFunctions<Shape>;
export type UpdatePartial<Shape> = Partial<Omit<{
  // type UpdatePartial<Shape> = Partial<{
  // [P in keyof WithoutFunctions<Shape>]: ShapePropertyToUpdatePartial<WithoutFunctions<Shape>[P]>
  // [P in keyof WithoutFunctions<Shape>]: WithoutFunctions<Shape>[P]
  [P in KeysWithoutFunctions<Shape>]: ShapePropertyToUpdatePartial<Shape[P]>
},'node'|'nodeShape'|'namedNode'|'targetClass'>>;
// type AvailableUpdateKeys<Shape> = Omit<KeysWithoutFunctions<Shape>,'nodeShape'|'node'|'namedNode'>
type KeysWithoutFunctions<T> = {
  [K in keyof T]: T[K] extends Function ? never : K
}[keyof T];

// type ShapePropertyToUpdatePartial<ShapeProperty> = ShapeProperty;
type ShapePropertyToUpdatePartial<ShapeProperty> = ShapeProperty extends Shape ? UpdatePartial<ShapeProperty> :
  ShapeProperty extends ShapeValuesSet<infer SSType> ? UpdatePartial<SSType>[] : ShapeProperty;

export type UpdateQuery<ResponseType> = {
  type:'update',
  id:string,
  shape:NodeShape,
  fields:UpdateField[]
}
export type UpdateField = {
  prop:PropertyShape,
  val:any
}

export class LinkedUpdateQuery<ShapeType extends Shape,U extends UpdatePartial<ShapeType>> {
  private id:string;
  private fields:UpdateField[];

  constructor(public shapeClass: typeof Shape,id:string|{id:string}|{uri:string},private updateObjectOrFn:U)
  {
    this.id = (typeof id === 'string' ? id : (id as any).id | (id as any).uri) as string;
    this.fields = this.convertUpdateObject(updateObjectOrFn,this.shapeClass.shape);
  }
  private convertUpdateObject(obj,shape:NodeShape) {
    if(!(typeof obj === 'object')) {
      return obj;
    }
    const props = shape.getPropertyShapes();
    const fields:UpdateField[] = [];
    for(var key in obj) {
      let propShape = props.find(p => p.label === key);
      if(!propShape) {
        console.warn(`Cannot find property shape to update for key: ${key}`);
      } else {
        fields.push({
          prop:propShape,
          val:this.convertUpdateObject(obj[key],propShape.valueShape)
        })
      }
    }
    return fields;
  }
  getQueryObject():UpdateQuery {
    return {
      type:'update',
      id:this.id,
      shape:this.shapeClass.shape,
      fields:this.fields
    }
  }
}