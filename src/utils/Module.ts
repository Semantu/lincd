/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode} from '../models';
// import {registerComponent} from '../models/Component';
import {Shape} from '../shapes/Shape';
import {NodeShape} from '../shapes/SHACL';
import {Prefix} from './Prefix';
import {LinkedComponentProps,FunctionalComponent,Component} from '../interfaces/Component';
import {CoreSet} from '../collections/CoreSet';

//global tree
declare var lincd: any;
declare var window;
declare var global;
declare var require;

var moduleParsePromises: Map<string, Promise<any>> = new Map();
var loadedModules: Set<NamedNode> = new Set();
let shapeToComponents: Map<typeof Shape, CoreSet<Component>> = new Map();

// type LinkedComponentClassDecorator<ShapeType,P> = <T extends typeof LinkedComponentClass<ShapeType,P>>(constructor:T)=>T;
type ClassDecorator = <T extends { new(...args:any[]):{}}>(constructor:T)=>T;

/**
 * This object, returned by [linkedModule()](/docs/lincd.js/modules/utils_Module#linkedmodule),
 * contains the decorators to link different parts of a LINCD module.
 */
export interface LinkedModuleObject
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
  linkedComponent:<ShapeType extends Shape, P = {}>(
    shapeClass: typeof Shape,
    functionalComponent?:
      FunctionalComponent<P,ShapeType>,
  )=> FunctionalComponent<P,ShapeType>;

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
   * import {linkedComponentClass} from "../module";
   * import {LinkedComponentClass} from "lincd/lib/utils/LinkedComponentClass";
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
  linkedComponentClass:<ShapeType extends Shape,P={}>(
    shapeClass:typeof Shape,
  )=>ClassDecorator

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
  linkedShape:<T extends typeof Shape>(constructor:T)=>T;

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
  linkedUtil:(constructor:any)=>any;

  /**
   * Used to notify LINCD.js of an ontology.
   * See also the [Ontology guides](/docs/guides/ontologies).
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
   * import {linkedOntology} from '../module';
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
  linkedOntology:(
    allFileExports,
    nameSpace: (term: string) => NamedNode,
    suggestedPrefixAndFileName: string,
    loadDataFunction?:()=>Promise<any>,
    dataSource?:string,
  )=>void;

  /**
   * Low level method used by other decorators to write to the modules' object in the LINCD tree.
   * You should typically not need this.
   * @param exportFileName - the file name that this exported object is available under. Needs to be unique across the module.
   * @param exportedObject - the exported object (the class, constant, function, etc)
   */
  registerModuleExport:(exportFileName:string,exportedObject:any)=>void;

  /**
   * A reference to the modules' object in the LINCD tree.
   * Contains all linked components of the module.
   */
  moduleExports:any;
}

// var moduleLoadPromises: Map<NamedNode, DeferredPromise> = new Map();

