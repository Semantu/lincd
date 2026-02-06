import {Shape,ShapeType} from '../shapes/Shape.js';
import {PropertyShape} from '../shapes/SHACL.js';
import {ShapeSet} from '../collections/ShapeSet.js';
import {shacl} from '../ontologies/shacl.js';
import {CoreSet} from '../collections/CoreSet.js';
import {CoreMap} from '../collections/CoreMap.js';
import {getPropertyShapeByLabel,getShapeClass} from '../utils/ShapeClass.js';
import {NodeReferenceValue,Prettify,QueryFactory,ShapeReferenceValue} from './QueryFactory.js';
import {xsd} from '../ontologies/xsd.js';

/**
 * ###################################
 * #### TYPES FOR QUERY BUILDING  ####
 * ###################################
 */
export type JSPrimitive = JSNonNullPrimitive | null | undefined;
export type JSNonNullPrimitive = string | number | boolean | Date;

const isSameRef = (
  a?: NodeReferenceValue,
  b?: NodeReferenceValue,
): boolean => !!a && !!b && a.id === b.id;

export type SingleResult<ResultType> =
  ResultType extends Array<infer R>
    ? R
    : ResultType extends Set<infer R>
      ? R
      : ResultType;

/**
 * All the possible types that a regular get/set method of a Shape can return
 */
export type AccessorReturnValue =
  | Shape
  | ShapeSet
  | JSPrimitive
  | NodeReferenceValue;

export type WhereClause<S extends Shape | AccessorReturnValue> =
  | Evaluation
  | ((s: ToQueryBuilderObject<S>) => Evaluation);

export type QueryBuildFn<T extends Shape, ResponseType> = (
  p: ToQueryBuilderObject<T>,
  q: SelectQueryFactory<T>,
) => ResponseType;

export type QueryWrapperObject<ShapeType extends Shape = any> = {
  [key: string]: SelectQueryFactory<ShapeType>;
};
export type CustomQueryObject = {[key: string]: QueryPath};

export type SelectPath = QueryPath[] | CustomQueryObject;
export type SortByPath = {
  paths: QueryPath[];
  direction: 'ASC' | 'DESC';
};

/**
 * A LinkedQuery is used to build a query, when complete it can be turned into a LinkedQueryObject
 * that is used to send across the network as it can be serialized to JSON
 * @todo add | UpdateQuery and others
 */
export interface LinkedQuery {
  type: string;
}

export type SubQueryPaths = SelectPath;

/**
 * A QueryPath is an array of QuerySteps, representing the path of properties that were requested to reach a certain value
 */
export type QueryPath = (QueryStep | SubQueryPaths)[] | WherePath;

/**
 * A plain JS object that represents a LinkedQuery created by a Shape.select(...) call
 * It can be sent across the network.
 * @see LinkedQuery
 */
export interface SelectQuery<S extends Shape = Shape, ResultType = any>
  extends LinkedQuery {
  select: SelectPath;
  where?: WherePath;
  sortBy?: SortByPath;
  subject?: S | QResult<S>;
  limit?: number;
  offset?: number;
  shape?: ShapeType<S>;
  singleResult?: boolean;
}

/**
 * Much like a querypath, except it can only contain QuerySteps
 */
export type QueryPropertyPath = QueryStep[];

/**
 * A QueryStep is a single step in a query path
 * It contains the property that was requested, and optionally a where clause
 */
export type QueryStep =
  | PropertyQueryStep
  | SizeStep
  | CustomQueryObject
  | ShapeReferenceValue;
export type SizeStep = {
  count: QueryPropertyPath;
  label?: string;
};
export type PropertyQueryStep = {
  property: PropertyShape;
  where?: WherePath;
};

export type WhereAndOr = {
  firstPath: WherePath;
  andOr: AndOrQueryToken[];
};

/**
 * A WhereQuery is a (sub)query that is used to filter down the results of its parent query
 * Hence it extends LinkedQuery and can do anything a normal query can
 */
export type AndOrQueryToken = {
  and?: WherePath;
  or?: WherePath;
};

export enum WhereMethods {
  EQUALS = '=',
  SOME = 'some',
  EVERY = 'every',
}

/**
 * Maps all the return types of get/set methods of a Shape and maps their return types to QueryBuilderObjects
 */
export type QueryShapeProps<
  T extends Shape,
  Source,
  Property extends string | number | symbol = any,
> = {
  [P in keyof T]: ToQueryBuilderObject<T[P], QShape<T, Source, Property>, P>;
};

/**
 * This type states that the ShapeSet has access to the same methods as the shape of all the items in the set
 * (this is enabled with the QueryShapeSet.proxifyShapeSet method)
 * Each value of the shape is converted to a QueryBuilderObject
 */
export type QueryShapeSetProps<SourceShapeSet, Shape> = {
  [P in keyof Shape]: ToQueryBuilderObject<Shape[P], SourceShapeSet, P>;
};

/**
 * ShapeSets are converted to QueryShapeSets, but also inherit all the properties of the shape that each item in the set has (with converted result types)
 */
export type QShapeSet<
  ShapeSetType extends Shape,
  Source = null,
  Property extends string | number | symbol = null,
> = QueryShapeSet<ShapeSetType, Source, Property> &
  QueryShapeSetProps<
    QueryShapeSet<ShapeSetType, Source, Property>,
    ShapeSetType
  >;

/**
 * Shapes are converted to QueryShapes, but also inherit all the properties of the shape (with converted result types)
 */
export type QShape<
  T extends Shape,
  Source = any,
  Property extends string | number | symbol = any,
> = QueryShape<T, Source, Property> & QueryShapeProps<T, Source, Property>;

export type ToQueryBuilderObject<
  T,
  Source = null,
  Property extends string | number | symbol = '',
> =
  T extends ShapeSet<infer ShapeSetType>
    ? QShapeSet<ShapeSetType, Source, Property>
    : T extends Shape
      ? QShape<T, Source, Property>
      : T extends string | number | Date | boolean
        ? ToQueryPrimitive<T, Source, Property>
        : // : QueryBuilderObject<T,Source,Property>;
          T extends Array<infer AT>
          ? AT extends Date | string | number
            ? QueryPrimitiveSet<ToQueryPrimitive<AT, Source, Property>>
            : AT extends boolean
              ? QueryBoolean
              : AT[]
          : //added support for get/set methods that return NodeReferenceValue, treating them as plain Shapes
            T extends NodeReferenceValue
            ? QShape<Shape, Source, Property>
            : QueryBuilderObject<T, Source, Property>;

export type ToQueryPrimitive<
  T extends string | number | Date | boolean,
  Source,
  Property extends string | number | symbol = '',
> = T extends string
  ? QueryString<Source, Property>
  : T extends number
    ? QueryNumber<Source, Property>
    : T extends Date
      ? QueryDate<Source, Property>
      : T extends boolean
        ? QueryBoolean<Source, Property>
        : never;

export type WherePath = WhereEvaluationPath | WhereAndOr;

export type WhereEvaluationPath = {
  path: QueryPropertyPath;
  method: WhereMethods;
  args: QueryArg[];
};

// WherePath can also be an and/or wrapper; use this guard to safely access args.
export const isWhereEvaluationPath = (
  value: WherePath,
): value is WhereEvaluationPath => {
  return !!value && 'args' in value;
};

/**
 * An argument can be a direct reference to a node, a js primitive (boolean,number), a path to resolve (like from a query context variables)
 * Or a wherePath in the case of some() or every() (e.g. x.where(x.friends.some(f => f.age > 18) -> the argument is a wherePath)
 */
export type QueryArg =
  | NodeReferenceValue
  | JSNonNullPrimitive
  | ArgPath
  | WherePath;
export type ArgPath = {
  path: QueryPropertyPath;
  subject: ShapeReferenceValue;
};

export type ComponentQueryPath = (QueryStep | SubQueryPaths)[] | WherePath;

export type QueryComponentLike<ShapeType extends Shape, CompQueryResult> = {
  query:
    | SelectQueryFactory<ShapeType, CompQueryResult>
    | Record<string, SelectQueryFactory<ShapeType, CompQueryResult>>;
};
/**
 * ###################################
 * ####    QUERY RESULT TYPES     ####
 * ###################################
 */

export type NodeResultMap = CoreMap<string, QResult<any, any>>;

export type QResult<ShapeType extends Shape = Shape, Object = {}> = Object & {
  id: string;
  // shape?: ShapeType;
};

export type QueryProps<Q extends SelectQueryFactory<any>> =
  Q extends SelectQueryFactory<infer ShapeType, infer ResponseType>
    ? QueryResponseToResultType<ResponseType, ShapeType>
    : never;

