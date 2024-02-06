import {Shape} from '../shapes/Shape';
import {TestNode} from './TraceShape';
import {PropertyShape} from '../shapes/SHACL';
import {ShapeSet} from '../collections/ShapeSet';
import {shacl} from '../ontologies/shacl';
import {CoreSet} from '../collections/CoreSet';
import {BoundComponent, Component} from '../interfaces/Component';

export type WhereClause<S extends Shape | OriginalValue> =
  | Evaluation
  | ((s: ToQueryValue<S>) => Evaluation);
export type JSPrimitive = string | number | boolean | Date | null | undefined;
export type OriginalValue = Shape | ShapeSet | JSPrimitive;

//2: T = QueryShapeSet<Person, QueryShapeSet<Person, Person>>
//ShapesetType = Person,
//Source = QueryShapeSet<Person, Person>
//QueryString<Person,"name">
export type GetValueResultType<T> = T extends QueryString<
  infer Source,
  infer Property
>
  ? ToQueryResult<Source, string, Property>
  : T extends QueryShapeSet<infer ShapeType, infer Source, infer Property>
  ? // ? [ShapesetType, Source] //ToValueResultType<ShapesetType[], Source>
    ToQueryResult<Source, ShapeType, Property>
  : T extends QueryNumber<infer Source, infer Property>
  ? ToQueryResult<Source, number, Property>
  : any;

// QueryShapeSet<Person, QueryShapeSet<Person, Person>> & ToQueryShapeSetValue<QueryShapeSet<Person, QueryShapeSet<Person, Person>>, Person>
//example class
interface Foo<Source> {
  name: string;
}
//simplified type that maps all keys of an object to a different return type
type FooMapped<T> = {
  [P in keyof T]: boolean;
};

type NestedToArr<T> = T extends Foo<infer Source> ? NestedToArr<Source>[] : T;
var AnswerNum: NestedToArr<number>;
var Answer: NestedToArr<Foo<number>>; //number
var Answer2: NestedToArr<Foo<Foo<number>>>; //number[]
var Answer3: NestedToArr<Foo<Foo<number>>>; //number[][]

var AnswerB: NestedToArr<number & FooMapped<number>>; //number
var AnswerB2: NestedToArr<Foo<number> & FooMapped<Foo<number>>>; //unknown[]
var AnswerB3: NestedToArr<Foo<Foo<number>> & FooMapped<Foo<Foo<number>>>>; //unknown[]

// type GetResponseType<T> = T extends QueryShapeSet<any> ? never : never;
// type ToResult<T> = T extends QueryShapeSet<infer ShapeType, infer Source>
//   ? ToValueResultType<ShapeType, Source>
//   : never;
// function executeFn<T>(queryFn: T): ToResult<GetResponseType<T>>[] {
//   return null;
// }
// let res = executeFn((p: QueryShapeSet<Person>) => p.friends.name);

// QueryString<QueryShapeSet<Person, QueryShapeSet<Person, Person>>>
//Source = QueryShapeSet<Person, QueryShapeSet<Person, Person>>
//Value = QueryString
//ShapeType = Person,
//ParentSource = QueryShapeSet<Person, Person>

//2: QueryShapeSet<Person, QueryShapeSet<Person, Person>>
//Value = Person[]
//Source = QueryShapeSet<Person, Person>
//ShapeType = Person,
//ParentSource = Person

//-> ToValueResultType<Person[], Person>[]
//Value = Person[]
//Source = Person
export type QResult<Source, Object = {}> = Object & {
  id: string;
  shape: Source;
};
/**
 * If the source is an object (it extends shape)
 * then the result is a plain JS Object, with Property as its key, with type Value
 */
export type ToQueryResult<
  Source,
  Value = undefined,
  Property extends string | number | symbol = '',
