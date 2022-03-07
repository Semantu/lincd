/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode} from '../models/NamedNode';
import {Prefix} from '../utils/Prefix';

var base: string = 'http://www.w3.org/2000/01/rdf-schema#';
export var _ontologyResource: NamedNode = NamedNode.getOrCreate(base);
Prefix.add('rdfs', base);

export var subPropertyOf: NamedNode = NamedNode.getOrCreate(
	base + 'subPropertyOf',
);
var subClassOf: NamedNode = NamedNode.getOrCreate(base + 'subClassOf');
var label: NamedNode = NamedNode.getOrCreate(base + 'label');
var Literal: NamedNode = NamedNode.getOrCreate(base + 'Literal');
var Datatype: NamedNode = NamedNode.getOrCreate(base + 'Datatype');
var Class: NamedNode = NamedNode.getOrCreate(base + 'Class');
var Resource: NamedNode = NamedNode.getOrCreate(base + 'Resource');

export const rdfs = {
	_ontologyResource,
	subPropertyOf,
	subClassOf,
	label,
	Literal,
	Datatype,
	Class,
	Resource,
};
