import { Shape } from '../../shapes/Shape';
import { ShapeValuesSet } from '../../collections/ShapeValuesSet';
import { SelectQuery } from '../LinkedQuery';
import { NodeShape,PropertyShape } from '../../shapes/SHACL';
import { NamedNode } from '../../models';

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

export type UpdateQuery<ResponseType=null> = {
  type:'update',
  id:string,
  shape:NodeShape,
  updates:NodeDescriptionValue;
}
export type LiteralUpdateValue = string | number | boolean | Date;
export type PropUpdateValue = SinglePropertyUpdateValue | SinglePropertyUpdateValue[];
export type SinglePropertyUpdateValue =
  NodeDescriptionValue
  | NodeReferenceValue
  | LiteralUpdateValue;
export type NodeDescriptionValue = {
  shape:NodeShape
  fields:UpdateNodePropertyValue[]
};
export type UpdateNodePropertyValue = {
  prop:PropertyShape,
  val:PropUpdateValue
};
export type NodeReferenceValue = {id:string};

export class LinkedUpdateQuery<ShapeType extends Shape,U extends UpdatePartial<ShapeType>> {
  readonly id:string;
  readonly fields:NodeDescriptionValue;

  constructor(public shapeClass: typeof Shape,id:string|{id:string}|{uri:string},updateObjectOrFn:U)
  {
    this.id = (typeof id === 'string' ? id : ((id as any).id || (id as any).uri)) as string;
    this.fields = this.convertUpdateObject(updateObjectOrFn,this.shapeClass.shape);
  }
  private convertUpdateObject(obj,shape:NodeShape)
  {
    if (typeof obj === 'object' && !(obj instanceof Date))
    {
      if ('id' in obj)
      {
        throw new Error("You cannot use id in the top level of an update object");
      }
      return this.convertNodeDescription(obj,shape);
    }
    else if (typeof obj === 'function')
    {
      //TODO
    }
    else
    {
      throw new Error("Invalid update object");
    }
  }
  private convertNodeDescription(obj:Object,shape:NodeShape):NodeDescriptionValue {
    const props = shape.getPropertyShapes();
    const fields:UpdateNodePropertyValue[] = [];
    for(var key in obj) {
      let propShape = props.find(p => p.label === key);
      if(!propShape) {
        console.warn(`Cannot find property shape to update for key: ${key}`);
      } else {
        fields.push(this.createNodePropertyValue(obj[key],propShape));
      }
    }
    return {
      fields,
      shape
    };
  }
  private createNodePropertyValue(value,propShape:PropertyShape):UpdateNodePropertyValue {
    // let value = obj[propShape.label];
    return {
      prop:propShape,
      val:this.convertUpdateValue(value,propShape)
    } as UpdateNodePropertyValue;
  }
  private convertUpdateValue(value,propShape?:PropertyShape,allowArrays:boolean=true):PropUpdateValue {
    //single value which will
    if(typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value instanceof Date) {
      return value as LiteralUpdateValue;
    }

    //if multiple items are given as value of this prop
    if(Array.isArray(value)) {
      if(!allowArrays) {
        throw new Error('Nested arrays are not allowed as values of keys');
      }
      //then convert each value, but disallow nested arrays
      return value.map(o => {
        return this.convertUpdateValue(o,propShape,false);
      }) as SinglePropertyUpdateValue[];
    }
    if(typeof value === 'object') {
      if('id' in value)
      {
        //ensure there are no other properties in the object
        if(Object.keys(value).length > 1) {
          throw new Error('Cannot have id and other properties in update object');
        }
        return { id: value.id } as NodeReferenceValue;
      } else {
        //pass the value shape of the property as the node shape of this value
        if(!propShape.valueShape) {
          //TODO: not sure if this should be an error. Does every @linkedObject need to define the shape of the values?
          //If not, then how do we continue? because currently we use the value shape to look up further property shapes
          throw new Error('Cannot update properties with plain objects if the shape of the values is not know. See how the @objectProperty is used in the get/set method and make sure it defines the \'shape\' key.');
        }
        return this.convertNodeDescription(value,propShape.valueShape);
      }
    }
    throw new Error(`Unsupported update value type: ${typeof value}`);
  }
  getQueryObject():UpdateQuery<WithId<U>> {
    return {
      type:'update',
      id:this.id,
      shape:this.shapeClass.shape,
      updates:this.fields
    }
  }
}