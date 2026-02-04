/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NodeReferenceValue} from '../utils/NodeReference.js';
import {Prefix} from '../utils/Prefix.js';

const base = 'http://www.w3.org/2001/XMLSchema#';
export const ns = (term: string): NodeReferenceValue => ({id: base + term});

export const _ontologyResource = ns('');
Prefix.add('xsd', base);

const string = ns('string');
const boolean = ns('boolean');
const date = ns('date');
const integer = ns('integer');
const float = ns('float');
const double = ns('double');
const time = ns('time');
const duration = ns('duration');
const decimal = ns('decimal');
const gYear = ns('gYear');
const Bytes = ns('Bytes');
const long = ns('long');
const dateTime = ns('dateTime');

//not yet required by core so why define it?
//export var boolean:NamedNode = nodes.getOrCreate(base+"boolean");

export const xsd = {
  _ontologyResource,
  string,
  boolean,
  date,
  integer,
  float,
  double,
  time,
  duration,
  decimal,
  gYear,
  Bytes,
  long,
  dateTime,
};
