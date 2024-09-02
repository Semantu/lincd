"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prefix = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var CoreMap_js_1 = require("../collections/CoreMap.js");
var Prefix = /** @class */ (function () {
    function Prefix() {
    }
    Prefix.getUriToPrefixMap = function () {
        return this.uriToPrefix;
    };
    Prefix.getPrefixToUriMap = function () {
        return this.prefixToUri;
    };
    Prefix.add = function (prefix, fullURI) {
        this.uriToPrefix.set(fullURI, prefix);
        this.prefixToUri.set(prefix, fullURI);
    };
    Prefix.delete = function (prefix) {
        if (this.prefixToUri.has(prefix)) {
            var fullURI = this.getFullURI(prefix);
            this.uriToPrefix.delete(fullURI);
            this.prefixToUri.delete(prefix);
        }
    };
    Prefix.clear = function () {
        this.uriToPrefix = new CoreMap_js_1.CoreMap();
        this.prefixToUri = new CoreMap_js_1.CoreMap();
    };
    Prefix.getPrefix = function (fullURI) {
        if (this.uriToPrefix.has(fullURI)) {
            return this.uriToPrefix.get(fullURI);
        }
        var match = this.findMatch(fullURI);
        if (match.length > 0)
            return match[1];
    };
    Prefix.getFullURI = function (prefix) {
        return this.prefixToUri.get(prefix);
    };
    Prefix.findMatch = function (fullURI) {
        var e_1, _a;
        try {
            for (var _b = __values(this.uriToPrefix.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), ontologyURI = _d[0], prefix = _d[1];
                if (fullURI.substring(0, ontologyURI.length) == ontologyURI) {
                    return [ontologyURI, prefix, fullURI.substring(ontologyURI.length)];
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return [];
    };
    Prefix.toPrefixed = function (fullURI) {
        var match = this.findMatch(fullURI);
        if (match.length > 0) {
            return match[1] + ':' + fullURI.substr(match[0].length);
        }
    };
    Prefix.toPrefixedIfPossible = function (fullURI) {
        return this.toPrefixed(fullURI) || fullURI;
    };
    /**
     * Converts a prefixed URI back to its full URI
     * Will return the prefixed URI if no prefix was found
     * @param uri
     */
    Prefix.toFull = function (uri) {
        var _a = __read(uri.split(':'), 2), prefix = _a[0], rest = _a[1];
        var ontologyURI = this.getFullURI(prefix);
        if (ontologyURI) {
            return ontologyURI + rest;
        }
        throw new Error('Unknown prefix ' +
            prefix +
            '. Could not convert ' +
            uri +
            ' to a full URI');
    };
    Prefix.uriToPrefix = new CoreMap_js_1.CoreMap();
    Prefix.prefixToUri = new CoreMap_js_1.CoreMap();
    return Prefix;
}());
exports.Prefix = Prefix;
//# sourceMappingURL=Prefix.js.map