import {Shape} from '../shapes/Shape';
import {
  BoundComponentFactory,
  BoundSetComponentFactory,
  LinkedDataRequest,
  TransformedLinkedDataResponse,
} from '../interfaces/Component';
import {createTraceShape} from './TraceShape';
import {PropertyShape} from '../shapes/SHACL';

export class LinkedQuery<T extends Shape> {
  public shape: typeof Shape;

  constructor(private queryBuildFn: QueryBuildFn<T>) {}

  toQueryObject() {
    //create a test instance of the shape
    let traceInstance = createTraceShape<T>(
      this.shape,
      null,
      '', //functionalComponent.name || functionalComponent.toString().substring(0, 80) + ' ...',
    );

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
    let dataResponse = this.queryBuildFn(this, traceInstance);

    //for sets, we should get a set with a single item, so we can retrieve traced properties from that single item
    // let traceInstance = traceInstanceOrSet instanceof ShapeSet ? traceInstanceOrSet.first() : traceInstanceOrSet;

    //first finish up the dataRequest object by inserted nested requests from shapes
    // replaceSubRequestsFromTraceShapes(traceInstance);

    //start with the requested properties, which is an array of PropertyShapes
    let dataRequest: LinkedDataRequest = traceInstance.requested;

    let insertSubRequestsFromBoundComponent = (value, target?, key?) => {
      //if a shape was returned for this key
      // if (value instanceof Shape) {
      //   //then add all the things that were requested from this shape as a nested sub request
      //   insertSubRequestForTraceShape(dataRequest,key,value as TraceShape);
      // }
      //if a function was returned for this key
      if (typeof value === 'function') {
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
      }
      return value;
    };

    //whether the component returned an array, a function or an object, replace the values that are bound-component-factories
    if (Array.isArray(dataResponse)) {
      (dataResponse as any[]).forEach((value, index) => {
        dataResponse[index] = insertSubRequestsFromBoundComponent(value);
      });
    } else if (typeof dataResponse === 'function') {
      dataResponse = insertSubRequestsFromBoundComponent(dataResponse);
    } else {
      Object.getOwnPropertyNames(dataResponse).forEach((key) => {
        dataResponse[key] = insertSubRequestsFromBoundComponent(
          dataResponse[key],
        );
      });
    }
    return [dataRequest, dataResponse as any as TransformedLinkedDataResponse];
  }
}

export type QueryBuildFn<T extends Shape> = (
  q: LinkedQuery<T>,
  p: T,
) => LinkedQuery<T>;
