import { LinkedQueryObject } from './LinkedSelectQuery';
import { NodeShape,PropertyShape } from '../../shapes/SHACL';
import { Shape } from '../../shapes/Shape';
import { ShapeValuesSet } from '../../collections/ShapeValuesSet';

export type Prettify<T> = T extends infer R
  ? {
    [K in keyof R]: R[K];
  }
  : never;
type BoolIsObj = {}[] extends Object ? true : false;
type StrIsObj = {}[] extends null ? 'yes' : false;
type StrIsObj2 = {}[] extends String ? true : false;
type ArrayIsObj2 = {}[] extends Array<any> ? true : false;
type ArrayIsObj3s = {} extends Number ? true : false;
type ArrayIsObj3d = {} extends Date ? true : false;
type ArrayIsObj3 = {} extends undefined ? true : false;
type ArrayIsObj4 = {} extends null ? true : false;
type ArrayIsObj5 = null extends null ? true : false;
type ArrayIsObj6 = undefined extends null ? true : false;
type ArrayIsObj56 = undefined extends Array<any> ? true : false;
type ArrayIsObj56a = null extends Array<any> ? true : false;
type ArrayIsObj56b = 'asdf' extends Array<any> ? true : false;
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

type RemoveId<U> = Omit<U,'id'>;
// type WithId<U> = {
//   [K in keyof U]-?: _AddId<U[K]>; // Make all fields required
// } & { id: string };

type WithId<U> = U & { id: string };

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

type IsPlainObject<T> = T extends object
  ? T extends any[]
    ? false
    : T extends Function
      ? false
      : T extends Date
        ? false
        : T extends RegExp
          ? false
          : T extends Error
            ? false
            : T extends null
              ? false
              : T extends undefined
                ? false
                : T extends object
                  ? true
                  : false
  : false;

// type X = [{
//   id:string
// },{
//   id:string
// },{
//   name:string
// }];
// type OfX<X> = Prettify<{
//   updatedTo:(X extends Array<infer U> ? U : X)[]
// }>;
// type Y = OfX<X>;
// let x:Y;
// let name = x.updatedTo[0].name;

type RecursiveTransform<T> =
  T extends string | number | boolean | Date | null | undefined
    ? T
    : T extends Array<infer U>
      ? UpdatedSet<Prettify<RecursiveTransform<U>>>
      : IsSetModification<T> extends true
        ? ModifiedSet<T>
        : IsPlainObject<T> extends true
          // ? WithId<{ [K in keyof T]-?: Prettify<RecursiveTransform<T[K]>> }>
          ? WithId<{ [K in keyof T]: Prettify<RecursiveTransform<T[K]>> }>
          : T;//<-- should be never?

type UpdatedSet<U> = {
  updatedTo: U[]
};
type IsSetModification<T> = T extends { add?: any;remove?: any } ? true : false;
type AddedType<T> =
  T extends { add: (infer U)[] }
    ? U
    : T extends { add: infer U }
      ? U
      : never;

type RemovedType<T> =
  T extends { remove: (infer U)[] }
    ? U
    : T extends { remove: infer U }
      ? U
      : never;

type ModifiedSet<T> = {
  added: AddId<AddedType<T>>[];
  removed: AddId<RemovedType<T>>[];
};

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
export type UpdatePartial<S = Shape> = UpdateNodeDescription<S> | NodeReferenceValue;
type UpdateNodeDescription<Shape> = Partial<Omit<{
  [P in KeysWithoutFunctions<Shape>]: ShapePropValueToUpdatePartial<Shape[P]>
},'node' | 'nodeShape' | 'namedNode' | 'targetClass'>>;
// type AvailableUpdateKeys<Shape> = Omit<KeysWithoutFunctions<Shape>,'nodeShape'|'node'|'namedNode'>
type KeysWithoutFunctions<T> = {
  [K in keyof T]: T[K] extends Function ? never : K
}[keyof T];

// type ShapePropertyToUpdatePartial<ShapeProperty> = ShapeProperty;
type ShapePropValueToUpdatePartial<ShapeProperty> = ShapeProperty extends Shape ? UpdatePartial<ShapeProperty> :
  ShapeProperty extends ShapeValuesSet<infer SSType> ? SetUpdateValue<SSType> : ShapeProperty;

