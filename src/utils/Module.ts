/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode, Node} from '../models';
import {
  BoundPropertyShapes,
  DetailedLinkedDataRequest,
  LinkedDataDeclaration,
  LinkedDataRequest,
  LinkedDataResponse,
  Shape,
} from '../shapes/Shape';
import {NodeShape, PropertyShape} from '../shapes/SHACL';
import {Prefix} from './Prefix';
import {
  Component,
  FunctionalComponent,
  LinkedComponentProps,
  LinkedFunctionalComponent,
  BoundComponentFactory,
} from '../interfaces/Component';
import {CoreSet} from '../collections/CoreSet';
import {rdf} from '../ontologies/rdf';
import {lincd as lincdOntology} from '../ontologies/lincd';
import {npm} from '../ontologies/npm';
import {createElement, default as React, useEffect, useState} from 'react';
import {rdfs} from '../ontologies/rdfs';
import {NodeSet} from '../collections/NodeSet';
import {Storage} from './Storage';
import {ShapeSet} from '../collections/ShapeSet';
import {CoreMap} from '../collections/CoreMap';
import {QuadArray} from '../collections/QuadArray';
import {QuadSet} from '../collections/QuadSet';
// import {createRoot} from 'react-dom/client';

//global tree
declare var lincd: any;
declare var window;
declare var global;
declare var require;
declare var document;

export const LINCD_DATA_ROOT: string = 'https://data.lincd.org/';

var packageParsePromises: Map<string, Promise<any>> = new Map();
var loadedPackages: Set<NamedNode> = new Set();
let shapeToComponents: Map<typeof Shape, CoreSet<Component>> = new Map();
/**
 * a map of data requests for specific nodes
 * The value is a promise if its still loading
 * QuadArray if its completed
 * Or 'true' if it was already loaded as a subRequest of another request
 */
var nodeToDataRequest: CoreMap<Node, CoreMap<LinkedDataRequest, Promise<void> | QuadArray | true>> = new CoreMap();
// type LinkedComponentClassDecorator<ShapeType,P> = <T extends typeof LinkedComponentClass<ShapeType,P>>(constructor:T)=>T;
type ClassDecorator = <T extends {new (...args: any[]): {}}>(constructor: T) => T;

// type EventConfig<Events extends { kind: string }> = {
//   // [E in Events as E["kind"]]: (event: E) => void;
//   [E in Events as String<E>]: (event: E) => void;
// }
//<Person,{bla}> => {bla:string} & {person:Person}

/**
 * This object, returned by [linkedPackage()](/docs/lincd.js/modules/utils_Module#linkedPackage),
 * contains the decorators to link different parts of a LINCD module.
 */
export interface LinkedPackageObject {
  /**
   * Links a functional component to its shape
   * Once linked, the component receives an extra property "sourceShape" which will be an instance of the linked Shape.
   *
   * Note that the shape needs to be provided twice, as a type and as a value, see examples below.
   * @param shape - the Shape class that this component is linked to. Import a LINCD Shape class and use this class directly for this parameter
   * @param functionalComponent - a functional rect component
   *
   * @example
   * Linked Functional Component example:
   * ```tsx
   * import {Person} from "../shapes/Person";
   * export const PersonView = linkedComponent<Person>(Person, ({source, sourceShape}) => {
   *   //source is a NamedNode, and sourceShape is an instance of Person (for the same named node)
   *   let person = sourceShape;
   *   //get the name of the person from the graph
   *   return <h1>Hello {person.name}!</h1>;
   * });
   * ```
   */
  linkedComponent: <ShapeType extends Shape, P = {}>(
    shapeClass: typeof Shape | LinkedDataDeclaration<ShapeType>,
    functionalComponent?: FunctionalComponent<P, ShapeType>,
    // )=> FunctionalComponent<P,ShapeType>;
  ) => LinkedFunctionalComponent<Omit<Omit<P, 'source'>, 'sourceShape'> & LinkedComponentProps<ShapeType>, ShapeType>;

  /**
   * Class decorator that links a class-based component to its shape.
   * Once linked, the component receives an extra property "sourceShape" which will be an instance of the linked Shape.
   *
   * Note that your class needs to extend [LinkedComponentClass](/docs/lincd.js/classes/utils_LinkedComponentClass.LinkedComponentClass), which extends React.Component.
   * And you will need to provide the same Shape class that you use as a parameter for the decorator as a type generic to LinkedComponentClass (see example).
   * @param shape - the Shape class that this component is linked to. Import a LINCD Shape class and use this class directly for this parameter
   *
   * @example
   * Linked component class example:
   * ```tsx
   * import {React} from "react";
   * import {linkedComponentClass} from "../package";
   * import {LinkedComponentClass} from "lincd/lib/utils/ComponentClass";
   * @linkedComponentClass(Person)
   * export class PersonView extends LinkedComponentClass<Person> {
   *   render() {
   *     //typescript knows that person is of type Person
   *     let person = this.props.sourceShape;
   *
   *     //get the name of the person from the graph
   *     return <h1>Hello {person.name}!</h1>;
   *   }
   * }
   * ```
   */
  linkedComponentClass: <ShapeType extends Shape, P = {}>(shapeClass: typeof Shape) => ClassDecorator;

