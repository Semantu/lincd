"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shacl = exports._ontologyResource = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var models_js_1 = require("../models.js");
var Prefix_js_1 = require("../utils/Prefix.js");
var base = 'http://www.w3.org/ns/shacl#';
exports._ontologyResource = models_js_1.NamedNode.getOrCreate(base);
Prefix_js_1.Prefix.add('shacl', base);
//add your ontology nodes here
var _class = models_js_1.NamedNode.getOrCreate(base + 'class');
var datatype = models_js_1.NamedNode.getOrCreate(base + 'datatype');
var declare = models_js_1.NamedNode.getOrCreate(base + 'declare');
var _in = models_js_1.NamedNode.getOrCreate(base + 'in');
var maxCount = models_js_1.NamedNode.getOrCreate(base + 'maxCount');
var minCount = models_js_1.NamedNode.getOrCreate(base + 'minCount');
var name = models_js_1.NamedNode.getOrCreate(base + 'name');
var NodeShape = models_js_1.NamedNode.getOrCreate(base + 'NodeShape');
var optional = models_js_1.NamedNode.getOrCreate(base + 'optional');
var Parameter = models_js_1.NamedNode.getOrCreate(base + 'Parameter');
var PrefixDeclaration = models_js_1.NamedNode.getOrCreate(base + 'PrefixDeclaration');
var path = models_js_1.NamedNode.getOrCreate(base + 'path');
var property = models_js_1.NamedNode.getOrCreate(base + 'property');
var prefix = models_js_1.NamedNode.getOrCreate(base + 'prefix');
var PropertyShape = models_js_1.NamedNode.getOrCreate(base + 'PropertyShape');
var targetClass = models_js_1.NamedNode.getOrCreate(base + 'targetClass');
var targetNode = models_js_1.NamedNode.getOrCreate(base + 'targetNode');
var node = models_js_1.NamedNode.getOrCreate(base + 'node');
var nodeKind = models_js_1.NamedNode.getOrCreate(base + 'nodeKind');
var Shape = models_js_1.NamedNode.getOrCreate(base + 'Shape');
var BlankNode = models_js_1.NamedNode.getOrCreate(base + 'BlankNode');
var IRI = models_js_1.NamedNode.getOrCreate(base + 'IRI');
var Literal = models_js_1.NamedNode.getOrCreate(base + 'Literal');
var BlankNodeOrIRI = models_js_1.NamedNode.getOrCreate(base + 'BlankNodeOrIRI');
var BlankNodeOrLiteral = models_js_1.NamedNode.getOrCreate(base + 'BlankNodeOrLiteral');
var IRIOrLiteral = models_js_1.NamedNode.getOrCreate(base + 'IRIOrLiteral');
//make sure every node is also exported here
exports.shacl = {
    class: _class,
    datatype: datatype,
    declare: declare,
    in: _in,
    maxCount: maxCount,
    minCount: minCount,
    name: name,
    node: node,
    NodeShape: NodeShape,
    optional: optional,
    Parameter: Parameter,
    PrefixDeclaration: PrefixDeclaration,
    path: path,
    prefix: prefix,
    property: property,
    PropertyShape: PropertyShape,
    Shape: Shape,
    targetClass: targetClass,
    targetNode: targetNode,
    BlankNode: BlankNode,
    IRI: IRI,
    Literal: Literal,
    BlankNodeOrIRI: BlankNodeOrIRI,
    BlankNodeOrLiteral: BlankNodeOrLiteral,
    IRIOrLiteral: IRIOrLiteral,
    nodeKind: nodeKind,
};
//# sourceMappingURL=shacl.js.map