export type QueryControllerProps = {
  query?: QueryController;
};
export type QueryController = {
  nextPage: () => void;
  previousPage: () => void;
  setLimit: (limit: number) => void;
  setPage: (page: number) => void;
};

export type PatchedQueryPromise<ResultType, ShapeType extends Shape> = {
  where(
    validation: WhereClause<ShapeType>,
  ): PatchedQueryPromise<ResultType, ShapeType>;
  limit(lim: number): PatchedQueryPromise<ResultType, ShapeType>;
  sortBy(
    sortParam: any,
    direction?: 'ASC' | 'DESC',
  ): PatchedQueryPromise<ResultType, ShapeType>;
  one(): PatchedQueryPromise<SingleResult<ResultType>, ShapeType>;
} & Promise<ResultType>;

export type GetCustomObjectKeys<T> = T extends QueryWrapperObject
  ? {
      [P in keyof T]: T[P] extends SelectQueryFactory<any>
        ? ToQueryResultSet<T[P]>
        : never;
    }
  : [];

export type QueryIndividualResultType<T extends SelectQueryFactory<any>> =
  T extends SelectQueryFactory<infer ShapeType, infer ResponseType>
    ? QueryResponseToResultType<ResponseType, ShapeType>
    : null;

export type ToQueryResultSet<T> =
  T extends SelectQueryFactory<infer ShapeType, infer ResponseType>
    ? QueryResponseToResultType<ResponseType, ShapeType>[]
    : null;

/**
 * MAIN ENTRY to convert the response of a query into a result object
 */
export type QueryResponseToResultType<
  T,
  QShapeType extends Shape = null,
  HasName = false,
  // PreserveArray = false,
> = T extends QueryBuilderObject
  ? GetQueryObjectResultType<T, {}, false, HasName>
  : T extends SelectQueryFactory<any, infer Response, infer Source>
    ? GetNestedQueryResultType<Response, Source>
    : T extends Array<infer Type>
      ? UnionToIntersection<QueryResponseToResultType<Type>>
      : // ? PreserveArray extends true ? QueryResponseToResultType<Type,null,null,true>[] : UnionToIntersection<QueryResponseToResultType<Type,null,null,true>>
        T extends Evaluation
        ? boolean
        : T extends Object
          ? QResult<QShapeType, Prettify<ObjectToPlainResult<T>>>
          : never;

/**
 * Turns a QueryBuilderObject into a plain JS object
 * @param QV the query value type
 * @param SubProperties to add extra properties into the result object (used to merge arrays into objects for example)
 * @param SourceOverwrite if the source of the query value should be overwritten
 */
//QV QueryBuilderObject<string[],QShape<Person,null,''>,'nickNames'>[]
//SubProperties = {}
export type GetQueryObjectResultType<
  QV,
  SubProperties = {},
  PrimitiveArray = false,
  HasName = false,
> =
  //note: count needs to be above primitive
  QV extends SetSize<infer Source>
    ? SetSizeToQueryResult<Source, HasName>
    : QV extends QueryPrimitive<infer Primitive, infer Source, infer Property>
      ? CreateQResult<
          Source,
          PrimitiveArray extends true ? Primitive[] : Primitive,
          Property,
          {},
          HasName
        >
      : QV extends QueryShape<infer ShapeType, infer Source, infer Property>
        ? CreateQResult<Source, ShapeType, Property, SubProperties, HasName>
        : //   CreateQResult<Source, ShapeType, Property>
          QV extends BoundComponent<infer Source, infer CompQueryResult>
          ? GetQueryObjectResultType<
              Source,
              SubProperties & QueryResponseToResultType<CompQueryResult>,
              PrimitiveArray,
              HasName
            >
          : QV extends QueryShapeSet<
              infer ShapeType,
              infer Source,
              infer Property
            >
            ? CreateShapeSetQResult<
                ShapeType,
                Source,
                Property,
                SubProperties,
                HasName
              >
            : QV extends QueryPrimitiveSet<
                  infer QPrim extends QueryPrimitive<any>
                >
              ? GetQueryObjectResultType<QPrim, null, null, true>
              : QV extends Array<infer Type>
                ? UnionToIntersection<QueryResponseToResultType<Type>>
                : QV extends QueryBoolean<any, any>
                  ? 'bool'
                  : never;

//for now, we don't pass result types of nested queries of bound components
//instead we just pass on the result as it would have been if the query element was not extended with ".preLoadFor()"
export type GetShapesResultTypeWithSource<Source> =
  QueryResponseToResultType<Source>;
// export type GetShapesResultTypeWithSource<Source> =
//   Source extends QueryShape<infer ShapeType, infer Source, infer Property>
//     ? CreateQResult<Source, ShapeType, Property>
//     : Source extends QueryShapeSet<
//           infer ShapeType,
//           infer Source,
//           infer Property
//         >
//       ? CreateShapeSetQResult<ShapeType, Source, Property>
//       : never;

type GetQueryObjectProperty<T> =
  T extends QueryBuilderObject<any, any, infer Property>
    ? Property
    : T extends SelectQueryFactory<
          infer SubShapeType,
          infer SubResponse,
          infer SubSource
        >
      ? GetQueryObjectProperty<SubSource>
      : never;
type GetQueryObjectOriginal<T> =
  T extends QueryBuilderObject<infer Original>
    ? Original
    : T extends SelectQueryFactory<
          infer SubShapeType,
          infer SubResponse,
          infer SubSource
        >
      ? GetNestedQueryResultType<SubResponse, SubSource>
      : never;
/**
 * Converts an intersection of QueryBuilderObjects into a plain JS object
 * i.e. QueryString<Person,"name"> | QueryString<Person,"hobby"> --> {name: string, hobby: string}
 * To do this we get the Property of each QueryBuilderObject, and use it as the key in the resulting object
 * and, we get the Original type of each QueryBuilderObject, and use it as the value in the resulting object
 */
type QueryValueIntersectionToObject<Items> = {
  [Type in Items as GetQueryObjectProperty<Type>]: true; //GetQueryObjectOriginal<Type>;
};

export type SetSizeToQueryResult<Source, HasName = false> =
  Source extends QueryShapeSet<
    infer ShapeType,
    infer ParentSource,
    infer SourceProperty
  >
    ? HasName extends false
      ? //when we count something and we already know what the name of the variable of the resulting number is, then we return a number
        //But if we count a shapeset and its NOT in a custom object where a key (name) is already known, then we return a QResult
        //This QResult will be the same as it would be if there was no .count() statement. Except now it returns a number (hence we send number as value type)
        CreateQResult<ParentSource, number, SourceProperty>
      : number
    : number;

/**
 * If the source is an object (it extends shape)
 * then the result is a plain JS Object, with Property as its key, with type Value
 */
export type CreateQResult<
  Source,
  Value = undefined,
  Property extends string | number | symbol = '',
  SubProperties = {},
  HasName = false,
> =
  Source extends QueryShape<
    infer SourceShapeType,
    infer ParentSource,
    infer SourceProperty
  >
    ? //if the parent source is null, that means this is the final source-node in the query
      ParentSource extends null
      ? HasName extends true
        ? Value
        : //TODO: this must be simplified and rewritten
          // it is likely the most complex part of the type system currently
          // It turns out that sub-.select() on a QueryShapeSet ends up here with Value being null, and sub properties need to be added to the QResult itself
          // Whilst sub-.select() on a single QueryShape ends up here with Value being defined, in which case the SubProperties need to be included in the inner QResult
          Value extends null
          ? //hence we create a single QResult, but do not use CreateQResult (which will keep creating nested QResults)
            QResult<
              SourceShapeType,
              {
                //we pass Value and Value but not Property, so that when the value is a Shape or ShapeSet, there is recursion
                //but for all other cases (like string, number, boolean) the value is just passed through
                [P in Property]: CreateQResult<Value, Value>;
              } & SubProperties
            >
          : //hence we create a single QResult, but do not use CreateQResult (which will keep creating nested QResults)
            QResult<
              SourceShapeType,
              {
                //we pass Value and Value but not Property, so that when the value is a Shape or ShapeSet, there is recursion
                //but for all other cases (like string, number, boolean) the value is just passed through
                [P in Property]: CreateQResult<Value, Value, '', SubProperties>;
              }
            >
      : CreateQResult<
          ParentSource,
          QResult<
            SourceShapeType,
            {
              //we pass Value and Value but not Property, so that when the value is a Shape or ShapeSet, there is recursion
              //but for all other cases (like string, number, boolean) the value is just passed through
              [P in Property]: CreateQResult<Value, Value>;
            } & SubProperties
          >,
          SourceProperty,
          {},
          HasName
        >
    : Source extends QueryShapeSet<
          infer ShapeType,
          infer ParentSource,
          infer SourceProperty
        >
      ? //for a ShapeSet, we make the current result (a QResult) the value of a parent QResult (created with ToQueryResult)
        CreateQResult<
          ParentSource,
          QResult<
            ShapeType,
            {
              //we pass Value and Value but not Property, so that when the value is a Shape or ShapeSet, there is recursion
              //but for all other cases (like string, number, boolean) the value is just passed through
              [P in Property]: CreateQResult<Value, Value, null, SubProperties>;
            }
          >[],
          SourceProperty,
          {},
          HasName
        >
      : //Source is not a QueryShape or QueryShape set (currently sometimes used by end QueryPrimitives) ..
        // this needs to convert to value (amongst other things) for .select({customKeys}) and ObjectToPlainResult
        Value extends Shape
        ? QResult<Value, SubProperties>
        : // : Value extends boolean ? 'boolean' : Value;
          NormaliseBoolean<Value>;

