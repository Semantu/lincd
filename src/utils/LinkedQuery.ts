import {Shape} from '../shapes/Shape';
import {TestNode} from './TraceShape';
import {PropertyShape} from '../shapes/SHACL';
import {ShapeSet} from '../collections/ShapeSet';
import {shacl} from '../ontologies/shacl';
import {CoreSet} from '../collections/CoreSet';

//TODO: it also needs to extend shape or what?
// export interface QueryShape<S> extends QueryValue<S> {
//   where: (WhereClause) => this;
// }
type WhereClause<S> =
  | QueryValueEvaluation
  | ((s: ToQueryShape<S>) => QueryValueEvaluation);
type OriginalValue =
  | Shape
  | ShapeSet
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

type QueryPrimitive = QueryString;
export type QueryBuildFn<T extends Shape, ResultType> = (
  p: ToQueryShape<T>,
  q: LinkedQuery<T>,
) => ResultType; //QueryValue<any> | QueryValue<any>[];

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
export type ToQueryValue<T> = T extends ShapeSet
  ? //a shape set turns into a query-shape set but also inherits all the properties of the shape that each item in the set has
    QueryShapeSet<GetShapeSetType<T>> & ToQueryValue<GetShapeSetType<T>>
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
  ? string
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

const primitiveTypes: string[] = ['string', 'number', 'boolean', 'Date'];

export class QueryValue<S extends Object = any> {
  protected whereTraceResult: QueryValueEvaluation;
  protected whereQuery: LinkedWhereQuery<any>;

  constructor(
    public property?: PropertyShape,
    public subject?: QueryShape<any> | QueryShapeSet<any>,
  ) {}

  getPropertyPath(): QueryPath {
    let path: QueryPath = [];
    let current: QueryValue = this;
    while (current.property) {
      path.unshift({
        property: current.property,
        where: current.whereQuery?.getWhereQueryPaths(),
      }); //current.where});
      current = current.subject;
    }
    return path;
  }
  // where(validation: WhereClause<S>): this {
  //   return this;
  // }
  // original:Shape|ShapeValuesSet|Primitive

  /**
   * Converts an original value into a query value
   * @param originalValue
   * @param requestedPropertyShape the property shape that is connected to the get accessor that returned the original value
   */
  static convertOriginal(
    originalValue: OriginalValue,
    property: PropertyShape,
    subject: QueryShape<any> | QueryShapeSet<any> | QueryShape<any>,
  ) {
    if (originalValue instanceof Shape) {
      return QueryShape.create(originalValue, property, subject);
    } else if (originalValue instanceof ShapeSet) {
      return QueryShapeSet.create(originalValue, property, subject);
    } else if (typeof originalValue === 'string') {
      return new QueryString(originalValue, property, subject);
    }
  }

  static toOriginal(
    endValue:
      | ShapeSet<Shape>
      | Shape[]
      | Shape
      | string[]
      | QueryValue<any>
      | QueryPrimitiveSet,
  ) {
    if (endValue instanceof QueryPrimitiveSet) {
      return endValue.map((endValue) => this.toOriginal(endValue));
    }
    if (endValue instanceof QueryString) {
      return this.toOriginal(endValue.subject);
    }
    if (endValue instanceof QueryShape) {
      if (endValue.subject) {
        return this.toOriginal(endValue.subject);
      }
      return endValue.originalShape;
    } else if (endValue instanceof Shape) {
      return endValue;
    } else {
      throw new Error('Unimplemented. Return as is?');
    }
  }
}
class QueryShapeSet<S extends Shape> extends QueryValue<S> {
  private proxy;

