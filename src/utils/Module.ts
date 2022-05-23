/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode} from '../models';
import {registerComponent} from '../models/Component';
import {Shape} from '../shapes/Shape';
import {NodeShape} from '../shapes/NodeShape';
import {Prefix} from './Prefix';

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
	let linkedComponent = function(shape: typeof Shape) {
		return (constructor) => {
			//add the component class of this module to the global tree
			registerInTree(constructor);

			//link the shape
			constructor.shape = shape;

			//register the component and its shape
			registerComponent(constructor);

			//return the original class without modifications
			return constructor;
		};
	};

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
	 * @param nameSpace the base URI of the ontology
	 * @param prefixAndFileName the file name MUST match the prefix for this ontology
	 * @param exports all exports of the file, simply provide "this" as value!
	 */
	let linkedOntology = function(
		exports,
		nameSpace: (term: string) => NamedNode,
		prefixAndFileName: string,
		loadData?,
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
	};
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