type NormaliseBoolean<T> = [T] extends [boolean] ? boolean : T;

export type CreateShapeSetQResult<
  ShapeType = undefined,
  Source = undefined,
  Property extends string | number | symbol = '',
  SubProperties = {},
  HasName = false,
> =
  Source extends QueryShape<infer SourceShapeType, infer ParentSource>
    ? //if HasName is true and source is a QueryShape, but ITS source (ParentSource) is null
      //then we don't want to create a nested QResult, but instead we ignore this last property and we return an array of QResults of this source
      //This is used by custom object keys with values like: p.friends, which should return an array of QResult<Person> Objects, not a {friends:...} QResult
      //NOTE: this notation check if 2 statements are true: HasName is true, and ParentSource is null
      [HasName, ParentSource] extends [true, null]
      ? CreateQResult<Source, null, null>[]
      : QResult<
          SourceShapeType,
          {[P in Property]: CreateQResult<Source, null, null, SubProperties>[]}
        >
    : Source extends QueryShapeSet<
          infer ShapeType,
          infer ParentSource,
          infer SourceProperty
        >
      ? //for a shapeset source, we make the current result (a QResult) the value of a parent QResult (created with ToQueryResult)
        CreateQResult<
          ParentSource,
          QResult<
            ShapeType,
            {
              [P in Property]: CreateQResult<ShapeType>[];
            }
          >[],
          SourceProperty,
          {},
          HasName
        >
      : CreateQResult<ShapeType>;

/**
 * Ignores the source and property, and returns the converted value
 */
export type ObjectToPlainResult<T> = {
  //passing true as sourceOverwrite will mean that the original source is ignored and so the converted value will not be wrapped in a QResult
  // [P in keyof T]: QueryResponseToResultType<T[P], null, true>;
  [P in keyof T]: QueryResponseToResultType<T[P], null, true>;
};

export type GetSource<Source, Overwrite> = Overwrite extends null
  ? Source
  : Overwrite;

type GetNestedQueryResultType<Response, Source> =
  Source extends QueryBuilderObject
    ? //if the linked query originates from within another query (like with select())
      //then we turn the source into a result. And then pass the selected properties as "SubProperties"
      //regardless of whether the response type is an array or object, it gets converted into a result value object
      GetQueryObjectResultType<Source, QueryResponseToResultType<Response>>
    : //by default: we just convert the response type into a result value object
      QueryResponseToResultType<Response>[];

//https://stackoverflow.com/a/50375286/977206
type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer I,
) => void
  ? I
  : never;

/**
 * Converts the response of a nested query into a QResult object
 */
type ResponseToObject<R> =
  R extends Array<infer Type extends QueryBuilderObject>
    ? QueryValueIntersectionToObject<Type>
    : Prettify<ObjectToPlainResult<R>>;

export type GetQueryResponseType<Q> =
  Q extends SelectQueryFactory<any, infer ResponseType> ? ResponseType : Q;

export type GetQueryShapeType<Q> =
  Q extends SelectQueryFactory<infer ShapeType, infer ResponseType>
    ? ShapeType
    : never;

export type QueryResponseToEndValues<T> = T extends SetSize
  ? number[]
  : T extends SelectQueryFactory<any, infer Response>
    ? QueryResponseToEndValues<Response>[]
    : T extends QueryShapeSet<infer ShapeType>
      ? ShapeSet<ShapeType>
      : T extends QueryShape<infer ShapeType>
        ? ShapeType
        : T extends QueryString
          ? string[]
          : T extends Array<infer ArrType>
            ? Array<QueryResponseToEndValues<ArrType>>
            : T extends Evaluation
              ? boolean[]
              : T;

/**
 * ###################################
 * ####  QUERY BUILDING CLASSES   ####
 * ###################################
 */

export class QueryBuilderObject<
  OriginalValue = any,
  Source = any,
  Property extends string | number | symbol = any,
