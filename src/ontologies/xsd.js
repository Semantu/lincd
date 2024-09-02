"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xsd = exports._ontologyResource = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var models_js_1 = require("../models.js");
var Prefix_js_1 = require("../utils/Prefix.js");
var base = 'http://www.w3.org/2001/XMLSchema#';
exports._ontologyResource = models_js_1.NamedNode.getOrCreate(base);
Prefix_js_1.Prefix.add('xsd', base);
var string = models_js_1.NamedNode.getOrCreate(base + 'string');
var boolean = models_js_1.NamedNode.getOrCreate(base + 'boolean');
var date = models_js_1.NamedNode.getOrCreate(base + 'date');
var integer = models_js_1.NamedNode.getOrCreate(base + 'integer');
var time = models_js_1.NamedNode.getOrCreate(base + 'time');
var duration = models_js_1.NamedNode.getOrCreate(base + 'duration');
var decimal = models_js_1.NamedNode.getOrCreate(base + 'decimal');
var gYear = models_js_1.NamedNode.getOrCreate(base + 'gYear');
var Bytes = models_js_1.NamedNode.getOrCreate(base + 'Bytes');
var long = models_js_1.NamedNode.getOrCreate(base + 'long');
//not yet required by core so why define it?
//export var boolean:NamedNode = nodes.getOrCreate(base+"boolean");
exports.xsd = {
    _ontologyResource: exports._ontologyResource,
    string: string,
    boolean: boolean,
    date: date,
    integer: integer,
    time: time,
    duration: duration,
    decimal: decimal,
    gYear: gYear,
    Bytes: Bytes,
    long: long,
};
//# sourceMappingURL=xsd.js.map