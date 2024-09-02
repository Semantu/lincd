"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rdf = exports._ontologyResource = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var models_js_1 = require("../models.js");
var Prefix_js_1 = require("../utils/Prefix.js");
var base = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
exports._ontologyResource = models_js_1.NamedNode.getOrCreate(base);
Prefix_js_1.Prefix.add('rdf', base);
var langString = models_js_1.NamedNode.getOrCreate(base + 'langString');
var type = models_js_1.NamedNode.getOrCreate(base + 'type');
var Property = models_js_1.NamedNode.getOrCreate(base + 'Property');
var List = models_js_1.NamedNode.getOrCreate(base + 'List');
var rest = models_js_1.NamedNode.getOrCreate(base + 'rest');
var first = models_js_1.NamedNode.getOrCreate(base + 'first');
var nil = models_js_1.NamedNode.getOrCreate(base + 'nil');
exports.rdf = {
    _ontologyResource: exports._ontologyResource,
    langString: langString,
    type: type,
    Property: Property,
    List: List,
    rest: rest,
    first: first,
    nil: nil,
};
//# sourceMappingURL=rdf.js.map