  /**
   * Register a file (a javascript module) and all its exported objects.
   * Specifically helpful for registering multiple functional components if you declare them without a function name
   * @param _this
   * @param _module
   */
  registerPackageModule(_module): void;

  /**
   * Links a typescript class to a SHACL shape.
   * This decorator creates a SHACL shape and looks at the static property [targetClass](/docs/lincd.js/classes/shapes_Shape.Shape#targetclass)
   * The rest of the shape is typically 'shaped' by methods that use [property decorators](/docs/lincd.js/modules/utils_ShapeDecorators).
   *
   * @example
   * Example of a typescript class using the \@linkedShape decorator:
   * ```tsx
   * @linkedShape
   * export class Person extends Shape {
   *   /**
   *    * indicates that instances of this shape need to have this rdf.type
   *    *\/
   *   static targetClass: NamedNode = schema.Person;
   *
   *   /**
   *    * indicates that instances of this shape need to have this rdf.type
   *    *\/
   *   @literalProperty({
   *     path: schema.givenName,
   *     required: true,
   *     maxCount: 1,
   *   })
   *   get name() {
   *     return this.getValue(schema.givenName);
   *   }
   *
   *   set name(val: string) {
   *     this.overwrite(schema.givenName, new Literal(val));
   *   }
   * }
   * ```
   */
  linkedShape: <T extends typeof Shape>(constructor: T) => T;

  /**
   * Use this decorator to make any other classes or functions available on demand to other LINCD modules.
   * It does not change the object it is applied on.
   * This is specifically required for their use in an open-ended LINCD application.
   *
   * @example
   * An example helper utility using the \@linkedUtil decorator:
   * ```tsx
   * @linkedUtil
   * export class Sort {
   *   static byName(persons:Person[]) {
   *     return persons.sort((p1,p2) => p1.name < p2.name ? -1 : 1)
   *   }
   * ```
   */
  linkedUtil: (constructor: any) => any;

  /**
   * Used to notify LINCD.js of an ontology.
   * See also the [Ontology guides](/docs/guides/linked-code/ontologies).
   *
   * @param allFileExports - all the objects that are exported by the ontology file (use `import * as _this from "./path-to-this-file")`)
   * @param nameSpace - the result of [createNameSpace](/docs/lincd.js/modules/utils_NameSpace#createnamespace). This allows consumers to generate NamedNodes that may not be listed in this ontology if needed
   * @param prefixAndFileName - a suggested prefix chosen by you. Make sure the suggestedPrefix matches the file name and the name of the exported object that groups all entities together
   * @param loadDataFunction - a method that loads _and parses_ the raw ontology data. This means the ontology will be loaded into the local graph. The returned result is mostly a JSONLDParsePromise (from lincd-jsonld/lib/JSONLD, not bundled in LINCD.js)
   * @param dataSource - the relative path to the raw data of the ontology
   * @example
   * Example of an Ontology File that used linkedOntology()
   * ```tsx
   * import {NamedNode} from 'lincd/lib/models';
   * import {JSONLD} from 'lincd-jsonld/lib/JSONLD';
   * import {createNameSpace} from 'lincd/lib/utils/NameSpace';
   * import {linkedOntology} from '../package';
   * import * as _this from './my-ontology';
   *
   * let dataFile = '../data/my-ontology.json';
   * export var loadData = () => JSONLD.parsePromise(import(dataFile));
   *
   * export var ns = createNameSpace('http://www.my-ontology.com/');
   *
   * export var _self: NamedNode = ns('');
   *
   * // Classes
   * export var ExampleClass: NamedNode = ns('ExampleClass');
   *
   * // Properties
   * export var exampleProperty: NamedNode = ns('exampleProperty');
   *
   * export const myOntology = {
   *   ExampleClass,
   *   exampleProperty,
   * };
   *
   * linkedOntology(_this, ns, 'myOntology', loadData, dataFile);
   * ```
   */
  linkedOntology: (
    allFileExports,
    nameSpace: (term: string) => NamedNode,
    suggestedPrefixAndFileName: string,
    loadDataFunction?: () => Promise<any>,
    dataSource?: string | string[],
  ) => void;

  /**
   * Low level method used by other decorators to write to the modules' object in the LINCD tree.
   * You should typically not need this.
   * @param exportFileName - the file name that this exported object is available under. Needs to be unique across the module.
   * @param exportedObject - the exported object (the class, constant, function, etc)
   */
  registerPackageExport: (exportedObject: any) => void;

