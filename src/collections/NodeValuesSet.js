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
exports.NodeValuesSet = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var NodeSet_js_1 = require("./NodeSet.js");
var NodeValuesSet = /** @class */ (function (_super) {
    __extends(NodeValuesSet, _super);
    function NodeValuesSet(_subject, _property, iterable) {
        var _this = _super.call(this, iterable) || this;
        _this._subject = _subject;
        _this._property = _property;
        return _this;
    }
    Object.defineProperty(NodeValuesSet.prototype, "subject", {
        get: function () {
            return this._subject;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeValuesSet.prototype, "property", {
        get: function () {
            return this._property;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Listen to any changes in the valueset for this subject + property combination
     * If you provide context (usually 'this'), removing the onChange listener will remove all listeners for this property & context, regardless of what callback you provide. (this is helpful if you dont have access to the excact same callback function)
     * @param callback
     * @param context
     */
    NodeValuesSet.prototype.onChange = function (callback, context) {
        this._subject.onChange(this._property, callback, context);
    };
    /**
     * Remove listener for changes in the valueset for this subject + property combination
     * If you provide context (usually 'this'), removing the onChange listener will remove all listeners for this property & context, regardless of what callback you provide. (this is helpful if you dont have access to the excact same callback function)
     * @param callback
     * @param context
     */
    NodeValuesSet.prototype.removeOnChange = function (callback, context) {
        this._subject.removeOnChange(this._property, callback, context);
    };
    /**
     * When cloned we switch to a NodeSet of all the values
     * And detach from the magic of PropertyValueSets, which are only meant to be used internally in the NamedNode model
     * @param args
     */
    NodeValuesSet.prototype.createNew = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return new (NodeSet_js_1.NodeSet.bind.apply(NodeSet_js_1.NodeSet, __spreadArray([void 0], __read(args), false)))();
    };
    /**
     * Add a new node to this set of values.
     * This creates a new quad in the local graph.
     * This is equivalent to manually adding a new property value using `subject.set(predicate,object)`
     * @param value the node to add
     */
    NodeValuesSet.prototype.add = function (value) {
        this._subject.set(this._property, value);
        return this;
    };
    /**
     * Remove a node from this set of values.
     * This removes a quad in the local graph (if the node was an existing value)
     * This is equivalent to manually removing a property value using `subject.unset(predicate,object)`
     * @param value the node to remove
     */
    NodeValuesSet.prototype.delete = function (value) {
        return this._subject.unset(this._property, value);
    };
    /**
     * Actually removes a node from this value set. Does not remove any quads in the local graph
     * DO NOT use this method.
     * Use subject.getAll(predicate).remove(object) or subject.unset(predicate,object) instead
     * @internal
     * @param v
     */
    NodeValuesSet.prototype.__delete = function (v) {
        return _super.prototype.delete.call(this, v);
    };
    /**
     * Adds a value directly to this value set. Does not create new quads in the local graph
     * DO NOT USE this method.
     * Use subject.getAll(predicate).add(object) or subject.set(predicate,object) instead.
     * @internal
     * @param v
     */
    NodeValuesSet.prototype.__add = function (v) {
        return _super.prototype.add.call(this, v);
    };
    //here we overload the type definitions to indicate its a NodeSet that will be returned
    //HOWEVER, without '|any' this will not be expected by Typescript unless we find a really intricate way of rewriting all methods of CoreSet / CoreIterable that return this into methods that return ...?
    NodeValuesSet.prototype.sort = function (compareFn, thisArg) {
        return _super.prototype.sort.call(this, compareFn, thisArg);
    };
    NodeValuesSet.prototype.concat = function () {
        var sets = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            sets[_i] = arguments[_i];
        }
        return _super.prototype.concat.apply(this, __spreadArray([], __read(sets), false));
    };
    NodeValuesSet.prototype.filter = function (fn) {
        return _super.prototype.filter.call(this, fn);
    };
    return NodeValuesSet;
}(NodeSet_js_1.NodeSet));
exports.NodeValuesSet = NodeValuesSet;
//# sourceMappingURL=NodeValuesSet.js.map