/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode} from '../models';
import {Prefix} from '../utils/Prefix';

var base: string = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
export var _ontologyResource: NamedNode = NamedNode.getOrCreate(base);
Prefix.add('rdf', base);

var langString: NamedNode = NamedNode.getOrCreate(base + 'langString');
var type: NamedNode = NamedNode.getOrCreate(base + 'type');
var Property: NamedNode = NamedNode.getOrCreate(base + 'Property');
var List: NamedNode = NamedNode.getOrCreate(base + 'List');
var rest: NamedNode = NamedNode.getOrCreate(base + 'rest');
var first: NamedNode = NamedNode.getOrCreate(base + 'first');
var nil: NamedNode = NamedNode.getOrCreate(base + 'nil');

export const rdf = {
	_ontologyResource,
	langString,
	type,
	Property,
	List,
	rest,
	first,
	nil,
};
