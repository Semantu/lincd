/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode} from '../models/NamedNode';
import {Prefix} from '../utils/Prefix';

var base: string = 'http://www.w3.org/ns/shacl#';
export var _ontologyResource: NamedNode = NamedNode.getOrCreate(base);
Prefix.add('shacl', base);

//add your ontology resources here
var _class: NamedNode = NamedNode.getOrCreate(base + 'class');
var datatype: NamedNode = NamedNode.getOrCreate(base + 'datatype');
var declare: NamedNode = NamedNode.getOrCreate(base + 'declare');
var _in: NamedNode = NamedNode.getOrCreate(base + 'in');
var maxCount: NamedNode = NamedNode.getOrCreate(base + 'maxCount');
var minCount: NamedNode = NamedNode.getOrCreate(base + 'minCount');
var name: NamedNode = NamedNode.getOrCreate(base + 'name');
var NodeShape: NamedNode = NamedNode.getOrCreate(base + 'NodeShape');
var optional: NamedNode = NamedNode.getOrCreate(base + 'optional');
var Parameter: NamedNode = NamedNode.getOrCreate(base + 'Parameter');
var PrefixDeclaration: NamedNode = NamedNode.getOrCreate(
	base + 'PrefixDeclaration',
);
var path: NamedNode = NamedNode.getOrCreate(base + 'path');
var property: NamedNode = NamedNode.getOrCreate(base + 'property');
var prefix: NamedNode = NamedNode.getOrCreate(base + 'prefix');
var PropertyShape: NamedNode = NamedNode.getOrCreate(base + 'PropertyShape');
var targetClass: NamedNode = NamedNode.getOrCreate(base + 'targetClass');
var targetNode: NamedNode = NamedNode.getOrCreate(base + 'targetNode');
var Shape: NamedNode = NamedNode.getOrCreate(base + 'Shape');

//make sure every node is also exported here
export const shacl = {
	class: _class,
	datatype,
	declare,
	in: _in,
	maxCount,
	minCount,
	name,
	NodeShape,
	optional,
	Parameter,
	PrefixDeclaration,
	path,
	prefix,
	property,
	PropertyShape,
	Shape,
	targetClass,
	targetNode,
};
