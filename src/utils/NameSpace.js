"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNameSpace = void 0;
var models_js_1 = require("../models.js");
var createNameSpace = function (nameSpace) {
    return function (term) { return models_js_1.NamedNode.getOrCreate(nameSpace + term); };
};
exports.createNameSpace = createNameSpace;
//# sourceMappingURL=NameSpace.js.map