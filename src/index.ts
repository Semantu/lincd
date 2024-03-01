/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
//import everything from each file that we want to be bundled in the stand-alone dist/lincd.js file
import * as Package from './utils/Package.js';
import * as models from './models.js';
import * as LinkedFileStorage from './utils/LinkedFileStorage.js';
import * as LinkedStorage from './utils/LinkedStorage.js';
import * as EventEmitter from './events/EventEmitter.js';
import * as NodeURIMappings from './collections/NodeURIMappings.js';
import * as CoreSet from './collections/CoreSet.js';
import * as CoreMap from './collections/CoreMap.js';
import * as SearchMap from './collections/SearchMap.js';
import * as PropertySet from './collections/NodeValuesSet.js';
import * as NodeMap from './collections/NodeMap.js';
import * as NodeSet from './collections/NodeSet.js';
import * as QuadArray from './collections/QuadArray.js';
import * as QuadMap from './collections/QuadMap.js';
import * as QuadSet from './collections/QuadSet.js';
import * as Shape from './shapes/Shape.js';
import * as SHACLShapes from './shapes/SHACL.js';
import * as ShapeSet from './collections/ShapeSet.js';
import * as Prefix from './utils/Prefix.js';
import * as Debug from './utils/Debug.js';
import * as URI from './utils/URI.js';
import * as Find from './utils/Find.js';
import * as Order from './utils/Order.js';
import * as NQuads from './utils/NQuads.js';
import * as LinkedQuery from './utils/LinkedQuery.js';
import * as LinkedComponent from './utils/LinkedComponent.js';
import * as LinkedComponentClass from './utils/LinkedComponentClass.js';
import * as ForwardReasoning from './utils/ForwardReasoning.js';
import * as NameSpace from './utils/NameSpace.js';
import * as Hooks from './utils/Hooks.js';
import * as ShapeClass from './utils/ShapeClass.js';
import * as ShapeDecorators from './utils/ShapeDecorators.js';
import * as ClassNames from './utils/ClassNames.js';
import * as List from './shapes/List.js';
import * as IGraphObject from './interfaces/IGraphObject.js';
import * as IGraphObjectSet from './interfaces/IGraphObjectSet.js';
import * as ICoreIterable from './interfaces/ICoreIterable.js';
import * as IFileStore from './interfaces/IFileStore.js';
import * as IQuadStore from './interfaces/IQuadStore.js';
import * as rdf from './ontologies/rdf.js';
import * as rdfs from './ontologies/rdfs.js';
import * as xsd from './ontologies/xsd.js';
import * as shacl from './ontologies/shacl.js';
import React from 'react';

export const nextTick = require('next-tick');

export function initModularApp() {
  //we don't want people to import {NamedNode} from 'lincd' for example
  //because this does not work well with tree shaking
  //therefor we do not export all the classes here from the index directly
  //instead we make all components of LINCD available through the global tree for modular apps
  let publicFiles = {
    Node,
    EventEmitter,
    NodeURIMappings,
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
    LinkedFileStorage,
    LinkedStorage,
    Shape,
    ShapeSet,
    Debug,
    NameSpace,
    List,
    ClassNames,
    URI,
    Hooks,
    ShapeClass,
    ForwardReasoning,
    Find,
    Order,
    Prefix,
    NQuads,
    Boolean,
    ShapeDecorators,
    Package,
    IGraphObject,
    IGraphObjectSet,
    ICoreIterable,
    IFileStore,
    IQuadStore,
    LinkedComponentClass,
    LinkedComponent,
    LinkedQuery,
    SHACLShapes,
    rdf,
    rdfs,
    xsd,
    shacl,
  };
  //register the library in the global tree and make all classes available directly from it
  var lincdExport = {};
  for (let fileKey in publicFiles) {
    let exportedClasses = publicFiles[fileKey];
    for (let className in exportedClasses) {
      lincdExport[className] = exportedClasses[className];
    }
  }
  //add all the exports to the global LINCD object
  if (typeof window !== 'undefined') {
    Object.assign(window['lincd'], lincdExport);
  } else if (typeof global !== 'undefined') {
    Object.assign(global['lincd'], lincdExport);
  }

  //modular apps will expect React to be available as a global variable
  //therefor when enabling modular apps, lincd makes its own React version available through window
  window['React'] = React;
}
