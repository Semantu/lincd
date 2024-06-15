"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lincd = exports._self = exports.ns = void 0;
var NameSpace_js_1 = require("../utils/NameSpace.js");
var Prefix_js_1 = require("../utils/Prefix.js");
exports.ns = (0, NameSpace_js_1.createNameSpace)('https://purl.org/on/lincd/');
exports._self = (0, exports.ns)('');
Prefix_js_1.Prefix.add('lincd', exports._self.uri);
var Module = (0, exports.ns)('Module');
var ShapeClass = (0, exports.ns)('ShapeClass');
var definesShape = (0, exports.ns)('definesShape');
var module = (0, exports.ns)('module');
var usesShapeClass = (0, exports.ns)('usesShapeClass');
exports.lincd = {
    Module: Module,
    ShapeClass: ShapeClass,
    definesShape: definesShape,
    module: module,
    usesShapeClass: usesShapeClass,
};
//# sourceMappingURL=lincd.js.map