  constructor(
    public originalValue: ShapeSet<S>,
    property?: PropertyShape,
    subject?: QueryShape<any> | QueryShapeSet<any>,
  ) {
    super(property, subject);
  }
  callPropertyShapeAccessor(propertyShape: PropertyShape) {
    //call the get method for that property shape on each item in the shape set
    //and return the result as a new shape set
    let result: QueryPrimitiveSet | ShapeSet<any>;

    //if we expect the accessor to return a Primitive (string,number,boolean,Date)
    if (propertyShape.nodeKind === shacl.Literal) {
      //then return a Set of QueryPrimitives
      result = new QueryPrimitiveSet(propertyShape, this);
    } else {
      //TODO: should this be a QueryShapeSet
      // can we avoid setting the subj/prop on each value and instead set it once in the container?
      result = new ShapeSet();
    }
    let expectSingleValues =
      propertyShape.hasProperty(shacl.maxCount) && propertyShape.maxCount <= 1;

    this.originalValue.forEach((shape) => {
      // let shapeValue = shape[propertyShape.label];
      //convert the returned value for this individual shape into a query value
      // let shapeQueryValue = QueryValue.convertOriginal(
      //   shapeValue,
      //   propertyShape,
      //   shape as any as QueryShape<any>,
      // );
      let shapeQueryValue = shape[propertyShape.label];

      if (expectSingleValues) {
        result.add(shapeQueryValue);
      } else {
        //if each of the shapes in a set return a new shapeset for the request accessor
        //then we merge all the returned values into a single shapeset
        result = result.concat(shapeQueryValue);
      }
    });
    return result;
  }

  // get testItem() {}
  where(validation: WhereClause<S>): this {
    if (validation instanceof Function) {
      let dummyNode = new TestNode();
      let leastSpecificShape = this.originalValue.getLeastSpecificShape();
      //create an instance of the shape with the dummy node as node
      let dummyShape = new (leastSpecificShape as any)(dummyNode);
      //convert it to a root query shape
      let queryShape = QueryShape.create(dummyShape);
      // queryShape = QueryShape.create(this.originalValue.first());

      //YOU ARE HERE
      //see what comes back, think through what we need to do with it to track the path
      this.whereQuery = new LinkedWhereQuery(leastSpecificShape, validation);
      // this.whereTraceResult = validation(queryShape);
      return this;
    } else {
      //TODO: add support for where clauses that return a boolean from already available variables,
      // like .where(p.name.eq('Semmy'))
      // for this WhereClause definition may need to be updated to use QueryBoolean instead of boolean
    }
  }

