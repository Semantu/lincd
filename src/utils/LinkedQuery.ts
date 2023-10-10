import {ShapeSet} from '../collections/ShapeSet';
import {PropertyShape} from '../shapes/SHACL';
import {Shape} from '../shapes/Shape';
import {TestNode} from './TraceShape';

//TODO: it also needs to extend shape or what?
// export interface QueryShape<S> extends QueryValue<S> {
//   where: (WhereClause) => this;
// }
type WhereClause<S> = boolean | ((s: ToQueryShape<S>) => boolean);
type OriginalValue =
  | Shape
  | ShapeSet
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

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
  ? QueryString<T>
  : QueryValue<T>;

export type ToNormalValue<T> = T extends QueryShapeSet<GetShapeSetType<T>>
  ? ShapeSet<GetQueryShapeSetType<T>>
  : T extends QueryShape<any>
  ? GetQueryShapeType<T>
  : T extends QueryString<any>
  ? string
  : any;

export type GetQueryShapeSetType<T> = T extends QueryShapeSet<infer ShapeType>
  ? ShapeType
  : never;

export type GetQueryShapeType<T> = T extends QueryShape<infer ShapeType>
  ? ShapeType
  : never;

export class QueryValue<S extends Object = any> {
  constructor(
    public property: PropertyShape,
    public subject: QueryShape<any>,
  ) {}

  getPropertyPath(): QueryPath {
    let path: QueryPath = [];
    let current: QueryValue = this;
    while (current.property) {
      path.unshift({property: current.property, where: null}); //current.where});
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
    subject: QueryShape<any>,
  ) {
    if (originalValue instanceof Shape) {
      return new QueryShape(originalValue, property, subject);
    } else if (originalValue instanceof ShapeSet) {
      return new QueryShapeSet(originalValue, property, subject);
    } else if (typeof originalValue === 'string') {
      return new QueryString(originalValue, property, subject);
    }
  }
}
class QueryShapeSet<S> extends QueryValue<S> {
  constructor(
    private shape: S,
    property?: PropertyShape,
    subject?: QueryShape<any>,
  ) {
    super(property, subject);
  }
  where(validation: WhereClause<S>): this {
    return this;
  }
}
// type QueryShapeType<S> = QueryShape<S> & ToQueryShape<S>;
class QueryShape<S extends Shape> extends QueryValue<S> {
  private proxy;
  constructor(
    private shape: S,
    property?: PropertyShape,
    subject?: QueryShape<any>,
  ) {
    super(property, subject);
  }
  where(validation: WhereClause<S>): this {
    return this;
  }

  static proxifyInstance<T extends Shape>(queryShape: QueryShape<T>) {
    let originalShape = queryShape.shape;
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
class QueryString<T> extends QueryValue<string> {
  constructor(
    private value: string,
    property?: PropertyShape,
    subject?: QueryShape<any>,
  ) {
    super(property, subject);
  }
  equals(otherString: string) {
    return false;
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
  private traceResponse: ResponseType;
  constructor(
    private shape: T,
    private queryBuildFn: QueryBuildFn<T, ResponseType>,
  ) {
    //TODO: do we use createTraceShape or a variant of it .. called createQueryShape
    // QueryShape somehow needs to inherrit all the properties of the shape, but also change the return types of the get accessors

    let dummyNode = new TestNode();
    let dummyShape = new (shape as any)(dummyNode);
    let queryShape = new QueryShape(dummyShape);

    // let queryShape = new QueryShape<T>(shape);
    let queryShapeProxy = QueryShape.proxifyInstance<T>(queryShape);
    // let queryShape = createTraceShape<T>(shape, null, '');
    let queryResponse = queryBuildFn(queryShapeProxy as any, this);
    this.traceResponse = queryResponse;
  }

  where(validation: WhereClause<T>): this {
    return this;
  }

  /**
   * Resolves the query locally, by searching the graph in local memory, without using stores.
   * Returns the result immediately.
   */
  local(): ToNormalValue<ResponseType>[] {
    let queryPaths = this.getQueryPaths();
    let localInstances = (this.shape as any).getLocalInstances();
    let results = [];
    localInstances.forEach((localInstance) => {
      results.push(this.resolveQueryPaths(localInstance, queryPaths));
    });
    //convert the result of each instance into the shape that was requested
    if (this.traceResponse instanceof QueryValue) {
      return results.map((result) => {
        //even though resolveQueryPaths always returns an array, if a single value was requested
        //we will return the first value of that array to match the request
        return result.shift();
      });
    } else if (Array.isArray(this.traceResponse)) {
      //nothing to convert if an array was requested
      return results;
    } else if (typeof this.traceResponse === 'object') {
      throw new Error('Objects are not yet supported');
      // let result = {};
      // //go over keys of traceresponse
      // Object.getOwnPropertyNames(this.traceResponse).forEach((key) => {
      //   //and add the property paths for each key
      //   result[key] = results.shift();
      // });
      // return result;
    }
  }
  private resolveQueryPaths(localInstance, queryPaths: QueryPath[]) {
    let shapeResult = [];
    queryPaths.forEach((queryPath) => {
      shapeResult.push(this.resolveQueryPath(localInstance, queryPath));
    });
    return shapeResult;
  }
  private resolveQueryPath(localInstance, queryPath: QueryPath) {
    //start with the local instance as the subject
    let result = localInstance;
    queryPath.forEach((queryStep) => {
      //then resolve each of the query steps and use the result as the new subject for the next step
      result = this.resolveQueryStep(result, queryStep);
    });
    //return the final value at the end of the path
    return result;
  }
  private resolveQueryStep(subject: Shape | ShapeSet, queryStep: QueryStep) {
    if (subject instanceof Shape) {
      return subject[queryStep.property.label];
    }
    if (subject instanceof ShapeSet) {
      let result = new ShapeSet();
      subject.forEach((singleShape) => {
        let singleResult = singleShape[queryStep.property.label];
        if (singleResult instanceof ShapeSet) {
          result = result.concat(singleResult);
        } else if (singleResult instanceof Shape) {
          result.add(singleResult);
        } else {
          throw Error(
            'Unknown result type: ' +
              typeof singleResult +
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

  /**
   * Returns an array of query paths
   * Each query path represents an array of property paths requested, with potential where clauses
   * This can be used to retrieve the data from stores.
   * Once retrieved, the data needs to be transformed into the shape that was requested (object, array or single value)
   */
  getQueryPaths() {
    //at some point this will be not just property shape paths, but a complex object with potential where clause
    let queryPaths: QueryPath[] = [];
    if (Array.isArray(this.traceResponse)) {
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
    // return [dataRequest, dataResponse as any as TransformedLinkedDataResponse];
  }
}