> = Source extends Shape
  ? QResult<
      Source,
      {
        [P in Property]: Value extends Shape ? ToQueryResult<Value>[] : Value;
      }
    >
  : Source extends QueryShapeSet<
      infer ShapeType,
      infer ParentSource,
      infer SourceProperty
    >
  ? ToQueryResult<
      ParentSource,
      QResult<
        ShapeType,
        {
          [P in Property]: Value;
        }
      >[],
      SourceProperty
    >
  : Source;

// export type ToValueResultType<Value, Source> = Source extends QueryShapeSet<
//   infer ShapeType,
//   infer ParentSource
// >
//   ? ToQueryShapeSetSource<ShapeType, Value, ParentSource>
//   : Source extends QueryShape<infer ShapeType>
//   ? ToQueryShapeSource<ShapeType, Value>
//   : Value;

//ShapeType = Person,
//Value = QueryString
//ParentSource = QueryShapeSet<Person, Person>

//ShapeType = Person,
//Value = Person[]
//ParentSource = Person
//-> ToValueResultType<Person[], Person>[]

export type ToQueryShapeSource<ShapeType, Value> = ShapeType extends null
  ? Value
  : {
      name: Value;
    }[];

// export type ToQueryShapeSetSource<ShapeType, Value, ParentSource> =
//   ShapeType extends null ? Value : ToQueryResult<Value, ParentSource>[];

export type ToResultType<T> = T extends QueryValue
  ? GetValueResultType<T>
  : T extends Count
  ? number[]
  : T extends LinkedQuery<any, any>
  ? ToResultType<GetQueryResponseType<T>>[]
  : // : T extends QueryShapeSet<any>
  // ? ShapeSet<GetQueryShapeSetType<T>>
  // : T extends QueryShape<any>
  // ? GetQueryShapeType<T>
  // : T extends QueryString
  // ? GetValueResultType<T>
  T extends Array<any>
  ? Array<ToResultType<GetArrayType<T>>>
  : T extends Evaluation
  ? boolean[]
  : T;

export type GetQueryResponseType<Q> = Q extends LinkedQuery<
  any,
  infer ResponseType
>
  ? ResponseType
  : never;

export type GetQueryFnResponseType<Q> = Q extends QueryBuildFn<
  any,
  infer ResponseType
>
  ? ResponseType
  : never;

// export type QueryPrimitive = QueryString;
export type QueryBuildFn<T extends Shape, ResultType> = (
  p: ToQueryValue<T>,
  q: LinkedQuery<T>,
) => ResultType;

export type ToQueryShape<T> = {
  [P in keyof T]: ToQueryValue<T[P], T, P>;
};
export type ToQueryShapeSetValue<
  SourceShapeSet,
  Shape,
  SourceProperty = null,
> = {
  [P in keyof Shape]: ToQueryValue<Shape[P], SourceShapeSet, P>;
};
export type ToWhereShape<T> = {
  [P in keyof T]: ToWhereValue<T[P]>;
};
type GetShapeSetType<SS> = SS extends ShapeSet<infer ShapeType>
  ? ShapeType
  : never;

export type SourcedValue<Source, Value> = Value;

export type ToQueryValue<
  T,
  Source = any,
  Property extends string | number | symbol = '',
> = T extends ShapeSet<infer ShapeSetType>
  ? //a shape set turns into a query-shape set but also inherits all the properties of the shape that each item in the set has
    QueryShapeSet<ShapeSetType, Source, Property> &
      ToQueryShapeSetValue<
        QueryShapeSet<ShapeSetType, Source, Property>,
        ShapeSetType,
        Property
      >
  : T extends Shape
  ? ToQueryShape<T> & QueryShape<T>
  : T extends string
  ? QueryString<Source, Property>
  : T extends number
  ? QueryNumber
  : T extends boolean
  ? QueryBoolean
  : QueryValue<T>;

export type ToWhereValue<T, I = 0> = T extends ShapeSet
  ? //a shape set turns into a query-shape set but also inherits all the properties of the shape that each item in the set has
    WhereShapeSet<GetShapeSetType<T>> & ToWhereShape<GetShapeSetType<T>>
  : T extends Shape
  ? ToWhereShape<T> & WhereShape<T>
  : T extends string
  ? QueryString
  : T extends number
  ? QueryNumber
  : T extends boolean
  ? QueryBoolean
  : QueryValue<T>;

