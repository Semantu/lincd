/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode,Node} from '../models';
import {Shape} from '../shapes/Shape';
import {NodeShape,PropertyShape} from '../shapes/SHACL';
import {Prefix} from './Prefix';
import {
  BoundComponentFactory,
  BoundComponentProps,
  BoundSetComponentFactory,
  Component,
  LinkableFunctionalComponent,
  LinkableFunctionalSetComponent,
  LinkedComponentInputProps,
  LinkedComponentProps,LinkedDataChildRequestFn,
  LinkedDataDeclaration,
  LinkedDataRequest,
  LinkedDataRequestFn,
  LinkedDataResponse,
  LinkedDataSetDeclaration,
  LinkedFunctionalComponent,
  LinkedFunctionalSetComponent,
  LinkedSetComponentInputProps,
  LinkedSetComponentProps,
  TransformedLinkedDataResponse,
} from '../interfaces/Component';
import {CoreSet} from '../collections/CoreSet';
import {rdf} from '../ontologies/rdf';
import {lincd as lincdOntology} from '../ontologies/lincd';
import {npm} from '../ontologies/npm';
import {createElement,default as React,useEffect,useState} from 'react';
import {rdfs} from '../ontologies/rdfs';
import {NodeSet} from '../collections/NodeSet';
import {Storage} from './Storage';
import {ShapeSet} from '../collections/ShapeSet';
import {CoreMap} from '../collections/CoreMap';
import {QuadArray} from '../collections/QuadArray';
import {URI} from './URI';
import {shacl} from '../ontologies/shacl';
// import {createRoot} from 'react-dom/client';

//global tree
declare var lincd: any;
declare var window;
declare var global;
declare var require;
declare var document;

export const LINCD_DATA_ROOT: string = 'https://data.lincd.org/';

var packageParsePromises: Map<string,Promise<any>> = new Map();
var loadedPackages: Set<NamedNode> = new Set();
let shapeToComponents: Map<typeof Shape,CoreSet<Component>> = new Map();
/**
 * a map of requested property shapes for specific nodes
 * The value is a promise if it's still loading, or true if it is fully loaded
 */
var nodeToPropertyRequests: CoreMap<Node,CoreMap<PropertyShape,true | Promise<any>>> = new CoreMap();
type ClassDecorator = <T extends {new(...args: any[]): {}}>(constructor: T) => T;

/**
 * This object, returned by [linkedPackage()](/docs/lincd.js/modules/utils_Module#linkedPackage),
 * contains the decorators to link different parts of a LINCD module.
 */
export interface LinkedPackageObject
{
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
  linkedComponent<ShapeType extends Shape,DeclaredProps = {}>(
    requiredData: typeof Shape | LinkedDataDeclaration<ShapeType>,
    // dataDeclarationOrComponent:FunctionalComponent<P,ShapeType>|LinkedDataDeclaration<ShapeType>,
    functionalComponent: LinkableFunctionalComponent<DeclaredProps,ShapeType>,
  ): LinkedFunctionalComponent<DeclaredProps,ShapeType>;

