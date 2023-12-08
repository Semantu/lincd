import {Shape} from '../shapes/Shape';
import {TestNode} from './TraceShape';
import {PropertyShape} from '../shapes/SHACL';
import {ShapeSet} from '../collections/ShapeSet';
import {shacl} from '../ontologies/shacl';
import {CoreSet} from '../collections/CoreSet';

export type WhereClause<S> = Evaluation | ((s: ToQueryShape<S>) => Evaluation);
export type OriginalValue =
  | Shape
  | ShapeSet
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

export type QueryPrimitive = QueryString;
export type QueryBuildFn<T extends Shape, ResultType> = (
  p: ToQueryShape<T>,
  q: LinkedQuery<T>,
) => ResultType;

// type RecursiveObject<T> = T extends Date ? never : T extends object ? T : never;
// export type StringValues<TModel> = {
//   [Key in keyof TModel]: TModel[Key] extends RecursiveObject<TModel[Key]>
//     ? StringValues<TModel[Key]>
//     : string;
// };
export type ToQueryShape<T> = {
  [P in keyof T]: ToQueryValue<T[P]>;
};
type GetShapeSetType<SS> = SS extends ShapeSet<infer ShapeType>
  ? ShapeType
  : never;

// export type WrappedQueryShape<T> = ToQueryShapeArrayWrapped<T>;
// export type Wrapped<R> = R;
// export type ToShapeSetProxiedValue<T> = T extends Shape
//   ? ToQueryShapeArrayWrapped<T>
//   : never;

// export type ToQueryShapeArrayWrapped<T> = {
//   [P in keyof T]: ShapeSetArray<ToQueryValue<T[P]>>;
// };
// export type ShapeSetArray<T> = Array<T> & {
//   [P in keyof T]: ToQueryValue<T[P]>;
// };

export type ToQueryValue<T, I = 0> = T extends ShapeSet
  ? //a shape set turns into a query-shape set but also inherits all the properties of the shape that each item in the set has
    QueryShapeSet<GetShapeSetType<T>> & ToQueryShape<GetShapeSetType<T>>
  : T extends Shape
  ? ToQueryShape<T>
  : T extends string
  ? QueryString
  : T extends boolean
  ? QueryBoolean
  : QueryValue<T>;

export type ToNormalValue<T> = T extends QueryShapeSet<any>
  ? ShapeSet<GetQueryShapeSetType<T>>
  : T extends QueryShape<any>
  ? GetQueryShapeType<T>
  : T extends QueryString
  ? string[]
  : T extends Array<any>
  ? Array<ToNormalValue<GetArrayType<T>>>
  : T;

export type GetQueryShapeSetType<T> = T extends QueryShapeSet<infer ShapeType>
  ? ShapeType
  : never;

export type GetArrayType<T> = T extends Array<infer ArrayType>
  ? ArrayType
  : never;

export type GetQueryShapeType<T> = T extends QueryShape<infer ShapeType>
  ? ShapeType
  : never;

export class QueryValue<S extends Object = any> {
  protected whereQuery?: LinkedWhereQuery<any> | Evaluation;

  constructor(
    public property?: PropertyShape,
    public subject?: QueryShape<any> | QueryShapeSet<any>,
  ) {}

