/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode} from '../models.js';
import {Prefix} from '../utils/Prefix.js';

var base: string = 'http://www.w3.org/2001/XMLSchema#';
export var _ontologyResource: NamedNode = NamedNode.getOrCreate(base);
Prefix.add('xsd', base);

var string: NamedNode = NamedNode.getOrCreate(base + 'string');
var boolean: NamedNode = NamedNode.getOrCreate(base + 'boolean');
var date: NamedNode = NamedNode.getOrCreate(base + 'date');
var integer: NamedNode = NamedNode.getOrCreate(base + 'integer');
var time: NamedNode = NamedNode.getOrCreate(base + 'time');
var duration: NamedNode = NamedNode.getOrCreate(base + 'duration');
var decimal: NamedNode = NamedNode.getOrCreate(base + 'decimal');
var gYear: NamedNode = NamedNode.getOrCreate(base + 'gYear');
var Bytes: NamedNode = NamedNode.getOrCreate(base + 'Bytes');
var long: NamedNode = NamedNode.getOrCreate(base + 'long');

//not yet required by core so why define it?
//export var boolean:NamedNode = nodes.getOrCreate(base+"boolean");

export const xsd = {
  _ontologyResource,
  string,
  boolean,
  date,
  integer,
  time,
  duration,
  decimal,
  gYear,
  Bytes,
  long,
};