export type GetQueryShapeSetType<T> = T extends QueryShapeSet<infer ShapeType>
  ? ShapeType
  : never;

export type GetArrayType<T> = T extends Array<infer ArrayType>
  ? ArrayType
  : never;

export type GetQueryShapeType<T> = T extends QueryShape<infer ShapeType>
  ? ShapeType
  : never;

export type WherePath = WhereEvaluationPath | WhereAndOr;

export type WhereEvaluationPath = {
  path: QueryPropertyPath;
  method: WhereMethods;
  args: any[];
};

export type ComponentQueryPath =
  | (QueryStep | SubQueryPaths | BoundComponentQueryStep)[]
  | WherePath;

export interface BoundComponentQueryStep {
  component: BoundComponent<any, any>;
  // path: LinkedQueryObject;
}
export type LinkedQueryObject = QueryPath[];

export type SubQueryPaths = LinkedQueryObject;
/**
 * A QueryPath is an array of QuerySteps, representing the path of properties that were requested to reach a certain value
 */
export type QueryPath = (QueryStep | SubQueryPaths)[] | WherePath;
/**
 * Much like a querypath, except it can only contain QuerySteps
 */
export type QueryPropertyPath = QueryStep[];

/**
 * A QueryStep is a single step in a query path
 * It contains the property that was requested, and optionally a where clause
 */
export type QueryStep = {
  property: PropertyShape;
  where?: WherePath;
  count?: Count;
};

export type WhereAnd = {
  and: WherePath[];
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
  EQUALS = 'eq',
  SOME = 'some',
  EVERY = 'every',
}

export class QueryValue<
  S = any,
  Source = any,
  Property extends string | number | symbol = any,