  /**
   * A reference to the modules' object in the LINCD tree.
   * Contains all linked components of the module.
   */
  packageExports: any;
}

// var moduleLoadPromises: Map<NamedNode, DeferredPromise> = new Map();

export function linkedPackage(
  packageName: string,
  packageExports?: any,
  packageNode?: NamedNode,
  packageDataPromise?: Promise<any>,
  ontologyDataPromises?: [NamedNode, Promise<any>][],
): LinkedPackageObject {
  //handle module data and ontology data
  if (!ontologyDataPromises) ontologyDataPromises = [];

  //module is parsed when all of those are parsed
  var packageParsedPromise = Promise.all([packageDataPromise || true, ...ontologyDataPromises]);

  packageParsePromises.set(packageName, packageParsedPromise);

  //if no module node was given, we will determine the URI of the module for them
  //TODO: (assuming that the module data does not include a URI already?)
  if (!packageNode) {
    // packageNode = NamedNode.getOrCreate(
    // 	'http://data.lincd.pro/modules/npm/' + packageName,
    // );
    packageNode = NamedNode.getOrCreate(`${LINCD_DATA_ROOT}module/${packageName}`, true);
  }

  //register the ontologies once they're parsed
  ontologyDataPromises.forEach(([ontology, ontologyPromise]) => {
    ontologyPromise.then((parseResult) => {
      //parseResult:JSONLDParseResult
      //TODO: bring back support for ontologies?
      // Ontology.registerOntology(ontology, parseResult.quads);
    });
  });

  //AFTER all the data has been loaded
  packageParsedPromise.then(() => {
    loadedPackages.add(packageNode);
    // we can officially resolve the module load promise
    // if (!moduleLoadPromises.has(moduleResource)) {
    // 	moduleLoadPromises.set(moduleResource as NamedNode, {
    // 		done: true,
    // 		promise: Promise.resolve(true),
    // 	});
    // } else {
    // 	let promiseObject = moduleLoadPromises.get(moduleResource as NamedNode);
    // 	promiseObject.done = true;
    // 	promiseObject.resolve(true);
    // }
  });

  packageNode.set(rdf.type, lincdOntology.Module);
  packageNode.setValue(npm.packageName, packageName);

  let packageTreeObject = registerPackageInTree(packageName, packageExports);

  //#Create declarators for this module
  let registerPackageExport = function (object) {
    if (object.name in packageTreeObject) {
      console.warn(
        `Key ${object.name} was already defined for package ${packageName}. Note that LINCD currently only supports unique names across your entire package. Overwriting ${object.name} with new value`,
      );
    }
    packageTreeObject[object.name] = object;
  };

  //create a declarator function which Components of this module can use register themselves and add themselves to the global tree
  // let linkedUtil = function () {
  //
  // 	return (constructor) => {
  // 		//add the component class of this module to the global tree
  // 		registerPackageExport(constructor);
  //
  // 		//return the original class without modifications
  // 		return constructor;
  // 	};
  // };

  let registerInPackageTree = function (exportName, exportedObject) {
    packageTreeObject[exportName] = exportedObject;
  };

  function registerPackageModule(_module): void {
    for (var key in _module.exports) {
      //if the exported object itself (usually FunctionalComponents) is not named or its name is _wrappedComponent (which ends up happening in the linkedComponent method above)
      //then we give it the same name as it's export name.
      if (!_module.exports[key].name || _module.exports[key].name === '_wrappedComponent') {
        Object.defineProperty(_module.exports[key], 'name', {value: key});
      }
      registerInPackageTree(key, _module.exports[key]);
    }
  }

  //create a declarator function which Components of this module can use register themselves and add themselves to the global tree
  let linkedUtil = function (constructor) {
    //add the component class of this module to the global tree
    registerPackageExport(constructor);

    //return the original class without modifications
    return constructor;
  };

  //creates a declarator function which Components of this module can use register themselves and add themselves to the global tree
  function linkedComponent<ShapeType extends Shape, P = {}>(
    requiredData: typeof Shape | LinkedDataDeclaration<ShapeType>,
    // dataDeclarationOrComponent:FunctionalComponent<P,ShapeType>|LinkedDataDeclaration<ShapeType>,
    functionalComponent: FunctionalComponent<P, ShapeType>,
  ): LinkedFunctionalComponent<P, ShapeType> {
    type FC = LinkedFunctionalComponent<P, ShapeType>;

    //if a class that extends Shape was given
    let shapeClass: typeof Shape;
    let dataRequest: LinkedDataRequest;
    let tracedDataResponse: LinkedDataResponse;
    let dataDeclaration: LinkedDataDeclaration<ShapeType>;
    let propertyShapeClone: any;

    //if a Shape class was given (the actual class that extends Shape)
    if (requiredData['prototype'] instanceof Shape) {
      //then we just load the whole shape
      shapeClass = requiredData as typeof Shape;
      dataRequest = shapeClass;
    } else {
      //linkedDataShape is a LinkedDataRequest
      dataDeclaration = requiredData as LinkedDataDeclaration<ShapeType>;
      shapeClass = dataDeclaration.shape;

      //create a test instance of the shape
      let dummyInstance = createTraceShape(
        shapeClass,
        null,
        functionalComponent.name || functionalComponent.toString().substring(0, 80) + ' ...',
      );

      //run the function that the component provided to see which properties it needs
      tracedDataResponse = dataDeclaration.request(dummyInstance as any as ShapeType);

      //for objects
      dataRequest = createDataRequestObject(shapeClass, tracedDataResponse, dummyInstance);

      //now that we can find the accessor back (based on the order in which they were added! eek)
      //make a copy of the requested property shapes array (as we want to manipulate it)
      // let propertyShapes = [...dummyInstance.requested];

      //we can call the '_create' function which generates the boundComponent
      //which we then store as the value (so we can use it when this component is used with real data)

      //here we create an identical object to the one that was returned (either an array or object)
      //and we replace those values that used Component.of(...) with the accessor they will require to run
      // propertyShapeClone = getResponsePropertyShapeClone(propertyShapes,dataRequest,dataResponse);

      // console.log('Data response:', tracedDataResponse);
      // console.log(
      //   'Requested properties:',
      //   dataRequest['properties']
      //     ? dataRequest['properties']
      //         .map((r) => (r instanceof PropertyShape ? r.path.toString() : '(ComplexRequest)'))
      //         .join(', ')
      //     : null,
      // );
    }

    //create a new functional component which wraps the original
    let _wrappedComponent: FC = (props: P & LinkedComponentProps<ShapeType>) => {
      //take the given props and add make sure both 'source' and 'sourceShape' are defined
      let linkedProps = getLinkedComponentProps<ShapeType, P>(props, shapeClass);

      //get the map of requests made for this node (and make sure a map exists)
      if (!nodeToDataRequest.has(linkedProps.source)) {
        nodeToDataRequest.set(linkedProps.source, new CoreMap());
      }
      let requestCache = nodeToDataRequest.get(linkedProps.source);

      //if the data request has already been made and the request has already resolved
      //then we can safely continue to render straight away
      let preLoaded: boolean =
        requestCache && requestCache.has(dataRequest) && !(requestCache.get(dataRequest) instanceof Promise);

      let [linkedData, setLinkedData] = useState<any>();
      useEffect(() => {
        //if the request has been made before we don't have to do it again, even if it's still loading
        if (!requestCache.has(dataRequest)) {
          //if not, load now,
          let loadPromise = Storage.loadShape(linkedProps.sourceShape, dataRequest).then((quads) => {
            // console.log('Received ' + quads.toString());

            //if the component used a Shape.request() data declaration function
            if (dataDeclaration) {
              //then use that now to get the requested for this instance
              let dataResponse:LinkedDataResponse = dataDeclaration.request(linkedProps.sourceShape);

              //YOU ARE HERE, UPDATE THIS METHOD FOR REPLACING () =>
              //see
              //finally we replace any temporary placeholders returned by 'Component.of(..)'
              //with real components
              appendDataResponse(dataResponse,tracedDataResponse);

              //use the response as the linkedData for this component
              setLinkedData(dataResponse);

            }
            else
            {
              //set to true to indicate the shaoe instance is loaded
              setLinkedData(true);
            }
            //update the cached result to the actual quads instead of the promise
            //also mark any subRequests as loaded for the right nodes
            updateCache(linkedProps.sourceShape.node, dataRequest, quads);

          });

          //save the promise result (so we don't request it again)
          requestCache.set(dataRequest, loadPromise);
        }
      }, []);

      //if the data is loaded
      if (preLoaded || linkedData) {
        //if the component used a Shape.request() data declaration function
        // if (dataDeclaration) {
        //   //then use that now to get the requested for this instance
        //   let dataResponse = dataDeclaration.request(linkedProps.sourceShape);
        //
        //   //finally we replace any temporary placeholders returned by 'Component.of(..)'
        //   //with real components
        //   replaceBoundComponents(propertyShapeClone, dataResponse);
        //
        // }
        if(linkedData !== true)
        {
          linkedProps['linkedData'] = linkedData;
        }

        //render the original components with the original + generated properties
        return functionalComponent(linkedProps);
      } else {
        //render loading
        return createElement('div', null, '...');
      }
    };

    //bind
    _wrappedComponent.of = bindComponentToData<P, ShapeType>;
    //keep a copy of the original for strict checking of equality when compared to
    _wrappedComponent.original = functionalComponent;

    _wrappedComponent.dataRequest = dataRequest;

    //link the wrapped functional component to its shape
    _wrappedComponent.shape = shapeClass;
    //IF this component is a function that has a name
    if (functionalComponent.name) {
      //then copy the name (have to do it this way, name is protected)
      Object.defineProperty(_wrappedComponent, 'name', {
        value: functionalComponent.name,
      });
      //and add the component class of this module to the global tree
      registerPackageExport(_wrappedComponent);
    }
    //NOTE: if it does NOT have a name, the developer will need to manually use registerPackageExport

    //register the component and its shape
    registerComponent(_wrappedComponent, shapeClass);

    return _wrappedComponent;
  }

  function linkedComponentClass<ShapeType extends Shape, P = {}>(shapeClass: typeof Shape): ClassDecorator {
    //this is for Components declared with ES Classes
    //in this case the function we're in will be used as a decorator: @linkedComponent(SomeShapeClass)
    //class decorators return a function that receives a constructor and returns a constructor.
    let decoratorFunction = function <T>(constructor) {
      //add the component class of this module to the global tree
      registerPackageExport(constructor);

      //link the shape
      constructor['shape'] = shapeClass;

      //register the component and its shape
      registerComponent(constructor as any, shapeClass);

      //return the original class without modifications
      // return constructor;

      //only here we have shapeClass as a value (not in LinkedComponentClass)
      //so here we can return a new class that extends the original class,
      //but it adds linked properties like sourceShape
      let wrappedClass = class extends constructor {
        constructor(props) {
          let linkedProps = getLinkedComponentProps<ShapeType, P>(props, shapeClass);
          super(linkedProps);
        }
      } as any as T;
      //copy the name
      Object.defineProperty(wrappedClass, 'name', {value: constructor.name});
      Object.defineProperty(wrappedClass, 'original', {value: constructor});
      return wrappedClass;
    };
    return decoratorFunction;
  }

  //create a declarator function which Shapes of this module can use register themselves and add themselves to the global tree
  let linkedShape = function (constructor) {
    //add the component class of this module to the global tree
    registerPackageExport(constructor);

    //register the component and its shape
    Shape.registerByType(constructor);

    //if no shape object has been attached to the constructor
    if (!Object.getOwnPropertyNames(constructor).includes('shape')) {
      //create a new node shape for this shapeClass
      let shape: NodeShape = new NodeShape();
      // shape.namedNode.uri =`${NamedNode.TEMP_URI_BASE}${packageName}/shape/${constructor.name}`;
      shape.namedNode.uri = `${LINCD_DATA_ROOT}module/${packageName}/shape/${constructor.name}`;
      constructor.shape = shape;

      //also create a representation in the graph of the shape class itself
      let shapeClass = NamedNode.create();
      // shapeClass.uri = `${NamedNode.TEMP_URI_BASE}${packageName}/shapeClass/${constructor.name}`
      shapeClass.uri = `${LINCD_DATA_ROOT}module/${packageName}/shapeclass/${constructor.name}`;
      shapeClass.set(lincdOntology.definesShape, shape.node);
      shapeClass.set(rdf.type, lincdOntology.ShapeClass);

      //and connect it back to the module
      shapeClass.set(lincdOntology.module, packageNode);

      //if linkedProperties have already registered themselves
      if (constructor.propertyShapes) {
        //then add them to this node shape now
        constructor.propertyShapes.forEach((propertyShape) => {
          //update the URI (by extending the URI of the shape)
          propertyShape.namedNode.uri = shape.namedNode.uri + `/property/${propertyShape.label}`;

          shape.addPropertyShape(propertyShape);
        });
        //and remove the temporary key
        delete constructor.propertyShapes;
      }
    } else {
      // (constructor.shape.node as NamedNode).uri = URI;
      console.warn('This ShapeClass already has a shape: ', constructor.shape);
    }

    if (constructor.targetClass) {
      (constructor.shape as NodeShape).targetClass = constructor.targetClass;
    }

    //return the original class without modifications
    return constructor;
  };

  /**
   *
   * @param exports all exports of the file, simply provide "this" as value!
   * @param dataSource the path leading to the ontology's data file
   * @param nameSpace the base URI of the ontology
   * @param prefixAndFileName the file name MUST match the prefix for this ontology
   */
  let linkedOntology = function (
    exports,
    nameSpace: (term: string) => NamedNode,
    prefixAndFileName: string,
    loadData?,
    dataSource?: string | string[],
  ) {
    // let linkedOntology = function(
    // 	fn: () => [Object, (term: string) => NamedNode, string, () => Promise<any>],
    // ) {
    //the ontology file will call linkedOntology() whilst its parsing
    // but the exports of the file will only be available once parsing has fully completed. So we execute the given function after the next tick
    // nextTick(() => {
    // 	let [exports, nameSpace, prefixAndFileName, loadData] = fn();
    //make sure we can detect this as an ontology later
    exports['_ns'] = nameSpace;
    exports['_prefix'] = prefixAndFileName;
    exports['_load'] = loadData;
    exports['_data'] = dataSource;

    //register the prefix here (so just calling linkedOntology with a prefix will automatically register that prefix)
    if (prefixAndFileName) {
      //run the namespace without any term name, this will give back a named node with just the namespace as URI, then get that URI to provide it as full URI
      Prefix.add(prefixAndFileName, nameSpace('').uri);
    }

    //register all the exports under the prefix. NOTE: this means the file name HAS to match the prefix
    registerInPackageTree(prefixAndFileName, exports);
    // });
  };

  //return the declarators so the module can use them
  return {
    linkedComponent,
    linkedComponentClass,
    linkedShape,
    linkedUtil,
    linkedOntology,
    registerPackageExport,
    registerPackageModule,
    packageExports: packageTreeObject,
  } as LinkedPackageObject;
}

