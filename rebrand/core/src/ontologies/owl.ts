/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NodeReferenceValue} from '../utils/NodeReference.js';
import {Prefix} from '../utils/Prefix.js';

//Important note: the actual ontology node is WITHOUT HASH, because in the ontology itself, that is how the node is defined
//(other than RDF and RDFS who DO define their URL INCLUDING HASH as ontologies)
//so here we make sure of that, by adding the hash after creating the ontology node
let base = 'http://www.w3.org/2002/07/owl';
export const _ontologyResource: NodeReferenceValue = {id: base};
base += '#';
Prefix.add('owl', base);

const ObjectProperty = {id: base + 'ObjectProperty'};
const DataProperty = {id: base + 'DataProperty'};
const equivalentClass = {id: base + 'equivalentClass'};

export const owl = {
  _ontologyResource,
  ObjectProperty,
  DataProperty,
  equivalentClass,
};
