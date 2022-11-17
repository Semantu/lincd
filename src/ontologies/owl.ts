/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode} from '../models';
import {Prefix} from '../utils/Prefix';

//Important note: the actual ontology node is WITHOUT HASH, because in the ontology itself, that is how the node is defined
//(other than RDF and RDFS who DO define their URL INCLUDING HASH as ontologies)
//so here we make sure of that, by adding the hash after creating the ontology node
var base: string = 'http://www.w3.org/2002/07/owl';
export var _ontologyResource: NamedNode = NamedNode.getOrCreate(base);
base += '#';
Prefix.add('owl', base);

var ObjectProperty: NamedNode = NamedNode.getOrCreate(base + 'ObjectProperty');
var DataProperty: NamedNode = NamedNode.getOrCreate(base + 'DataProperty');

export const owl = {
	_ontologyResource,
  ObjectProperty,
  DataProperty
};