function appendDataResponse(dataResponse: LinkedDataResponse,tracedDataResponse:LinkedDataResponse) {

  let replaceBoundComponent = (value, target, key) => {
    //if a function was returned for this key
    if (typeof value === 'function') {

      //then call the function to get the actual intended value
      let evaluated = (value as Function)();
      //if a bound component was returned
      if (evaluated && evaluated._create) {

        //here we get the propertyShapes that were required to obtain the source
        // when we evaluated the function when the component was first initialised
        let props = tracedDataResponse[key]._props;
        evaluated = (evaluated as BoundComponentFactory<any, any>)._create(props);
      }
      //overwrite the value of this key with the returned value
      target[key] = evaluated;
    }
  };
  if (Array.isArray(dataResponse)) {
    (dataResponse as any[]).forEach((value, index) => {
      replaceBoundComponent(value, dataResponse, index);
    });
  } else {
    Object.getOwnPropertyNames(dataResponse).forEach((key) => {
      replaceBoundComponent(dataResponse[key], dataResponse, key);
    });
  }

}

function updateCache(source: Node, request: LinkedDataRequest, requestResult?: QuadArray | true) {
  let requestCache = nodeToDataRequest.get(source);
  requestCache.set(request, requestResult);


  //if specific properties were requested (rather than simply a shape)
  if ((request as DetailedLinkedDataRequest).shape) {
    //check each requested proeprty shape
    let {shape, properties} = request as DetailedLinkedDataRequest;
    properties.map((propertyRequest: PropertyShape|BoundPropertyShapes) => {
      let subRequest: LinkedDataRequest;
      let propertyShape: PropertyShape;
      let propertyShapes: PropertyShape[];

      //if this property request is given as an object with the following key
      //then it comes from a bound child component request, aka a sub request
      if((propertyRequest as BoundPropertyShapes).propertyShapes)
      {
        propertyShapes = (propertyRequest as BoundPropertyShapes).propertyShapes
        subRequest = (propertyRequest as BoundPropertyShapes).request

        //if there were more than 1 (if there is more left right now)
        if (propertyShapes.length > 1) {
          console.warn('Multiple property shapes not supported yet. Taking first only');
        }
        propertyShape = propertyShapes[0];

        //if no property shapes were used, then the source of the child component equals the source of the component
        //so we now update the cache for the same source for this subrequest
        if (!propertyShape) {
          updateCache(source, subRequest, true);
        }
        else
        {
          //for each returned value for this property path
          source.getAll(propertyShape.path).forEach((propertyValue) => {
            //update the cache to state that we have loaded the sub request for this specific node
            //and also check the subrequest recursively for any more deeply nested requests
            //but first: for subrequests we need to first make sure an entry exists in the cache for this node
            if (!nodeToDataRequest.has(propertyValue)) {
              nodeToDataRequest.set(propertyValue, new CoreMap());
            }
            updateCache(propertyValue, subRequest, true);
          });
        }
      }
    });
  }
}

