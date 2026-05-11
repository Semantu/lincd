/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NodeReferenceValue} from '../utils/NodeReference.js';
import {Prefix} from '../utils/Prefix.js';
import {createNameSpace} from '../utils/NameSpace.js';

const base = 'http://www.w3.org/ns/shacl#';
export const _ontologyResource: NodeReferenceValue = {id: base};
Prefix.add('shacl', base);

export const ns = createNameSpace(base);

//add your ontology nodes here
const _class = ns('class');
const datatype = ns('datatype');
const declare = ns('declare');
const _in = ns('in');
const maxCount = ns('maxCount');
const minCount = ns('minCount');
const inList = ns('inList');
const name = ns('name');
const description = ns('description');
const NodeShape = ns('NodeShape');
const optional = ns('optional');
const Parameter = ns('Parameter');
const PrefixDeclaration = ns('PrefixDeclaration');
const path = ns('path');
const property = ns('property');
const prefix = ns('prefix');
const PropertyShape = ns('PropertyShape');
const targetClass = ns('targetClass');
const targetNode = ns('targetNode');
const node = ns('node');
const nodeKind = ns('nodeKind');
const Shape = ns('Shape');

const BlankNode = ns('BlankNode');
const IRI = ns('IRI');
const Literal = ns('Literal');
const BlankNodeOrIRI = ns('BlankNodeOrIRI');
const BlankNodeOrLiteral = ns('BlankNodeOrLiteral');
const IRIOrLiteral = ns('IRIOrLiteral');

export const languageIn = ns('languageIn');
export const lessThan = ns('lessThan');
export const lessThanOrEquals = ns('lessThanOrEquals');
export const maxExclusive = ns('maxExclusive');
export const maxInclusive = ns('maxInclusive');
export const maxLength = ns('maxLength');
export const minExclusive = ns('minExclusive');
export const minInclusive = ns('minInclusive');
export const minLength = ns('minLength');
export const pattern = ns('pattern');
export const uniqueLang = ns('uniqueLang');
export const ValidationReport = ns('ValidationReport');
export const conforms = ns('conforms');
export const ValidationResult = ns('ValidationResult');
export const focusNode = ns('focusNode');
export const sourceShape = ns('sourceShape');
export const resultSeverity = ns('resultSeverity');
export const resultPath = ns('resultPath');
export const value = ns('value');
export const message = ns('message');
export const Violation = ns('Violation');
export const AbstractResult = ns('AbstractResult');
export const sourceConstraintComponent = ns('sourceConstraintComponent');
export const ClassConstraintComponent = ns('ClassConstraintComponent');
export const NodeConstraintComponent = ns('NodeConstraintComponent');
export const DatatypeConstraintComponent = ns('DatatypeConstraintComponent');
export const MinLengthConstraintComponent = ns('MinLengthConstraintComponent');
export const MaxLengthConstraintComponent = ns('MaxLengthConstraintComponent');
export const result = ns('result');

//make sure every node is also exported here
export const shacl = {
  class: _class,
  datatype,
  declare,
  in: _in,
  maxCount,
  minCount,
  name,
  description,
  node,
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
  BlankNode,
  IRI,
  Literal,
  BlankNodeOrIRI,
  BlankNodeOrLiteral,
  IRIOrLiteral,
  nodeKind,
  inList,
  languageIn,
  lessThan,
  lessThanOrEquals,
  maxExclusive,
  maxInclusive,
  maxLength,
  minExclusive,
  minInclusive,
  minLength,
  pattern,
  uniqueLang,
  ValidationReport,
  conforms,
  ValidationResult,
  focusNode,
  sourceShape,
  resultSeverity,
  resultPath,
  value,
  message,
  Violation,
  sourceConstraintComponent,
  ClassConstraintComponent,
  NodeConstraintComponent,
  DatatypeConstraintComponent,
  MinLengthConstraintComponent,
  MaxLengthConstraintComponent,
  AbstractResult,
  result,
};