> {
  //is null by default to avoid warnings when trying to access wherePath when its undefined
  wherePath?: WherePath = null;
  protected originalValue?: OriginalValue;
  protected source: Source;
  protected prop: Property;

  constructor(
    public property?: PropertyShape,
    public subject?: QueryShape<any> | QueryShapeSet<any> | QueryPrimitiveSet,
  ) {}

  /**
   * Converts an original value into a query value
   * @param originalValue
   * @param requestedPropertyShape the property shape that is connected to the get accessor that returned the original value
   */
  static convertOriginal(
    originalValue: AccessorReturnValue,
    property: PropertyShape,
    subject: QueryShape<any> | QueryShapeSet<any> | QueryShape<any>,
  ): QueryBuilderObject {
    if (originalValue instanceof Shape) {
      return QueryShape.create(originalValue, property, subject);
    } else if (originalValue instanceof ShapeSet) {
      return QueryShapeSet.create(originalValue, property, subject);
    } else if (typeof originalValue === 'string') {
      return new QueryString(originalValue, property, subject);
    } else if (typeof originalValue === 'number') {
      return new QueryNumber(originalValue, property, subject);
    } else if (typeof originalValue === 'boolean') {
      return new QueryBoolean(originalValue, property, subject);
    } else if (originalValue instanceof Date) {
      return new QueryDate(originalValue, property, subject);
    } else if (Array.isArray(originalValue)) {
      return new QueryPrimitiveSet(originalValue, property, subject);
    } else if (
      originalValue &&
      typeof originalValue === 'object' &&
      'id' in originalValue
    ) {
      //Support accessors that return NodeReferenceValue when a value shape is known.
      if (property.valueShape) {
        const shapeClass = getShapeClass(property.valueShape) as any;
        if (!shapeClass) {
          throw new Error(
            `Shape class not found for ${property.valueShape.id}`,
          );
        }
        const shape = new shapeClass();
        shape.id = (originalValue as NodeReferenceValue).id;
        return QueryShape.create(shape, property, subject);
      }
      throw new Error(
        subject.getOriginalValue().nodeShape.label +
          '.' +
          property.label +
          ': A property accessor should return a Shape or a primitive value. Returning a NodeReferenceValue is currently not supported.',
      );
    } else {
      throw new Error('Unknown query path result type: ' + originalValue);
    }
  }

  /**
   * Create a Query Builder Object based on the requested PropertyShape
   */
  static generatePathValue(
    // originalValue: AccessorReturnValue,
    property: PropertyShape,
    subject: QueryShape<any> | QueryShapeSet<any> | QueryShape<any>,
  ): QueryBuilderObject {
    let datatype = property.datatype;
    let valueShape = property.valueShape;
    let singleValue = property.maxCount <= 1;
    if (datatype) {
      if (singleValue) {
        if (isSameRef(datatype, xsd.integer)) {
          return new QueryNumber(0, property, subject);
        } else if (isSameRef(datatype, xsd.boolean)) {
          return new QueryBoolean(false, property, subject);
        } else if (
          isSameRef(datatype, xsd.dateTime) ||
          isSameRef(datatype, xsd.date)
        ) {
          return new QueryDate(new Date(), property, subject);
        } else if (isSameRef(datatype, xsd.string)) {
          return new QueryString('', property, subject);
        }
      } else {
        //TODO review this, do we need property & subject in both of these? currently yes, but why
        return new QueryPrimitiveSet([''], property, subject, [
          new QueryString('', property, subject),
        ]);
      }
    }
    if (valueShape) {
      const shapeClass = getShapeClass(valueShape) as any;
      if(!shapeClass) {
        //TODO: getShapeClassAsync -> which will lazy load the shape class
        // but Im not sure if that's even possible with dynamic import paths, that are only known at runtime
        //UPDATE: we should not need to load shapeclasses. We just need to be able to access shapes.
        // but the problem remains that the ImageObject shape needs to be available, but thats easier, as its data
        throw new Error(`Shape class not found for ${valueShape.id}`);
      }
      const shapeValue = new shapeClass();
      if (singleValue) {
        return QueryShape.create(shapeValue, property, subject);
      } else {
        return QueryShapeSet.create(
          new ShapeSet([shapeValue]),
          property,
          subject,
        );
      }
    }

    //no value shape and no data type.
    //Lets look at the node kind
    if (
      isSameRef(property.nodeKind, shacl.Literal) ||
      isSameRef(property.nodeKind, shacl.BlankNodeOrLiteral)
    ) {
      if (singleValue) {
        //default to string if no datatype is set
        return new QueryString('', property, subject);
      } else {
        //TODO review this, do we need property & subject in both of these? currently yes, but why
        return new QueryPrimitiveSet([''], property, subject, [
          new QueryString('', property, subject),
        ]);
      }
    }

    //if an object is expected and no value shape is set, then warn
    throw Error(
      `No shape set for objectProperty ${property.parentNodeShape.label}.${property.label}`,
    );

    // //and use a generic shape
    // const shapeValue = new (Shape as any)(new TestNode(path));
    // if (singleValue) {
    //   return QueryShape.create(shapeValue, property, subject);
    // } else {
    //   //check if shapeValue is iterable
    //   if (!(Symbol.iterator in Object(shapeValue))) {
    //     throw new Error(
    //       `Property ${property.parentNodeShape.label}.${property.label} is not marked as single value (maxCount:1), but the value is not iterable`,
    //     );
    //   }
    //   return QueryShapeSet.create(new ShapeSet(shapeValue), property, subject);
    // }
  }

  static getOriginalSource(
    endValue: ShapeSet<Shape> | Shape[] | QueryPrimitiveSet,
  ): // | QueryValueSetOfSets,
  ShapeSet;

  static getOriginalSource(endValue: Shape): Shape;

  static getOriginalSource(endValue: QueryString): Shape | string;

  static getOriginalSource(
    endValue: string[] | QueryBuilderObject,
  ): Shape | ShapeSet;

  static getOriginalSource(
    endValue:
      | ShapeSet
      | Shape[]
      | Shape
      | string[]
      | QueryBuilderObject
      | QueryPrimitiveSet,
  ): AccessorReturnValue {
    if (typeof endValue === 'undefined') return undefined;
    if (endValue instanceof QueryPrimitiveSet) {
      return new ShapeSet(
        endValue.contents.map(
          (endValue) => this.getOriginalSource(endValue) as any as Shape,
        ),
      ) as ShapeSet;
    }
    if (endValue instanceof QueryString) {
      return endValue.subject
        ? this.getOriginalSource(endValue.subject as QueryShapeSet)
        : endValue.originalValue;
    }
    if (endValue instanceof QueryShape) {
      if (endValue.subject && !endValue.isSource) {
        return this.getOriginalSource(
          endValue.subject as QueryShape<any> | QueryShapeSet<any>,
        );
      }
      return endValue.originalValue;
    } else if (endValue instanceof Shape) {
      return endValue;
    } else if (endValue instanceof QueryShapeSet) {
      return new ShapeSet(
        (endValue as QueryShapeSet).queryShapes.map(
          (queryShape: QueryShape) =>
            this.getOriginalSource(queryShape) as Shape,
        ),
      );
    } else {
      throw new Error('Unimplemented. Return as is?');
    }
  }

  getOriginalValue() {
    return this.originalValue;
  }

  getPropertyStep(): QueryStep {
    return {
      property: this.property,
      where: this.wherePath,
    };
  }

  preloadFor<ShapeType extends Shape, CompQueryRes>(
    component: QueryComponentLike<ShapeType, CompQueryRes>,
  ): BoundComponent<this, CompQueryRes> {
    return new BoundComponent<this, CompQueryRes>(component, this);
  }

  limit(lim: number) {
    console.log(lim);
  }

  /**
   * Returns the path of properties that were requested to reach this value
   */
  getPropertyPath(currentPath?: QueryPropertyPath): QueryPropertyPath {
    let path: QueryPropertyPath = currentPath || [];
    //add the step of this object to the beginning of the path (so that the next parent will always before the current item)
    if (this.property || this.wherePath) {
      path.unshift(this.getPropertyStep());
    }
    if (this.subject) {
      return this.subject.getPropertyPath(path);
    }
    //when query context is used as the first step, then the first step is just a pointer to the subject it represents
    if ((this.originalValue as Shape)?.__queryContextId) {
      path.unshift(convertQueryContext(this as any as QueryShape));
    }
    return path;
  }
}

export class BoundComponent<
  Source extends QueryBuilderObject,
  CompQueryResult = any,
> extends QueryBuilderObject {
  constructor(
    public originalValue: QueryComponentLike<any, CompQueryResult>,
    public source: Source,
  ) {
    super(null, null);
  }

  getParentQueryFactory(): SelectQueryFactory<any> {
    let parentQuery: SelectQueryFactory<any> | Object =
      this.originalValue.query;

    if (parentQuery instanceof SelectQueryFactory) {
      return parentQuery;
    }
    if (typeof parentQuery === 'object') {
      if (Object.keys(parentQuery).length > 1) {
        throw new Error(
          'Only one key is allowed to map a query to a property for linkedSetComponents',
        );
      }
      for (let key in parentQuery) {
        if (parentQuery[key] instanceof SelectQueryFactory) {
          return parentQuery[key];
        }
        throw new Error(
          'Unknown value type for query object. Keep to this format: {propName: Shape.query(s => ...)}',
        );
      }
    }
    throw new Error(
      'Unknown data query type. Expected a LinkedQuery (from Shape.query()) or an object with 1 key whose value is a LinkedQuery',
    );
  }

  getPropertyPath() {
    let sourcePath: ComponentQueryPath = this.source.getPropertyPath();
    let requestQuery = this.getParentQueryFactory();
    let compSelectQuery = requestQuery.getQueryObject().select;

    if (Array.isArray(sourcePath)) {
      sourcePath.push(
        compSelectQuery.length === 1
          ? compSelectQuery[0].length === 1
            ? compSelectQuery[0][0]
            : compSelectQuery[0]
          : compSelectQuery,
      );
    }
    return sourcePath as QueryPropertyPath;
  }
}

/**
 * Converts query context to a ShapeReferenceValue
 */
const convertQueryContext = (shape: QueryShape): ShapeReferenceValue => {
  return {
    id: (shape.originalValue as Shape).__queryContextId,
    shape: {
      id: shape.originalValue.nodeShape.id,
    },
  } as ShapeReferenceValue;
};

const processWhereClause = (
  validation: WhereClause<any>,
  shape?,
): WherePath => {
  if (validation instanceof Function) {
    if (!shape) {
      throw new Error('Cannot process where clause without shape');
    }
    return new LinkedWhereQuery(shape, validation).getWherePath();
  } else {
    return (validation as Evaluation).getWherePath();
  }
};

export class QueryShapeSet<
  S extends Shape = Shape,
  Source = any,
  Property extends string | number | symbol = any,