> {
  protected originalValue: S;
  protected source: Source;
  protected prop: Property;

  //is null by default to avoid warnings when trying to access wherePath when its undefined
  wherePath?: WherePath = null;
  _count: Count;

  constructor(
    public property?: PropertyShape,
    public subject?: QueryShape<any> | QueryShapeSet<any>,
  ) {}

  getOriginalValue() {
    return this.originalValue;
  }
  /**
   * Returns the path of properties that were requested to reach this value
   */
  getPropertyPath(): QueryPropertyPath {
    let path: QueryPropertyPath = [];
    let current: QueryValue = this;
    while (current && (current.property || current.wherePath)) {
      path.unshift({
        property: current.property,
        where: current.wherePath,
        count: current._count,
      } as QueryStep);
      current = current.subject;
    }
    return path;
  }

  /**
   * Converts an original value into a query value
   * @param originalValue
   * @param requestedPropertyShape the property shape that is connected to the get accessor that returned the original value
   */
  static convertOriginal(
    originalValue: OriginalValue,
    property: PropertyShape,
    subject: QueryShape<any> | QueryShapeSet<any> | QueryShape<any>,
  ): QueryValue {
    if (originalValue instanceof Shape) {
      return QueryShape.create(originalValue, property, subject);
    } else if (originalValue instanceof ShapeSet) {
      return QueryShapeSet.create(originalValue, property, subject);
    } else if (typeof originalValue === 'string') {
      return new QueryString(originalValue, property, subject);
    }
  }

  static getOriginalSource(
    endValue:
      | ShapeSet<Shape>
      | Shape[]
      | QueryPrimitiveSet
      | QueryValueSetOfSets,
  ): ShapeSet;
  static getOriginalSource(endValue: Shape): Shape;
  static getOriginalSource(endValue: QueryString): Shape | string;
  static getOriginalSource(endValue: string[] | QueryValue): Shape | ShapeSet;
  static getOriginalSource(
    endValue:
      | ShapeSet<Shape>
      | Shape[]
      | Shape
      | string[]
      | QueryValue
      | QueryValueSetOfSets
      | QueryPrimitiveSet,
  ): OriginalValue {
    if (typeof endValue === 'undefined') return undefined;
    if (endValue instanceof QueryPrimitiveSet) {
      return new ShapeSet(
        endValue.map((endValue) => this.getOriginalSource(endValue) as Shape),
      ) as ShapeSet;
    }
    if (endValue instanceof QueryString) {
      return endValue.subject
        ? this.getOriginalSource(endValue.subject)
        : endValue.originalValue;
    }
    if (endValue instanceof QueryShape) {
      if (endValue.subject && !endValue.isSource) {
        return this.getOriginalSource(endValue.subject);
      }
      return endValue.originalValue;
    } else if (endValue instanceof Shape) {
      return endValue;
    } else if (endValue instanceof QueryValueSetOfSets) {
      let first = endValue.first();
      let res;
      if (first instanceof QueryShapeSet) {
        res = new QueryShapeSet();
        endValue.forEach((queryShapeSet: QueryShapeSet) => {
          queryShapeSet.queryShapes.forEach(
            res.queryShapes.add.bind(res.queryShapes),
          );
        });
      } else {
        res = new QueryPrimitiveSet();
        endValue.forEach((queryPrimitiveSet: QueryPrimitiveSet) => {
          queryPrimitiveSet.forEach(res.add.bind(res));
        });
      }
      return this.getOriginalSource(res);
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
}
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

export class QueryValueSetOfSets extends CoreSet<
  QueryShapeSet | QueryPrimitiveSet
> {
  public proxy;
  static create() {
    let instance = new QueryValueSetOfSets();
    let proxy = this.proxify(instance);
    return proxy;
  }
  static proxify(valueSets: QueryValueSetOfSets) {
    valueSets.proxy = new Proxy(valueSets, {
      get(target, key, receiver) {
        //TODO: combine reusable code between profixy methods
        //if the key is a string
        if (typeof key === 'string') {
          //if this is a get method that is implemented by the QueryShapeSets, then use that
          if (key in valueSets) {
            //if it's a function, then bind it to the queryShape and return it so it can be called
            if (typeof valueSets[key] === 'function') {
              return target[key].bind(target);
            }
            //if it's a get method, then return that
            //NOTE: we may not need this if we don't use any get methods in QueryValue classes?
            return valueSets[key];
          }
        }

        //otherwise, call the method on each of the shape sets in the set
        let res = new QueryValueSetOfSets();
        valueSets.forEach((shapeSet) => {
          const shapeSetResult = shapeSet[key];
          if (shapeSetResult instanceof QueryValueSetOfSets) {
            shapeSetResult.forEach(res.add.bind(res));
          } else if (shapeSetResult instanceof QueryShapeSet) {
            res.add(shapeSetResult);
          }
        });
        return res;
      },
    });
    return valueSets.proxy;
  }
}
export class QueryShapeSet<
  S extends Shape = Shape,
  Source = any,
  Property extends string | number | symbol = any,
> extends QueryValue<ShapeSet<S>, Source, Property> {
  private proxy;
  public queryShapes: CoreSet<QueryShape>;
  constructor(
    _originalValue?: ShapeSet<S>,
    property?: PropertyShape,
    subject?: QueryShape<any> | QueryShapeSet<any>,
  ) {
    super(property, subject);
    //Note that QueryShapeSet intentionally does not store the _originalValue shape set, because it manipulates this.queryShapes
    // and then recreates the original shape set when getOriginalValue() is called
    this.queryShapes = new CoreSet(
      _originalValue?.map((shape) =>
        QueryShape.create(shape, property, subject),
      ),
    );
  }
  concat(other: QueryShapeSet | QueryValueSetOfSets): QueryShapeSet {
    if (other) {
      if (other instanceof QueryShapeSet) {
        (other as QueryShapeSet).queryShapes.forEach(
          this.queryShapes.add.bind(this.queryShapes),
        );
      } else if (other instanceof QueryValueSetOfSets) {
        (other as QueryValueSetOfSets).forEach((shapeSet) => {
          (shapeSet as QueryShapeSet).queryShapes.forEach(
            this.queryShapes.add.bind(this.queryShapes),
          );
        });
      } else {
        throw new Error('Unknown type: ' + other);
      }
    }
    return this;
  }

  filter(filterFn): QueryShapeSet {
    let clone = new QueryShapeSet(new ShapeSet(), this.property, this.subject);
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
  ): QueryValueSetOfSets | QueryPrimitiveSet {
    //call the get method for that property shape on each item in the shape set
    //and return the result as a new shape set
    let result: QueryPrimitiveSet | QueryValueSetOfSets;

    //if we expect the accessor to return a Primitive (string,number,boolean,Date)
    if (propertyShape.nodeKind === shacl.Literal) {
      //then return a Set of QueryPrimitives
      result = new QueryPrimitiveSet(propertyShape, this);
    } else {
      result = QueryValueSetOfSets.create(); //QueryShapeSet.create(null, propertyShape, this);
    }
    let expectSingleValues =
      propertyShape.hasProperty(shacl.maxCount) && propertyShape.maxCount <= 1;

    this.queryShapes.forEach((shape) => {
      //access the propertyShapes accessor,
      // since the shape should be converted to a QueryShape, the result is a QueryValue also
      let shapeQueryValue = shape[propertyShape.label];

      //only add results if something was actually returned, if the property is not defined for this shape the result can be undefined
      if (shapeQueryValue) {
        if (expectSingleValues) {
          (result as any).add(shapeQueryValue);
        } else {
          //if each of the shapes in a set return a new shapeset for the request accessor
          //then we merge all the returned values into a single shapeset
          // (result as QueryShapeSet).concat(shapeQueryValue);
          (result as QueryValueSetOfSets).add(shapeQueryValue);
        }
      }
    });
    // if (result instanceof ShapeSet) {
    //   return QueryShapeSet.create(result, propertyShape, this);
    // }
    return result;
  }

  count(): Count {
    //when count() is called we want to count the number of items in the entire query path
    this._count = new Count(this);
    return this._count;
  }

  // get testItem() {}
  where(validation: WhereClause<S>): this {
    if ((this.getPropertyPath() as QueryStep[]).some((step) => step.where)) {
      throw new Error(
        'You cannot call where() from within a where() clause. Consider using some() or every() instead',
      );
    }
    let leastSpecificShape = this.getOriginalValue().getLeastSpecificShape();
    this.wherePath = processWhereClause(validation, leastSpecificShape);
    //return this.proxy because after person.friends.where() we can call other methods of person.friends
    //and for that we need the proxy
    return this.proxy;
  }

  select<QF = unknown>(subQueryFn: QueryBuildFn<S, QF>): LinkedQuery<S, QF> {
    let leastSpecificShape = this.getOriginalValue().getLeastSpecificShape();
    let subQuery = new LinkedQuery(leastSpecificShape, subQueryFn);
    subQuery.parentQueryPath = this.getPropertyPath();
    return subQuery as any;
  }

  // static select<T extends Shape, S = unknown>(
  //   this: {new (node: Node): T; targetClass: any},
  //   // this: typeof Shape,
  //   selectFn: QueryBuildFn<T, S>,
  // ): LinkedQuery<T, S> {
  //   const query = new LinkedQuery<T, S>(this as any, selectFn);
  //   return query;
  // }

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
          //As in person.friends.name -> key would be name, which is requested from (each item in!) a ShapeSet of Persons
          //So here we find back the shape that all items have in common, and then find the property shape that matches the key
          //NOTE: this will only work if the key corresponds with an accessor in the shape that uses a @linkedProperty decorator
          let leastSpecificShape = queryShapeSet
            .getOriginalValue()
            .getLeastSpecificShape();
          let propertyShape: PropertyShape = leastSpecificShape?.shape
            .getPropertyShapes()
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
          } else {
            console.warn(
              'Could not find property shape for key ' +
                key +
                ' on shape ' +
                leastSpecificShape +
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
}
// type QueryShapeType<S> = QueryShape<S> & ToQueryShape<S>;
export class QueryShape<S extends Shape = Shape> extends QueryValue<S> {
  private proxy;
  public isSource: boolean;
  constructor(
    public originalValue: S,
    property?: PropertyShape,
    subject?: QueryShape<any> | QueryShapeSet<any>,
  ) {
    super(property, subject);
  }

  where(validation: WhereClause<S>): QueryShapeSet<S> & ToQueryShape<S> {
    let nodeShape = this.originalValue.nodeShape;
    this.wherePath = processWhereClause(validation, nodeShape);
    //return this because after person.friends.where() we can call other methods of person.friends
    return this.proxy;
  }

  static create(
    original: Shape,
    property?: PropertyShape,
    subject?: QueryShape<any> | QueryShapeSet<any>,
  ) {
    let instance = new QueryShape(original, property, subject);
    let proxy = this.proxifyQueryShape(instance);
    return proxy;
  }

  static proxifyQueryShape<T extends Shape>(queryShape: QueryShape<T>) {
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
          let propertyShape = originalShape.nodeShape
            .getPropertyShapes()
            .find((propertyShape) => propertyShape.label === key);

          if (propertyShape) {
            //get the value of the property from the original shape
            let value = originalShape[key];
            //convert the value into a query value
            return QueryValue.convertOriginal(value, propertyShape, queryShape);
          }
        }
        //otherwise return the value of the property on the original shape
        return originalShape[key];
      },
    });
    return queryShape.proxy;
  }
}