/*function getResponsePropertyShapeClone(propertyShapes:PropertyShape[],dataRequest:LinkedDataRequest,dataResponse:LinkedDataResponse) {

  let propertyShapeClone;
  let checkPropertyShape = (value, target, key) => {
    //always take the first next property shape in line
    let propertyShape = propertyShapes.shift();
    //save it in the propertyShapeClone if this value is a bound component
    if (value && value._create) {
      target[key] = propertyShape;
      //first, find the index of the shifted propertyShape in the original request.properties array
      //we can calculate that manually
      //TODO: test if indexOf would be faster
      let numLeft = propertyShapes.length;
      let total = (dataRequest as DetailedLinkedDataRequest).properties.length;
      let targetIndex = total-numLeft-1;
      //then replace the propertyShape in the dataRequest with a new entry,
      //that adds the nested data dependencies of this bound child component
      (dataRequest as DetailedLinkedDataRequest).properties[targetIndex] = [
        propertyShape,
        (value as BoundComponentFactory<any,any>)._comp.dataRequest
      ]

    }
  };
  if (Array.isArray(dataResponse)) {
    propertyShapeClone = [];
    (dataResponse as any[]).forEach((value, index) => {
      checkPropertyShape(value, propertyShapeClone, index);
    });
  } else {
    propertyShapeClone = {};
    Object.getOwnPropertyNames(dataResponse).forEach((key) => {
      checkPropertyShape(dataResponse[key], propertyShapeClone, key);
    });
  }
  return propertyShapeClone
}*/
function createDataRequestObject(
  shapeClass,
  dataResponse: LinkedDataResponse,
  instance: TraceShape,
): LinkedDataRequest {
  let dataRequest: LinkedDataRequest = {
    shape: shapeClass,
    properties: instance.requested,
  };

  let replaceBoundFactory = (value,target,key) => {
    //if a function was returned for this key
    if (typeof value === 'function') {
      //count the current amount of property shapes requested so far
      let previousNumPropShapes = instance.requested.length;

      //then call the function to get the actual intended value
      //this will also trigger new accessors to be called & propertyshapes to be added
      let evaluated = (value as Function)();
      //if a bound component was returned
      if (evaluated && evaluated._create) {
        //retrieve and remove any propertyShape that were requested
        let appliedPropertyShapes = instance.requested.splice(previousNumPropShapes);
        //store them in the value, we need that when we actually use the nested component
        (evaluated as BoundComponentFactory<any, any>)._props = appliedPropertyShapes;

        //then place back an object stating which property shapes were requested
        //and which subRequest need to be made for those as defined by the bound child component
        (dataRequest as DetailedLinkedDataRequest).properties.push({
          propertyShapes: appliedPropertyShapes,
          request: (evaluated as BoundComponentFactory<any, any>)._comp.dataRequest,
        });
      }
      //overwrite the value of this key with the returned value
      target[key] = value;
    }
  }

  if (Array.isArray(dataResponse)) {
    (dataResponse as any[]).forEach((value, index) => {
      replaceBoundFactory(value, dataResponse, index);
    });
  } else {
    Object.getOwnPropertyNames(dataResponse).forEach((key) => {
      replaceBoundFactory(dataResponse[key], dataResponse, key);
    });
  }
  return dataRequest;
}

