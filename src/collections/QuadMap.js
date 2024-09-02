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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuadMap = void 0;
var NodeSet_js_1 = require("./NodeSet.js");
var QuadSet_js_1 = require("./QuadSet.js");
var CoreSet_js_1 = require("./CoreSet.js");
/**
 * A map who's values are sets
 * When you iterate over this map with methods like map and forEach you'll iterate over the values of the sets
 */
var CoreMapToSet = /** @class */ (function (_super) {
    __extends(CoreMapToSet, _super);
    function CoreMapToSet() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Determines whether all the members of an array satisfy the specified test.
     * @param callbackfn A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    CoreMapToSet.prototype.every = function (callbackfn, thisArg) {
        var e_1, _a, e_2, _b;
        try {
            for (var _c = __values(this), _d = _c.next(); !_d.done; _d = _c.next()) {
                var _e = __read(_d.value, 2), key = _e[0], set = _e[1];
                try {
                    for (var set_1 = (e_2 = void 0, __values(set)), set_1_1 = set_1.next(); !set_1_1.done; set_1_1 = set_1.next()) {
                        var value = set_1_1.value;
                        if (!callbackfn.apply(thisArg, [value, key, this])) {
                            return false;
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (set_1_1 && !set_1_1.done && (_b = set_1.return)) _b.call(set_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return true;
    };
    /**
     * This object is a Map whos values are sets.
     * This forEach method calls the callback-function for each items in each of those sets.
     * The first parameter has the type of the items in the sets
     * The second parameter is the key
     * The type information can unfortunately not be defined as they would conflict with the usual forEach method
     * @param callbackfn
     * @param thisArg
     */
    CoreMapToSet.prototype.forEach = function (callbackfn, thisArg) {
        var e_3, _a, e_4, _b;
        try {
            for (var _c = __values(this), _d = _c.next(); !_d.done; _d = _c.next()) {
                var _e = __read(_d.value, 2), key = _e[0], set = _e[1];
                try {
                    for (var set_2 = (e_4 = void 0, __values(set)), set_2_1 = set_2.next(); !set_2_1.done; set_2_1 = set_2.next()) {
                        var value = set_2_1.value;
                        callbackfn.apply(thisArg, [value, key, this]);
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (set_2_1 && !set_2_1.done && (_b = set_2.return)) _b.call(set_2);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_3) throw e_3.error; }
        }
    };
    /**
     * Determines whether the specified callback function returns true for any element of an array.
     * @param callbackfn A function that accepts up to three arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    CoreMapToSet.prototype.some = function (callbackfn, thisArg) {
        var e_5, _a, e_6, _b;
        try {
            for (var _c = __values(this), _d = _c.next(); !_d.done; _d = _c.next()) {
                var _e = __read(_d.value, 2), key = _e[0], set = _e[1];
                try {
                    for (var set_3 = (e_6 = void 0, __values(set)), set_3_1 = set_3.next(); !set_3_1.done; set_3_1 = set_3.next()) {
                        var value = set_3_1.value;
                        if (callbackfn.apply(thisArg, [value, key, set, this])) {
                            return true;
                        }
                    }
                }
                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                finally {
                    try {
                        if (set_3_1 && !set_3_1.done && (_b = set_3.return)) _b.call(set_3);
                    }
                    finally { if (e_6) throw e_6.error; }
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return false;
    };
    /**
     * Maps all values contained in this map of set into a new single set
     * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    CoreMapToSet.prototype.map = function (callbackfn, resultType, thisArg) {
        var e_7, _a, e_8, _b;
        if (resultType === void 0) { resultType = CoreSet_js_1.CoreSet; }
        //create the result map, whos values will be 'mapped' into new values from the current values of this map
        //whilst maintaining set organisation
        var resultSet = new resultType();
        try {
            for (var _c = __values(this), _d = _c.next(); !_d.done; _d = _c.next()) {
                var _e = __read(_d.value, 2), key = _e[0], set = _e[1];
                try {
                    for (var set_4 = (e_8 = void 0, __values(set)), set_4_1 = set_4.next(); !set_4_1.done; set_4_1 = set_4.next()) {
                        var value = set_4_1.value;
                        //get the right set and add the mapped value to it
                        resultSet.add(callbackfn.apply(thisArg, [value, key, set, this]));
                    }
                }
                catch (e_8_1) { e_8 = { error: e_8_1 }; }
                finally {
                    try {
                        if (set_4_1 && !set_4_1.done && (_b = set_4.return)) _b.call(set_4);
                    }
                    finally { if (e_8) throw e_8.error; }
                }
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_7) throw e_7.error; }
        }
        return resultSet;
    };
    /**
     * Returns the end values in the map that meet the condition specified in a callback function.
     * The result will be a single set of values
     * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    CoreMapToSet.prototype.filter = function (callbackfn, resultType, thisArg) {
        var e_9, _a, e_10, _b;
        if (resultType === void 0) { resultType = CoreSet_js_1.CoreSet; }
        //create the result map, whos values will be 'mapped' into new values from the current values of this map
        //whilst maintaining set organisation
        var resultSet = new resultType();
        try {
            for (var _c = __values(this), _d = _c.next(); !_d.done; _d = _c.next()) {
                var _e = __read(_d.value, 2), key = _e[0], set = _e[1];
                try {
                    //use the type of the first set to determine the result type
                    for (var set_5 = (e_10 = void 0, __values(set)), set_5_1 = set_5.next(); !set_5_1.done; set_5_1 = set_5.next()) {
                        var value = set_5_1.value;
                        //if the filter function returns true-ish
                        if (callbackfn.apply(thisArg, [value, key, set, this])) {
                            //add to result set
                            resultSet.add(value);
                        }
                    }
                }
                catch (e_10_1) { e_10 = { error: e_10_1 }; }
                finally {
                    try {
                        if (set_5_1 && !set_5_1.done && (_b = set_5.return)) _b.call(set_5);
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
        return resultSet;
    };
    CoreMapToSet.prototype.first = function () {
        return this.values().next().value.first();
    };
    /**
     * Returns the value of the first element in the Set where predicate is true, and undefined
     * otherwise.
     */
    CoreMapToSet.prototype.find = function (predicate, thisArg) {
        var e_11, _a, e_12, _b;
        try {
            for (var _c = __values(this), _d = _c.next(); !_d.done; _d = _c.next()) {
                var _e = __read(_d.value, 2), key = _e[0], set = _e[1];
                try {
                    for (var set_6 = (e_12 = void 0, __values(set)), set_6_1 = set_6.next(); !set_6_1.done; set_6_1 = set_6.next()) {
                        var value = set_6_1.value;
                        if (predicate.apply(thisArg, [value, key, this])) {
                            return value;
                        }
                    }
                }
                catch (e_12_1) { e_12 = { error: e_12_1 }; }
                finally {
                    try {
                        if (set_6_1 && !set_6_1.done && (_b = set_6.return)) _b.call(set_6);
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
        return undefined;
    };
    CoreMapToSet.prototype.toString = function () {
        var e_13, _a;
        var res = 'MapToSets:\n';
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), key = _d[0], set = _d[1];
                res += '\t[' + key.toString() + '] => ' + set.toString() + '\n';
            }
        }
        catch (e_13_1) { e_13 = { error: e_13_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_13) throw e_13.error; }
        }
        return res;
    };
    return CoreMapToSet;
}(Map));
var QuadMap = /** @class */ (function (_super) {
    __extends(QuadMap, _super);
    function QuadMap() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    QuadMap.prototype.removeAll = function (alteration) {
        if (alteration === void 0) { alteration = false; }
        this.forEach(function (quad) { return quad.remove(alteration); });
    };
    QuadMap.prototype.getSubjects = function () {
        return this.map(function (quad) { return quad.subject; }, NodeSet_js_1.NodeSet);
    };
    QuadMap.prototype.getPredicates = function () {
        return this.map(function (quad) { return quad.predicate; }, NodeSet_js_1.NodeSet);
    };
    QuadMap.prototype.getObjects = function () {
        return this.map(function (quad) { return quad.predicate; }, NodeSet_js_1.NodeSet);
    };
    QuadMap.prototype.getQuadSet = function () {
        return this.map(function (q) { return q; }, QuadSet_js_1.QuadSet);
    };
    QuadMap.prototype.delete = function (v) {
        throw new Error('Do not delete values directly from a QuadMap. Either create a new set of all values with getQuadSet() or use methods like map() and filter() which also return a new set.');
        return false;
    };
    QuadMap.prototype.__delete = function (v) {
        return _super.prototype.delete.call(this, v);
    };
    QuadMap.prototype.__set = function (k, v) {
        //make sure we have a QuadSet ready for that key
        if (!this.has(k)) {
            this.set(k, new QuadSet_js_1.QuadSet());
        }
        //then add this quad to that set
        this.get(k).add(v);
    };
    return QuadMap;
}(CoreMapToSet));
exports.QuadMap = QuadMap;
//# sourceMappingURL=QuadMap.js.map