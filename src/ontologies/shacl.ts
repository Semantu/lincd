/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode} from '../models.js';
import {Prefix} from '../utils/Prefix.js';
import { createNameSpace } from '../utils/NameSpace';

var base: string = 'http://www.w3.org/ns/shacl#';
export var _ontologyResource: NamedNode = NamedNode.getOrCreate(base);
Prefix.add('shacl', base);

export var ns = createNameSpace('http://www.w3.org/ns/shacl#');

//add your ontology nodes here
var _class: NamedNode = ns('class');
var datatype: NamedNode = ns('datatype');
var declare: NamedNode = ns('declare');
var _in: NamedNode = ns('in');
var maxCount: NamedNode = ns('maxCount');
var minCount: NamedNode = ns('minCount');
var inList: NamedNode = ns('inList');
var editInline: NamedNode =  ns('editInline');
var name: NamedNode = ns('name');
var NodeShape: NamedNode = ns('NodeShape');
var optional: NamedNode = ns('optional');
var Parameter: NamedNode = ns('Parameter');
var PrefixDeclaration: NamedNode = NamedNode.getOrCreate(
  base + 'PrefixDeclaration',
);
var path: NamedNode = ns('path');
var property: NamedNode = ns('property');
var prefix: NamedNode = ns('prefix');
var PropertyShape: NamedNode = ns('PropertyShape');
var targetClass: NamedNode = ns('targetClass');
var targetNode: NamedNode = ns('targetNode');
var node: NamedNode = ns('node');
var nodeKind: NamedNode = ns('nodeKind');
var Shape: NamedNode = ns('Shape');

var BlankNode: NamedNode = ns('BlankNode');
var IRI: NamedNode = ns('IRI');
var Literal: NamedNode = ns('Literal');
var BlankNodeOrIRI: NamedNode = ns('BlankNodeOrIRI');
var BlankNodeOrLiteral: NamedNode = NamedNode.getOrCreate(
  base + 'BlankNodeOrLiteral',
);
var IRIOrLiteral: NamedNode = ns('IRIOrLiteral');


export var languageIn: NamedNode = ns('languageIn');
export var lessThan: NamedNode = ns('lessThan');
export var lessThanOrEquals: NamedNode = ns('lessThanOrEquals');
export var maxExclusive: NamedNode = ns('maxExclusive');
export var maxInclusive: NamedNode = ns('maxInclusive');
export var maxLength: NamedNode = ns('maxLength');
export var minExclusive: NamedNode = ns('minExclusive');
export var minInclusive: NamedNode = ns('minInclusive');
export var minLength: NamedNode = ns('minLength');
export var pattern: NamedNode = ns('pattern');
export var uniqueLang: NamedNode = ns('uniqueLang');
export var ValidationReport: NamedNode = ns('ValidationReport');
export var conforms: NamedNode = ns('conforms');
export var ValidationResult: NamedNode = ns('ValidationResult');
export var focusNode: NamedNode = ns('focusNode');
export var sourceShape: NamedNode = ns('sourceShape');
export var resultSeverity: NamedNode = ns('resultSeverity');
export var resultPath: NamedNode = ns('resultPath');
export var value: NamedNode = ns('value');
export var message: NamedNode = ns('message');
export var Violation: NamedNode = ns('Violation');
export var AbstractResult: NamedNode = ns('AbstractResult');
export var sourceConstraintComponent: NamedNode = ns(
  'sourceConstraintComponent',
);
export var ClassConstraintComponent: NamedNode = ns('ClassConstraintComponent');
export var NodeConstraintComponent: NamedNode = ns('NodeConstraintComponent');
export var DatatypeConstraintComponent: NamedNode = ns(
  'DatatypeConstraintComponent',
);
export var MinLengthConstraintComponent: NamedNode = ns(
  'MinLengthConstraintComponent',
);
export var MaxLengthConstraintComponent: NamedNode = ns(
  'MaxLengthConstraintComponent',
);
export var result: NamedNode = ns('result');




//make sure every node is also exported here
export const shacl = {
  class: _class,
  datatype,
  declare,
  in: _in,
  maxCount,
  minCount,
  name,
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
  editInline,
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