function useLinkedData(source, shapeClass) {
  return null;
}

interface TraceShape extends Shape {
  // constructor(p:TestNode):TraceShape;
  requested: PropertyShape[];
  // resultOrigins:CoreMap<any,any>;
  usedAccessors: any[];
}

// function addTestDataAccessors(detectionClass,shapeClass,dummyShape):
function createTraceShape(shapeClass: typeof Shape, shapeInstance?: Shape, debugName?: string): TraceShape {
  let detectionClass = class extends shapeClass implements TraceShape {
    requested: PropertyShape[] = [];
    // resultOrigins:CoreMap<any,any> = new CoreMap();
    usedAccessors: any[] = [];

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
  //we will overwrite all the methods of the class we extend and that classes that that extends
  let finger = shapeClass;
  while (finger) {
    //check this superclass still extends Shape, otherwise break;
    if (!(finger.prototype instanceof Shape) || finger === Shape) {
      break;
    }

    let descriptors = Object.getOwnPropertyDescriptors(finger.prototype);

    for (var key in descriptors) {
      let descriptor = descriptors[key];
      if (descriptor.configurable) {
        //if this is a get method that used a @linkedProperty decorator
        //then it should match with a propertyShape
        let propertyShape = shapeClass['shape']
          .getPropertyShapes()
          .find((propertyShape) => propertyShape.label === key);
        if (propertyShape) {
          // let propertyShape:PropertyShape = descriptor.get['propertyShape'];
          let g = descriptor.get != null;
          // let s = descriptor.set != null;

          if (g) {
            let newDescriptor: PropertyDescriptor = {};
            newDescriptor.enumerable = descriptor.enumerable;
            newDescriptor.configurable = descriptor.configurable;

            //not sure if we can or want to?..
            // newDescriptor.value= descriptor.value;
            // newDescriptor.writable = descriptor.writable;

            newDescriptor.get = ((key: string, propertyShape: PropertyShape, descriptor: PropertyDescriptor) => {
              // console.log(debugName + ' requested get ' + key + ' - ' + propertyShape.path.value);

              //use dummyShape as 'this'
              let returnedValue = descriptor.get.call(traceShape);
              // console.log('generated result -> ',res['print'] ? res['print']() : res);
              // console.log('\tresult -> ', returnedValue && returnedValue.print ? returnedValue.print() : returnedValue);

              //if a shape was returned, make sure we trace that shape too
              if (returnedValue instanceof Shape) {
                returnedValue = createTraceShape(Object.getPrototypeOf(returnedValue), returnedValue);
              }

              //store which property shapes were requested in the detectionClass defined above
              traceShape.requested.push(propertyShape);
              traceShape.usedAccessors.push(descriptor.get);

              //also store which result was returned for which property shape (we need this in Component.to().. / bindComponentToData())
              // traceShape.resultOrigins.set(returnedValue,descriptor.get);
              // returnedValue['_reqPropShape'] = propertyShape;
              // returnedValue['_accessor'] = descriptor.get;

              return returnedValue;
            }).bind(detectionClass.prototype, key, propertyShape, descriptor);
            //bind this descriptor to the class that defines it
            //and bind the required arguments (which we know only now, but we need to know them when the descriptor runs, hence we bind them)

            //overwrite the get method
            Object.defineProperty(detectionClass.prototype, key, newDescriptor);
          }
        }
      }
    }
    finger = Object.getPrototypeOf(finger);
  }
  return traceShape;
}

class TestNode extends NamedNode {
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
      this.set(property, new TestNode(property));
    }
    return super.getOne(property) as any;
  }

  //@TODO: other methods like getDeep, etc
}

