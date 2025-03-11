import { Shape } from '../../shapes/Shape.js';
import { ShapeValuesSet } from '../../collections/ShapeValuesSet.js';
import { NodeShape,PropertyShape } from '../../shapes/SHACL.js';

export type Prettify<T> = T extends infer R
  ? {
    [K in keyof R]: R[K];
  }
  : never;
type BoolIsObj = {}[]  extends Object ? true : false;
type StrIsObj = {}[] extends null ? 'yes' : false;
type StrIsObj2 = {}[] extends String ? true : false;
type ArrayIsObj2 = {}[] extends Array<any> ? true : false;
type ArrayIsObj3s = { } extends Number ? true : false;
type ArrayIsObj3d = { } extends Date ? true : false;
type ArrayIsObj3 = {} extends undefined ? true : false;
type ArrayIsObj4 = {} extends null ? true : false;
type ArrayIsObj5 = null extends null ? true : false;
type ArrayIsObj6 = undefined extends null ? true : false;
type ArrayIsObj56 = undefined extends Array<any> ? true : false;
type ArrayIsObj56a = null extends Array<any> ? true : false;
type ArrayIsObj56b = "asdf" extends Array<any> ? true : false;
type ArrayIsObj56bc = 4 extends Array<any> ? true : false;

/**
 * {
 *     hobby: string;
 *     friends: {
 *         name: string;
 *         friends: ({
 *             name: string;
 *             friends: {
 *                 name: string;
 *             }[];
 *             id?: undefined;
 *         } | {
 *             id: string;
 *             name?: undefined;
 *             friends?: undefined;
 *         } | {
 *             name: string;
 *             friends?: undefined;
 *             id?: undefined;
 *         })[];
 *     }[];
 * }
 */
//TODO: 1) is there another way to exclude everything except plain objects {}?
//Note: I was not able to prettify this (getting rid of "AddId") without losing information of deeply nested properties.
/**
 * Adds an id property to the object.
 */
// export type AddId<U> = U;

/**
 * Recursively adds an id property to all objects in the object.
 * Also makes all keys optional.
 */
type _AddId<U> = U extends string | number | boolean | Date | null | undefined
  ? U
  : U extends Array<infer T>
    ? Array<_AddId<T>>
    : WithId<U>;

type WithId<U> = {
  [K in keyof U]-?: _AddId<U[K]>; // Make all fields required
} & { id: string };

type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
  ) extends (k: infer I) => void
  ? I
  : never;

type CombineTypes<T> = {
  [K in keyof UnionToIntersection<T>]: T extends { [P in K]?: infer V }
    ? _AddId<V>
    : never;
};

// Recursive transformation with required fields
type RecursiveTransform<T> = T extends { friends: infer F }
  ? {
  [K in keyof T]-?: K extends "friends"
    ? RecursiveTransform<F>
    : _AddId<T[K]>;
} & { id: string }
  : T extends Array<infer U>
    ? Array<RecursiveTransform<U>>
    : _AddId<T>;

export type AddId<T> = Prettify<RecursiveTransform<T>>;
// export type AddId<T> = Prettify<_AddId<T>>;
// type _AddId<T> = T extends Array<infer U>
//   ? Array<AddId<U>>
//   : T extends Record<string, any> // Record checks for plain objects, hence we exclude dates and other objects that extend Object
//     ? WithId<T>
//     : T;
//
//
// /**
//  * Makes all keys optional and adds an id property.
//  */
// type WithId<T> = {
//   [K in keyof T]-?: AddId<T[K]>; // Recursively apply AddId to all properties
// } & { id: string };


// export type AddId<U> = Prettify<U extends String ? U :
//     U extends Number ? U :
//       U extends Date ? U :
//        U extends Boolean ? U :
//        U extends null ? U :
//        U extends undefined ? U :
//          U extends Array<infer T> ? Array<AddId<CombineTypes<T>>> : WithId<U>>;
//
//
// type WithId<U> = {[K in keyof U]: AddId<U[K]>} & {id:string};
//
// type UnionToIntersection<U> =
//   (U extends any ? (k: U) => void : never) extends
//     ((k: infer I) => void) ? I : never;
//
//
// type CombineTypes<T> = {
//   [K in keyof UnionToIntersection<T>]: T extends { [P in K]?: infer V }
//     ? AddId<V>
//     : never;
// };
// type CombineTypes<T> = Partial<{
//   [K in keyof UnionToIntersection<T>]: T extends { [P in K]?: infer V } ? V : never;
// }>;

// type Prettify<T> = { [K in keyof T]: T[K] };

// type RemoveUndefinedKeys<T> = {
//   [K in keyof T as T[K] extends undefined ? never : K]: T[K];
// };

// type UpdatePartial<Shape> = WithoutFunctions<Shape>;
export type UpdatePartial<Shape> = UpdateNodeDescription<Shape> | NodeReferenceValue;
type UpdateNodeDescription<Shape> = Partial<Omit<{
  [P in KeysWithoutFunctions<Shape>]: ShapePropValueToUpdatePartial<Shape[P]>
},'node'|'nodeShape'|'namedNode'|'targetClass'>>;
// type AvailableUpdateKeys<Shape> = Omit<KeysWithoutFunctions<Shape>,'nodeShape'|'node'|'namedNode'>
type KeysWithoutFunctions<T> = {
  [K in keyof T]: T[K] extends Function ? never : K
}[keyof T];

// type ShapePropertyToUpdatePartial<ShapeProperty> = ShapeProperty;
type ShapePropValueToUpdatePartial<ShapeProperty> = ShapeProperty extends Shape ? UpdatePartial<ShapeProperty> :
  ShapeProperty extends ShapeValuesSet<infer SSType> ? UpdatePartial<SSType>[] : ShapeProperty;

export type UpdateQuery<ResponseType=null> = {
  type:'update',
  id:string,
  shape:NodeShape,
  updates:NodeDescriptionValue;
}
type UnsetValue = undefined;
export type LiteralUpdateValue = string | number | boolean | Date;
export type PropUpdateValue = SinglePropertyUpdateValue | SinglePropertyUpdateValue[];
export type SinglePropertyUpdateValue =
  NodeDescriptionValue
  | NodeReferenceValue
  | LiteralUpdateValue
  | UnsetValue;
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
    } else if (typeof value === 'undefined') {
      return value;
    } else if(value === null) {
      throw new Error('Value cannot be null. If you want to unset a value, use undefined');
    }
    throw new Error(`Unsupported update value type: ${typeof value}`);
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