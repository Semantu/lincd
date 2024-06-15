"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rdfs = exports.subPropertyOf = exports._ontologyResource = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var models_js_1 = require("../models.js");
var Prefix_js_1 = require("../utils/Prefix.js");
var base = 'http://www.w3.org/2000/01/rdf-schema#';
exports._ontologyResource = models_js_1.NamedNode.getOrCreate(base);
Prefix_js_1.Prefix.add('rdfs', base);
exports.subPropertyOf = models_js_1.NamedNode.getOrCreate(base + 'subPropertyOf');
var subClassOf = models_js_1.NamedNode.getOrCreate(base + 'subClassOf');
var range = models_js_1.NamedNode.getOrCreate(base + 'range');
var isDefinedBy = models_js_1.NamedNode.getOrCreate(base + 'isDefinedBy');
var label = models_js_1.NamedNode.getOrCreate(base + 'label');
var Literal = models_js_1.NamedNode.getOrCreate(base + 'Literal');
var Datatype = models_js_1.NamedNode.getOrCreate(base + 'Datatype');
var Class = models_js_1.NamedNode.getOrCreate(base + 'Class');
var Resource = models_js_1.NamedNode.getOrCreate(base + 'Resource');
exports.rdfs = {
    _ontologyResource: exports._ontologyResource,
    subPropertyOf: exports.subPropertyOf,
    subClassOf: subClassOf,
    range: range,
    isDefinedBy: isDefinedBy,
    label: label,
    Literal: Literal,
    Datatype: Datatype,
    Class: Class,
    Resource: Resource,
};
//# sourceMappingURL=rdfs.js.map