function registerComponent(exportedComponent: Component, shape?: typeof Shape) {
  if (!shape) {
    //warn developers against a common mistake: if no static shape is set by the Component it will inherit the one of the class it extends
    if (!exportedComponent.hasOwnProperty('shape')) {
      console.warn(`Component ${exportedComponent.displayName || exportedComponent.name} is not linked to a shape.`);
      return;
    }
    shape = exportedComponent.shape;
  }

  if (!shapeToComponents.has(shape)) {
    shapeToComponents.set(shape, new CoreSet<any>());
  }

  shapeToComponents.get(shape).add(exportedComponent);
}

function registerPackageInTree(moduleName, packageExports) {
  //prepare name for global tree reference
  let moduleTreeKey = moduleName.replace(/-/g, '_');
  //if something with this name already registered in the global tree
  if (moduleTreeKey in lincd._modules) {
    console.warn('A module with the name ' + moduleName + ' has already been registered.');
  } else {
    //initiate an empty object for this module in the global tree
    lincd._modules[moduleTreeKey] = packageExports || {};
  }
  return lincd._modules[moduleTreeKey];
}

function getPackageExport(moduleName, exportName) {
  return lincd._modules[moduleName] ? lincd._modules[moduleName][exportName] : null;
}

function getLinkedComponentProps<ShapeType extends Shape, P>(
  props: LinkedComponentProps<ShapeType> & P,
  shapeClass,
): LinkedComponentProps<ShapeType> & P {
  let newProps = {...props};

  //set the sourceShape from the source
  if (props.source && !props.sourceShape) {
    //for which we create a new instance of the given shapeClass, which is the same as ShapeType (shapeClass is a runtime variable, ShapeType is used for the typing system)
    newProps.sourceShape = new shapeClass(props.source);
  }
  //set the source from the sourceShape
  if (props.sourceShape && !props.source) {
    newProps.source = newProps.sourceShape.node;
  }

  if (!props.sourceShape && !props.source) {
    throw new Error(
      "Please provide either the source or sourceShape property. 'source' should be a Node or 'sourceShape' should be a Shape.",
    );
  }
  return newProps;
}