  /**
   * Returns the path of properties that were requested to reach this value
   */
  getPropertyPath(): QueryPath {
    let path: QueryPath = [];
    let current: QueryValue = this;
    while (current.property) {
      path.unshift({
        property: current.property,
        where: current.whereQuery?.getWherePath(),
      });
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
    endValue: ShapeSet<Shape> | Shape[] | QueryPrimitiveSet,
  ): Shape[];
  static getOriginalSource(endValue: Shape): Shape;
  static getOriginalSource(
    endValue: string[] | QueryValue<any>,
  ): Shape | Shape[];
  static getOriginalSource(
    endValue:
      | ShapeSet<Shape>
      | Shape[]
      | Shape
      | string[]
      | QueryValue<any>
      | QueryPrimitiveSet,
  ): Shape | Shape[] {
    if (endValue instanceof QueryPrimitiveSet) {
      return endValue.map((endValue) =>
        this.getOriginalSource(endValue),
      ) as Shape[];
    }
    if (endValue instanceof QueryString) {
      return this.getOriginalSource(endValue.subject);
    }
    if (endValue instanceof QueryShape) {
      if (endValue.subject) {
        return this.getOriginalSource(endValue.subject);
      }
      return endValue.originalShape;
    } else if (endValue instanceof Shape) {
      return endValue;
    } else {
      throw new Error('Unimplemented. Return as is?');
    }
  }
}
const processWhereClause = (
  validation: WhereClause<any>,
  shape?,
): LinkedWhereQuery<any> | Evaluation => {
  if (validation instanceof Function) {
    // let dummyNode = new TestNode();
    // let leastSpecificShape = this.originalValue.getLeastSpecificShape();
    //create an instance of the shape with the dummy node as node
    // let dummyShape = new (leastSpecificShape as any)(dummyNode);
    //convert it to a root query shape
    // let queryShape = QueryShape.create(dummyShape);
    // queryShape = QueryShape.create(this.originalValue.first());

    //YOU ARE HERE
    //see what comes back, think through what we need to do with it to track the path
    if (!shape) {
      throw new Error('Cannot process where clause without shape');
    }
    return new LinkedWhereQuery(shape, validation);
  } else {
    return validation as Evaluation;
  }
};
export class QueryShapeSet<S extends Shape> extends QueryValue<S> {
  private proxy;

