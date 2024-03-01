import {Shape} from '../shapes/Shape.js';
import {NamedNode, Quad} from '../models.js';
import {PropertyShape} from '../shapes/SHACL.js';
import {rdfs} from '../ontologies/rdfs.js';
import {NodeSet} from '../collections/NodeSet.js';

export interface TraceShape extends Shape {
  // constructor(p:TestNode):TraceShape;
  requested: LinkedDataRequest;
  // resultOrigins:CoreMap<any,any>;
  usedAccessors: any[];
  responses: any[];
}

export declare type SubRequest = LinkedDataRequest;
/**
 * An array of requested property shapes.
 * If you want to request specific property shapes of another property shape (this is called a SubRequest)
 * then replace a property shape with an array that contains the main property shape as the first element, and an array of property shapes as subRequest of that main property shape
 * e.g.: [shape1,[shape2,[shape3,shape4]]] will request shape 3 & 4 of shape 2
 */
export declare type LinkedDataRequest = SingleDataRequest[];
export declare type SingleDataRequest =
  | PropertyShape
  | [PropertyShape, SubRequest];

export function createTraceShape<ShapeType extends Shape>(
  shapeClass: typeof Shape,
  shapeInstance?: Shape,
  debugName?: string,
): ShapeType & TraceShape {
  let detectionClass = class extends shapeClass implements TraceShape {
    requested: LinkedDataRequest = [];
    // resultOrigins:CoreMap<any,any> = new CoreMap();
    usedAccessors: any[] = [];
    responses: any[] = [];

    constructor(p: TestNode) {
      super(p as NamedNode);
    }
  };
  let traceShape: TraceShape;
  if (!shapeInstance) {
    //if not provided we create a new detectionClass instance
    let dummyNode = new TestNode();
    traceShape = new detectionClass(dummyNode);
  } else {
    //if an instance was provided
    // (this happens if a testnode generates a testnode value on demand
    // and the original shape get-accessor returns an instance of a shape of that testnode)
    //then we turn that shape instance into it's test/detection variant
    traceShape = new detectionClass(shapeInstance.namedNode as TestNode);
  }

  //here in the constructor (now that we have a 'this')
  //we will overwrite all the methods of the class we extend and the classes that it itself extends
  //we start with the shape class itself
  let finger = shapeClass;
  while (finger) {
    //check that this shape class or one of its superclasses still extends Shape, otherwise break;
    if (!(finger.prototype instanceof Shape) || finger === Shape) {
      break;
    }

    //get all the property descriptors of the class
    let descriptors = Object.getOwnPropertyDescriptors(finger.prototype);

    for (var key in descriptors) {
      let descriptor = descriptors[key];
      if (descriptor.configurable) {
        //if this is a get method that used a @linkedProperty decorator
        //then it should match with a propertyShape
        let propertyShape = finger['shape']
          .getPropertyShapes()
          .find((propertyShape) => propertyShape.label === key);
        //get the get method (that's the one place that we support @linkedProperty decorators for, for now)
        let g = descriptor.get != null;
        if (g) {
          let newDescriptor: PropertyDescriptor = {};
          newDescriptor.enumerable = descriptor.enumerable;
          newDescriptor.configurable = descriptor.configurable;

          //not sure if we can or want to?..
          // newDescriptor.value= descriptor.value;
          // newDescriptor.writable = descriptor.writable;

          if (propertyShape) {
            //create a new get function
            newDescriptor.get = ((
              key: string,
              propertyShape: PropertyShape,
              descriptor: PropertyDescriptor,
            ) => {
              // console.log(debugName + ' requested get ' + key + ' - ' + propertyShape.path.value);

              //use dummyShape as 'this'
              let returnedValue = descriptor.get.call(traceShape);
              // console.log('generated result -> ',res['print'] ? res['print']() : res);
              // console.log('\tresult -> ', returnedValue && returnedValue.print ? returnedValue.print() : returnedValue);

              //if a shape was returned, make sure we trace that shape too
              if (returnedValue instanceof Shape) {
                returnedValue = createTraceShape(
                  Object.getPrototypeOf(returnedValue).constructor,
                  returnedValue,
                  Object.getPrototypeOf(returnedValue).constructor.name,
                );
              }

              //store which property shapes were requested in the detectionClass defined above
              traceShape.requested.push(propertyShape);
              traceShape.usedAccessors.push(descriptor.get);
              traceShape.responses.push(returnedValue);

              //also store which result was returned for which property shape (we need this in Component.to().. / bindComponentToData())
              // traceShape.resultOrigins.set(returnedValue,descriptor.get);
              // returnedValue['_reqPropShape'] = propertyShape;
              // returnedValue['_accessor'] = descriptor.get;

              return returnedValue;
            }).bind(detectionClass.prototype, key, propertyShape, descriptor);
          } else {
            //if no propertyShape was found, then this is a get method that was not decorated with @linkedProperty
            newDescriptor.get = () => {
              let numRequested = traceShape.requested.length;
              //so we call the method as it was
              let result = descriptor.get.call(traceShape);
              //and if no new property shapes have been accessed
              if (traceShape.requested.length === numRequested) {
                //then probably someone forgot to add a @linkedProperty decorator!
                //or at least it won't add any data to the dataRequest of the linked component, so let's warn the developer of that
                console.warn(
                  `"${
                    traceShape.nodeShape?.label
                  }.${descriptor.get.name.replace(
                    'get ',
                    '',
                  )}" was requested by a linked component. However '${
                    descriptor.get.name
                  }' is not decorated with a linked property decorator (like @linkedProperty), so LINCD can not automatically load this data`,
                );
              }
              //(else, the method probably accessed other methods of the shape that DO use linkedProperty decorators, thus adding more traced propertyShapes. This is fine and works as intended)

              return result;
            };
          }
          //bind this descriptor to the class that defines it
          //and bind the required arguments (which we know only now, but we need to know them when the descriptor runs, hence we bind them)

          //overwrite the get method
          Object.defineProperty(detectionClass.prototype, key, newDescriptor);
        }
      }
    }
    finger = Object.getPrototypeOf(finger);
  }
  //really we return a TraceShape, but it extends the given Shape class, so we need typescript to recognise it as such
  //not sure how to do that dynamically
  return traceShape as any;
}

export class TestNode extends NamedNode {
  constructor(public property?: NamedNode) {
    let uri = NamedNode.createNewTempUri();
    super(uri, true);
  }

  getValue() {
    let label = '';
    if (this.property) {
      if (this.property.hasProperty(rdfs.label)) {
        label = this.property.getValue(rdfs.label);
      } else {
        label = this.property.uri.split(/[\/#]/).pop();
      }
    }
    return label;
  }

  hasProperty(property: NamedNode) {
    return true;
  }

  getAll(property: NamedNode) {
    return new NodeSet([this.getOne(property)]) as any;
  }

  getOne(property: NamedNode): TestNode {
    if (!super.hasProperty(property)) {
      //test nodes AUTOMATICALLY generate a dummy test-node value when a property is requested
      //however they avoid sending events about this
      new Quad(this, property, new TestNode(property), undefined, false, false);
    }
    return super.getOne(property) as any;
  }

  //@TODO: other methods like getDeep, etc
}