export function initTree() {
  let globalObject = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : undefined;
  if ('lincd' in globalObject) {
    throw new Error('Multiple versions of LINCD are loaded');
  } else {
    globalObject['lincd'] = {_modules: {}};
  }
  // if (typeof window !== 'undefined') {
  //   if (typeof window['lincd'] === 'undefined') {
  //     window['lincd'] = {_modules: {}};
  //   }
  // } else if (typeof global !== 'undefined') {
  //   if (typeof global['lincd'] === 'undefined') {
  //     global['lincd'] = {_modules: {}};
  //   }
  //   global['lincd'] = {_modules: {}};
  // }
}

function bindComponentToData<P, ShapeType extends Shape>(source: Node | Shape): BoundComponentFactory<P, ShapeType> {
  return {
    _comp: this,
    _create: (propertyShapes) => {
      let boundComponent: LinkedFunctionalComponent<P, ShapeType> = (props) => {
        //TODO: use propertyShapes for RDFa

        //add this result as the source of the bound child component
        let newProps = {...props};
        if (source instanceof Shape) {
          newProps['sourceShape'] = source;
        } else if (source instanceof Node) {
          newProps['source'] = source;
        } else {
          console.warn('Invalid accessor result. Should return a Node or a Shape instance');
        }
        //render the child component (which is 'this')
        return React.createElement(this, newProps);
      };
      return boundComponent;
    },
  };
}

//when this file is used, make sure the tree is initialized
initTree();
