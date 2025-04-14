import { LinkedQuery } from './SelectQuery';
import { NodeShape,PropertyShape } from '../shapes/SHACL';
import { Shape } from '../shapes/Shape';
import { ShapeValuesSet } from '../collections/ShapeValuesSet';

export type Prettify<T> = T extends infer R
  ? {
    [K in keyof R]: R[K];
  }
  : never;

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

export type SetModification<SSType> = {
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

export abstract class QueryFactory
{
  getQueryObject(): LinkedQuery
  {
    return null;
  }
}