export class Evaluation {
  constructor(
    public value: QueryValue | QueryPrimitiveSet,
    public method: WhereMethods,
    public args: any[],
  ) {}
  private _andOr: AndOrQueryToken[] = [];

  getWherePath(): WherePath {
    let evalPath: WhereEvaluationPath = {
      path: this.value.getPropertyPath(),
      method: this.method,
      args: this.args,
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

class WhereShapeSet<S extends Shape = Shape> extends QueryShapeSet<S> {}
class WhereShape<S extends Shape = Shape> extends QueryShape<S> {}

class QueryBoolean extends QueryValue<boolean> {
  constructor(
    private value: boolean,
    property?: PropertyShape,
    subject?: QueryShape<any> | QueryShapeSet<any>,
  ) {
    super(property, subject);
  }
}
export class QueryPrimitive<
  T,
  Source = any,
  Property extends string | number | symbol = any,
> extends QueryValue<T, Source, Property> {
  constructor(
    public originalValue: T,
    public property?: PropertyShape,
    public subject?: QueryShape<any> | QueryShapeSet<any>,
  ) {
    super(property, subject);
  }
  equals(otherString: string) {
    return new Evaluation(this, WhereMethods.EQUALS, [otherString]);
  }
  where(validation: WhereClause<string>): QueryString {
    // let nodeShape = this.subject.getOriginalValue().nodeShape;
    this.wherePath = processWhereClause(validation, new QueryString(''));
    //return this because after person.friends.where() we can call other methods of person.friends
    return this as any;
  }
}
export class QueryString<
  Source = any,
  Property extends string | number | symbol = '',
> extends QueryPrimitive<string, Source, Property> {}
export class QueryNumber<
  Source extends JSPrimitive = null,
  Property extends string | number | symbol = any,
> extends QueryValue<number, Source, Property> {}

export class QueryPrimitiveSet<P = any> extends CoreSet<QueryPrimitive<P>> {
  constructor(
    public property?: PropertyShape,
    public subject?: QueryShapeSet<any> | QueryShape<any>,
    items?,
  ) {
    super(items);
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
  equals(other: P) {
    return new Evaluation(this, WhereMethods.EQUALS, [other]);
  }
  getPropertyPath(): QueryPropertyPath {
    if (this.size > 1) {
      throw new Error(
        'This should never happen? Not implemented: get property path for a QueryPrimitiveSet with multiple values',
      );
    }
    //here we let the first item in the set return its property path, because all items will be the same
    //however, sometimes the path goes through the subject of this SET rather than the individual items (which have an individual shape as subject)
    //so we pass the subject of this set so it can be used
    let first = this.first();
    first.subject.wherePath = first.subject.wherePath || this.subject.wherePath;
    first.subject._count = first.subject._count || this.subject._count;
    return this.first().getPropertyPath();
  }
}

export class LinkedQuery<T extends Shape, ResponseType = any> {
  /**
   * The returned value when the query was initially run.
   * Will likely be an array or object or query values that can be used to trace back which methods/accessors were used in the query.
   * @private
   */
  public traceResponse: ResponseType;
  public parentQueryPath: QueryPath;
  constructor(
    public shape: T,
    private queryBuildFn: QueryBuildFn<T, ResponseType>,
  ) {
    let dummyNode = new TestNode();
    let queryShape: QueryValue;
    //if the given class already extends QueryValue
    if (shape instanceof QueryValue) {
      //then we're likely dealing with QueryPrimitives (end values like strings)
      //and we can use the given query value directly for the query evaluation
      queryShape = shape;
    } else {
      //else a shape class is given, and we need to create a dummy node to apply and trace the query
      let dummyShape = new (shape as any)(dummyNode);
      queryShape = QueryShape.create(dummyShape);
    }

    let queryResponse = this.queryBuildFn(queryShape as any, this);
    this.traceResponse = queryResponse;
  }

  where(validation: WhereClause<T>): this {
    throw Error('Not implemented');
    // return this;
  }

  /**
   * Returns an array of query paths
   * A single query can request multiple things in multiple "query paths" (For example this is using 2 paths: Person.select(p => [p.name, p.friends.name]))
   * Each query path is returned as array of the property paths requested, with potential where clauses (together called a QueryStep)
   */
  getQueryPaths() {
    let queryPaths: LinkedQueryObject = [];
    //if the trace response is an array, then multiple paths were requested
    if (
      this.traceResponse instanceof QueryValue ||
      this.traceResponse instanceof QueryPrimitiveSet
    ) {
      //if it's a single value, then only one path was requested, and we can add it directly
      queryPaths.push(this.traceResponse.getPropertyPath());
    } else if (
      Array.isArray(this.traceResponse) ||
      this.traceResponse instanceof Set
    ) {
      this.traceResponse.forEach((endValue: QueryValue) => {
        queryPaths.push(endValue.getPropertyPath());
      });
    } else if (this.traceResponse instanceof Evaluation) {
      queryPaths.push(this.traceResponse.getWherePath());
    } else if (this.traceResponse instanceof LinkedQuery) {
      queryPaths.push(
        (this.traceResponse as LinkedQuery<any, any>).getQueryPaths() as any,
      );
    }
    //if it's an object
    else if (typeof this.traceResponse === 'object') {
      //then loop over all the keys
      Object.getOwnPropertyNames(this.traceResponse).forEach((key) => {
        //and add the property paths for each key
        queryPaths.push(
          (this.traceResponse[key] as QueryValue).getPropertyPath(),
        );
      });
    } else {
      throw Error('Unknown trace response type');
    }
    if (this.parentQueryPath) {
      queryPaths = (this.parentQueryPath as any[]).concat([queryPaths]);
    }
    return queryPaths;
  }
}

export class LinkedWhereQuery<
  S extends Shape,
  ResponseType = any,
> extends LinkedQuery<S, ResponseType> {
  getResponse() {
    return this.traceResponse as Evaluation;
  }
  getWherePath() {
    return (this.traceResponse as Evaluation).getWherePath();
  }
}
export class Count extends QueryPrimitiveSet<number> {
  constructor(public subject: QueryShapeSet) {
    super();
  }
  getPropertyPath(): QueryPropertyPath {
    return this.subject.getPropertyPath();
  }
}