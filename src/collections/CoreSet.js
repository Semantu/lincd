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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreSet = void 0;
var CoreSet = /** @class */ (function (_super) {
    __extends(CoreSet, _super);
    function CoreSet() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CoreSet.prototype.createNew = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return new ((_a = this.constructor).bind.apply(_a, __spreadArray([void 0], __read(args), false)))();
    };
    CoreSet.prototype.filter = function (fn) {
        var e_1, _a;
        var res = this.createNew();
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var item = _c.value;
                if (fn(item, item, this)) {
                    res.add(item);
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
        return res;
    };
    /**
     * Returns the value of the first element in the Set where predicate is true, and undefined
     * otherwise.
     */
    CoreSet.prototype.find = function (predicate, thisArg) {
        var e_2, _a;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var item = _c.value;
                if (predicate.apply(thisArg, [item, item, this])) {
                    return item;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return undefined;
    };
    CoreSet.prototype.first = function () {
        return this.values().next().value;
    };
    /**
     * Returns the last element added to the set
     */
    CoreSet.prototype.last = function () {
        var e_3, _a;
        //unfortunately there is no efficient way to do this. Either we convert the set to an array or we loop over all values to discover the last
        var item;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                item = _c.value;
                ;
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return item;
    };
    CoreSet.prototype.getFirst = function (n) {
        return this.createNew(__spreadArray([], __read(this), false).slice(0, n));
    };
    CoreSet.prototype.slice = function (start, end) {
        return this.createNew(__spreadArray([], __read(this), false).slice(start, end));
    };
    CoreSet.prototype.sort = function (compareFn, thisArg) {
        //convert this set to an array, sort it with provided parameters, create a new set of the same type and provide the sorted array as content
        var sortedArray = thisArg
            ? __spreadArray([], __read(this), false).sort.apply(thisArg, [compareFn])
            : __spreadArray([], __read(this), false).sort(compareFn);
        return this.createNew(sortedArray);
    };
    /**
     * Determines whether all the members of an array satisfy the specified test.
     * @param callbackfn A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    CoreSet.prototype.every = function (callbackfn, thisArg) {
        var e_4, _a;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var item = _c.value;
                if (!callbackfn.apply(thisArg, [item, this])) {
                    return false;
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
        return true;
    };
    /**
     * Determines whether the specified callback function returns true for any element of an array.
     * @param callbackfn A function that accepts up to three arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    CoreSet.prototype.some = function (callbackfn, thisArg) {
        var e_5, _a;
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var item = _c.value;
                if (callbackfn.apply(thisArg, [item, this])) {
                    return true;
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return false;
    };
    /**
     * Calls a defined callback function on each element of the set, and returns an ARRAY that contains the results.
     * Note that this method returns an array so that sets can be more easily used with for example JSX
     * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    CoreSet.prototype.map = function (callbackfn, thisArg) {
        //NOTE: we changed this method so that it returns an array because it
        // causes trouble in ES5 when we create a new CoreSet and try to add the mapped results which may not have a unique toString() implementation (like in React)
        var e_6, _a;
        //create the result map, whos values will be 'mapped' into new values from the current values of this map
        var mapped = [];
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var item = _c.value;
                //do the mapping
                mapped.push(callbackfn.apply(thisArg, [item, this]));
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_6) throw e_6.error; }
        }
        return mapped;
    };
    CoreSet.prototype.concat = function () {
        var e_7, _a;
        var sets = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            sets[_i] = arguments[_i];
        }
        var res = this.createNew(this);
        try {
            for (var sets_1 = __values(sets), sets_1_1 = sets_1.next(); !sets_1_1.done; sets_1_1 = sets_1.next()) {
                var set = sets_1_1.value;
                set.forEach(res.add.bind(res));
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (sets_1_1 && !sets_1_1.done && (_a = sets_1.return)) _a.call(sets_1);
            }
            finally { if (e_7) throw e_7.error; }
        }
        return res;
    };
    CoreSet.prototype.clone = function () {
        return this.createNew(this);
    };
    CoreSet.prototype.reverse = function () {
        return this.createNew(__spreadArray([], __read(this), false).reverse());
    };
    CoreSet.prototype.print = function () {
        console.log(this.toString());
    };
    /**
     * Similar to concat, but adds all items to THIS set instead of creating a new one
     * @param sets
     */
    CoreSet.prototype.addFrom = function () {
        var e_8, _a;
        var sets = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            sets[_i] = arguments[_i];
        }
        try {
            for (var sets_2 = __values(sets), sets_2_1 = sets_2.next(); !sets_2_1.done; sets_2_1 = sets_2.next()) {
                var set = sets_2_1.value;
                if (set) {
                    set.forEach(this.add.bind(this));
                }
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (sets_2_1 && !sets_2_1.done && (_a = sets_2.return)) _a.call(sets_2);
            }
            finally { if (e_8) throw e_8.error; }
        }
        return this;
    };
    return CoreSet;
}(Set));
exports.CoreSet = CoreSet;
//# sourceMappingURL=CoreSet.js.map