"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Debug = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var models_js_1 = require("../models.js");
var Debug = /** @class */ (function () {
    function Debug() {
    }
    //TODO: move stuff back into actual models, keep a general method here that handles numbers etc, so that imports of this file are minimal
    //TODO: and so that dprint is not undefined if this file is not imported from index
    Debug.print = function (node, includeInverseProperties) {
        var _this = this;
        if (includeInverseProperties === void 0) { includeInverseProperties = true; }
        if (typeof node == 'number') {
            node = models_js_1.NamedNode.TEMP_URI_BASE + node.toString();
        }
        if (typeof node == 'string') {
            var namedNode = models_js_1.NamedNode.getNamedNode(node);
            if (!namedNode)
                return node;
            node = namedNode;
        }
        if (node instanceof Set || Array.isArray(node)) {
            var r_1 = [];
            node.forEach(function (item) { return r_1.push(_this.print(item)); });
            return "Set [\n".concat(r_1.join('\n'), "\n]");
        }
        if (node instanceof models_js_1.Literal) {
            return node.toString();
        }
        if (node instanceof models_js_1.Node) {
            return node.print();
        }
    };
    return Debug;
}());
exports.Debug = Debug;
//attach dprint to global or window object
var g = typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
        ? global
        : null;
if (g) {
    g['dprint'] = function (item, includeIncomingProperties) {
        if (includeIncomingProperties === void 0) { includeIncomingProperties = true; }
        return console.log(Debug.print(item, includeIncomingProperties));
    };
}
//# sourceMappingURL=Debug.js.map