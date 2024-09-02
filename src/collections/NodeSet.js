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
exports.NodeSet = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var CoreSet_js_1 = require("./CoreSet.js");
var models_js_1 = require("../models.js");
var QuadSet_js_1 = require("./QuadSet.js");
var QuadArray_js_1 = require("./QuadArray.js");
var Debug_js_1 = require("../utils/Debug.js");
var URI_js_1 = require("../utils/URI.js");
var NodeSet = /** @class */ (function (_super) {
    __extends(NodeSet, _super);
    function NodeSet(iterable) {
        return _super.call(this, iterable) || this;
    }
    NodeSet.fromValues = function (strings) {
        return new NodeSet(strings.map(function (s) {
            return (URI_js_1.URI.isURI(s)
                ? models_js_1.NamedNode.getOrCreate(s)
                : new models_js_1.Literal(s));
        }));
    };
    //we cannot use NamedNodeSet here because of requirement loops
    NodeSet.prototype.getProperties = function (includeFromIncomingArcs) {
        var e_1, _a;
        if (includeFromIncomingArcs === void 0) { includeFromIncomingArcs = false; }
        var res = new NodeSet();
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var node = _c.value;
                res = res.concat(node.getProperties(includeFromIncomingArcs));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return res;
    };
    NodeSet.prototype.getInverseProperties = function () {
        var e_2, _a;
        var res = new NodeSet();
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var node = _c.value;
                res = res.concat(node.getInverseProperties());
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return res;
    };
    NodeSet.prototype.getOne = function (property) {
        var e_3, _a;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var node = _c.value;
                if (node.hasProperty(property)) {
                    return node.getOne(property);
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return undefined;
    };
    /**
     * Returns a NodeSet containing the merged results of node.get(property) for each node in this set
     * @param property
     * @returns {NodeSet}
     */
    NodeSet.prototype.getAll = function (property) {
        var e_4, _a;
        var res = new NodeSet();
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var node = _c.value;
                res = res.concat(node.getAll(property));
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return res;
    };
    NodeSet.prototype.getValues = function (property) {
        var e_5, _a;
        var res = [];
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var node = _c.value;
                res.push(node.getValue(property));
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return res;
    };
    /**
     * Returns an array of the URI's or literal values (for Literals) of the nodes in this set
     */
    NodeSet.prototype.getNodeValues = function () {
        var e_6, _a;
        var res = [];
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var node = _c.value;
                res.push(node.value);
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_6) throw e_6.error; }
        }
        return res;
    };
    NodeSet.prototype.getOneFromPath = function () {
        //NOTE: same implementation as in NamedNode
        var e_7, _a;
        var properties = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            properties[_i] = arguments[_i];
        }
        //we just need one, so we do a depth-first algorithm which will be more performant, so:
        //take first property
        var property = properties.shift();
        //if more properties left
        if (properties.length > 0) {
            var res;
            try {
                //check if any of the values of that property for this node
                //has a path to the rest of the properties, and if so return the found value
                for (var _b = __values(this.getAll(property)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var value = _c.value;
                    if ((res = value.getOneFromPath.apply(value, __spreadArray([], __read(properties), false)))) {
                        return res;
                    }
                }
            }
            catch (e_7_1) { e_7 = { error: e_7_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_7) throw e_7.error; }
            }
        }
        else {
            //return the first value possible
            return this.getOne(property);
        }
    };
    NodeSet.prototype.getAllFromPath = function () {
        var _a;
        var properties = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            properties[_i] = arguments[_i];
        }
        //we just need all paths, so we can do a breadth first implementation
        //take first property
        var property = properties.shift();
        if (properties.length > 0) {
            //and ask the whole set of values to return all values of the rest of the path
            return (_a = this.getAll(property)).getAllFromPath.apply(_a, __spreadArray([], __read(properties), false));
        }
        else {
            return this.getAll(property);
        }
    };
    NodeSet.prototype.getOneInverse = function (property) {
        var e_8, _a;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var node = _c.value;
                if (node.hasInverseProperty(property)) {
                    return node.getOneInverse(property);
                }
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_8) throw e_8.error; }
        }
        return undefined;
    };
    NodeSet.prototype.getAllInverse = function (property) {
        var e_9, _a;
        var res = new NodeSet();
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var node = _c.value;
                res = res.concat(node.getAllInverse(property));
            }
        }
        catch (e_9_1) { e_9 = { error: e_9_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_9) throw e_9.error; }
        }
        return res;
    };
    NodeSet.prototype.getMultipleInverse = function (properties) {
        var e_10, _a, e_11, _b;
        var res = new NodeSet();
        try {
            for (var _c = __values(this), _d = _c.next(); !_d.done; _d = _c.next()) {
                var instance = _d.value;
                try {
                    for (var properties_1 = (e_11 = void 0, __values(properties)), properties_1_1 = properties_1.next(); !properties_1_1.done; properties_1_1 = properties_1.next()) {
                        var property = properties_1_1.value;
                        res = res.concat(instance.getAllInverse(property));
                    }
                }
                catch (e_11_1) { e_11 = { error: e_11_1 }; }
                finally {
                    try {
                        if (properties_1_1 && !properties_1_1.done && (_b = properties_1.return)) _b.call(properties_1);
                    }
                    finally { if (e_11) throw e_11.error; }
                }
            }
        }
        catch (e_10_1) { e_10 = { error: e_10_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_10) throw e_10.error; }
        }
        return res;
    };
    NodeSet.prototype.getMultiple = function (properties) {
        var e_12, _a, e_13, _b;
        var res = new NodeSet();
        try {
            for (var _c = __values(this), _d = _c.next(); !_d.done; _d = _c.next()) {
                var node = _d.value;
                try {
                    for (var properties_2 = (e_13 = void 0, __values(properties)), properties_2_1 = properties_2.next(); !properties_2_1.done; properties_2_1 = properties_2.next()) {
                        var property = properties_2_1.value;
                        res = res.concat(node.getAll(property));
                    }
                }
                catch (e_13_1) { e_13 = { error: e_13_1 }; }
                finally {
                    try {
                        if (properties_2_1 && !properties_2_1.done && (_b = properties_2.return)) _b.call(properties_2);
                    }
                    finally { if (e_13) throw e_13.error; }
                }
            }
        }
        catch (e_12_1) { e_12 = { error: e_12_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_12) throw e_12.error; }
        }
        return res;
    };
    NodeSet.prototype.getDeep = function (property, maxDepth) {
        var e_14, _a, e_15, _b;
        if (maxDepth === void 0) { maxDepth = Infinity; }
        var result = new NodeSet();
        var stack = this;
        while (stack.size > 0 && maxDepth > 0) {
            var nextLevelStack = new NodeSet();
            try {
                for (var stack_1 = (e_14 = void 0, __values(stack)), stack_1_1 = stack_1.next(); !stack_1_1.done; stack_1_1 = stack_1.next()) {
                    var node = stack_1_1.value;
                    try {
                        for (var _c = (e_15 = void 0, __values(node.getAll(property))), _d = _c.next(); !_d.done; _d = _c.next()) {
                            var value = _d.value;
                            if (!result.has(value)) {
                                result.add(value);
                                nextLevelStack.add(value);
                            }
                        }
                    }
                    catch (e_15_1) { e_15 = { error: e_15_1 }; }
                    finally {
                        try {
                            if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                        }
                        finally { if (e_15) throw e_15.error; }
                    }
                }
            }
            catch (e_14_1) { e_14 = { error: e_14_1 }; }
            finally {
                try {
                    if (stack_1_1 && !stack_1_1.done && (_a = stack_1.return)) _a.call(stack_1);
                }
                finally { if (e_14) throw e_14.error; }
            }
            stack = nextLevelStack;
            maxDepth--;
        }
        return result;
    };
    NodeSet.prototype.getQuads = function (property) {
        var e_16, _a, e_17, _b;
        var res = new QuadSet_js_1.QuadSet();
        try {
            for (var _c = __values(this), _d = _c.next(); !_d.done; _d = _c.next()) {
                var node = _d.value;
                try {
                    for (var _e = (e_17 = void 0, __values(node.getQuads(property))), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var quad = _f.value;
                        res.add(quad);
                    }
                }
                catch (e_17_1) { e_17 = { error: e_17_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_17) throw e_17.error; }
                }
            }
        }
        catch (e_16_1) { e_16 = { error: e_16_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_16) throw e_16.error; }
        }
        return res;
    };
    NodeSet.prototype.getInverseQuads = function (property) {
        var e_18, _a, e_19, _b;
        var res = new QuadSet_js_1.QuadSet();
        try {
            for (var _c = __values(this), _d = _c.next(); !_d.done; _d = _c.next()) {
                var node = _d.value;
                try {
                    for (var _e = (e_19 = void 0, __values(node.getInverseQuads(property))), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var quad = _f.value;
                        res.add(quad);
                    }
                }
                catch (e_19_1) { e_19 = { error: e_19_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_19) throw e_19.error; }
                }
            }
        }
        catch (e_18_1) { e_18 = { error: e_18_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_18) throw e_18.error; }
        }
        return res;
    };
    NodeSet.prototype.getAllQuads = function (includeAsObject, includeImplicit) {
        var e_20, _a, e_21, _b;
        if (includeImplicit === void 0) { includeImplicit = false; }
        var res = new QuadArray_js_1.QuadArray();
        try {
            for (var _c = __values(this), _d = _c.next(); !_d.done; _d = _c.next()) {
                var node = _d.value;
                try {
                    for (var _e = (e_21 = void 0, __values(node.getAllQuads(includeAsObject, includeImplicit))), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var item = _f.value;
                        if (res.indexOf(item) === -1) {
                            res.push(item);
                        }
                    }
                }
                catch (e_21_1) { e_21 = { error: e_21_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_21) throw e_21.error; }
                }
                //res = res.concat(node.getAllQuads(includeAsObject));
            }
        }
        catch (e_20_1) { e_20 = { error: e_20_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_20) throw e_20.error; }
        }
        return res;
    };
    NodeSet.prototype.getAllInverseQuads = function (includeImplicit) {
        var e_22, _a, e_23, _b;
        var res = new QuadArray_js_1.QuadArray();
        try {
            for (var _c = __values(this), _d = _c.next(); !_d.done; _d = _c.next()) {
                var node = _d.value;
                try {
                    for (var _e = (e_23 = void 0, __values(node.getAllInverseQuads(includeImplicit))), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var item = _f.value;
                        if (res.indexOf(item) === -1) {
                            res.push(item);
                        }
                    }
                }
                catch (e_23_1) { e_23 = { error: e_23_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_23) throw e_23.error; }
                }
            }
        }
        catch (e_22_1) { e_22 = { error: e_22_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_22) throw e_22.error; }
        }
        return res;
    };
    NodeSet.prototype.where = function (property, value) {
        var e_24, _a;
        //TODO: test performance with
        //return this.filter(r => r.has(property,value));
        var res = this.createNew();
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var node = _c.value;
                if (node.has(property, value)) {
                    //as any apparently needed, strange that NamedNode is not seen as matching to R?
                    res.add(node);
                }
            }
        }
        catch (e_24_1) { e_24 = { error: e_24_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_24) throw e_24.error; }
        }
        return res;
    };
    NodeSet.prototype.getWhere = function (property, value) {
        var e_25, _a;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var node = _c.value;
                if (node.has(property, value)) {
                    return node;
                }
            }
        }
        catch (e_25_1) { e_25 = { error: e_25_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_25) throw e_25.error; }
        }
        return undefined;
    };
    NodeSet.prototype.setEach = function (property, value) {
        var e_26, _a;
        var res = false;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var node = _c.value;
                res = node.set(property, value) && res;
            }
        }
        catch (e_26_1) { e_26 = { error: e_26_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_26) throw e_26.error; }
        }
        return res;
    };
    NodeSet.prototype.msetEach = function (property, values) {
        var e_27, _a;
        var res = false;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var node = _c.value;
                res = node.mset(property, values) && res;
            }
        }
        catch (e_27_1) { e_27 = { error: e_27_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_27) throw e_27.error; }
        }
        return res;
    };
    NodeSet.prototype.updateEach = function (property, value) {
        var e_28, _a;
        var res = false;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var node = _c.value;
                res = node.overwrite(property, value) && res;
            }
        }
        catch (e_28_1) { e_28 = { error: e_28_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_28) throw e_28.error; }
        }
        return res;
    };
    NodeSet.prototype.mupdateEach = function (property, values) {
        var e_29, _a;
        var res = false;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var node = _c.value;
                res = node.moverwrite(property, values) && res;
            }
        }
        catch (e_29_1) { e_29 = { error: e_29_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_29) throw e_29.error; }
        }
        return res;
    };
    NodeSet.prototype.unsetEach = function (property, value) {
        var e_30, _a;
        var res = false;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var node = _c.value;
                res = node.unset(property, value) && res;
            }
        }
        catch (e_30_1) { e_30 = { error: e_30_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_30) throw e_30.error; }
        }
        return res;
    };
    NodeSet.prototype.unsetAllEach = function (property) {
        var e_31, _a;
        var res = false;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var node = _c.value;
                res = node.unsetAll(property) && res;
            }
        }
        catch (e_31_1) { e_31 = { error: e_31_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_31) throw e_31.error; }
        }
        return res;
    };
    //@TODO: remove generic isLoaded now that we have Shape loading functionality?
    //@TODO: remove promiseLoaded now that we have Shape loading functionality?
    /**
     * @deprecated
     * @param loadInverseProperties
     */
    NodeSet.prototype.promiseLoaded = function (loadInverseProperties) {
        if (loadInverseProperties === void 0) { loadInverseProperties = false; }
        return Promise.all(this.map(function (node) { return node.promiseLoaded(loadInverseProperties); }))
            .then(function (res) {
            return res.every(function (result) { return result === true; });
        })
            .catch(function () {
            return false;
        });
    };
    // perhaps we need to add a new shapeIsLoaded() method?
    /**
     * @deprecated
     * @param includingInverseProperties
     */
    NodeSet.prototype.isLoaded = function (includingInverseProperties) {
        if (includingInverseProperties === void 0) { includingInverseProperties = false; }
        return this.every(function (node) { return node.isLoaded(includingInverseProperties); });
    };
    NodeSet.prototype.toString = function () {
        return ('NodeSet {\n' +
            __spreadArray([], __read(this), false).map(function (node) { return '\t' + node.toString(); }).join(',\n') +
            '\n}');
    };
    NodeSet.prototype.print = function (includeIncomingProperties) {
        if (includeIncomingProperties === void 0) { includeIncomingProperties = true; }
        return Debug_js_1.Debug.print(this, includeIncomingProperties);
    };
    return NodeSet;
}(CoreSet_js_1.CoreSet));
exports.NodeSet = NodeSet;
//# sourceMappingURL=NodeSet.js.map