> extends QueryBuilderObject<ShapeSet<S>, Source, Property> {
  public queryShapes: CoreSet<QueryShape>;
  private proxy;

  constructor(
    _originalValue?: ShapeSet<S>,
    property?: PropertyShape,
    subject?: QueryShape<any> | QueryShapeSet<any>,
  ) {
    super(property, subject);
    this.originalValue = _originalValue;

    //Note that QueryShapeSet intentionally does not store the _originalValue shape set, because it manipulates this.queryShapes
    // and then recreates the original shape set when getOriginalValue() is called
    this.queryShapes = new CoreSet(
      _originalValue?.map((shape) =>
        QueryShape.create(shape, property, subject),
      ),
    );
  }

  static create<S extends Shape = Shape>(
    originalValue: ShapeSet<S>,
    property: PropertyShape,
    subject: QueryShape<any> | QueryShapeSet<any>,
  ) {
    let instance = new QueryShapeSet<S>(originalValue, property, subject);

    let proxy = this.proxifyShapeSet<S>(instance);
    return proxy;
  }

  static proxifyShapeSet<T extends Shape = Shape>(
    queryShapeSet: QueryShapeSet<T>,
  ) {
    let originalShapeSet = queryShapeSet.getOriginalValue();

    queryShapeSet.proxy = new Proxy(queryShapeSet, {
      get(target, key, receiver) {
        //if the key is a string
        if (typeof key === 'string') {
          //if this is a get method that is implemented by the QueryShapeSet, then use that
          if (key in queryShapeSet) {
            //if it's a function, then bind it to the queryShape and return it so it can be called
            if (typeof queryShapeSet[key] === 'function') {
              return target[key].bind(target);
            }
            //if it's a get method, then return that
            //NOTE: we may not need this if we don't use any get methods in QueryValue classes?
            return queryShapeSet[key];
          }

          //if not, then a method/accessor was called that likely fits with the methods of the original SHAPE of the items in the shape set
          //As in Shape.friends.name -> key would be name, which is requested from (each item in!) a ShapeSet of Shapes
          //So here we find back the shape that all items have in common, and then find the property shape that matches the key
          //NOTE: this will only work if the key corresponds with an accessor in the shape that uses a @linkedProperty decorator
          let leastSpecificShape = queryShapeSet
            .getOriginalValue()
            .getLeastSpecificShape();
          let valueShape = leastSpecificShape ? leastSpecificShape.shape : null;
          if (!valueShape && queryShapeSet.property?.valueShape) {
            const shapeClass = getShapeClass(queryShapeSet.property.valueShape);
            valueShape = shapeClass?.shape;
          }
          let propertyShape: PropertyShape = valueShape
            ?.getPropertyShapes(true)
            .find((propertyShape) => propertyShape.label === key);

          //if the property shape is found
          if (propertyShape) {
            return queryShapeSet.callPropertyShapeAccessor(propertyShape);
          } else if (
            //else if a method of the original shape is called, like .forEach() or similar
            originalShapeSet[key] &&
            typeof originalShapeSet[key] === 'function'
          ) {
            //then return that method and bind the original value as 'this'
            return originalShapeSet[key].bind(originalShapeSet);
          } else if (key !== 'then' && key !== '$$typeof') {
            //TODO: there is a strange bug with "then" being called, only for queries that access ShapeSets (multi value props), but I'm not sure where it comes from
            //hiding the warning for now in that case as it doesn't seem to affect the results
            console.warn(
              'Could not find property shape for key ' +
                key +
                ' on shape ' +
                valueShape?.label +
                '. Make sure the get method exists and is decorated with @linkedProperty / @objectProperty / @literalProperty',
            );
          }
        }
        //otherwise return the value of the property on the original shape
        return originalShapeSet[key];
      },
    });
    return queryShapeSet.proxy;
  }

  as<ShapeClass extends typeof Shape>(
    shape: ShapeClass,
  ): QShapeSet<InstanceType<ShapeClass>, Source, Property> {
    //if the shape is not the same as the original value, then we need to create a new query shape
    if (!shape.shape.equals(this.originalValue.getLeastSpecificShape().shape)) {
      let newOriginal = new ShapeSet(
        this.originalValue.map((existing) => {
          const instance = new (shape as any)();
          if (existing?.id) {
            instance.id = existing.id;
          }
          return instance;
        }),
      );
      return QueryShapeSet.create(
        newOriginal,
        this.property,
        this.subject as any,
      );
    }
    // else return this
    return this as any as QShapeSet<InstanceType<ShapeClass>, Source, Property>;
  }

  add(item) {
    this.queryShapes.add(item);
  }

  concat(other: QueryShapeSet): QueryShapeSet {
    if (other) {
      if (other instanceof QueryShapeSet) {
        (other as QueryShapeSet).queryShapes.forEach(
          this.queryShapes.add.bind(this.queryShapes),
        );
      } else {
        throw new Error('Unknown type: ' + other);
      }
    }
    return this;
  }

  filter(filterFn): QueryShapeSet {
    let clone = new QueryShapeSet(
      new ShapeSet(),
      this.property,
      this.subject as QueryShape<any> | QueryShapeSet<any>,
    );
    clone.queryShapes = this.queryShapes.filter(filterFn);
    return clone;
  }

  setSource(val: boolean) {
    this.queryShapes.forEach((shape) => {
      shape.isSource = val;
    });
  }

  getOriginalValue() {
    return new ShapeSet(
      this.queryShapes.map((shape) => {
        return shape.originalValue;
      }),
    ) as ShapeSet<S>;
  }

  callPropertyShapeAccessor(
    propertyShape: PropertyShape,
  ): QueryShapeSet | QueryPrimitiveSet {
    //call the get method for that property shape on each item in the shape set
    //and return the result as a new shape set
    let result: QueryPrimitiveSet | QueryShapeSet; //QueryValueSetOfSets;

    //if we expect the accessor to return a Primitive (string,number,boolean,Date)
    if (isSameRef(propertyShape.nodeKind, shacl.Literal)) {
      //then return a Set of QueryPrimitives
      result = new QueryPrimitiveSet(null, propertyShape, this);
    } else {
      // result = QueryValueSetOfSets.create(propertyShape, this); //QueryShapeSet.create(null, propertyShape, this);
      result = QueryShapeSet.create(null, propertyShape, this);
    }
    let expectSingleValues =
      typeof propertyShape.maxCount === 'number' && propertyShape.maxCount <= 1;

    this.queryShapes.forEach((shape) => {
      //access the propertyShapes accessor,
      // since the shape should already be converted to a QueryShape, the result is a QueryValue also
      let shapeQueryValue = shape[propertyShape.label];

      //only add results if something was actually returned, if the property is not defined for this shape the result can be undefined
      if (shapeQueryValue) {
        if (expectSingleValues) {
          (result as any).add(shapeQueryValue);
        } else {
          //if each of the shapes in a set return a new shapeset for the request accessor
          //then we merge all the returned values into a single shapeset
          (result as QueryShapeSet).concat(shapeQueryValue);
        }
      }
    });
    return result;
  }

  //countable?, resultKey?: string
  size(): SetSize<this> {
    //when count() is called we want to count the number of items in the entire query path
    return new SetSize(this); //countable, resultKey
  }

  // get testItem() {}
  where(validation: WhereClause<S>): this {
    if (
      (this.getPropertyPath() as QueryStep[]).some(
        (step) => (step as PropertyQueryStep).where,
      )
    ) {
      throw new Error(
        'You cannot call where() from within a where() clause. Consider using some() or every() instead',
      );
    }
    let leastSpecificShape = this.getOriginalValue().getLeastSpecificShape();
    this.wherePath = processWhereClause(validation, leastSpecificShape);
    //return this.proxy because after Shape.friends.where() we can call other methods of Shape.friends
    //and for that we need the proxy
    return this.proxy;
  }

  select<QF = unknown>(
    subQueryFn: QueryBuildFn<S, QF>,
  ): SelectQueryFactory<S, QF, QueryShapeSet<S, Source, Property>> {
    let leastSpecificShape = this.getOriginalValue().getLeastSpecificShape();
    let subQuery = new SelectQueryFactory(leastSpecificShape, subQueryFn);
    subQuery.parentQueryPath = this.getPropertyPath();
    return subQuery as any;
  }

  some(validation: WhereClause<S>): SetEvaluation {
    return this.someOrEvery(validation, WhereMethods.SOME);
  }

  every(validation: WhereClause<S>): SetEvaluation {
    return this.someOrEvery(validation, WhereMethods.EVERY);
  }

  private someOrEvery(validation: WhereClause<S>, method: WhereMethods) {
    let leastSpecificShape = this.getOriginalValue().getLeastSpecificShape();
    //do we need to store this here? or are we accessing the evaluation and then going backwards?
    //in that case just pass it to the evaluation and don't use this.wherePath
    let wherePath = processWhereClause(validation, leastSpecificShape);
    return new SetEvaluation(this, method, [wherePath]);
  }
}

export class QueryShape<
  S extends Shape = Shape,
  Source = any,
  Property extends string | number | symbol = any,