type SetUpdateValue<SSType> = UpdatePartial<SSType>[] | SetModification<SSType>;

type SetModification<SSType> = {
  add?: UpdatePartial<SSType>[] | UpdatePartial<SSType>,
  remove?: UpdatePartial<SSType>[] | UpdatePartial<SSType>
};

export type SetModificationValue = {
  $add?: UpdatePartial[],
  $remove?: NodeReferenceValue[]
}

type UnsetValue = undefined;
export type LiteralUpdateValue = string | number | boolean | Date;
export type PropUpdateValue = SinglePropertyUpdateValue | SinglePropertyUpdateValue[] | SetModificationValue;
export type SinglePropertyUpdateValue =
  NodeDescriptionValue
  | NodeReferenceValue
  | LiteralUpdateValue
  | UnsetValue;
export type NodeDescriptionValue = {
  shape: NodeShape
  fields: UpdateNodePropertyValue[]
};
export type UpdateNodePropertyValue = {
  prop: PropertyShape,
  val: PropUpdateValue
};
export type NodeReferenceValue = { id: string };

export abstract class LinkedQuery
{
  getQueryObject(): LinkedQueryObject
  {
    return null;
  }

  protected convertUpdateObject(obj,shape: NodeShape)
  {
    if (typeof obj === 'object' && !(obj instanceof Date))
    {
      return this.convertNodeDescription(obj,shape);
    }
    else if (typeof obj === 'function')
    {
      //TODO
      throw new Error('Update functions are not implemented yet');
    }
    else
    {
      throw new Error('Invalid update object');
    }
  }

  protected isSetModification(obj,shape)
  {
    // return obj.add || obj.remove;
    let hasAdd = obj.add;
    let hasRemove = obj.remove;
    let numKeysExpected = (hasAdd ? 1 : 0) + (hasRemove ? 1 : 0);
    let numKeys = Object.getOwnPropertyNames(obj).length;
    return hasAdd || hasRemove && numKeysExpected === numKeys;
  }

  protected convertSetModification(obj: SetModification<any>,shape: PropertyShape): SetModificationValue
  {
    if (!obj.add && !obj.remove)
    {
      throw new Error('Set modification should have either add or remove key');
    }
    const res: SetModificationValue = {};
    if (obj.add)
    {
      res.$add = this.convertSetAddValue(obj.add,shape);
    }
    if (obj.remove)
    {
      res.$remove = this.convertSetRemoveValue(obj.remove,shape);
    }
    return res;
  }

  protected convertSetRemoveValue(obj: UpdatePartial | UpdatePartial[],shape: PropertyShape): NodeReferenceValue[]
  {
    //the user can either pass an array of node references or a single node reference
    //either way we should return an array of node reference values
    if (Array.isArray(obj))
    {
      return obj.map(o => this.convertSingleRemoveValue(o,shape));
    }
    else
    {
      return [this.convertSingleRemoveValue(obj,shape)];
    }
  }

  protected convertSetAddValue(obj: UpdatePartial | UpdatePartial[],shape: PropertyShape): UpdatePartial[]
  {
    if (Array.isArray(obj))
    {
      return obj.map(o => this.convertUpdateValue(o,shape) as UpdatePartial);
    }
    else
    {
      return [this.convertUpdateValue(obj,shape) as UpdatePartial];
    }
  }

  protected convertSingleRemoveValue(value,shape: PropertyShape): NodeReferenceValue
  {
    if (this.isNodeReference(value))
    {
      return this.convertNodeReference(value);
    }
    else
    {
      throw new Error(`Invalid value for ${shape.label}.$remove. Expected an object with an id as key: {id:string}`);
    }
  }

  protected convertNodeDescription(obj: Object,shape: NodeShape): NodeDescriptionValue
  {
    if ('id' in obj)
    {
      throw new Error('You cannot use id in the top level of an update object');
    }
    const props = shape.getPropertyShapes(true);
    const fields: UpdateNodePropertyValue[] = [];
    for (var key in obj)
    {
      let propShape = props.find(p => p.label === key);
      if (!propShape)
      {
        throw Error(`Invalid property key: ${key}. ${shape.label} does not have a property with this name.`);
      }
      else
      {
        fields.push(this.createNodePropertyValue(obj[key],propShape));
      }
    }
    return {
      fields,
      shape,
    };
  }