export function linkedModule(
	moduleName: string,
	moduleExports?: any,
	moduleResource?: NamedNode,
	moduleDataPromise?: Promise<any>,
	ontologyDataPromises?: [NamedNode, Promise<any>][],
) {
	//handle module data and ontology data
	if (!ontologyDataPromises) ontologyDataPromises = [];

	//module is parsed when all of those are parsed
	var moduleParsedPromise = Promise.all([
		moduleDataPromise || true,
		...ontologyDataPromises,
	]);

	moduleParsePromises.set(moduleName, moduleParsedPromise);

	//if no module node was given, we will determine the URI of the module for them
	//TODO: (assuming that the module data does not include a URI already?)
	if (!moduleResource) {
		moduleResource = NamedNode.getOrCreate(
			'http://data.lincd.pro/modules/npm/' + moduleName,
		);
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
	moduleParsedPromise.then(() => {
		loadedModules.add(moduleResource);
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

	//prepare name for global tree reference
	moduleName = moduleName.replace(/-/g, '_');

	//if something with this name already registered in the global tree
	if (moduleName in lincd._modules) {
		console.warn(
			'A module with the name ' + moduleName + ' has already been registered.',
		);
	} else {
		//initiate an empty object for this module in the global tree
		lincd._modules[moduleName] = moduleExports || {};

		//next we will go over each export of each file
		//and just check that the format is correct
		for (var key in moduleExports) {
			var fileExports = moduleExports[key];

			if (!fileExports) continue;

			if (typeof fileExports === 'function') {
				console.warn(
					moduleName +
						"/index.ts exports a class or function under '" +
						key +
						"'. Make sure to import * as '" +
						key +
						"' and export that from index",
				);
			}
		}
	}

	//#Create declarators for this module
	let registerInTree = function(object) {
		lincd._modules[moduleName][object.name] = object;
	};

	//create a declarator function which Components of this module can use register themselves and add themselves to the global tree
	// let linkedUtil = function () {
	//
	// 	return (constructor) => {
	// 		//add the component class of this module to the global tree
	// 		registerInTree(constructor);
	//
	// 		//return the original class without modifications
	// 		return constructor;
	// 	};
	// };

	let registerModuleExport = function(exportName, exportedObject) {
		lincd._modules[moduleName][exportName] = exportedObject;
	};

	//create a declarator function which Components of this module can use register themselves and add themselves to the global tree
	let linkedUtil = function(constructor) {
		//add the component class of this module to the global tree
		registerInTree(constructor);

		//return the original class without modifications
		return constructor;
	};

	//creates a declarator function which Components of this module can use register themselves and add themselves to the global tree
	function linkedComponent<ShapeType extends Shape, P = {}>(
		shapeClass: typeof Shape,
		functionalComponent?:
      FunctionalComponent<P,ShapeType>,
	): FunctionalComponent<P,ShapeType> {
		type FC = FunctionalComponent<P,ShapeType>;
    //create a new functional component which wraps the original
    let wrappedComponent:FC = (props: P & LinkedComponentProps<ShapeType>) => {
      //when this function is ran, we add a new property 'sourceShape'
      let linkedProps = getLinkedComponentProps<ShapeType,P>(props,shapeClass);
      //and then run the original with the transformed props
      return functionalComponent(linkedProps);
    };
    //copy the name (have to do it this way, name is protected)
    Object.defineProperty(wrappedComponent, "name", { value: functionalComponent.name });
    //keep a copy of the original for strict checking of equality when compared to
    wrappedComponent['original'] = functionalComponent;

    //link the wrapped functional component to its shape
    (wrappedComponent as FC).shape = shapeClass;
    //add the component class of this module to the global tree
    registerInTree(wrappedComponent);
    //register the component and its shape
    registerComponent(wrappedComponent as FC, shapeClass);

    return wrappedComponent;

	}

  function linkedComponentClass<ShapeType extends Shape,P={}>(
    shapeClass:typeof Shape,
  ):ClassDecorator
  {
    //this is for Components declared with ES Classes
    //in this case the function we're in will be used as a decorator: @linkedComponent(SomeShapeClass)
    //class decorators return a function that receives a constructor and returns a constructor.
    let decoratorFunction = function<T>(constructor) {

      //add the component class of this module to the global tree
      registerInTree(constructor);

      //link the shape
      constructor['shape'] = shapeClass;

      //register the component and its shape
      registerComponent(constructor as any,shapeClass);

      //return the original class without modifications
      // return constructor;

      //only here we have shapeClass as a value (not in LinkedComponentClass)
      //so here we can return a new class that extends the original class,
      //but it adds linked properties like sourceShape
      return class extends constructor {

        constructor(props) {
          let linkedProps = getLinkedComponentProps<ShapeType,P>(props,shapeClass);
          super(linkedProps);
        }
      } as any as T;

    };
    return decoratorFunction;
  }

	//create a declarator function which Shapes of this module can use register themselves and add themselves to the global tree
	let linkedShape = function(constructor) {
		//add the component class of this module to the global tree
		registerInTree(constructor);

		//register the component and its shape
		Shape.registerByType(constructor);

		// let URI = `${moduleURLBase + moduleName}/${constructor.name}Shape`;
		if (!constructor.shape) {
			// console.log('Creating shape from class decorator.');
			// let node = NamedNode.getOrCreate(URI);
			// constructor.shape = NodeShape.getOf(node);
			constructor.shape = new NodeShape();
		} else {
			// (constructor.shape.node as NamedNode).uri = URI;
		}

		(constructor.shape as NodeShape).targetClass = constructor.targetClass;

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
    dataSource?:string,
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
		registerModuleExport(prefixAndFileName, exports);
		// });
	};

	//return the declarators so the module can use them
  return {
    linkedComponent,
    linkedComponentClass,
    linkedShape,
    linkedUtil,
    linkedOntology,
    registerModuleExport,
    moduleExports: lincd._modules[moduleName],
  } as LinkedModuleObject;
}

function registerComponent(
  exportedComponent: Component,
  shape?: typeof Shape,
) {
  if (!shape) {
    //warn developers against a common mistake: if no static shape is set by the Component it will inherit the one of the class it extends
    if (!exportedComponent.hasOwnProperty('shape')) {
      console.warn(
        `Component ${exportedComponent.displayName || exportedComponent.name} is not linked to a shape.`,
      );
      return;
    }
    shape = exportedComponent.shape;
  }

  if (!shapeToComponents.has(shape)) {
    shapeToComponents.set(shape, new CoreSet<any>());
  }

  shapeToComponents.get(shape).add(exportedComponent);
}

function getLinkedComponentProps<ShapeType extends Shape,P>(props:LinkedComponentProps<ShapeType> & P,shapeClass):LinkedComponentProps<ShapeType> & P
{
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
  return newProps;
}

export function createDataPromise(dataSource) {
	require(dataSource);
}


export function initTree() {
  if (typeof window !== 'undefined') {
    if (typeof window['lincd'] === 'undefined') {
      window['lincd'] = {_modules: {}};
    }
  } else if (typeof global !== 'undefined') {
    if (typeof global['lincd'] === 'undefined') {
      global['lincd'] = {_modules: {}};
    }
    global['lincd'] = {_modules: {}};
  }
}

//when this file is used, make sure the tree is initialized
initTree();