> extends QueryBuilderObject<S, Source, Property> {
  public isSource: boolean;
  private proxy;

  constructor(
    public originalValue: S,
    property?: PropertyShape,
    subject?: QueryShape<any> | QueryShapeSet<any>,
  ) {
    super(property, subject);
  }

  get id() {
    return (
      (this.originalValue as Shape).__queryContextId ||
      this.originalValue['id']
    );
  }

  // where(validation: WhereClause<S>): this {
  //   let nodeShape = this.originalValue.nodeShape;
  //   this.wherePath = processWhereClause(validation, nodeShape);
  //   //return this because after Shape.friends.where() we can call other methods of Shape.friends
  //   return this.proxy;
  // }

  static create(
    original: Shape,
    property?: PropertyShape,
    subject?: QueryShape<any> | QueryShapeSet<any>,
  ) {
    let instance = new QueryShape(original, property, subject);
    let proxy = this.proxifyQueryShape(instance);
    return proxy;
  }

  private static proxifyQueryShape<T extends Shape>(queryShape: QueryShape<T>) {
    let originalShape = queryShape.originalValue;
    queryShape.proxy = new Proxy(queryShape, {
      get(target, key, receiver) {
        //if the key is a string
        if (typeof key === 'string') {
          //if this is a get method that is implemented by the QueryShape, then use that
          if (key in queryShape) {
            //if it's a function, then bind it to the queryShape and return it so it can be called
            if (typeof queryShape[key] === 'function') {
              return target[key].bind(target);
            }
            //if it's a get method, then return that
            //NOTE: we may not need this if we don't use any get methods in QueryValue classes?
            return queryShape[key];
          }

          //if not, then a method/accessor of the original shape was called
          //then check if we have indexed any property shapes with that name for this shapes NodeShape
          //NOTE: this will only work with a @linkedProperty decorator
          // let propertyShape = originalShape.nodeShape
          //   .getPropertyShapes()
          //   .find((propertyShape) => propertyShape.label === key);

          let propertyShape = getPropertyShapeByLabel(
            originalShape.constructor as typeof Shape,
            key,
          );
          if (propertyShape) {
            //generate the query shape based on the property shape
            // let nodeValue;
            // if(propertyShape.maxCount <= 1) {
            //   nodeValue = new TestNode(propertyShape.path);
            // } else {
            //   nodeValue = new NodeSet(new TestNode(propertyShape.path));
            // }

            return QueryBuilderObject.generatePathValue(propertyShape, target);

            //get the value of the property from the original shape
            // let value = originalShape[key];
            // //convert the value into a query value
            // return QueryBuilderObject.convertOriginal(
            //   value,
            //   propertyShape,
            //   queryShape,
            // );
          }
        }
        if (key !== 'then' && key !== '$$typeof') {
          //   //otherwise return the value of the property on the original shape
          //generate stack trace for debugging
          let stack = new Error().stack;
          //https://stackoverflow.com/a/49725198/977206
          const stackLines = stack.split('\n').slice(1); //remove the "Error" line
          console.warn(
            `${originalShape.constructor.name}.${key.toString()} is accessed in a query, but it does not have a @linkedProperty decorator. Queries can only access decorated get/set methods. ${stackLines.join('\n')}`,
          );
          // } else {
          //   console.error('Proxy is accessed like a promise');
        }
        return originalShape[key];
      },
    });
    return queryShape.proxy;
  }

  as<ShapeClass extends typeof Shape>(
    shape: ShapeClass,
  ): QShape<InstanceType<ShapeClass>, Source, Property> {
    //if the shape is not the same as the original value, then we need to create a new query shape
    if (!shape.shape.equals(this.originalValue.nodeShape)) {
      let newOriginal = new (shape as any)();
      if (this.originalValue.id) {
        newOriginal.id = this.originalValue.id;
      }
      return QueryShape.create(newOriginal, this.property, this.subject as any);
    }
    // else return this
    return this as any as QShape<InstanceType<ShapeClass>, Source, Property>;
    // return this.proxy;
  }

  equals(otherValue: NodeReferenceValue | QShape<any>) {
    return new Evaluation(this, WhereMethods.EQUALS, [otherValue]);
  }

  select<QF = unknown>(
    subQueryFn: QueryBuildFn<S, QF>,
  ): SelectQueryFactory<S, QF, QueryShape<S, Source, Property>> {
    let leastSpecificShape = getShapeClass(
      (this.getOriginalValue() as Shape).nodeShape.id,
    );
    let subQuery = new SelectQueryFactory(
      leastSpecificShape as ShapeType,
      subQueryFn,
    );
    subQuery.parentQueryPath = this.getPropertyPath();
    return subQuery as any;
  }

  // count(countable: QueryBuilderObject, resultKey?: string): SetSize<this> {
  //   return new SetSize(this, countable, resultKey);
  //   // return this._count;
  // }
}

export class Evaluation {
  private _andOr: AndOrQueryToken[] = [];

  constructor(
    public value: QueryBuilderObject | QueryPrimitiveSet,
    public method: WhereMethods,
    public args: QueryArg[],
  ) {}

  getPropertyPath() {
    return this.getWherePath();
  }

  processArgs(): QueryArg[] {
    //if the args are not an array, then we convert them to an array
    if (!this.args || !Array.isArray(this.args)) {
      return [];
    }
    //convert each arg to a QueryBuilderObject
    return this.args.map((arg) => {
      if (arg instanceof QueryBuilderObject) {
        let path = arg.getPropertyPath();
        let subject;
        if (path[0] && (path[0] as ShapeReferenceValue).id) {
          subject = path.shift();
        }
        if ((!path || path.length === 0) && subject) {
          return subject as ShapeReferenceValue;
        }
        return {
          path,
          subject,
        } as ArgPath;
      } else {
        return arg;
      }
    });
  }

  getWherePath(): WherePath {
    let evalPath: WhereEvaluationPath = {
      path: this.value.getPropertyPath(),
      method: this.method,
      args: this.processArgs(),
    };

    if (this._andOr.length > 0) {
      return {
        firstPath: evalPath,
        andOr: this._andOr,
      };
    }
    return evalPath;
  }

  and(subQuery: WhereClause<any>) {
    this._andOr.push({
      and: processWhereClause(subQuery),
    });
    return this;
  }

  or(subQuery: WhereClause<any>) {
    this._andOr.push({
      or: processWhereClause(subQuery),
    });
    return this;
  }
}

class SetEvaluation extends Evaluation {}

// class QueryBoolean extends QueryBuilderObject<boolean> {
//   constructor(
//     property?: PropertyShape,
//     subject?: QueryShape<any> | QueryShapeSet<any>,
//   ) {
//     super(property, subject);
//   }
// }

/**
 * The class that is used for when JS primitives are converted to a QueryValue
 * This is extended by QueryString, QueryNumber, QueryBoolean, etc
 */
export abstract class QueryPrimitive<
  T,
  Source = any,
  Property extends string | number | symbol = any,
> extends QueryBuilderObject<T, Source, Property> {
  constructor(
    public originalValue?: T,
    public property?: PropertyShape,
    public subject?: QueryShape<any> | QueryShapeSet<any> | QueryPrimitiveSet,
  ) {
    super(property, subject);
  }

  equals(otherValue: JSPrimitive | QueryBuilderObject) {
    //TODO: review types, this is working but currently QueryBuilderObject is not accepted as a type of args
    return new Evaluation(this, WhereMethods.EQUALS, [otherValue as any]);
  }

  where(validation: WhereClause<string>): this {
    // let nodeShape = this.subject.getOriginalValue().nodeShape;
    this.wherePath = processWhereClause(validation, new QueryString(''));
    //return this because after Shape.friends.where() we can call other methods of Shape.friends
    return this as any;
  }
}

//@TODO: QueryString, QueryNumber, QueryBoolean, QueryDate can all be replaced with QueryPrimitive, and we can infer the original type, no need for these extra classes
//UPDATE some of this has started. Query response to result conversion is using QueryPrimitive only
export class QueryString<
  Source = any,
  Property extends string | number | symbol = '',
> extends QueryPrimitive<string, Source, Property> {}

export class QueryDate<
  Source = any,
  Property extends string | number | symbol = any,
> extends QueryPrimitive<Date, Source, Property> {}

export class QueryNumber<
  Source = any,
  Property extends string | number | symbol = any,
> extends QueryPrimitive<number, Source, Property> {}

export class QueryBoolean<
  Source = any,
  Property extends string | number | symbol = any,
> extends QueryPrimitive<boolean, Source, Property> {}

export class QueryPrimitiveSet<
  QPrimitive extends QueryPrimitive<any> = null,
