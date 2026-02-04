/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NodeReferenceValue} from '../utils/NodeReference.js';
import {Prefix} from '../utils/Prefix.js';

const base = 'http://www.w3.org/2000/01/rdf-schema#';
export const ns = (term: string): NodeReferenceValue => ({id: base + term});

export const _ontologyResource = ns('');
Prefix.add('rdfs', base);

const subPropertyOf = ns('subPropertyOf');
const subClassOf = ns('subClassOf');
const range = ns('range');
const isDefinedBy = ns('isDefinedBy');
const label = ns('label');
const comment = ns('comment');
const Literal = ns('Literal');
const Datatype = ns('Datatype');
const Class = ns('Class');
const Resource = ns('Resource');

export const rdfs = {
  _ontologyResource,
  subPropertyOf,
  subClassOf,
  range,
  isDefinedBy,
  label,
  comment,
  Literal,
  Datatype,
  Class,
  Resource,
};