  protected createNodePropertyValue(value,propShape: PropertyShape): UpdateNodePropertyValue
  {
    // let value = obj[propShape.label];
    return {
      prop: propShape,
      val: this.convertUpdateValue(value,propShape),
    } as UpdateNodePropertyValue;
  }

  protected convertUpdateValue(value,propShape?: PropertyShape,allowArrays: boolean = true): PropUpdateValue
  {
    //single value which will
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value instanceof Date)
    {
      return value as LiteralUpdateValue;
    }

    //if multiple items are given as value of this prop
    if (Array.isArray(value))
    {
      if (!allowArrays)
      {
        throw new Error('Nested arrays are not allowed as values of keys');
      }
      //then convert each value, but disallow nested arrays moving forward
      return value.map(o => {
        return this.convertUpdateValue(o,propShape,false);
      }) as SinglePropertyUpdateValue[];
    }
    if (typeof value === 'object')
    {
      if (this.isNodeReference(value))
      {
        return this.convertNodeReference(value);
      }
      else
      {
        let valueShape = propShape.valueShape;
        //pass the value shape of the property as the node shape of this value
        if (!propShape.valueShape)
        {
          //It's possible to define the shape of the value in the value itself for properties who do not define the shape in their objectProperty
          if (value.shape)
          {
            if (!(value.shape.shape instanceof NodeShape))
            {
              throw new Error(`The value of property "shape" is invalid and should be a class that extends Shape.`);
            }
            valueShape = (value.shape as typeof Shape).shape;
          }
          else
          {
            //TODO: not sure if this should be an error. Does every @linkedObject need to define the shape of the values?
            // If not, then how do we continue? because currently we use the value shape to look up further property shapes
            throw new Error(`Cannot update properties with plain objects if the shape of the values is not known. Make sure get/set ${propShape.parentNodeShape.label}.${propShape.label} defines the 'shape' key in its @objectProperty decorator.`);
          }
        }
        //never keep a shape key in the value object
        if (value.shape)
        {
          //double check that IF a shape value is provided, that it matches the shape from the @objectProperty decorator
          if (!(value.shape as typeof Shape).shape.equals(valueShape))
          {
            throw new Error(`The property 'shape' is reserved in LINCD and should not be used here in this way. The ${propShape.label} property already defines the shape of the value as ${propShape.label}. If you want to use a different shape, use the 'shape' key in the @objectProperty decorator.`);
          }
          delete value.shape;
        }

        if (this.isSetModification(value,propShape))
        {
          return this.convertSetModification(value,propShape);
        }
        else
        {
          return this.convertNodeDescription(value,valueShape);
        }
        // //check if the property shape allows a single value
        // if(propShape.maxCount === 1) {
        //   //if yes, then the object should be seen as a node description
        //   return this.convertNodeDescription(value,propShape.valueShape);
        // } else {
        //   if(this.isSetModification(value,propShape)) {
        //     //but if multiple values are allowed, the value should either be an Array of node descriptions
        //     //OR an object with add or remove keys
        //     return this.convertSetModification(value,propShape);
        //   } else {
        //     //it must be a set overwrite, and it must be coming from an array
        //     if(!allowArrays) {
        //       return this.convertNodeDescription(value,propShape.valueShape);
        //     } else {
        //       throw new Error("Invalid array value. Should be a node reference or node description")
        //     }
        //   }
        // }

      }
    }
    else if (typeof value === 'undefined')
    {
      return value;
    }
    else if (value === null)
    {
      throw new Error('Value cannot be null. If you want to unset a value, use undefined');
    }
    throw new Error(`Unsupported update value type: ${typeof value}`);
  }

  protected isNodeReference(obj): obj is NodeReferenceValue
  {
    return 'id' in obj;
  }

  protected convertNodeReference(obj: { id: string }): NodeReferenceValue
  {
    //ensure there are no other properties in the object
    if (Object.keys(obj).length > 1)
    {
      throw new Error('Cannot have id and other properties in the same value object');
    }
    return { id: obj.id };
  }
}