> extends QueryBuilderObject<any, any, any> {
  public contents: CoreSet<QPrimitive>;

  constructor(
    public originalValue?: JSNonNullPrimitive[],
    public property?: PropertyShape,
    public subject?: QueryShapeSet<any> | QueryShape<any>,
    items?,
  ) {
    super(property, subject);
    this.contents = new CoreSet(items);
  }

  add(item) {
    this.contents.add(item);
  }

  values() {
    return [...this.contents.values()];
  }

  //this is needed because we extend CoreSet which has a createNew method but does not expect the constructor to have arguments
  createNew(...args): this {
    return new (<any>this.constructor)(
      this.property,
      this.subject,
      ...args,
    ) as this;
  }

  //TODO: see if we can merge these methods of QueryString and QueryPrimitiveSet and soon other things like QueryNumber
  // so that they're only defined once
  equals(other) {
    return new Evaluation(this, WhereMethods.EQUALS, [other]);
  }

  getPropertyStep(): QueryStep {
    if (this.contents.size > 1) {
      throw new Error(
        'This should never happen? Not implemented: get property path for a QueryPrimitiveSet with multiple values',
      );
    }
    return this.contents.first().getPropertyStep();
  }

  getPropertyPath(): QueryPropertyPath {
    if (this.contents.size > 1) {
      throw new Error(
        'This should never happen? Not implemented: get property path for a QueryPrimitiveSet with multiple values',
      );
    }
    //here we let the first item in the set return its property path, because all items will be the same
    //however, sometimes the path goes through the subject of this SET rather than the individual items (which have an individual shape as subject)
    //so we pass the subject of this set so it can be used
    let first = this.contents.first();
    if (first) {
      (first.subject as QueryShapeSet).wherePath =
        (first.subject as QueryShapeSet).wherePath || this.subject.wherePath;
      return first.getPropertyPath();
    } else {
      console.warn(
        `QueryPrimitiveSet without items. From ${this.subject.getOriginalValue().nodeShape.label}.${this.property.label}.  What to return as property path?`,
      );
      return this.subject.getPropertyPath();
    }
  }

  //countable, resultKey?: string
  size(): SetSize<this> {
    return new SetSize(this as QueryPrimitiveSet);
    //countable, resultKey
  }
}

let documentLoaded = false;
let callbackStack = [];
const docReady = () => {
  documentLoaded = true;
  callbackStack.forEach((callback) => callback());
  callbackStack = [];
};
if (typeof document === 'undefined' || document.readyState !== 'loading') {
  docReady();
} else {
  documentLoaded = false;
  document.addEventListener('DOMContentLoaded', () => () => {
    docReady();
  });
  setTimeout(() => {
    if (!documentLoaded) {
      console.warn('⚠️ Forcing init after timeout');
      docReady();
    }
  }, 3500);
}
//only continue to parse the query if the document is ready, and all shapes from initial bundles are loaded
export var onQueriesReady = (callback) => {
  if (!documentLoaded) {
    callbackStack.push(callback);
  } else {
    callback();
  }
};

export class SelectQueryFactory<
  S extends Shape,
  ResponseType = any,
  Source = any,
> extends QueryFactory {
  /**
   * The returned value when the query was initially run.
   * Will likely be an array or object or query values that can be used to trace back which methods/accessors were used in the query.
   * @private
   */
  public traceResponse: ResponseType;
  public sortResponse: any;
  public sortDirection: string;
  public parentQueryPath: QueryPath;
  public singleResult: boolean;
  private limit: number;
  private offset: number;
  private wherePath: WherePath;
  private initPromise: {
    promise: Promise<any>;
    resolve;
    reject;
    complete?: boolean;
  };
  debugStack: string;

  constructor(
    public shape: ShapeType<S>,
    private queryBuildFn?: QueryBuildFn<S, ResponseType>,
    public subject?: S | ShapeSet<S> | QResult<S>,
  ) {
    super();

    let promise, resolve, reject;
    promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.initPromise = {promise, resolve, reject, complete: false};

    //only continue to parse the query if the document is ready, and all shapes from initial bundles are loaded
    if (typeof document === 'undefined' || document.readyState !== 'loading') {
      this.init();
    } else {
      document.addEventListener('DOMContentLoaded', () => this.init());
      setTimeout(() => {
        if (!this.initPromise.complete) {
          console.warn('⚠️ Forcing init after timeout');
          this.init();
        }
      }, 3500);
    }
  }

  setLimit(limit: number) {
    this.limit = limit;
  }

  getLimit() {
    return this.limit;
  }

  setOffset(offset: number) {
    this.offset = offset;
  }

  getOffset() {
    return this.offset;
  }

  setSubject(subject) {
    this.subject = subject;
    return this;
  }

  where(validation: WhereClause<S>): this {
    this.wherePath = processWhereClause(validation, this.shape);
    return this;
  }

  exec(): Promise<QueryResponseToResultType<ResponseType>[]> {
    return Shape.queryParser.selectQuery(this);
  }

  /**
   * Turns the LinkedQuery into a SelectQuery, which is a plain JS object that can be serialized to JSON
   */
  getQueryObject(): SelectQuery<S> {
    try {
      let queryPaths = this.getQueryPaths();
      let selectQuery = {
        type: 'select',
        select: queryPaths,
        subject: this.getSubject(),
        limit: this.limit,
        offset: this.offset,
        shape: this.shape,
        sortBy: this.getSortByPath(),
        //the query is selecting a single result if it explicitly requested it, or if the subject is a specific subject (with a URI or ID)
        singleResult:
          this.singleResult ||
          !!(
            this.subject &&
            ('id' in (this.subject as S) || 'id' in (this.subject as QResult<S>))
          ),
      } as SelectQuery<S>;

      if (this.wherePath) {
        selectQuery.where = this.wherePath;
      }
      return selectQuery;
    } catch (err) {
      console.error('Error in getQueryObject', err);
      throw err;
    }
  }

  // applyTo(subject) {
  //   return new LinkedQuery(this.shape, this.queryBuildFn, subject);
  // }

  getSubject() {
    //if the subject is a QueryShape which comes from query context
    //then it will carry a query context id and we convert it to a node reference
    //NOTE: its important to access originalValue instead of .node directly because QueryShape.node may be undefined
    if ((this.subject as QueryShape)?.originalValue?.__queryContextId) {
      return convertQueryContext(this.subject as QueryShape);
    }
    // }
    return this.subject;
  }

  /**
   * Returns an array of query paths
   * A single query can request multiple things in multiple "query paths" (For example this is using 2 paths: Shape.select(p => [p.name, p.friends.name]))
   * Each query path is returned as array of the property paths requested, with potential where clauses (together called a QueryStep)
   */
  getQueryPaths(
    response = this.traceResponse,
  ): CustomQueryObject | QueryPath[] {
    let queryPaths: QueryPath[] = [];
    let queryObject: CustomQueryObject;
    //if the trace response is an array, then multiple paths were requested
    if (
      response instanceof QueryBuilderObject ||
      response instanceof QueryPrimitiveSet
    ) {
      //if it's a single value, then only one path was requested, and we can add it directly
      queryPaths.push(response.getPropertyPath());
    } else if (Array.isArray(response) || response instanceof Set) {
      response.forEach((endValue) => {
        if (endValue instanceof QueryBuilderObject) {
          queryPaths.push(endValue.getPropertyPath());
        } else if (endValue instanceof SelectQueryFactory) {
          queryPaths.push(
            (endValue as SelectQueryFactory<any>).getQueryPaths() as any,
          );
        }
      });
    } else if (response instanceof Evaluation) {
      queryPaths.push(response.getWherePath());
    } else if (response instanceof SelectQueryFactory) {
      queryPaths.push(
        (response as SelectQueryFactory<any, any>).getQueryPaths() as any,
      );
    } else if (!response) {
      //that's totally fine. For example Person.select().where(p => p.name.equals('John'))
      //will return all persons with the name John, but no properties are selected for these persons
    }
    //if it's an object
    else if (typeof response === 'object') {
      queryObject = {};
      //then loop over all the keys
      Object.getOwnPropertyNames(response).forEach((key) => {
        //and add the property paths for each key
        const value = response[key];
        //TODO: we could potentially make Evaluation extend QueryValue, and rename getPropertyPath to something more generic,
        //that way we can simplify the code perhaps? Or would we loose type clarity? (QueryStep is the generic one for QueryValue, and Evaluation can just return WherePath right?)
        if (
          value instanceof QueryBuilderObject ||
          value instanceof QueryPrimitiveSet
        ) {
          queryObject[key] = value.getPropertyPath();
        } else if (value instanceof Evaluation) {
          queryObject[key] = value.getWherePath();
        } else {
          throw Error('Unknown trace response type for key ' + key);
        }
      });
    } else {
      throw Error('Unknown trace response type');
    }

    if (this.parentQueryPath) {
      queryPaths = (this.parentQueryPath as any[]).concat([
        queryObject || queryPaths,
      ]);
      //reset the variable so it doesn't get used again below
      queryObject = null;
    }
    return queryObject || queryPaths;
  }

  isValidSetResult(qResults: QResult<any>[]) {
    return qResults.every((qResult) => {
      return this.isValidResult(qResult);
    });
  }

  isValidResult(qResult: QResult<any>) {
    let select = this.getQueryObject().select;
    if (Array.isArray(select)) {
      return this.isValidQueryPathsResult(qResult, select);
    } else if (typeof select === 'object') {
      return this.isValidCustomObjectResult(qResult, select);
    }
  }

  clone() {
    return new SelectQueryFactory(this.shape, this.queryBuildFn, this.subject);
  }

  /**
   * Makes a clone of the query template, sets the subject and executes the query
   * @param subject
   */
  execFor(subject) {
    //TODO: Differentiate between the result of Shape.query and the internal query in Shape.select?
    // so that Shape.query can never be executed. Its just a template
    return this.clone().setSubject(subject).exec();
  }

  patchResultPromise<ResultType>(
    p: Promise<ResultType>,
  ): PatchedQueryPromise<any, S> {
    let pAdjusted = p as PatchedQueryPromise<ResultType, S>;
    p['where'] = (
      validation: WhereClause<S>,
    ): PatchedQueryPromise<ResultType, S> => {
      // preventExec();
      this.where(validation);
      return pAdjusted;
    };
    p['limit'] = (lim: number): PatchedQueryPromise<ResultType, S> => {
      this.setLimit(lim);
      return pAdjusted;
    };
    p['sortBy'] = (
      sortFn: QueryBuildFn<S, any>,
      direction: string = 'ASC',
    ): PatchedQueryPromise<ResultType, S> => {
      this.sortBy(sortFn, direction);
      return pAdjusted;
    };
    p['one'] = (): PatchedQueryPromise<ResultType, S> => {
      this.setLimit(1);
      this.singleResult = true;
      return pAdjusted;
    };

    return p as any as PatchedQueryPromise<SingleResult<ResultType>, S>;
  }

  sortBy<R>(sortFn: QueryBuildFn<S, R>, direction) {
    let queryShape = this.getQueryShape();
    if (sortFn) {
      this.sortResponse = sortFn(queryShape as any, this);
      this.sortDirection = direction;
    }
    return this;
  }

  private init() {
    let queryShape = this.getQueryShape();

    if (this.queryBuildFn) {
      let queryResponse = this.queryBuildFn(queryShape as any, this);
      this.traceResponse = queryResponse;
    }
    this.initPromise.resolve(this.traceResponse);
    this.initPromise.complete = true;
  }

  private initialized() {
    return this.initPromise.promise;
  }

  /**
   * Returns the dummy shape instance who's properties can be accessed freely inside a queryBuildFn
   * It is used to trace the properties that are accessed in the queryBuildFn
   * @private
   */
  private getQueryShape() {
    let queryShape: QueryBuilderObject;
    //if the given class already extends QueryValue
    if (this.shape instanceof QueryBuilderObject) {
      //then we're likely dealing with QueryPrimitives (end values like strings)
      //and we can use the given query value directly for the query evaluation
      queryShape = this.shape;
    } else {
      //else a shape class is given, and we need to create a dummy node to apply and trace the query
      let dummyShape = new (this.shape as any)();
      queryShape = QueryShape.create(dummyShape);
    }
    return queryShape;
  }

  private getSortByPath() {
    if (!this.sortResponse) return null;
    //TODO: we should put more restrictions on sortBy and getting query paths from the response
    // currently it reuses much of the select logic, but for example using .where() should probably not be allowed in a sortBy function?
    return {
      paths: this.getQueryPaths(this.sortResponse),
      direction: this.sortDirection,
    };
  }

  private isValidQueryPathsResult(qResult: QResult<any>, select: QueryPath[]) {
    return select.every((path) => {
      return this.isValidQueryPathResult(qResult, path);
    });
  }

  private isValidQueryPathResult(
    qResult: QResult<any>,
    path: QueryPath,
    nameOverwrite?: string,
  ) {
    if (Array.isArray(path)) {
      return this.isValidQueryStepResult(
        qResult,
        path[0],
        path.splice(1),
        nameOverwrite,
      );
    } else {
      if ((path as WhereAndOr).firstPath) {
        return this.isValidQueryPathResult(
          qResult,
          (path as WhereAndOr).firstPath,
        );
      } else if ((path as WhereEvaluationPath).path) {
        return this.isValidQueryPathResult(
          qResult,
          (path as WhereEvaluationPath).path,
        );
      }
    }
  }

  private isValidQueryStepResult(
    qResult: QResult<any>,
    step: QueryStep | SubQueryPaths,
    restPath: (QueryStep | SubQueryPaths)[] = [],
    nameOverwrite?: string,
  ): boolean {
    if (!qResult) {
      return false;
    }
    if ((step as PropertyQueryStep).property) {
      //if a name overwrite is given we check if that key exists instead of the property label
      //this happens with custom objects: for the first property step, the named key will be the accessKey used in the result instead of the first property label.
      //e.g. {title:item.name} in a query will result in a "title" key in the result, not "name"
      const accessKey =
        nameOverwrite || (step as PropertyQueryStep).property.label;
      //also check if this property needs to have a value (minCount > 0), if not it can be empty and undefined
      // if (!qResult.hasOwnProperty(accessKey) && (step as PropertyQueryStep).property.minCount > 0) {
      //the key must be in the object. If there is no value then it should be null (or undefined, but null works better with JSON.stringify, as it keeps the key. Whilst undefined keys get removed)
      if (!qResult.hasOwnProperty(accessKey)) {
        return false;
      }
      if (restPath.length > 0) {
        return this.isValidQueryStepResult(
          qResult[accessKey],
          restPath[0],
          restPath.splice(1),
        );
      }
      return true;
    } else if ((step as SizeStep).count) {
      return this.isValidQueryStepResult(qResult, (step as SizeStep).count[0]);
    } else if (Array.isArray(step)) {
      return step.every((subStep) => {
        return this.isValidQueryPathResult(qResult, subStep);
      });
    } else if (typeof step === 'object') {
      if (Array.isArray(qResult)) {
        return qResult.every((singleResult) => {
          return this.isValidQueryStepResult(singleResult, step);
        });
      }
      return this.isValidCustomObjectResult(qResult, step as CustomQueryObject);
    }
  }

  private isValidCustomObjectResult(
    qResult: QResult<any>,
    step: CustomQueryObject,
  ) {
    //for custom objects, all keys need to be defined, even if the value is undefined
    for (let key in step as CustomQueryObject) {
      if (!qResult.hasOwnProperty(key)) {
        return false;
      }
      let path: QueryPath = step[key];
      if (!this.isValidQueryPathResult(qResult, path, key)) {
        return false;
      }
      // return this.isValidQueryPathResult(qResult[key], path);
    }
    return true;
  }
}

