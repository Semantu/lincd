/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import * as Package from './utils/Package.js';
import * as LinkedErrorLogging from './utils/LinkedErrorLogging.js';
import * as LinkedFileStorage from './utils/LinkedFileStorage.js';
import * as LinkedStorage from './utils/LinkedStorage.js';
import * as CoreSet from './collections/CoreSet.js';
import * as CoreMap from './collections/CoreMap.js';
import * as Shape from './shapes/Shape.js';
import * as SHACLShapes from './shapes/SHACL.js';
import * as ShapeSet from './collections/ShapeSet.js';
import * as Prefix from './utils/Prefix.js';
import * as URI from './utils/URI.js';
import * as SelectQuery from './queries/SelectQuery.js';
import * as UpdateQuery from './queries/UpdateQuery.js';
import * as MutationQuery from './queries/MutationQuery.js';
import * as DeleteQuery from './queries/DeleteQuery.js';
import * as CreateQuery from './queries/CreateQuery.js';
import * as QueryParser from './queries/QueryParser.js';
import * as QueryFactory from './queries/QueryFactory.js';
import * as NameSpace from './utils/NameSpace.js';
import * as ShapeClass from './utils/ShapeClass.js';
import * as cached from './utils/cached.js';
import * as List from './shapes/List.js';
import * as ICoreIterable from './interfaces/ICoreIterable.js';
import * as IFileStore from './interfaces/IFileStore.js';
import * as IQuadStore from './interfaces/IQuadStore.js';
import * as rdf from './ontologies/rdf.js';
import * as rdfs from './ontologies/rdfs.js';
import * as xsd from './ontologies/xsd.js';
import * as shacl from './ontologies/shacl.js';
import * as lincd from './ontologies/lincd.js';
import * as owl from './ontologies/owl.js';
import * as npm from './ontologies/npm.js';
import nextTick from 'next-tick';
export {nextTick};

export function initModularApp() {
  let publicFiles = {
    Package,
    LinkedErrorLogging,
    LinkedFileStorage,
    LinkedStorage,
    CoreSet,
    CoreMap,
    Shape,
    ShapeSet,
    Prefix,
    NameSpace,
    cached,
    URI,
    ShapeClass,
    List,
    ICoreIterable,
    IFileStore,
    IQuadStore,
    SelectQuery,
    UpdateQuery,
    MutationQuery,
    DeleteQuery,
    CreateQuery,
    QueryParser,
    QueryFactory,
    SHACLShapes,
    rdf,
    rdfs,
    xsd,
    shacl,
    lincd,
    owl,
    npm,
  };
  var lincdExport = {};
  for (let fileKey in publicFiles) {
    let exportedClasses = publicFiles[fileKey];
    for (let className in exportedClasses) {
      lincdExport[className] = exportedClasses[className];
    }
  }
  if (typeof window !== 'undefined') {
    Object.assign(window['lincd'], lincdExport);
  } else if (typeof global !== 'undefined') {
    Object.assign(global['lincd'], lincdExport);
  }
}
