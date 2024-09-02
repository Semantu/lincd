"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.owl = exports._ontologyResource = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var models_js_1 = require("../models.js");
var Prefix_js_1 = require("../utils/Prefix.js");
//Important note: the actual ontology node is WITHOUT HASH, because in the ontology itself, that is how the node is defined
//(other than RDF and RDFS who DO define their URL INCLUDING HASH as ontologies)
//so here we make sure of that, by adding the hash after creating the ontology node
var base = 'http://www.w3.org/2002/07/owl';
exports._ontologyResource = models_js_1.NamedNode.getOrCreate(base);
base += '#';
Prefix_js_1.Prefix.add('owl', base);
var ObjectProperty = models_js_1.NamedNode.getOrCreate(base + 'ObjectProperty');
var DataProperty = models_js_1.NamedNode.getOrCreate(base + 'DataProperty');
var equivalentClass = models_js_1.NamedNode.getOrCreate(base + 'equivalentClass');
exports.owl = {
    _ontologyResource: exports._ontologyResource,
    ObjectProperty: ObjectProperty,
    DataProperty: DataProperty,
    equivalentClass: equivalentClass,
};
//# sourceMappingURL=owl.js.map