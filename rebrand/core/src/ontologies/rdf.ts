/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NodeReferenceValue} from '../utils/NodeReference.js';
import {Prefix} from '../utils/Prefix.js';

const base = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
export const ns = (term: string): NodeReferenceValue => ({id: base + term});

export const _ontologyResource = ns('');
Prefix.add('rdf', base);

const langString = ns('langString');
const type = ns('type');
const Property = ns('Property');
const List = ns('List');
const rest = ns('rest');
const first = ns('first');
const nil = ns('nil');

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