export class SetSize<Source = null> extends QueryNumber<Source> {
  constructor(
    public subject: QueryShapeSet | QueryShape | QueryPrimitiveSet,
    public countable?: QueryBuilderObject,
    public label?: string,
  ) {
    super();
  }

  as(label: string) {
    this.label = label;
    return this;
  }

  getPropertyPath(): QueryPropertyPath {
    //if a countable argument was given
    // if (this.countable) {
    //then creating the count step is straightforward
    // let countablePath = this.countable.getPropertyPath();
    // if (countablePath.some((step) => Array.isArray(step))) {
    //   throw new Error(
    //     'Cannot count a diverging path. Provide one path of properties to count',
    //   );
    // }
    // let self: CountStep = {
    //   count: this.countable?.getPropertyPath(),
    //   label: this.label,
    // };
    // //and we can add the count step to the path of the subject
    // let parent = this.subject.getPropertyPath();
    // parent.push(self);
    // return parent;
    // } else {

    //if nothing to count was given as an argument,
    //then we just count the last property in the path
    //also, we use the label of the last property as the label of the count step
    let countable = this.subject.getPropertyStep();
    let self: SizeStep = {
      count: [countable],
      label: this.label || this.subject.property.label, //the default is property name + 'Size', i.e., friendsSize
      //numFriends
      // label: this.label || 'num'+this.subject.property.label[0].toUpperCase()+this.subject.property.label.slice(1),//the default is property name + 'Size', i.e., friendsSize
    };

    //in that case we request the path of the subject of the subject (the parent of the parent)
    //and add the CountStep to that path
    //since we already used the subject as the thing that's counted.
    if (this.subject.subject) {
      let path = this.subject.subject.getPropertyPath();
      path.push(self);
      return path;
    }
    //if there is no parent of a parent, then we just return the count step as the whole path
    return [self];
    // }
  }
}

/**
 * A sub query that is used to filter results
 * i.e p.friends.where(f => //LinkedWhereQuery here)
 */
export class LinkedWhereQuery<
  S extends Shape,
  ResponseType = any,
> extends SelectQueryFactory<S, ResponseType> {
  getResponse() {
    return this.traceResponse as Evaluation;
  }

  getWherePath() {
    return (this.traceResponse as Evaluation).getWherePath();
  }
}
