/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
//import everything from each file we want to make available to other libraries
import * as Module from './utils/Module';
import {linkedModule} from './utils/Module';
import * as models from './models';
import * as StoreController from './controllers/StoreController';
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
import * as Shape from './shapes/Shape';
import * as NodeShape from './shapes/NodeShape';
import * as PropertyShape from './shapes/PropertyShape';
import * as ShapeSet from './collections/ShapeSet';
import * as Prefix from './utils/Prefix';
import * as Debug from './utils/Debug';
import * as URI from './utils/URI';
import * as Find from './utils/Find';
import * as Order from './utils/Order';
import * as NQuads from './utils/NQuads';
import * as NameSpace from './utils/NameSpace';
import * as ReactComponent from './shapes/ReactComponent';
import * as ShapeDecorators from './utils/ShapeDecorators';
import * as List from './shapes/List';
import * as IGraphObject from './interfaces/IGraphObject';
import * as IGraphObjectSet from './interfaces/IGraphObjectSet';
import * as ICoreIterable from './interfaces/ICoreIterable';
import * as IQuadStore from './interfaces/IQuadStore';
import * as SHACL_Shape from './shapes/SHACL_Shape';

//import anything else that needs to be bundled but not available to the outside world
import * as rdf from './ontologies/rdf';
import * as rdfs from './ontologies/rdfs';
import * as xsd from './ontologies/xsd';
import * as shacl from './ontologies/shacl';

export const nextTick = require('next-tick');

export const {linkedComponent, linkedShape} = linkedModule('lincd');

//we don't want people to import {NamedNode} from '@dacore/core' for example
//because this does not work well with tree shaking
//therefor we do not export all the classes here from the index directly
//instead we export all classes here as _moduleExports for internal exposure (and in-browser cross module availability)
let publicFiles = {
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
	models,
	StoreController,
	Shape,
	NodeShape,
	ShapeSet,
	PropertyShape,
	Debug,
	NameSpace,
	List,
	URI,
	Find,
	Order,
	Prefix,
	NQuads,
	Boolean,
	ShapeDecorators,
	ReactComponent,
	Module,
	IGraphObject,
	IGraphObjectSet,
	ICoreIterable,
	IQuadStore,
	SHACL_Shape,
	rdf,
	rdfs,
	xsd,
	shacl,
};
//register the library globally and make all classes available directly from it
var lincdExport = {};
for (let key in publicFiles) {
	let exportedClasses = publicFiles[key];
	for (let key2 in exportedClasses) {
		lincdExport[key2] = exportedClasses[key2];
	}
}
if (typeof window !== 'undefined') {
	Object.assign(window['lincd'], lincdExport);
} else if (typeof global !== 'undefined') {
	Object.assign(global['lincd'], lincdExport);
}
