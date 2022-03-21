/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {linkedModule} from './LINCD';

export const nextTick = require('next-tick');

//some interfaces also need to be exported manually here because no other code reached from index requires them
export * from './models/Node';
export * from './interfaces/IGraphObject';
export * from './interfaces/IGraphObjectSet';
export * from './interfaces/ICoreIterable';
export * from './events/EventEmitter';
export * from './collections/BlankNodeMap';
export * from './collections/CoreSet';
export * from './collections/CoreMap';
export * from './collections/SearchMap';
export * from './collections/PropertySet';
export * from './collections/NodeMap';
export * from './collections/NodeSet';
export * from './collections/QuadArray';
export * from './collections/QuadMap';
export * from './collections/QuadSet';
export * from './models/BlankNode';
export * from './models/Graph';
export * from './models/Literal';
export * from './models/Quad';
export * from './models/NamedNode';
export * from './models/Component';
export {defaultGraph} from './models/DefaultGraph';
export * from './ontologies/shacl';
export * from './collections/ShapeSet';
export * from './utils/Debug';
export * from './utils/URI';
export * from './utils/Find';
export * from './utils/Order';
export * from './utils/Prefix';
export * from './utils/NQuads';
export * from './utils/ShapeDecorators';
export * from './shapes/Shape';
export * from './shapes/NodeShape';
export * from './shapes/PropertyShape';
export * from './shapes/ReactComponent';
export * from './shapes/SHACL_Shape';
export * from './shapes/List';
export * from './LINCD';

import * as Node from './models/Node';
import * as EventEmitter from './events/EventEmitter';
import * as BlankNodeMap from './collections/BlankNodeMap';
import * as CoreSet from './collections/CoreSet';
import * as CoreMap from './collections/CoreMap';
import * as SearchMap from './collections/SearchMap';
import * as PropertySet from './collections/PropertySet';
import * as NodeMap from './collections/NodeMap';
import * as NodeSet from './collections/NodeSet';
import * as QuadArray from './collections/QuadArray';
import * as QuadMap from './collections/QuadMap';
import * as QuadSet from './collections/QuadSet';
import * as BlankNode from './models/BlankNode';
import * as Graph from './models/Graph';
import * as Literal from './models/Literal';
import * as Quad from './models/Quad';
import * as NamedNode from './models/NamedNode';
import * as Component from './models/Component';
import * as Shape from './shapes/Shape';
import * as NodeShape from './shapes/NodeShape';
import * as PropertyShape from './shapes/PropertyShape';
import {defaultGraph} from './models/DefaultGraph';
import * as ShapeSet from './collections/ShapeSet';
import * as Prefix from './utils/Prefix';
import * as Debug from './utils/Debug';
import * as URI from './utils/URI';
import * as Find from './utils/Find';
import * as Order from './utils/Order';
import * as NQuads from './utils/NQuads';
import * as ReactComponent from './shapes/ReactComponent';
import * as ShapeDecorators from './utils/ShapeDecorators';
import * as rdf from './ontologies/rdf';
import * as rdfs from './ontologies/rdfs';
import * as shacl from './ontologies/shacl';
import * as xsd from './ontologies/xsd';
import * as List from './shapes/List';
import * as LINCD from './LINCD';

export const {linkedComponent, linkedShape} = linkedModule('lincd');

declare var window;
declare var global;

//we do not export all the classes directly, because we don't want people to import {NamedNode} from '@dacore/core' for example
//because these sort of imports do not work well with tree shaking
//instead we export all classes here as _moduleExports for internal exposure (and in-browser cross module availability) of the available classes

let ownClasses = {
	Node,
	EventEmitter,
	BlankNodeMap,
	CoreSet,
	CoreMap,
	SearchMap,
	PropertySet,
	NodeMap,
	NodeSet,
	QuadArray,
	QuadMap,
	QuadSet,
	BlankNode,
	Graph,
	Literal,
	Quad,
	NamedNode,
	Shape,
	NodeShape,
	ShapeSet,
	PropertyShape,
	Debug,
	List,
	URI,
	// shacl,
	// rdf,
	// xsd,
	// rdfs,
	Find,
	Order,
	Prefix,
	NQuads,
	Boolean,
	ShapeDecorators,
	ReactComponent,
	Component,
	LINCD,
	defaultGraph,
};
//register the library globally and make all classes available directly from it
var lincdExport = {};
for (let key in ownClasses) {
	let exportedClass = ownClasses[key];
	for (let key2 in exportedClass) {
		lincdExport[key2] = exportedClass[key2];
	}
}
if (typeof window !== 'undefined') {
	window['lincd'] = lincdExport;
	window['lincd']._modules = {};
} else if (typeof global !== 'undefined') {
	global['lincd'] = lincdExport;
	global['lincd']._modules = {};
}
