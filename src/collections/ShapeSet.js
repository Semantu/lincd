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
exports.ShapeSet = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var CoreSet_js_1 = require("./CoreSet.js");
var QuadSet_js_1 = require("./QuadSet.js");
var QuadArray_js_1 = require("./QuadArray.js");
var NodeSet_js_1 = require("./NodeSet.js");
var ShapeClass_js_1 = require("../utils/ShapeClass.js");
var ShapeSet = /** @class */ (function (_super) {
    __extends(ShapeSet, _super);
    function ShapeSet(iterable) {
        return _super.call(this, iterable) || this;
    }
    ShapeSet.prototype.getLeastSpecificShape = function () {
        return (0, ShapeClass_js_1.getLeastSpecificShapeClasses)(this).shift();
    };
    /**
     * Returns true if this set contains the exact same shape OR a shape that has same node and is an instance of the same class as the given shape
     * Why? you can create two identical shapes of the same node, but they are not the same instance
     * To avoid having to account for that, by default, ShapeSets return true if the node matches and the shapes are instances of the same class
     * @param value the shape you want to check for
     * @param matchOnNodes set to false if you only want to check for true matches of identical instances
     */
    ShapeSet.prototype.has = function (value, matchOnNodes) {
        if (matchOnNodes === void 0) { matchOnNodes = true; }
        return (_super.prototype.has.call(this, value) ||
            (matchOnNodes &&
                this.some(function (shape) {
                    return shape.node === value.node &&
                        Object.getPrototypeOf(shape) === Object.getPrototypeOf(value);
                })));
    };
    ShapeSet.prototype.delete = function (value) {
        //if we can find a shape with the same node, delete that
        return _super.prototype.delete.call(this, this.find(function (shape) { return shape.node === value.node; }));
    };
    //we cannot use NamedNodeSet here because of requirement loops
    ShapeSet.prototype.getProperties = function (includeFromIncomingArcs) {
        var e_1, _a;
        if (includeFromIncomingArcs === void 0) { includeFromIncomingArcs = false; }
        var res = new NodeSet_js_1.NodeSet();
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var instance = _c.value;
                res = res.concat(instance.getProperties(includeFromIncomingArcs));
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
    ShapeSet.prototype.concat = function () {
        var e_2, _a;
        var sets = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            sets[_i] = arguments[_i];
        }
        var res = this.createNew(this);
        try {
            for (var sets_1 = __values(sets), sets_1_1 = sets_1.next(); !sets_1_1.done; sets_1_1 = sets_1.next()) {
                var set = sets_1_1.value;
                set.forEach(function (item) {
                    //for shape sets we need to manually check if an equivalent shape is already in the resulting shape set, to avoid duplicates
                    if (!res.has(item)) {
                        res.add(item);
                    }
                });
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (sets_1_1 && !sets_1_1.done && (_a = sets_1.return)) _a.call(sets_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return res;
    };
    ShapeSet.prototype.getInverseProperties = function () {
        var e_3, _a;
        var res = new NodeSet_js_1.NodeSet();
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var instance = _c.value;
                res = res.concat(instance.getInverseProperties());
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return res;
    };
    ShapeSet.prototype.getOne = function (property) {
        var e_4, _a;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var instance = _c.value;
                if (instance.hasProperty(property)) {
                    return instance.getOne(property);
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return undefined;
    };
    /**
     * Returns a NodeSet containing the merged results of node.get(property) for each node in this set
     * @param property
     * @returns {NodeSet}
     */
    ShapeSet.prototype.getAll = function (property) {
        var e_5, _a;
        var res = new NodeSet_js_1.NodeSet();
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var instance = _c.value;
                res = res.concat(instance.getAll(property));
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
    ShapeSet.prototype.getOneFromPath = function () {
        //NOTE: same implementation as in NamedNode
        var e_6, _a;
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
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_6) throw e_6.error; }
            }
        }
        else {
            //return the first value possible
            return this.getOne(property);
        }
    };
    ShapeSet.prototype.getAllFromPath = function () {
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
    ShapeSet.prototype.getOneInverse = function (property) {
        var e_7, _a;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var instance = _c.value;
                if (instance.hasInverseProperty(property)) {
                    return instance.getOneInverse(property);
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
        return undefined;
    };
    ShapeSet.prototype.getAllInverse = function (property) {
        var e_8, _a;
        var res = new NodeSet_js_1.NodeSet();
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var instance = _c.value;
                res = res.concat(instance.getAllInverse(property));
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_8) throw e_8.error; }
        }
        return res;
    };
    ShapeSet.prototype.getMultipleInverse = function (properties) {
        var e_9, _a, e_10, _b;
        var res = new NodeSet_js_1.NodeSet();
        try {
            for (var _c = __values(this), _d = _c.next(); !_d.done; _d = _c.next()) {
                var instance = _d.value;
                try {
                    for (var properties_1 = (e_10 = void 0, __values(properties)), properties_1_1 = properties_1.next(); !properties_1_1.done; properties_1_1 = properties_1.next()) {
                        var property = properties_1_1.value;
                        res = res.concat(instance.getAllInverse(property));
                    }
                }
                catch (e_10_1) { e_10 = { error: e_10_1 }; }
                finally {
                    try {
                        if (properties_1_1 && !properties_1_1.done && (_b = properties_1.return)) _b.call(properties_1);
                    }
                    finally { if (e_10) throw e_10.error; }
                }
            }
        }
        catch (e_9_1) { e_9 = { error: e_9_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_9) throw e_9.error; }
        }
        return res;
    };
    ShapeSet.prototype.getMultiple = function (properties) {
        var e_11, _a, e_12, _b;
        var res = new NodeSet_js_1.NodeSet();
        try {
            for (var _c = __values(this), _d = _c.next(); !_d.done; _d = _c.next()) {
                var instance = _d.value;
                try {
                    for (var properties_2 = (e_12 = void 0, __values(properties)), properties_2_1 = properties_2.next(); !properties_2_1.done; properties_2_1 = properties_2.next()) {
                        var property = properties_2_1.value;
                        res = res.concat(instance.getAll(property));
                    }
                }
                catch (e_12_1) { e_12 = { error: e_12_1 }; }
                finally {
                    try {
                        if (properties_2_1 && !properties_2_1.done && (_b = properties_2.return)) _b.call(properties_2);
                    }
                    finally { if (e_12) throw e_12.error; }
                }
            }
        }
        catch (e_11_1) { e_11 = { error: e_11_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_11) throw e_11.error; }
        }
        return res;
    };
    ShapeSet.prototype.getDeep = function (property, maxDepth) {
        if (maxDepth === void 0) { maxDepth = Infinity; }
        return this.getNodes().getDeep(property, maxDepth);
    };
    ShapeSet.prototype.getQuads = function (property) {
        var e_13, _a, e_14, _b;
        var res = new QuadSet_js_1.QuadSet();
        try {
            for (var _c = __values(this), _d = _c.next(); !_d.done; _d = _c.next()) {
                var instance = _d.value;
                try {
                    for (var _e = (e_14 = void 0, __values(instance.getQuads(property))), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var quad = _f.value;
                        res.add(quad);
                    }
                }
                catch (e_14_1) { e_14 = { error: e_14_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_14) throw e_14.error; }
                }
            }
        }
        catch (e_13_1) { e_13 = { error: e_13_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_13) throw e_13.error; }
        }
        return res;
    };
    ShapeSet.prototype.getInverseQuads = function (property) {
        var e_15, _a, e_16, _b;
        var res = new QuadSet_js_1.QuadSet();
        try {
            for (var _c = __values(this), _d = _c.next(); !_d.done; _d = _c.next()) {
                var instance = _d.value;
                try {
                    for (var _e = (e_16 = void 0, __values(instance.getInverseQuads(property))), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var quad = _f.value;
                        res.add(quad);
                    }
                }
                catch (e_16_1) { e_16 = { error: e_16_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_16) throw e_16.error; }
                }
            }
        }
        catch (e_15_1) { e_15 = { error: e_15_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_15) throw e_15.error; }
        }
        return res;
    };
    ShapeSet.prototype.getAllQuads = function (includeAsObject, includeImplicit) {
        var e_17, _a, e_18, _b;
        if (includeImplicit === void 0) { includeImplicit = false; }
        var res = new QuadArray_js_1.QuadArray();
        try {
            for (var _c = __values(this), _d = _c.next(); !_d.done; _d = _c.next()) {
                var instance = _d.value;
                try {
                    for (var _e = (e_18 = void 0, __values(instance.getAllQuads(includeAsObject, includeImplicit))), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var item = _f.value;
                        if (res.indexOf(item) === -1) {
                            res.push(item);
                        }
                    }
                }
                catch (e_18_1) { e_18 = { error: e_18_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_18) throw e_18.error; }
                }
                //res = res.concat(node.getAllQuads(includeAsObject));
            }
        }
        catch (e_17_1) { e_17 = { error: e_17_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_17) throw e_17.error; }
        }
        return res;
    };
    ShapeSet.prototype.getAllInverseQuads = function (includeImplicit) {
        var e_19, _a, e_20, _b;
        var res = new QuadArray_js_1.QuadArray();
        try {
            for (var _c = __values(this), _d = _c.next(); !_d.done; _d = _c.next()) {
                var node = _d.value;
                try {
                    for (var _e = (e_20 = void 0, __values(node.getAllInverseQuads(includeImplicit))), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var item = _f.value;
                        if (res.indexOf(item) === -1) {
                            res.push(item);
                        }
                    }
                }
                catch (e_20_1) { e_20 = { error: e_20_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_20) throw e_20.error; }
                }
            }
        }
        catch (e_19_1) { e_19 = { error: e_19_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_19) throw e_19.error; }
        }
        return res;
    };
    ShapeSet.prototype.where = function (property, value) {
        var e_21, _a;
        //TODO: test performance with
        //return this.filter(r => r.has(property,value));
        var res = this.createNew();
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var instance = _c.value;
                if (instance.has(property, value)) {
                    //as any apparently needed, strange that NamedNode is not seen as matching to R?
                    res.add(instance);
                }
            }
        }
        catch (e_21_1) { e_21 = { error: e_21_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_21) throw e_21.error; }
        }
        return res;
    };
    ShapeSet.prototype.getWhere = function (property, value) {
        var e_22, _a;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var instance = _c.value;
                if (instance.has(property, value)) {
                    return instance;
                }
            }
        }
        catch (e_22_1) { e_22 = { error: e_22_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_22) throw e_22.error; }
        }
        return undefined;
    };
    ShapeSet.prototype.setEach = function (property, value) {
        var e_23, _a;
        var res = false;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var instance = _c.value;
                res = instance.set(property, value) && res;
            }
        }
        catch (e_23_1) { e_23 = { error: e_23_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_23) throw e_23.error; }
        }
        return res;
    };
    ShapeSet.prototype.msetEach = function (property, values) {
        var e_24, _a;
        var res = false;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var instance = _c.value;
                res = instance.mset(property, values) && res;
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
    ShapeSet.prototype.updateEach = function (property, value) {
        var e_25, _a;
        var res = false;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var instance = _c.value;
                res = instance.overwrite(property, value) && res;
            }
        }
        catch (e_25_1) { e_25 = { error: e_25_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_25) throw e_25.error; }
        }
        return res;
    };
    ShapeSet.prototype.mupdateEach = function (property, values) {
        var e_26, _a;
        var res = false;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var instance = _c.value;
                res = instance.moverwrite(property, values) && res;
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
    ShapeSet.prototype.unsetEach = function (property, value) {
        var e_27, _a;
        var res = false;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var instance = _c.value;
                res = instance.unset(property, value) && res;
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
    ShapeSet.prototype.unsetAllEach = function (property) {
        var e_28, _a;
        var res = false;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var instance = _c.value;
                res = instance.unsetAll(property) && res;
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
    ShapeSet.prototype.getNodes = function () {
        var e_29, _a;
        var res = new NodeSet_js_1.NodeSet();
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var instance = _c.value;
                res.add(instance.node);
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
    ShapeSet.prototype.promiseLoaded = function (loadInverseProperties) {
        if (loadInverseProperties === void 0) { loadInverseProperties = false; }
        return Promise.all(this.map(function (instance) { return instance.promiseLoaded(loadInverseProperties); }))
            .then(function (res) {
            return res.every(function (result) { return result === true; });
        })
            .catch(function () {
            return false;
        });
    };
    ShapeSet.prototype.isLoaded = function (includingInverseProperties) {
        if (includingInverseProperties === void 0) { includingInverseProperties = false; }
        return this.every(function (instance) {
            return instance.isLoaded(includingInverseProperties);
        });
    };
    ShapeSet.prototype.toString = function () {
        return ('ShapeSet {\n' +
            __spreadArray([], __read(this), false).map(function (instance) { return '\t' + instance.toString(); }).join(',\n') +
            '\n}');
    };
    return ShapeSet;
}(CoreSet_js_1.CoreSet));
exports.ShapeSet = ShapeSet;
//# sourceMappingURL=ShapeSet.js.map