  constructor(
    public originalValue: ShapeSet<S>,
    property?: PropertyShape,
    subject?: QueryShape<any> | QueryShapeSet<any>,
  ) {
    super(property, subject);
  }
  callPropertyShapeAccessor(propertyShape: PropertyShape): QueryValue {
    //call the get method for that property shape on each item in the shape set
    //and return the result as a new shape set
    let result: QueryPrimitiveSet | ShapeSet<any>;

    //if we expect the accessor to return a Primitive (string,number,boolean,Date)
    if (propertyShape.nodeKind === shacl.Literal) {
      //then return a Set of QueryPrimitives
      result = new QueryPrimitiveSet(propertyShape, this);
    } else {
      result = new ShapeSet();
    }
    let expectSingleValues =
      propertyShape.hasProperty(shacl.maxCount) && propertyShape.maxCount <= 1;

    this.originalValue.forEach((shape) => {
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
          result = (result as any).concat(shapeQueryValue);
        }
      }
    });
    if (result instanceof ShapeSet) {
      //TODO: can we avoid setting the subj/prop on each value and instead set it once in the container?
      //the shapes in the result will already be query shapes here, so they dont need to be converted to query shapes again (hence the false at the end)
      return QueryShapeSet.create(result, propertyShape, this, false);
    }
    return result;
  }

  // get testItem() {}
  where(validation: WhereClause<S>): this {
    let leastSpecificShape = this.originalValue.getLeastSpecificShape();
    this.whereQuery = processWhereClause(
      validation,
      leastSpecificShape,
    ) as LinkedWhereQuery<any>;
    //return this because after person.friends.where() we can call other methods of person.friends
    return this;
  }

  static create<S extends Shape = Shape>(
    originalValue: ShapeSet<S>,
    property: PropertyShape,
    subject: QueryShape<any> | QueryShapeSet<any>,
    convertToQueryShapes: boolean = true,
  ) {
    let instance = new QueryShapeSet<S>(
      //also convert all instances in the shapeset to QueryShapes
      //NOTE: if this gets done on large data sets and is performance heavy, perhaps we should introduce a flag and only do this subQueries (whereClause)
      // because that may be the only place it is needed. (the proxifyInstance method below already handles get/set methods directly called ont he shape during usual queries)
      new ShapeSet(
        convertToQueryShapes
          ? originalValue.map((shape) =>
              QueryShape.create(shape, property, subject),
            )
          : originalValue,
      ),
      // originalValue,
      property,
      subject,
    );

    let proxy = this.proxifyShapeSet<S>(instance);
    return proxy;
  }
  static proxifyShapeSet<T extends Shape = Shape>(
    queryShapeSet: QueryShapeSet<T>,
  ) {
    let originalShapeSet = queryShapeSet.originalValue;

    queryShapeSet.proxy = new Proxy(queryShapeSet, {
      get(target, key, receiver) {
        //if the key is a string
        if (typeof key === 'string') {
          //if this is a get method that is implemented by the QueryShape, then use that
          if (key in queryShapeSet) {
            //if it's a function, then bind it to the queryShape and return it so it can be called
            if (typeof queryShapeSet[key] === 'function') {
              return target[key].bind(target);
            }
            //if it's a get method, then return that
            //NOTE: we may not need this if we don't use any get methods in QueryValue classes?
            return queryShapeSet[key];
          }

          if (queryShapeSet.originalValue.size === 0) {
            //in this case we're not sure if it should be a QueryPrimitiveSet or a ShapeSet, so we return an empty CoreSet
            return new CoreSet();
          }
          //if not, then a method/accessor was called that likely fits with the methods of the original SHAPE of the items in the shape set
          //As in person.friends.name -> key would be name, which is requested from (each item in!) a ShapeSet of Persons
          //So here we find back the shape that all items have in common, and then find the property shape that matches the key
          //NOTE: this will only work if the key corresponds with an accessor in the shape that uses a @linkedProperty decorator
          let leastSpecificShape =
            queryShapeSet.originalValue.getLeastSpecificShape();
          let propertyShape: PropertyShape = leastSpecificShape?.shape
            .getPropertyShapes()
            .find((propertyShape) => propertyShape.label === key);

          //if the property shape is found
          if (propertyShape) {
            return queryShapeSet.callPropertyShapeAccessor(propertyShape);
          } else if (
            //else if a method of the original shape is called, like .forEach() or similar
            queryShapeSet.originalValue[key] &&
            typeof queryShapeSet.originalValue[key] === 'function'
          ) {
            //then return that method and bind the original value as 'this'
            return queryShapeSet.originalValue[key].bind(
              queryShapeSet.originalValue,
            );
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
class QueryShape<S extends Shape> extends QueryValue<S> {
  private proxy;
  constructor(
    public originalShape: S,
    property?: PropertyShape,
    subject?: QueryShape<any> | QueryShapeSet<any>,
  ) {
    super(property, subject);
  }
  where(validation: WhereClause<S>): this {
    throw new Error('Unimplemented');
    return this;
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
    let originalShape = queryShape.originalShape;
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

export type WherePath = WhereEvaluationPath | WhereAnd | WhereOr;

export type WhereEvaluationPath = {
  path: QueryPath;
  method: WhereEvaluationMethod;
  args: any[];
};
class Evaluation {
  constructor(
    public value: QueryValue,
    public method: WhereEvaluationMethod,
    public args: any[],
  ) {}
  private _and: (LinkedWhereQuery<any> | Evaluation)[] = [];
  private _or: (LinkedWhereQuery<any> | Evaluation)[] = [];
  // resolve() {
  //   let queryEndValues = this.resolveWherePath(
  //     convertedSubjects,
  //     where.getPropertyPath(),
  //   );
  //
  //   if (where.method === WhereEvaluation.STRING_EQUALS) {
  //     if (queryEndValues instanceof QueryPrimitiveSet) {
  //       queryEndValues = queryEndValues.filter(
  //         this.resolveWhereEquals.bind(this, where.args),
  //       ) as any;
  //     }
  //   } else {
  //     throw new Error('Unimplemented where method: ' + where.method);
  //   }
  //
  //   //once the filtering of the where clause is done, we need to convert the result back to the original shape
  //   //for example Person.select(p => p.friends.where(f => f.name.equals('Semmy')))
  //   //the result of the where clause is an array of names (strings),
  //   //but we need to return the filtered result of p.friends (which is a ShapeSet of Persons)
  //   return QueryValue.getOriginalSource(queryEndValues);
  //   return null;
  // }

  getWherePath(): WherePath {
    let evalPath: WhereEvaluationPath = {
      path: this.value.getPropertyPath(),
      method: this.method,
      args: this.args,
    };

    //TODO: order of and & or
    //probably or should come first and inlcude there result of end as second param, whilst evalPath is first param
    //actuall just execute in order of occurance, so we should save both and and or in order
    // if (this._or) {
    //   if (this._and) {
    //     return {
    //       or: [evalPath, ...this._and.map((and) => and.getWherePath())],
    //     };
    //   }
    // }
    if (this._and.length > 0) {
      return {
        and: [evalPath, ...this._and.map((and) => and.getWherePath())],
      };
    }
    return evalPath;
  }
  and(subQuery: WhereClause<any>) {
    this._and.push(processWhereClause(subQuery) as LinkedWhereQuery<any>);
    return this;
  }
}

class QueryBoolean extends QueryValue<boolean> {
  constructor(
    private value: boolean,
    property?: PropertyShape,
    subject?: QueryShape<any> | QueryShapeSet<any>,
  ) {
    super(property, subject);
  }
}
class QueryString extends QueryValue<string> {
  constructor(
    public value: string,
    public property?: PropertyShape,
    public subject?: QueryShape<any> | QueryShapeSet<any>,
  ) {
    super(property, subject);
  }
  equals(otherString: string) {
    return new Evaluation(this, WhereMethods.STRING_EQUALS, [otherString]);
  }
}
export class QueryPrimitiveSet extends CoreSet<QueryPrimitive> {
  constructor(
    public property: PropertyShape,
    public subject: QueryShapeSet<any> | QueryShape<any>,
  ) {
    super();
  }
  getPropertyPath(): QueryPath {
    if (this.size > 1) {
      throw new Error(
        'This should never happen? Not implemented: get property path for a QueryPrimitiveSet with multiple values',
      );
    }
    return this.first().getPropertyPath();
  }
}

/**
 * A QueryPath is an array of QuerySteps, representing the path of properties that were requested to reach a certain value
 */
export type QueryPath = QueryStep[];

/**
 * A QueryStep is a single step in a query path
 * It contains the property that was requested, and optionally a where clause
 */
export type QueryStep = {
  property: PropertyShape;
  where?: WherePath;
};
type ShapeClass = typeof Shape & {new (node?: any): Shape};

export type WhereAnd = {
  and: WherePath[];
};

export type WhereOr = {
  or: WherePath[];
};
// export class WhereAnd extends WhereNode {
//   and: WhereNode[];
// }
//
// export class WhereOr extends WhereNode {
//   or: WhereNode[];
// }

export class LinkedQuery<T extends Shape, ResponseType = any> {
  /**
   * The returned value when the query was initially run.
   * Will likely be an array or object or query values that can be used to trace back which methods/accessors were used in the query.
   * @private
   */
  public traceResponse: ResponseType;

  constructor(
    public shape: T,
    private queryBuildFn: QueryBuildFn<T, ResponseType>,
  ) {
    //TODO: do we use createTraceShape or a variant of it .. called createQueryShape
    // QueryShape somehow needs to inherrit all the properties of the shape, but also change the return types of the get accessors

    let dummyNode = new TestNode();
    let dummyShape = new (shape as any)(dummyNode);
    let queryShape = QueryShape.create(dummyShape);

    let queryResponse = this.queryBuildFn(queryShape, this);
    this.traceResponse = queryResponse;
  }

  where(validation: WhereClause<T>): this {
    return this;
  }

  /**
   * Returns an array of query paths
   * A single query can request multiple things in multiple "query paths" (For example this is using 2 paths: Person.select(p => [p.name, p.friends.name]))
   * Each query path is returned as array of the property paths requested, with potential where clauses (together called a QueryStep)
   */
  getQueryPaths() {
    let queryPaths: QueryPath[] = [];
    //if the trace response is an array, then multiple paths were requested
    if (
      Array.isArray(this.traceResponse) ||
      this.traceResponse instanceof Set
    ) {
      this.traceResponse.forEach((endValue: QueryValue) => {
        queryPaths.push(endValue.getPropertyPath());
      });
    } else if (this.traceResponse instanceof QueryValue) {
      //if it's a single value, then only one path was requested, and we can add it directly
      queryPaths.push(this.traceResponse.getPropertyPath());
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
    return queryPaths;
  }
}

/**
 * A WhereQuery is a (sub)query that is used to filter down the results of its parent query
 * Hence it extends LinkedQuery and can do anything a normal query can
 */
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
type WhereEvaluationMethod = 'steq';
export class WhereMethods {
  static STRING_EQUALS: 'steq' = 'steq';
}
