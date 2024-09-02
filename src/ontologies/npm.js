"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.npm = exports.ns = void 0;
var NameSpace_js_1 = require("../utils/NameSpace.js");
var Prefix_js_1 = require("../utils/Prefix.js");
var base = 'http://purl.org/on/npm/';
exports.ns = (0, NameSpace_js_1.createNameSpace)(base);
Prefix_js_1.Prefix.add('npm', base);
var packageName = (0, exports.ns)('packageName');
var version = (0, exports.ns)('version');
exports.npm = {
    version: version,
    packageName: packageName,
};
//# sourceMappingURL=npm.js.map