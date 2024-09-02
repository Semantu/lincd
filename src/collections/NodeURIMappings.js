"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeURIMappings = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var models_js_1 = require("../models.js");
var NodeMap_js_1 = require("./NodeMap.js");
var NodeSet_js_1 = require("./NodeSet.js");
//TODO: rename to something more fitting now that it also handles TMP NamedNodes
var NodeURIMappings = /** @class */ (function (_super) {
    __extends(NodeURIMappings, _super);
    function NodeURIMappings() {
        var _this = _super.apply(this, __spreadArray([], __read(arguments), false)) || this;
        _this.originalUris = new Map();
        return _this;
    }
    /**
     * Will create a blanknode the first time you give a certain URI
     * and return the same blanknode when you request it again.
     * Note that the blanknode itself will have its own local URI regardless of the give URI
     * this method allows you to parse a set of data that
     * uses a certain identifier for a certain blanknode across several places
     * and convert it to a local blanknode
     * @param {string} givenUri
     * @returns {BlankNode}
     */
    NodeURIMappings.prototype.getOrCreateBlankNode = function (givenUri) {
        //TODO: rename this method to getOrCreateBlankNode
        if (this.has(givenUri)) {
            return this.get(givenUri);
        }
        else {
            var blankNode = new models_js_1.BlankNode();
            this.set(givenUri, blankNode);
            this.originalUris.set(blankNode.uri, givenUri);
            return blankNode;
        }
    };
    NodeURIMappings.prototype.getBlankNodes = function () {
        return new NodeSet_js_1.NodeSet(this.filter(function (n) { return n instanceof models_js_1.BlankNode; }).values());
    };
    NodeURIMappings.prototype.getOrCreateNamedNode = function (uri) {
        //the temp URI's in one environment may already be used in another environment
        //so we need to check for temporary URI's and convert them to a local temporary URI
        if (uri.substring(0, models_js_1.NamedNode.TEMP_URI_BASE.length) ==
            models_js_1.NamedNode.TEMP_URI_BASE) {
            if (!this.has(uri)) {
                //create a new temp node that has a LOCAL temp URI
                var tmpResource = models_js_1.NamedNode.create();
                this.set(uri, tmpResource);
                this.originalUris.set(tmpResource.uri, uri);
                return tmpResource;
            }
            return this.get(uri);
        }
        return models_js_1.NamedNode.getOrCreate(uri);
    };
    NodeURIMappings.prototype.getOriginalUri = function (localUri) {
        //return the original uri, and if we dont have a mapping it will not have changed
        return this.originalUris.get(localUri) || localUri;
    };
    return NodeURIMappings;
}(NodeMap_js_1.NodeMap));
exports.NodeURIMappings = NodeURIMappings;
//# sourceMappingURL=NodeURIMappings.js.map