  /**
   * Links a functional Set component to its shape
   * Set components are components that show a set of data sources.
   * Once linked, the component receives an extra property "sources" which will be a ShapeSet with instance of the linked Shape.
   *
   * Note that the shape needs to be provided twice, as a type and as a value, see examples below.
   * @param shape - the Shape class that this component is linked to. Import a LINCD Shape class and use this class directly for this parameter
   * @param functionalComponent - a functional react component
   *
   * @example
   * Linked Functional Set Component example:
   * ```tsx
   * import {Person} from "../shapes/Person";
   * export const PersonView = linkedSetComponent<Person>(Person, ({sources}) => {
   *   //source is a NamedNode, and sourceShape is an instance of Person (for the same named node)
   *   let persons = sources;
   *   //get the name of the person from the graph
   *   return <div>{persons.map(person => <p>{person.name}</p>)}</div>;
   * });
   * ```
   */
  linkedSetComponent<ShapeType extends Shape,DeclaredProps = {}>(
    requiredData: typeof Shape | LinkedDataSetDeclaration<ShapeType>,
    functionalComponent: LinkableFunctionalSetComponent<DeclaredProps,ShapeType>,
  ): LinkedFunctionalSetComponent<DeclaredProps,ShapeType>;

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
  linkedComponentClass: <ShapeType extends Shape,P = {}>(shapeClass: typeof Shape) => ClassDecorator;

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
  ontologyDataPromises?: [NamedNode,Promise<any>][],
): LinkedPackageObject
{
  //handle module data and ontology data
  if (!ontologyDataPromises) ontologyDataPromises = [];

  //module is parsed when all of those are parsed
  var packageParsedPromise = Promise.all([packageDataPromise || true,...ontologyDataPromises]);
  packageParsePromises.set(packageName,packageParsedPromise);

  //if no module node was given, we will determine the URI of the module for them
  //TODO: (assuming that the module data does not include a URI already?)
  if (!packageNode)
  {
    // packageNode = NamedNode.getOrCreate(
    // 	'http://data.lincd.pro/modules/npm/' + packageName,
    // );
    packageNode = NamedNode.getOrCreate(`${LINCD_DATA_ROOT}module/${packageName}`,true);
  }

  //register the ontologies once they're parsed
  ontologyDataPromises.forEach(([ontology,ontologyPromise]) => {
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

  packageNode.set(rdf.type,lincdOntology.Module);
  packageNode.setValue(npm.packageName,packageName);

  let packageTreeObject = registerPackageInTree(packageName,packageExports);

  //#Create declarators for this module
  let registerPackageExport = function(object) {
    if (object.name in packageTreeObject)
    {
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

  let registerInPackageTree = function(exportName,exportedObject) {
    packageTreeObject[exportName] = exportedObject;
  };

  function registerPackageModule(_module): void
  {
    for (var key in _module.exports)
    {
      //if the exported object itself (usually FunctionalComponents) is not named or its name is _wrappedComponent (which ends up happening in the linkedComponent method above)
      //then we give it the same name as it's export name.
      if (!_module.exports[key].name || _module.exports[key].name === '_wrappedComponent')
      {
        Object.defineProperty(_module.exports[key],'name',{value: key});
        //manual 'hack' to set the name of the original function
        if (_module.exports[key]['original'] && !_module.exports[key]['original']['name'])
        {
          Object.defineProperty(_module.exports[key]['original'],'name',{value: key + '_implementation'});
        }
      }
      registerInPackageTree(key,_module.exports[key]);
    }
  }

  //create a declarator function which Components of this module can use register themselves and add themselves to the global tree
  let linkedUtil = function(constructor) {
    //add the component class of this module to the global tree
    registerPackageExport(constructor);

    //return the original class without modifications
    return constructor;
  };

  //method to create a linked functional component
  function linkedComponent<ShapeType extends Shape,DeclaredProps = {}>(
    requiredData: typeof Shape | LinkedDataDeclaration<ShapeType>,
    functionalComponent: LinkableFunctionalComponent<DeclaredProps,ShapeType>,
  ): LinkedFunctionalComponent<DeclaredProps,ShapeType>
  {
    //if a class that extends Shape was given
    let shapeClass: typeof Shape;
    let dataRequest: LinkedDataRequest;
    let tracedDataResponse: TransformedLinkedDataResponse;
    let dataDeclaration: LinkedDataDeclaration<ShapeType>;

    //if a Shape class was given (the actual class that extends Shape)
    if (requiredData['prototype'] instanceof Shape)
    {
      //then we just load the whole shape
      shapeClass = requiredData as typeof Shape;
      //the dataRequest array consists of a single entry: the node shape that needs to be loaded entirely
      dataRequest = shapeClass.shape ? [...shapeClass.shape.getPropertyShapes()] : [];
    }
    else
    {
      //else: requiredData is a LinkedDataDeclaration
      dataDeclaration = requiredData as LinkedDataDeclaration<ShapeType>;
      shapeClass = dataDeclaration.shape;

      //create a test instance of the shape
      let dummyInstance = createTraceShape<ShapeType>(
        shapeClass,
        null,
        functionalComponent.name || functionalComponent.toString().substring(0,80) + ' ...',
      );

      //create a dataRequest object, we will use this for requesting data from stores
      [dataRequest,tracedDataResponse] = createDataRequestObject<ShapeType>(dataDeclaration.request,dummyInstance);
    }

    //create a new functional component which wraps the original
    let _wrappedComponent: LinkedFunctionalComponent<DeclaredProps,ShapeType> = (props: DeclaredProps & LinkedComponentInputProps<ShapeType> & BoundComponentProps) => {
      //take the given props and add make sure 'of' is converted to 'source' (an instance of the shape)
      let linkedProps = getLinkedComponentProps<ShapeType,DeclaredProps>(props,shapeClass);

      //if we're not using any storage in this LINCD app, just render as usual
      if (!Storage.isInitialised())
      {
        return functionalComponent(linkedProps);
      }

      let [isLoaded,setIsLoaded] = useState<any>(undefined);
      useEffect(() => {

        let cachedRequest = getCached(linkedProps.source.node,dataRequest);
        //if this component was bound and the cache does not state all the data was loaded
        if (props.isBound && !cachedRequest)
        {
          //then we need to update that
          //(explanation: for bound components we can expect the data to be loaded.
          //the parent component will only update the cache to state that its top level request is loaded for its source
          //so here we make sure that the bound child components also updates cache for its source
          //this reduces the need for the parent component to discover the right sources of each child component when updating cache)
          updateCache(linkedProps.source.node,dataRequest,true);
        }

        //if this property is not bound (if this component is bound we can expect all properties to be loaded by the time it renders)
        if (!props.isBound)
        {
          //if these properties were requested before
          if (cachedRequest)
          {
            //if some requiredProperties are still being loaded
            //(this may happen when a different component already requested the same properties for the same source just before this sibling component)
            if (cachedRequest instanceof Promise)
            {
              //wait for that loading to be completed and then update the state
              cachedRequest.then(() => {
                setIsLoaded(true);
              });
            }
            else
            {
              //cachedRequest will be true, we can set state to reflect that
              setIsLoaded(true);
            }
          }
          else //cachedRequest is false
          {
            //if we did not request all these properties before then we continue to load them all
            //load the required PropertyShapes from storage for this specific source
            let loadPromise = Storage.loadShape(linkedProps.source,dataRequest).then((quads) => {

              //update the cached result to the actual quads instead of the promise
              //also mark any subRequests as loaded for the right nodes
              updateCache(linkedProps.source.node,dataRequest,true,tracedDataResponse);

              //set the 'isLoaded' state to true, so we don't need to even check cache again.
              setIsLoaded(true);
            });

            //save the promise result (so we don't request it again)
            updateCache(linkedProps.source.node,dataRequest,loadPromise);
          }
        }
      },[linkedProps.source.node,props.isBound]);

      //we can assume data is loaded if this is a bound component or if the isLoaded state has been set to true
      let dataIsLoaded = props.isBound || isLoaded;
      //But for the first render, when the useEffect has not run yet,
      //and no this is not a bound component (so it's a top level linkedComponent),
      //then we still need to manually check cache to avoid a rendering a temporary load icon until useEffect has run (in the case the data is already loaded)
      if (!props.isBound && typeof isLoaded === 'undefined')
      {
        //only continue to render if the result is true (all required data loaded),
        // if it's a promise we already deal with that in useEffect()
        dataIsLoaded = getCached(linkedProps.source.node,dataRequest) === true;
      }

      //if the data is loaded
      if (dataIsLoaded)
      {
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
        // if (linkedData && linkedData !== true)
        // {
        //   linkedProps.linkedData = linkedData;
        // }
        /*if (preLoaded && !linkedData)
        {
          //this is likely when a parent component already loaded all the data, but linkedData didn't get set
          if (dataDeclaration)
          {

            //TODO: we get here because a parent has already loaded the data and set the cache of this component to true
            // but then linkedData is not defined, so here we dynamically get it, though shoulnd't we use setLinkedData somewhere instead?
            //then use that now to get the requested for this instance
            // let dynamicDataResponse = dataDeclaration.request(linkedProps.source);

            //finally we replace any temporary placeholders returned by 'Component.of(..)'
            //with real components
            let dynamicDataResponse = getLinkedDataResponse(dataDeclaration.request,linkedProps.source,tracedDataResponse as TransformedLinkedDataResponse);

            linkedProps.linkedData = dynamicDataResponse;
          }
        }*/

        //every render we run the data request for this source
        //this should not be anything heavy performance wise, and this makes sure the linked data result reflects the current state of the graph
        linkedProps.linkedData = getLinkedDataResponse(dataDeclaration.request,linkedProps.source,tracedDataResponse as TransformedLinkedDataResponse);

        //render the original components with the original + generated properties
        return functionalComponent(linkedProps);
      }
      else
      {
        //render loading
        return createElement('div',null,'...');
      }
    };

    //connect the Component.of() function, which is called bindComponentToData here
    //<DeclaredProps & LinkedComponentInputProps<ShapeType>, ShapeType>
    _wrappedComponent.of = bindComponentToData.bind(_wrappedComponent,tracedDataResponse);

    //keep a copy of the original for strict checking of equality when compared to
    _wrappedComponent.original = functionalComponent;

    // _wrappedComponent.setLoaded = function(source) {
    //   updateCache(source.node,dataRequest,true);
    // }

    _wrappedComponent.dataRequest = dataRequest;

    //link the wrapped functional component to its shape
    _wrappedComponent.shape = shapeClass;
    //IF this component is a function that has a name
    if (functionalComponent.name)
    {
      //then copy the name (have to do it this way, name is protected)
      Object.defineProperty(_wrappedComponent,'name',{
        value: functionalComponent.name,
      });
      //and add the component class of this module to the global tree
      registerPackageExport(_wrappedComponent);
    }
    //NOTE: if it does NOT have a name, the developer will need to manually use registerPackageExport

    // if(process.env.NODE_ENV === 'development')
    // {
    //   dataRequest.component = _wrappedComponent;
    // }

    //register the component and its shape
    registerComponent(_wrappedComponent,shapeClass);

    return _wrappedComponent;
  }

  function linkedSetComponent<ShapeType extends Shape,DeclaredProps = {}>(
    requiredData: typeof Shape | LinkedDataSetDeclaration<ShapeType>,
    functionalComponent: LinkableFunctionalSetComponent<DeclaredProps,ShapeType>,
  ): LinkedFunctionalSetComponent<DeclaredProps,ShapeType>
  {
    let shapeClass: typeof Shape;
    let dataRequest: LinkedDataRequest;
    let tracedDataResponse: TransformedLinkedDataResponse;
    let dataDeclaration: LinkedDataSetDeclaration<ShapeType>;

    //if a Shape class was given (the actual class that extends Shape)
    if (requiredData['prototype'] instanceof Shape || requiredData === Shape)
    {
      //then we will load instances of this shape
      shapeClass = requiredData as typeof Shape;
      //and we simply request all property shapes of this shape to be loaded
      dataRequest = shapeClass.shape ? [...shapeClass.shape.getPropertyShapes()] : [];
    }
    else
    {
      //linkedDataShape is a LinkedDataSetDeclaration
      dataDeclaration = requiredData as LinkedDataSetDeclaration<ShapeType>;
      shapeClass = dataDeclaration.shape;

      //create a test instance of the shape
      let dummyInstance = createTraceShape(
        shapeClass,
        null,
        functionalComponent.name || functionalComponent.toString().substring(0,80) + ' ...',
      );

      let dummySet = new ShapeSet([dummyInstance]);

      //create a dataRequest object, we will use this for requesting data from stores
      [dataRequest,tracedDataResponse] = createDataRequestObject(dataDeclaration.request,dummySet);
    }

    //create a new functional component which wraps the original
    let _wrappedComponent: LinkedFunctionalSetComponent<DeclaredProps,ShapeType> = (props: DeclaredProps & LinkedSetComponentInputProps<ShapeType> & BoundComponentProps) => {
      //take the given props and add make sure 'of' is converted to 'source' (an instance of the shape)
      let linkedProps = getLinkedSetComponentProps<ShapeType,DeclaredProps>(props,shapeClass);

      if (!Storage.isInitialised())
      {
        return functionalComponent(linkedProps);
      }

      let [isLoaded,setIsLoaded] = useState<any>(undefined);

      useEffect(() => {
        //only if this request was not made before do we continue with making a request)
        //(if it was made, but it is still loading ,we don't have to make the request again)
        let cachedRequest = getCachedForSet(linkedProps.sources.getNodes(),dataRequest);
        //if this component was bound and the cache does not state all the data was loaded
        if (props.isBound && !cachedRequest)
        {
          //then we need to update that
          //(explanation: for bound components we can expect the data to be loaded.
          //the parent component will only update the cache to state that its top level request is loaded for its source
          //so here we make sure that the bound child components also updates cache for its source
          //this reduces the need for the parent component to discover the right sources of each child component when updating cache)
          updateCacheForSet(linkedProps.sources.getNodes(),dataRequest,true);
        }

        //if this property is not bound (if this component is bound we can expect all properties to be loaded by the time it renders)
        if (!props.isBound)
        {
          //if these properties were requested before
          if (cachedRequest)
          {
            //if some requiredProperties are still being loaded
            //(this may happen when a different component already requested the same properties for the same source just before this sibling component)
            if (cachedRequest instanceof Promise)
            {
              //wait for that loading to be completed and then update the state
              cachedRequest.then(() => {
                setIsLoaded(true);
              });
            }
            else
            {
              //cachedRequest will be true, we can set state to reflect that
              setIsLoaded(true);
            }
          }
          else //cachedRequest is false
          {
            //if we did not request all these properties before then we continue to load them all
            //load the required PropertyShapes from storage for this specific source
            let loadPromise = Storage.loadShapes(linkedProps.sources,dataRequest).then((quads) => {

              //update the cached result to the actual quads instead of the promise
              //also mark any subRequests as loaded for the right nodes
              updateCacheForSet(linkedProps.sources.getNodes(),dataRequest,true);

              //set the 'isLoaded' state to true, so we don't need to even check cache again.
              setIsLoaded(true);
            });

            //save the promise result (so we don't request it again)
            updateCacheForSet(linkedProps.sources.getNodes(),dataRequest,loadPromise);
          }
        }
        //note: this useEffect function should be re-triggered if a different set of source nodes is given
        //however the actual set could be a new one every time. For now we check the 'of' prop, but if this triggers
        //on every parent update whilst it shouldnt, we could try linkedProps.sources.map(s => s.node.value).join("")
      },[props.of,props.isBound]);

      //we can assume data is loaded if this is a bound component or if the isLoaded state has been set to true
      let dataIsLoaded = props.isBound || isLoaded;

      //But for the first render, when the useEffect has not run yet,
      //and no this is not a bound component (so it's a top level linkedComponent),
      //then we still need to manually check cache to avoid a rendering a temporary load icon until useEffect has run (in the case the data is already loaded)
      if (!props.isBound && typeof isLoaded === 'undefined')
      {
        //only continue to render if the result is true (all required data loaded),
        // if it's a promise we already deal with that in useEffect()
        dataIsLoaded = getCachedForSet(linkedProps.sources.getNodes(),dataRequest) === true;
      }
      //if the data is loaded
      if (dataIsLoaded)
      {

        //if the component used a Shape.requestSet() data declaration function
        if (dataDeclaration)
        {
          //then use that now to get the requested linkedData for this instance
          //this happens every render, but should not be anything heavy performance wise, and this makes sure the linked data result reflects the current state of the graph
          linkedProps.linkedData = getLinkedDataResponse(dataDeclaration.request,linkedProps.sources,tracedDataResponse);
        }

        //render the original components with the original + generated properties
        return functionalComponent(linkedProps);
      }
      else
      {
        //render loading
        return createElement('div',null,'...');
      }

    };

    //attach the 'of(source)' function. Here named bindSetComponentToData()
    //bindSetComponentToData<DeclaredProps & LinkedSetComponentInputProps<ShapeType>>
    _wrappedComponent.of = bindSetComponentToData.bind(_wrappedComponent,shapeClass,tracedDataResponse);
    //keep a copy of the original for strict checking of equality when compared to
    _wrappedComponent.original = functionalComponent;

    _wrappedComponent.dataRequest = dataRequest;

    //link the wrapped functional component to its shape
    _wrappedComponent.shape = shapeClass;
    //IF this component is a function that has a name
    if (functionalComponent.name)
    {
      //then copy the name (have to do it this way, name is protected)
      Object.defineProperty(_wrappedComponent,'name',{
        value: functionalComponent.name,
      });
      //and add the component class of this module to the global tree
      registerPackageExport(_wrappedComponent);
    }
    //NOTE: if it does NOT have a name, the developer will need to manually use registerPackageExport

    // if(process.env.NODE_ENV === 'development')
    // {
    //   dataRequest.component = _wrappedComponent;
    // }

    //register the component and its shape
    registerComponent(_wrappedComponent,shapeClass);

    return _wrappedComponent;
  }

  function linkedComponentClass<ShapeType extends Shape,P = {}>(shapeClass: typeof Shape): ClassDecorator
  {
    //this is for Components declared with ES Classes
    //in this case the function we're in will be used as a decorator: @linkedComponent(SomeShapeClass)
    //class decorators return a function that receives a constructor and returns a constructor.
    let decoratorFunction = function <T>(constructor) {
      //add the component class of this module to the global tree
      registerPackageExport(constructor);

      //link the shape
      constructor['shape'] = shapeClass;

      //register the component and its shape
      registerComponent(constructor as any,shapeClass);

      //return the original class without modifications
      // return constructor;

      //only here we have shapeClass as a value (not in LinkedComponentClass)
      //so here we can return a new class that extends the original class,
      //but it adds linked properties like sourceShape
      let wrappedClass = class extends constructor
      {
        constructor(props)
        {
          let linkedProps = getLinkedComponentProps<ShapeType,P>(props,shapeClass);
          super(linkedProps);
        }
      } as any as T;
      //copy the name
      Object.defineProperty(wrappedClass,'name',{value: constructor.name});
      Object.defineProperty(wrappedClass,'original',{value: constructor});
      return wrappedClass;
    };
    return decoratorFunction;
  }

  //create a declarator function which Shapes of this module can use register themselves and add themselves to the global tree
  let linkedShape = function(constructor) {
    //add the component class of this module to the global tree
    registerPackageExport(constructor);

    //register the component and its shape
    Shape.registerByType(constructor);

    //if no shape object has been attached to the constructor
    if (!Object.getOwnPropertyNames(constructor).includes('shape'))
    {
      let packageNameURI = URI.sanitize(packageName);

      //create a new node shape for this shapeClass
      let shape: NodeShape = new NodeShape(NamedNode.getOrCreate(`${LINCD_DATA_ROOT}module/${packageNameURI}/shape/${URI.sanitize(constructor.name)}`,true));
      shape.set(rdf.type,shacl.NodeShape);
      constructor.shape = shape;

      //also create a representation in the graph of the shape class itself
      let shapeClass = NamedNode.getOrCreate(`${LINCD_DATA_ROOT}module/${packageNameURI}/shapeclass/${URI.sanitize(constructor.name)}`,true);
      shapeClass.set(lincdOntology.definesShape,shape.node);
      shapeClass.set(rdf.type,lincdOntology.ShapeClass);

      //and connect it back to the module
      shapeClass.set(lincdOntology.module,packageNode);

      //if linkedProperties have already registered themselves
      if (constructor.propertyShapes)
      {
        //then add them to this node shape now
        constructor.propertyShapes.forEach((propertyShape) => {

          let uri = shape.namedNode.uri + `/${URI.sanitize(propertyShape.label)}`;

          //with react hot reload, sometimes the same code gets loaded twice
          //and a node with this URI will already exist,
          //in that case we can ignore it, since the nodeShape will already have the propertyShape
          if (!NamedNode.getNamedNode(uri))
          {
            //update the URI (by extending the URI of the shape)
            propertyShape.namedNode.uri = shape.namedNode.uri + `/${URI.sanitize(propertyShape.label)}`;

            shape.addPropertyShape(propertyShape);
          }
        });
        //and remove the temporary key
        delete constructor.propertyShapes;
      }

      //if property shapes referred to this node shape as the required shape for their values
      // (note that accessor decorators always evaluate before class decorators, hence we sometimes need to process this here, AFTER the property decorators have run)
      if (constructor.nodeShapeOf)
      {
        constructor.nodeShapeOf.forEach((propertyShape: PropertyShape) => {
          //now that we have a NodeShape for this shape class, we can set the nodeShape of the property shape
          propertyShape.nodeShape = shape;
        });
      }
    }
    else
    {
      // (constructor.shape.node as NamedNode).uri = URI;
      console.warn('This ShapeClass already has a shape: ',constructor.shape);
    }

    if (constructor.targetClass)
    {
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
  let linkedOntology = function(
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
    if (prefixAndFileName)
    {
      //run the namespace without any term name, this will give back a named node with just the namespace as URI, then get that URI to provide it as full URI
      Prefix.add(prefixAndFileName,nameSpace('').uri);
    }

    //register all the exports under the prefix. NOTE: this means the file name HAS to match the prefix
    registerInPackageTree(prefixAndFileName,exports);
    // });
  };

  //return the declarators so the module can use them
  return {
    linkedComponent,
    linkedComponentClass,
    linkedSetComponent,
    linkedShape,
    linkedUtil,
    linkedOntology,
    registerPackageExport,
    registerPackageModule,
    packageExports: packageTreeObject,
  } as LinkedPackageObject;
}

function getLinkedDataResponse<ShapeType extends Shape>(dataRequestFn: LinkedDataRequestFn<ShapeSet<ShapeType>>,source: ShapeSet<ShapeType>,tracedDataResponse: TransformedLinkedDataResponse,setLoaded?: boolean): LinkedDataResponse;
function getLinkedDataResponse<ShapeType extends Shape>(dataRequestFn: LinkedDataRequestFn<ShapeType>,source: ShapeType,tracedDataResponse: TransformedLinkedDataResponse,setLoaded?: boolean): LinkedDataResponse;
function getLinkedDataResponse<ShapeType extends Shape>(dataRequestFn: LinkedDataRequestFn<any>,source: ShapeType | ShapeSet<ShapeType>,tracedDataResponse: TransformedLinkedDataResponse,setLoaded: boolean = true): LinkedDataResponse
{

  let dataResponse: LinkedDataResponse = dataRequestFn(source);

  let replaceBoundComponent = (value,key?) => {
    //if a function was returned for this key
    if (typeof value === 'function')
    {

      //then call the function to get the actual intended value
      let evaluated = (value as Function)();
      //if a bound component was returned
      if (evaluated && evaluated._create)
      {
        //here we get the propertyShapes that were required to obtain the source
        // when we evaluated the function when the component was first initialised
        let props = key ? tracedDataResponse[key]._props : (tracedDataResponse as BoundComponentFactory)._props;
        evaluated = (evaluated as BoundComponentFactory<any,any>)._create(props);
      }
      return evaluated;
    }
    return value;
  };
  if (Array.isArray(dataResponse))
  {
    (dataResponse as any[]).forEach((value,index) => {
      dataResponse[index] = replaceBoundComponent(value,index);
    });
  }
  else if (typeof dataResponse === 'function')
  {
    dataResponse = replaceBoundComponent(dataResponse);
  }
  else
  {
    Object.getOwnPropertyNames(dataResponse).forEach((key) => {
      dataResponse[key] = replaceBoundComponent(dataResponse[key],key);
    });
  }

  return dataResponse;
}

function getCachedForSet(sources: NodeSet,dataRequest): boolean | Promise<any>
{
  let stillLoading = [];
  if (!sources.every(source => {
    let cached = getCached(source,dataRequest);
    if (!cached)
    {
      return false;
    }
    if (cached !== true)
    {
      //then it's a promise, this node is still loading
      stillLoading.push(source);
    }
    return true;
  }))
  {
    return false;
  }
  return stillLoading ? Promise.all(stillLoading) : true;
}

function getCached(source: Node,dataRequest): boolean | Promise<any>
{
  if (!nodeToPropertyRequests.has(source))
  {
    return false;
  }
  let propertiesRequested = nodeToPropertyRequests.get(source);
  //return true if every top level property request has been loaded for this source
  let stillLoading = [];
  if (!dataRequest.every(propertyRequest => {
    let propertyReqResult;
    if (Array.isArray(propertyRequest))
    {
      //the property will be the first entry, the subRequest the second, but we don't do anything with that here
      //we only check the top level, which regards this source
      propertyReqResult = propertiesRequested.get(propertyRequest[0]);
    }
    else
    {
      propertyReqResult = propertiesRequested.get(propertyRequest);
    }
    if (!propertyReqResult)
    {
      //not every propertyRequest is loaded, return false, which stops the every() loop and resolves it to false
      return false;
    }
    if (propertyReqResult !== true)
    {
      stillLoading.push(propertyReqResult);
    }
    //else if it's true, everything is loaded so far, no need to do anything
    return true;
  }))
  {
    return false;
  }
  //all propertyRequests had an entry, if some are still loading, return the promise that resolves when they're all loaded
  //else return true (everything is loaded)
  return stillLoading.length > 0 ? Promise.all(stillLoading) : true;
}

function updateCacheForSet(sources: NodeSet,request: LinkedDataRequest,requestState: true | Promise<any> = true)
{
  sources.forEach(source => {
    updateCache(source,request,requestState);
  });
}

function updateCache(source: Node,request: LinkedDataRequest,requestState: true | Promise<any> = true,tracedDataResponse?: TransformedLinkedDataResponse)
{
  if (!nodeToPropertyRequests.get(source))
  {
    nodeToPropertyRequests.set(source,new CoreMap());
  }
  let requestedProperties = nodeToPropertyRequests.get(source);

  request.map(propertyRequest => {
    if (Array.isArray(propertyRequest))
    {
      //propertyRequest is of the shape [propertyShape,subRequest]
      //we're only updating cache for the property-shapes that regard this source, so we ignore the subRequest
      //(cache for the subRequest will be set in the subComponent itself the first time useEffect is triggered and isBound=true but isLoaded=undefined, see linkedComponent)
      requestedProperties.set(propertyRequest[0],requestState);
    }
    else
    {
      //propertyRequest is a PropertyShape
      requestedProperties.set(propertyRequest,requestState);
    }
  });
  /*

  let requestCache = nodeToDataRequest.get(source);
  requestCache.set(request,requestResult);

  let updateChildCache = (value,target,key) => {
    //if a function was returned for this key
    if (typeof value === 'function')
    {

      //then call the function to get the actual intended value
      let evaluated = (value as Function)();
      //if a bound component was returned
      if (evaluated && evaluated._create)
      {
        //YOU ARE HERE: you have access to component,
        //but not to the sources!
        evaluated._setLoaded();

      }
    }
  };
  if (Array.isArray(tracedDataResponse))
  {
    (tracedDataResponse as any[]).forEach((value,index) => {
      updateChildCache(value,tracedDataResponse,index);
    });
  }
  else
  {
    Object.getOwnPropertyNames(tracedDataResponse).forEach((key) => {
      updateChildCache(tracedDataResponse[key],tracedDataResponse,key);
    });
  }*/

  /*
   //if specific properties were requested (rather than simply a shape)
   // if (request.properties) {
   //check each requested property shape
   // let {shape, properties} = request;
   request.map((propertyRequest: NodeShape | PropertyShape | [PropertyShape,SubRequest]) => {
     let subRequest: LinkedDataRequest;
     let propertyShape: PropertyShape;
     // let propertyShapes: PropertyShape[];

     //if this property request is given as an object with the following key
     //then it comes from a bound child component request, aka a sub request
     if (Array.isArray(propertyRequest))
     {
       [propertyShape,subRequest] = propertyRequest;

       //if there were more than 1 (if there is more left right now)
       // if (propertyShapes.length > 1) {
       //   console.warn('Multiple property shapes not supported yet. Taking first only');
       // }
       // propertyShape = propertyShapes[0];

       //if no property shapes were used, then the source of the child component equals the source of the component
       //so, we now update the cache for the same source for this subrequest
       if (!propertyShape)
       {
         updateCache(source,subRequest,true);
       }
       else
       {
         //for each returned value for this property path
         source.getAll(propertyShape.path).forEach((propertyValue) => {
           //update the cache to state that we have loaded the sub request for this specific node
           //and also check the subrequest recursively for any more deeply nested requests
           //but first: for subrequests we need to first make sure an entry exists in the cache for this node
           if (!nodeToDataRequest.has(propertyValue))
           {
             nodeToDataRequest.set(propertyValue,new CoreMap());
           }
           updateCache(propertyValue,subRequest,true);
         });
       }
     }
     // });
   });*/
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

//This method can be used in two ways, the first parameter must match with the type of the second,
//hence the multiple function declarations (overloads)
function createDataRequestObject<ShapeType extends Shape>(
  dataRequestFn: LinkedDataRequestFn<ShapeType>,
  instance: ShapeType & TraceShape,
): [LinkedDataRequest,TransformedLinkedDataResponse];
function createDataRequestObject<ShapeType extends Shape>(
  dataRequestFn: LinkedFunctionalComponent<ShapeType> | LinkedDataRequestFn<ShapeSet<ShapeType>>,
  instance: ShapeSet<ShapeType & TraceShape>,
): [LinkedDataRequest,TransformedLinkedDataResponse];
function createDataRequestObject<ShapeType extends Shape>(
  dataRequestFn: LinkedFunctionalComponent<ShapeType> | LinkedDataRequestFn<ShapeType> | LinkedDataRequestFn<ShapeSet<ShapeType>>,
  instance: any,
): [LinkedDataRequest,TransformedLinkedDataResponse]
{

  if ((dataRequestFn as LinkedFunctionalComponent<ShapeType>).of)
  {
    return [null,null];
  }
  //run the function that the component provided to see which properties it needs
  let dataResponse = dataRequestFn(instance);

  //for sets, we should get a set with a single item, so we can retrieve traced properties from that single item
  let traceInstance = (instance instanceof ShapeSet ? instance.first() : instance);

  //start with the requested properties, which an array of PropertyShapes
  let dataRequest: LinkedDataRequest = traceInstance.requested;

  let replaceBoundFactory = (value,target?,key?) => {
    //if a function was returned for this key
    if (typeof value === 'function')
    {
      //count the current amount of property shapes requested so far
      let previousNumPropShapes = traceInstance.requested.length;

      //then call the function to get the actual intended value
      //this will also trigger new accessors to be called & property shapes to be added to 'traceInstance.requested'
      let evaluated = (value as Function)();
      //if a bound component was returned
      if (evaluated && (evaluated as BoundComponentFactory)._create)
      {

        //retrieve and remove any propertyShape that were requested
        let appliedPropertyShapes = traceInstance.requested.splice(previousNumPropShapes);
        //store them in the value, we will need that when we actually use the nested component
        evaluated._props = appliedPropertyShapes;

        //then place back an object stating which property shapes were requested
        //and which subRequest need to be made for those as defined by the bound child component
        let subRequest: LinkedDataRequest = (evaluated as BoundComponentFactory)._comp.dataRequest;

        if ((evaluated as BoundSetComponentFactory)._childDataRequest)
        {
          // boundProperties.childRequest = (evaluated as BoundSetComponentFactory<any, any>)._childDataRequest
          subRequest = subRequest.concat((evaluated as BoundSetComponentFactory<any,any>)._childDataRequest) as LinkedDataRequest;
        }
        if (appliedPropertyShapes.length > 1)
        {
          console.warn('Using multiple property shapes for subRequests are not yet supported');
        }
        let propertyShape = appliedPropertyShapes[0];

        //add an entry for the bound property with its subRequest (the data request of the component it was bound to)
        //if a specific property shape was requested for this component (like CompA(Shape.request(shape => CompB.of(shape.subProperty))
        if (propertyShape)
        {
          //then add it as a propertyShape + subRequest
          dataRequest.push([propertyShape,subRequest]);
        }
        else
        {
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
  if (Array.isArray(dataResponse))
  {
    (dataResponse as any[]).forEach((value,index) => {
      dataResponse[index] = replaceBoundFactory(value);
    });
  }
  else if (typeof dataRequest === 'function')
  {
    dataRequest = replaceBoundFactory(dataRequest);
  }
  else
  {
    Object.getOwnPropertyNames(dataResponse).forEach((key) => {
      dataResponse[key] = replaceBoundFactory(dataResponse[key]);
    });
  }
  return [dataRequest,dataResponse as any as TransformedLinkedDataResponse];
}

interface TraceShape extends Shape
{
  // constructor(p:TestNode):TraceShape;
  requested: PropertyShape[];
  // resultOrigins:CoreMap<any,any>;
  usedAccessors: any[];
}

// function addTestDataAccessors(detectionClass,shapeClass,dummyShape):
function createTraceShape<ShapeType extends Shape>(shapeClass: typeof Shape,shapeInstance?: Shape,debugName?: string): ShapeType & TraceShape
{
  let detectionClass = class extends shapeClass implements TraceShape
  {
    requested: PropertyShape[] = [];
    // resultOrigins:CoreMap<any,any> = new CoreMap();
    usedAccessors: any[] = [];

    constructor(p: TestNode)
    {
      super(p as NamedNode);
    }
  };
  let traceShape: TraceShape;
  if (!shapeInstance)
  {
    //if not provided we create a new detectionClass instance
    let dummyNode = new TestNode();
    traceShape = new detectionClass(dummyNode);
  }
  else
  {
    //if an instance was provided
    // (this happens if a testnode generates a testnode value on demand
    // and the original shape get-accessor returns an instance of a shape of that testnode)
    //then we turn that shape instance into it's test/detection variant
    traceShape = new detectionClass(shapeInstance.namedNode as TestNode);
  }

  //here in the constructor (now that we have a 'this')
  //we will overwrite all the methods of the class we extend and that classes that that extends
  let finger = shapeClass;
  while (finger)
  {
    //check this superclass still extends Shape, otherwise break;
    if (!(finger.prototype instanceof Shape) || finger === Shape)
    {
      break;
    }

    let descriptors = Object.getOwnPropertyDescriptors(finger.prototype);

    for (var key in descriptors)
    {
      let descriptor = descriptors[key];
      if (descriptor.configurable)
      {
        //if this is a get method that used a @linkedProperty decorator
        //then it should match with a propertyShape
        let propertyShape = shapeClass['shape']
          .getPropertyShapes()
          .find((propertyShape) => propertyShape.label === key);
        if (propertyShape)
        {
          // let propertyShape:PropertyShape = descriptor.get['propertyShape'];
          let g = descriptor.get != null;
          // let s = descriptor.set != null;

          if (g)
          {
            let newDescriptor: PropertyDescriptor = {};
            newDescriptor.enumerable = descriptor.enumerable;
            newDescriptor.configurable = descriptor.configurable;

            //not sure if we can or want to?..
            // newDescriptor.value= descriptor.value;
            // newDescriptor.writable = descriptor.writable;

            newDescriptor.get = ((key: string,propertyShape: PropertyShape,descriptor: PropertyDescriptor) => {
              // console.log(debugName + ' requested get ' + key + ' - ' + propertyShape.path.value);

              //use dummyShape as 'this'
              let returnedValue = descriptor.get.call(traceShape);
              // console.log('generated result -> ',res['print'] ? res['print']() : res);
              // console.log('\tresult -> ', returnedValue && returnedValue.print ? returnedValue.print() : returnedValue);

              //if a shape was returned, make sure we trace that shape too
              if (returnedValue instanceof Shape)
              {
                returnedValue = createTraceShape(Object.getPrototypeOf(returnedValue),returnedValue);
              }

              //store which property shapes were requested in the detectionClass defined above
              traceShape.requested.push(propertyShape);
              traceShape.usedAccessors.push(descriptor.get);

              //also store which result was returned for which property shape (we need this in Component.to().. / bindComponentToData())
              // traceShape.resultOrigins.set(returnedValue,descriptor.get);
              // returnedValue['_reqPropShape'] = propertyShape;
              // returnedValue['_accessor'] = descriptor.get;

              return returnedValue;
            }).bind(detectionClass.prototype,key,propertyShape,descriptor);
            //bind this descriptor to the class that defines it
            //and bind the required arguments (which we know only now, but we need to know them when the descriptor runs, hence we bind them)

            //overwrite the get method
            Object.defineProperty(detectionClass.prototype,key,newDescriptor);
          }
        }
      }
    }
    finger = Object.getPrototypeOf(finger);
  }
  //really we return a TraceShape, but it extends the given Shape class, so we need typescript to recognise it as such
  //not sure how to do that dynamically
  return traceShape as any;
}

class TestNode extends NamedNode
{
  constructor(public property?: NamedNode)
  {
    let uri = NamedNode.createNewTempUri();
    super(uri,true);
  }

  getValue()
  {
    let label = '';
    if (this.property)
    {
      if (this.property.hasProperty(rdfs.label))
      {
        label = this.property.getValue(rdfs.label);
      }
      else
      {
        label = this.property.uri.split(/[\/#]/).pop();
      }
    }
    return label;
  }

  hasProperty(property: NamedNode)
  {
    return true;
  }

  getAll(property: NamedNode)
  {
    return new NodeSet([this.getOne(property)]) as any;
  }

  getOne(property: NamedNode): TestNode
  {
    if (!super.hasProperty(property))
    {
      this.set(property,new TestNode(property));
    }
    return super.getOne(property) as any;
  }

  //@TODO: other methods like getDeep, etc
}

function registerComponent(exportedComponent: Component,shape?: typeof Shape)
{
  if (!shape)
  {
    //warn developers against a common mistake: if no static shape is set by the Component it will inherit the one of the class it extends
    if (!exportedComponent.hasOwnProperty('shape'))
    {
      console.warn(`Component ${exportedComponent.displayName || exportedComponent.name} is not linked to a shape.`);
      return;
    }
    shape = exportedComponent.shape;
  }

  if (!shapeToComponents.has(shape))
  {
    shapeToComponents.set(shape,new CoreSet<any>());
  }

  shapeToComponents.get(shape).add(exportedComponent);
}

function registerPackageInTree(moduleName,packageExports)
{
  //prepare name for global tree reference
  let moduleTreeKey = moduleName.replace(/-/g,'_');
  //if something with this name already registered in the global tree
  if (moduleTreeKey in lincd._modules)
  {
    console.warn('A module with the name ' + moduleName + ' has already been registered.');
  }
  else
  {
    //initiate an empty object for this module in the global tree
    lincd._modules[moduleTreeKey] = packageExports || {};
  }
  return lincd._modules[moduleTreeKey];
}

function getPackageExport(moduleName,exportName)
{
  return lincd._modules[moduleName] ? lincd._modules[moduleName][exportName] : null;
}

function getSourceFromInputProps(props,shapeClass)
{
  return props.of instanceof Node ? new shapeClass(props.of) : props.of;
}

function getLinkedComponentProps<ShapeType extends Shape,P>(
  props: LinkedComponentInputProps<ShapeType> & P,
  shapeClass,
): LinkedComponentProps<ShapeType> & P
{
  let newProps = {
    ...props,
    //if a node was given, convert it to a shape instance
    source: getSourceFromInputProps(props,shapeClass),
  };

  delete newProps['of'];
  delete newProps['isBound'];
  return newProps;
}

function getLinkedSetComponentProps<ShapeType extends Shape,P>(
  props: LinkedSetComponentInputProps<ShapeType> & P,
  shapeClass,
): LinkedSetComponentProps<ShapeType> & P
{
  let newProps = {
    ...props,
    //if a NodeSet was given, convert it to a ShapeSet
    sources: props.of instanceof NodeSet ? new ShapeSet(shapeClass.getSetOf(props.of)) as ShapeSet<ShapeType> : props.of,
  };

  delete newProps['of'];
  return newProps;
}

export function initTree()
{
  let globalObject = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : undefined;
  if ('lincd' in globalObject)
  {
    throw new Error('Multiple versions of LINCD are loaded');
  }
  else
  {
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

function bindComponentToData<P,ShapeType extends Shape>(tracedDataResponse: TransformedLinkedDataResponse,source: Node | Shape): BoundComponentFactory<P,ShapeType>
{
  return {
    _comp: this,
    _create: (propertyShapes) => {
      let boundComponent: LinkedFunctionalComponent<P,ShapeType> = (props) => {
        //TODO: use propertyShapes for RDFa

        //add this result as the source of the bound child component
        let newProps = {...props};
        newProps['of'] = source as Node | ShapeType;

        //let the LinkedComponent know that it was bound,
        //that means it can expect its data to have been loaded by its parent
        newProps['isBound'] = true;

        //render the child component (which is 'this')
        return React.createElement(this,newProps);
      };
      return boundComponent;
    },
  };
}

function bindSetComponentToData<P,ShapeType extends Shape>(shapeClass: typeof Shape,tracedDataResponse: TransformedLinkedDataResponse,sources: NodeSet | ShapeSet<ShapeType>,childDataRequestFn?: LinkedDataChildRequestFn<ShapeType>): BoundSetComponentFactory<P,ShapeType>
{

  let tracedChildDataResponse: TransformedLinkedDataResponse;
  let childDataRequest: LinkedDataRequest;
  if (childDataRequestFn)
  {
    //create a test instance of the shape
    let dummyInstance = createTraceShape(
      shapeClass,
      null,
      this.name || this.toString().substring(0,80) + ' ...',
    );

    //run the function that the component provided to see which properties it needs
    if (!(childDataRequestFn as LinkedFunctionalComponent<ShapeType>).of)
    {
      [childDataRequest,tracedChildDataResponse] = createDataRequestObject(childDataRequestFn as LinkedDataRequestFn<ShapeType>,dummyInstance);
    }

  }

  return {
    _comp: this,
    _childDataRequest: childDataRequest,
    _create: (propertyShapes) => {
      let boundComponent: LinkedFunctionalSetComponent<P,ShapeType> = (props) => {
        //TODO: use propertyShapes for RDFa

        //manually transfer the value of the first parameter of Component.of() to an of prop in JSX
        let newProps = {...props};
        newProps['of'] = sources;
        newProps['isBound'] = true;

        //add childDataRequestFn as a prop called getChildLinkedData
        //so that SetComponents can retrieve linked data for their children
        //see also definition of getChildLinkedData
        if (childDataRequestFn)
        {
          let childRenderFn;
          //if a single component was given, instead of a request
          if ((childDataRequestFn as LinkedFunctionalComponent<ShapeType>).of)
          {
            //then use that component as to render the child items
            childRenderFn = childDataRequestFn;
          }
          else
          {
            //else, a request function was given,
            //for this, props.children must be single item that is a function that we can use to render the children
            if (typeof props.children === 'function')
            {
              childRenderFn = (props.children as Function);
            }
            else if (React.Children.count(props.children) == 0)
            {
              throw new Error('Invalid use of Grid. Provide fixed child components or a render function as a single child. Alternatively, return a single bound component in the child data request.');
            }
          }

          newProps['ChildComponent'] = (childProps) => {
            let newChildProps = {...childProps};//getLinkedComponentProps(childProps as any,shapeClass);
            //children are 'bound', meaning their data will always be loaded
            newChildProps['isBound'] = true;

            //automatically set a key for each child component if a source is set
            if (newChildProps.of)
            {
              newChildProps['key'] = newChildProps.of instanceof Shape ? newChildProps.of.node.toString() : newChildProps.of.toString();
            }

            //if a dataRequest was given (not a component
            if (!(childDataRequestFn as LinkedFunctionalComponent<ShapeType>).of)
            {
              //NOTE: unlike other places where we call getLinkedDataResponse, the child component is a linkedComponent, which will convert the input props ('of') to source. so, we don't want to already do that here.
              // Hence, we manually get the source from props to get the linkedDataResponse
              let source = getSourceFromInputProps(childProps,shapeClass);

              //then we resolve that and use it as linkedData for the child component
              newChildProps.linkedData = getLinkedDataResponse(childDataRequestFn as LinkedDataRequestFn<ShapeType>,source,tracedChildDataResponse as TransformedLinkedDataResponse);
            }

            return childRenderFn(newChildProps);
          };
        }
        else
        {
          //TODO: do we want to allow for setcomponents that have a child data request, but fixed children? (so not a render fn, nor no children at all + a component as request (which then truly is a child render component))
          // newProps['getChildLinkedData'] = (childItem: ShapeType) => {
          //   //call the function defined in the component that consumes/uses the SetComponent
          //   //this returns the initial linked data for this child item
          //   //replace bound component factories with real components
          //   return getLinkedDataResponse(childDataRequestFn,childItem,tracedChildDataResponse as TransformedLinkedDataResponse);
          // };

        }

        //render the child component (which is 'this')
        return React.createElement(this,newProps);
      };
      //set an identifiable name for this bound component
      Object.defineProperty(boundComponent,'name',{value: 'bound_' + this.name});
      return boundComponent;
    },
  };

}

//when this file is used, make sure the tree is initialized
initTree();