  static create<S extends Shape = Shape>(
    originalValue: ShapeSet<S>,
    property: PropertyShape,
    subject: QueryShape<any> | QueryShapeSet<any>,
  ) {
    let instance = new QueryShapeSet<S>(
      //also convert all instances in the shapeset to QueryShapes
      //NOTE: if this gets done on large data sets and is performance heavy, perhaps we should introduce a flag and only do this subQueries (whereClause)
      // because that may be the only place it is needed. (the proxifyInstance method below already handles get/set methods directly called ont he shape during usual queries)
      new ShapeSet(
        originalValue.map((shape) =>
          QueryShape.create(shape, property, subject),
        ),
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
    return this;
  }
  static create(
    original: Shape,
    property?: PropertyShape,
    subject?: QueryShape<any> | QueryShapeSet<any>,
  ) {
    let instance = new QueryShape(original, property, subject);
    let proxy = this.proxifyInstance(instance);
    return proxy;
  }

  static proxifyInstance<T extends Shape>(queryShape: QueryShape<T>) {
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
class QueryValueEvaluation {
  constructor(
    private value: QueryValue,
    private method: WhereEvaluationMethod,
    private args: any[],
    private evaluation: any,
  ) {}
  getPropertyPath(): QueryPath {
    return this.value.getPropertyPath();
  }
  getMethod() {
    return this.method;
  }
  getArgs() {
    return this.args;
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
    return new QueryValueEvaluation(
      this,
      WhereEvaluation.STRING_EQUALS,
      [otherString],
      this.value === otherString,
    );
  }
}
class QueryPrimitiveSet extends CoreSet<QueryPrimitive> {
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
type QueryPath = QueryStep[];
type QueryStep = {
  property: PropertyShape;
  where?: any;
};
type ShapeClass = typeof Shape & {new (node?: any): Shape};

export class LinkedQuery<T extends Shape, ResponseType = any> {
  /**
   * The returned value when the query was initially run.
   * Will likely be an array or object or query values that can be used to trace back which methods/accessors were used in the query.
   * @private
   */
  protected traceResponse: ResponseType;

  constructor(
    private shape: T,
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
   * Resolves the query locally, by searching the graph in local memory, without using stores.
   * Returns the result immediately.
   */
  local(): ToNormalValue<ResponseType> {
    let queryPaths = this.getQueryPaths();
    let localInstances = (this.shape as any).getLocalInstances();
    let results = [];
    //TODO: we need to this per queryPath, not per instance
    queryPaths.forEach((queryPath) => {
      results.push(this.resolveQueryPath(localInstances, queryPath));
    });

    // localInstances.forEach((localInstance) => {
    //   results.push(this.resolveQueryPaths(localInstance, queryPaths));
    // });

    // return results;
    // convert the result of each instance into the shape that was requested
    if (this.traceResponse instanceof QueryValue) {
      //even though resolveQueryPaths always returns an array, if a single value was requested
      //we will return the first value of that array to match the request
      return results.shift();
      //map((result) => {
      //return result.shift();
      //});
    } else if (Array.isArray(this.traceResponse)) {
      //nothing to convert if an array was requested
      return results as any;
    } else if (this.traceResponse instanceof QueryPrimitiveSet) {
      //TODO: see how traceResponse is made for QueryValue. Here we need to return an array of the first item in the results?
      //does that also work if there is multiple values?
      //do we need to check the size of the traceresponse
      //why is a CoreSet created? start there
      return [...results[0]] as any;
    } else if (typeof this.traceResponse === 'object') {
      throw new Error('Objects are not yet supported');
    }
  }
  private resolveQueryPaths(localInstance, queryPaths: QueryPath[]) {
    let shapeResult = [];
    queryPaths.forEach((queryPath) => {
      shapeResult.push(this.resolveQueryPath(localInstance, queryPath));
    });
    return shapeResult;
  }
  private resolveWherePath(subject: ShapeSet | Shape, queryPath: QueryPath) {
    //start with the local instance as the subject
    let result: ShapeSet | Shape[] | Shape | QueryValue = subject;
    queryPath.forEach((queryStep) => {
      //then resolve each of the query steps and use the result as the new subject for the next step
      result = this.resolveWhereStep(result, queryStep);
    });
    //return the final value at the end of the path
    //TODO: review return types
    return result as
      | ShapeSet
      | Shape[]
      | Shape
      | string[]
      | QueryValue
      | QueryPrimitiveSet;
  }
  private resolveQueryPath(subject: ShapeSet | Shape, queryPath: QueryPath) {
    //start with the local instance as the subject
    let result: ShapeSet | Shape[] | Shape = subject;
    queryPath.forEach((queryStep) => {
      //then resolve each of the query steps and use the result as the new subject for the next step
      result = this.resolveQueryStep(result, queryStep);
    });
    //return the final value at the end of the path
    return result as ShapeSet | Shape[] | Shape;
  }
  // private resolveQueryPath(localInstance, queryPath: QueryPath) {
  //   //start with the local instance as the subject
  //   let result = localInstance;
  //   queryPath.forEach((queryStep) => {
  //     //then resolve each of the query steps and use the result as the new subject for the next step
  //     result = this.resolveQueryStep(result, queryStep);
  //   });
  //   //return the final value at the end of the path
  //   return result;
  // }

  /**
   * Filters down the given subjects to only those what match the where clause
   * @param subject
   * @param where
   * @private
   */
  private resolveWhere(
    subject: Shape | ShapeSet,
    where: {paths; method; args},
  ): OriginalValue | OriginalValue[] {
    //TODO: you are here. In the where query, we need to make sure it resolves to a query value. Probably by changing around the subject that we put in?
    // must be a query shape? Then we get QueryValueStrings back, we see which ones match the where function
    // and only return those who match, so return type of this function will be a ShapeSet or similar

    //TODO 2: we're getting a shapevaluesset, but the values are named nodes. Why?
    // should we change something so that these are QueryShapes?
    let convertedSubjects = QueryValue.convertOriginal(subject, null, null);

    let queryEndValues = this.resolveWherePath(convertedSubjects, where.paths);
    if (where.method === WhereEvaluation.STRING_EQUALS) {
      if (queryEndValues instanceof QueryPrimitiveSet) {
        queryEndValues = queryEndValues.filter(
          this.resolveWhereEquals.bind(this, where.args),
        ) as any;
        return QueryValue.toOriginal(queryEndValues);
      }
    }
  }
  private resolveWhereEquals(args: any[], queryEndValue: QueryPrimitive) {
    return queryEndValue.value === args[0];
  }
  private resolveQueryStep(
    subject: ShapeSet | Shape[] | Shape,
    queryStep: QueryStep,
  ) {
    // if (subject instanceof Shape) {
    //   return subject[queryStep.property.label];
    // }
    if (subject instanceof ShapeSet) {
      //if the propertyshape holds literal values in the graph, then the actual return values will be primitives (strings,numbers,Dates, etc) which we store in an Array
      let result =
        queryStep.property.nodeKind === shacl.Literal ? [] : new ShapeSet();
      (subject as ShapeSet).forEach((singleShape) => {
        let stepResult = singleShape[queryStep.property.label];
        if (queryStep.where) {
          let whereResult = this.resolveWhere(stepResult, queryStep.where);
          //overwrite the single result with the filtered where result
          stepResult = whereResult;
        }
        if (stepResult instanceof ShapeSet) {
          result = result.concat(stepResult);
        } else if (Array.isArray(stepResult)) {
          result = result.concat(stepResult);
        } else if (stepResult instanceof Shape) {
          (result as ShapeSet).add(stepResult);
        } else if (primitiveTypes.includes(typeof stepResult)) {
          (result as any[]).push(stepResult);
        } else {
          throw Error(
            'Unknown result type: ' +
              typeof stepResult +
              ' for property ' +
              queryStep.property.label +
              ' on shape ' +
              singleShape.toString() +
              ')',
          );
        }
      });
      return result;
    } else {
      throw new Error('Unknown subject type: ' + typeof subject);
    }
  }
  private resolveWhereStep(
    subject: ShapeSet | Shape[] | Shape | QueryValue,
    queryStep: QueryStep,
  ): QueryValue {
    if (
      subject instanceof QueryShapeSet &&
      (subject as QueryShapeSet<any>).originalValue instanceof ShapeSet
    ) {
      //if the propertyshape holds literal values in the graph, then the actual return values will be primitives (strings,numbers,Dates, etc) which we store in an Array
      // let result =
      //   queryStep.property.nodeKind === shacl.Literal ? [] : new ShapeSet();

      //access path directly from QueryShapeSet (see its proxy implementation)
      // let stepResult = subject[queryStep.property.label];
      let stepResult = subject.callPropertyShapeAccessor(queryStep.property);

      // (subject as ShapeSet).forEach((singleShape) => {
      //   let stepResult = singleShape[queryStep.property.label];
      //   if (queryStep.where) {
      //     let whereResult = this.resolveWhere(stepResult, queryStep.where);
      //     // if (whereResult === false) {
      //     //   return;
      //     // }
      //     // else
      //     // {
      //     //overwrite the single result with the filtered where result
      //     stepResult = whereResult;
      //     // }
      //   }
      return stepResult as any;
      // if (stepResult instanceof ShapeSet) {
      //   result = result.concat(stepResult);
      // } else if (stepResult instanceof Shape) {
      //   (result as ShapeSet).add(stepResult);
      // } else if (primitiveTypes.includes(typeof stepResult)) {
      //   (result as any[]).push(stepResult);
      // } else {
      //   throw Error(
      //     'Unknown result type: ' +
      //       typeof stepResult +
      //       ' for property ' +
      //       queryStep.property.label +
      //       ')',
      //   );
      // }
      // });
      // return result;
    } else {
      throw new Error('Unknown subject type: ' + typeof subject);
    }
  }
  // private resolveQueryStep(subject: Shape | ShapeSet, queryStep: QueryStep) {
  //   if (subject instanceof Shape) {
  //     return subject[queryStep.property.label];
  //   }
  //   if (subject instanceof ShapeSet) {
  //     //if the propertyshape holds literal values in the graph, then the actual return values will be primitives (strings,numbers,Dates, etc) which we store in an Array
  //     let result =
  //       queryStep.property.nodeKind === shacl.Literal ? [] : new ShapeSet();
  //     subject.forEach((singleShape) => {
  //       let singleResult = singleShape[queryStep.property.label];
  //       if (singleResult instanceof ShapeSet) {
  //         result = result.concat(singleResult);
  //       } else if (singleResult instanceof Shape) {
  //         (result as ShapeSet).add(singleResult);
  //       } else if (primitiveTypes.includes(typeof singleResult)) {
  //         (result as any[]).push(singleResult);
  //       } else {
  //         throw Error(
  //           'Unknown result type: ' +
  //           typeof singleResult +
  //           ' for property ' +
  //           queryStep.property.label +
  //           ' on shape ' +
  //           singleShape.toString() +
  //           ')',
  //         );
  //       }
  //     });
  //     return result;
  //   } else {
  //     throw new Error('Unknown subject type: ' + typeof subject);
  //   }
  // }
  /**
   * Returns an array of query paths
   * Each query path represents an array of property paths requested, with potential where clauses
   * This can be used to retrieve the data from stores.
   * Once retrieved, the data needs to be transformed into the shape that was requested (object, array or single value)
   */
  getQueryPaths() {
    //at some point this will be not just property shape paths, but a complex object with potential where clause
    let queryPaths: QueryPath[] = [];
    if (
      Array.isArray(this.traceResponse) ||
      this.traceResponse instanceof Set
    ) {
      this.traceResponse.forEach((endValue: QueryValue) => {
        queryPaths.push(endValue.getPropertyPath());
      });
    } else if (this.traceResponse instanceof QueryValue) {
      queryPaths.push(this.traceResponse.getPropertyPath());
    }
    //if it's an object
    else if (typeof this.traceResponse === 'object') {
      //then loop over all the keys
      Object.getOwnPropertyNames(this.traceResponse).forEach((key) => {
        //and add the property paths for each key
        queryPaths.push(this.traceResponse[key].getPropertyPath());
      });
    } else {
      throw Error('Unknown trace response type');
    }
    return queryPaths;
  }

  toQueryObject() {
    //create a test instance of the shape
    // let traceInstance = createTraceShape<T>(
    //   this.shape as any,
    //   null,
    //   '', //functionalComponent.name || functionalComponent.toString().substring(0, 80) + ' ...',
    // );
    //if setComponent is true then linkedSetComponent() was used
    //if then also dataDeclaration.setRequest is defined, then the SetComponent used Shape.requestSet()
    //and its LinkedDataRequestFn expects a set of shape instances
    //otherwise (also for Shape.requestForEachInSet) it expects a single shape instance
    // let provideSetToDataRequestFn = setComponent && (dataDeclaration as LinkedDataSetDeclaration<ShapeType>).setRequest;
    // let traceInstanceOrSet = provideSetToDataRequestFn ? new ShapeSet([dummyInstance]) : dummyInstance;
    //create a dataRequest object, we will use this for requesting data from stores
    // [dataRequest, tracedDataResponse] = createDataRequestObject(
    //   dataDeclaration.request || (dataDeclaration as any).setRequest,
    //   traceInstanceOrSet as any,
    // );
    // if ((this.queryBuildFn as LinkedFunctionalComponent<ShapeType>).of) {
    //   return [null, null];
    // }
    //run the function that the component provided to see which properties it needs
    // let dataResponse = this.queryBuildFn(this, traceInstance);
    //for sets, we should get a set with a single item, so we can retrieve traced properties from that single item
    // let traceInstance = traceInstanceOrSet instanceof ShapeSet ? traceInstanceOrSet.first() : traceInstanceOrSet;
    //first finish up the dataRequest object by inserted nested requests from shapes
    // replaceSubRequestsFromTraceShapes(traceInstance);
    //start with the requested properties, which is an array of PropertyShapes
    // let dataRequest: LinkedDataRequest = traceInstance.requested;
    // let insertSubRequestsFromBoundComponent = (value, target?, key?) => {
    //if a shape was returned for this key
    // if (value instanceof Shape) {
    //   //then add all the things that were requested from this shape as a nested sub request
    //   insertSubRequestForTraceShape(dataRequest,key,value as TraceShape);
    // }
    //if a function was returned for this key
    /*if (typeof value === 'function') {
        //count the current amount of property shapes requested so far
        let previousNumPropShapes = traceInstance.requested.length;

        //then call the function to get the actual intended value
        //this will also trigger new accessors to be called & property shapes to be added to 'traceInstance.requested'
        let evaluated = (value as Function)();
        //if a bound component was returned
        if (evaluated && (evaluated as BoundComponentFactory)._create) {
          //retrieve and remove any propertyShape that were requested
          let appliedPropertyShapes = traceInstance.requested.splice(
            previousNumPropShapes,
          );
          //store them in the bound component factory object,
          //we will need that when we actually use the nested component
          evaluated._props = appliedPropertyShapes;

          //then place back an object stating which property shapes were requested
          //and which subRequest need to be made for those as defined by the bound child component
          let subRequest: LinkedDataRequest = (
            evaluated as BoundComponentFactory
          )._comp.dataRequest;

          if ((evaluated as BoundSetComponentFactory)._childDataRequest) {
            subRequest = subRequest.concat(
              (evaluated as BoundSetComponentFactory<any, any>)
                ._childDataRequest,
            ) as LinkedDataRequest;
          }
          if (appliedPropertyShapes.length > 1) {
            console.warn(
              'Using multiple property shapes for subRequests are not yet supported',
            );
          }
          let propertyShape = appliedPropertyShapes[0];

          //add an entry for the bound property with its subRequest (the data request of the component it was bound to)
          //if a specific property shape was requested for this component (like CompA(Shape.request(shape => CompB.of(shape.subProperty))
          if (propertyShape) {
            //then add it as a propertyShape + subRequest
            dataRequest.push([propertyShape as PropertyShape, subRequest]);
          } else {
            //but if not, then the component uses the SAME source (like CompA(Shape.request(s => CompB.of(s)))
            //in this case the dataRequest of CompB can be directly added to that of CompA
            //because its requesting properties of the same subject
            //this keeps the request plain and simple for the stores that need to resolve it
            dataRequest = dataRequest.concat(subRequest);
          }
        }
        return evaluated;
      // }
      return value;*/
    // };
    //whether the component returned an array, a function or an object, replace the values that are bound-component-factories
    // if (Array.isArray(dataResponse)) {
    //   (dataResponse as any[]).forEach((value, index) => {
    //     dataResponse[index] = insertSubRequestsFromBoundComponent(value);
    //   });
    // } else if (typeof dataResponse === 'function') {
    //   dataResponse = insertSubRequestsFromBoundComponent(dataResponse);
    // } else {
    //   Object.getOwnPropertyNames(dataResponse).forEach((key) => {
    //     dataResponse[key] = insertSubRequestsFromBoundComponent(
    //       dataResponse[key],
    //     );
    //   });
    // }
    // return [dataRequest, dataReLinkedWhereQuerysponse as any as TransformedLinkedDataResponse];
  }
}

// class LinkedWhereQuery<S extends Shape, ResponseType = any> {
//   private query: LinkedQuery<S, ResponseType>;
//   constructor(shape, whereFn) {
//     this.query = new LinkedQuery<S, ResponseType>(shape, whereFn);
//   }
// }
class LinkedWhereQuery<S extends Shape, ResponseType = any> extends LinkedQuery<
  S,
  ResponseType
> {
  getWhereQueryPaths() {
    //TODO: return the query value evaluation instead of this in between step?
    return {
      paths: (this.traceResponse as QueryValueEvaluation).getPropertyPath(),
      method: (this.traceResponse as QueryValueEvaluation).getMethod(),
      args: (this.traceResponse as QueryValueEvaluation).getArgs(),
    };
  }
}
type WhereEvaluationMethod = 'steq';
class WhereEvaluation {
  static STRING_EQUALS: 'steq' = 'steq';
}
