/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode} from '../models';
import {registerComponent} from '../models/Component';
import {Shape} from '../shapes/Shape';
import {NodeShape} from '../shapes/SHACL';
import {Prefix} from './Prefix';
import {ComponentProps, FunctionalComponent} from '../interfaces/Component';

//global tree
declare var lincd: any;
declare var window;
declare var global;

interface DeferredPromise {
	resolve?: (res: any) => void;
	reject?: () => void;
	done: boolean;
	promise: Promise<any>;
}

/**
 * This object, returned by [linkedModule()](/docs/lincd.js/modules/utils_Module#linkedmodule),
 * contains the decorators to link different parts of a LINCD module.
 */
export interface LinkedModuleObject
{
  /**
   * Links a component to its shape.
   *
   * Can be used as a function to create functional components
   * Can be also used as a class decorator for components written as classes.
   * When a component is linked, it will receive an extra property "sourceShape" which will be an instance of the linked Shape.
   *
   * Note that the shape needs to be provided twice, as a type and as a value, see examples below.
   * @param shape - the Shape class that this component is linked to. Import a LINCD Shape class and use this class directly for this parameter
   * @param functionalComponent - when this method is used for functional components, provide a functional component as second argument.
   *
   * @example
   * Linked Functional Component example:
   * ```tsx
   * import {Person} from "../shapes/Person";
   * export const PersonView = linkedComponent<Person>(Person,(source,sourceShape) => {
   *  //source is a NamedNode, whilst sourceShape is the same NamedNode but as an instance of Person
   *  let person = sourceShape
   *  return <div>Hello {person.name}</div>
   * }
   * ```
   *
   * @example
   * Class Component example:
   * ```tsx
   * @linkedComponent(Person)
   * export class PersonView extends ReactComponent<any, any, Person> {
   *   render() {
   *     let person = this.sourceShape;
   *     return <h1>Hello {person.name}</h1>;
   *   }
   * }
   * ```
   */
  linkedComponent:<ShapeType extends Shape, P = any>(
    shapeClass: typeof Shape,
    functionalComponent?:
      | typeof Shape
      | FunctionalComponent<ComponentProps<ShapeType>>,
  ) => FunctionalComponent<ComponentProps<ShapeType>> | typeof Shape;
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
  linkedShape:(constructor:typeof Shape)=>typeof Shape;
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


var moduleParsePromises: Map<string, Promise<any>> = new Map();
var loadedModules: Set<NamedNode> = new Set();

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
				continue;
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

	//create a declarator function which Components of this module can use register themselves and add themselves to the global tree
	// let linkedComponent = function (config: {shape: typeof Shape}) {
	function linkedComponent<ShapeType extends Shape, P = any>(
		shapeClass: typeof Shape,
		functionalComponent: FunctionalComponent<P, ShapeType>,
	): FunctionalComponent<ComponentProps<ShapeType> & P>;
	function linkedComponent<ShapeType extends Shape, P = any>(
		shape: typeof Shape,
	);
	function linkedComponent<ShapeType extends Shape, P = any>(
		shapeClass: typeof Shape,
		functionalComponent?:
			| typeof Shape
			| FunctionalComponent<ComponentProps<ShapeType>>,
	): FunctionalComponent<ComponentProps<ShapeType>> | typeof Shape {
		type FC = FunctionalComponent<ComponentProps<ShapeType>>;
		if (functionalComponent) {
			//create a new functional component which wraps the original
			let wrappedComponent = (props: P & ComponentProps<ShapeType>) => {
				//when this function is ran, we add a new property 'sourceShape'
				let newProps = {...props};
				if (props.source) {
					//for which we create a new instance of the given shapeClass, which is the same as ShapeType (shapeClass is a runtime variable, ShapeType is used for the typing system)
					newProps.sourceShape = new shapeClass(props.source) as ShapeType;
				}
				//and then run the original with the transformed props
				return (functionalComponent as FunctionalComponent<P>)(newProps);
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

		//this is for Components declared with ES Classes
		//in this case the function we're in will be used as a decorator: @linkedComponent(SomeShapeClass)
		//so here we get the constructor of the class when the decorator runs
		let decoratorFunction = function(constructor) {
			//add the component class of this module to the global tree
			registerInTree(constructor);

			//link the shape
			constructor.shape = shapeClass;

			//register the component and its shape
			registerComponent(constructor);

			//return the original class without modifications
			return constructor;
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
    linkedShape,
    linkedUtil,
    linkedOntology,
    registerModuleExport,
    moduleExports: lincd._modules[moduleName],
  } as LinkedModuleObject;
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

export function createDataPromise(dataSource) {
	require(dataSource);
}

//when this file is used, make sure the tree is initialized
initTree();
