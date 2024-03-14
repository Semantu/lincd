/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
//import everything from each file that we want to be bundled in the stand-alone dist/lincd.js file
import * as Module from './utils/Module';
import * as models from './models';
import * as LinkedErrorLogging from './utils/LinkedErrorLogging';
import * as LinkedFileStorage from './utils/LinkedFileStorage';
import * as LinkedStorage from './utils/LinkedStorage';
import * as EventEmitter from './events/EventEmitter';
import * as NodeURIMappings from './collections/NodeURIMappings';
import * as CoreSet from './collections/CoreSet';
import * as CoreMap from './collections/CoreMap';
import * as SearchMap from './collections/SearchMap';
import * as PropertySet from './collections/NodeValuesSet';
import * as NodeMap from './collections/NodeMap';
import * as NodeSet from './collections/NodeSet';
import * as QuadArray from './collections/QuadArray';
import * as QuadMap from './collections/QuadMap';
import * as QuadSet from './collections/QuadSet';
import * as Shape from './shapes/Shape';
import * as SHACLShapes from './shapes/SHACL';
import * as ShapeSet from './collections/ShapeSet';
import * as Prefix from './utils/Prefix';
import * as Debug from './utils/Debug';
import * as URI from './utils/URI';
import * as Find from './utils/Find';
import * as Order from './utils/Order';
import * as NQuads from './utils/NQuads';
import * as LinkedComponentClass from './utils/LinkedComponentClass';
import * as ForwardReasoning from './utils/ForwardReasoning';
import * as NameSpace from './utils/NameSpace';
import * as Hooks from './utils/Hooks';
import * as ShapeClass from './utils/ShapeClass';
import * as ShapeDecorators from './utils/ShapeDecorators';
import * as ClassNames from './utils/ClassNames';
import * as List from './shapes/List';
import * as IGraphObject from './interfaces/IGraphObject';
import * as IGraphObjectSet from './interfaces/IGraphObjectSet';
import * as ICoreIterable from './interfaces/ICoreIterable';
import * as IFileStore from './interfaces/IFileStore';
import * as IQuadStore from './interfaces/IQuadStore';
import * as Component from './interfaces/Component';
import * as rdf from './ontologies/rdf';
import * as rdfs from './ontologies/rdfs';
import * as xsd from './ontologies/xsd';
import * as shacl from './ontologies/shacl';
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
    LinkedErrorLogging,
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
    Module,
    IGraphObject,
    IGraphObjectSet,
    ICoreIterable,
    IFileStore,
    IQuadStore,
    Component,
    LinkedComponentClass,
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
