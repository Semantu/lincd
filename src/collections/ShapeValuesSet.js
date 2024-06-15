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
exports.ShapeValuesSet = void 0;
var ShapeSet_js_1 = require("./ShapeSet.js");
var ShapeClass_js_1 = require("../utils/ShapeClass.js");
var ShapeValuesSet = /** @class */ (function (_super) {
    __extends(ShapeValuesSet, _super);
    function ShapeValuesSet(subject, property, shapeClass, allowSubShapes) {
        if (allowSubShapes === void 0) { allowSubShapes = false; }
        //we have to construct the set empty because the native Set constructor will call 'this.add()', which wont work since subject & property are not set yet
        var _this = _super.call(this) || this;
        _this.subject = subject;
        _this.property = property;
        _this.shapeClass = shapeClass;
        _this.allowSubShapes = allowSubShapes;
        //get all the property values nodes and add each of them to this set as instances of the given shape
        subject.getAll(property).forEach(function (object) {
            if (allowSubShapes) {
                _super.prototype.add.call(_this, (0, ShapeClass_js_1.getShapeOrSubShape)(object, shapeClass));
            }
            else {
                _super.prototype.add.call(_this, new shapeClass(object));
            }
        });
        //listen for changes in the property set
        subject.onChange(property, function (quads) {
            quads.forEach(function (q) {
                if (q.isRemoved) {
                    _this.some(function (shape) {
                        if (shape.node === q.object) {
                            return _super.prototype.delete.call(_this, shape);
                        }
                    });
                }
                else {
                    //it may have already been added if this very shapeset was used directly to add an item to
                    //(we need to add it directly as that is expected behaviour when you add something to a set)
                    //so if we don't have an existing shape in here for the added node, then we add it
                    if (!_this.some(function (shape) {
                        return shape.node === q.object;
                    })) {
                        if (allowSubShapes) {
                            _super.prototype.add.call(_this, (0, ShapeClass_js_1.getShapeOrSubShape)(q.object, shapeClass));
                        }
                        else {
                            _super.prototype.add.call(_this, new shapeClass(q.object));
                        }
                    }
                }
            });
        });
        return _this;
    }
    /**
     * When cloned (by .filter() or .sort()) we switch to a ShapeSet of all the values
     * And detach from the magic of PropertyValueShapeSets that automatically add and remove items
     * @param args
     */
    ShapeValuesSet.prototype.createNew = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return new (ShapeSet_js_1.ShapeSet.bind.apply(ShapeSet_js_1.ShapeSet, __spreadArray([void 0], __read(args), false)))();
    };
    /**
     * Add a new Shape to this set of values.
     * This creates a new quad in the local graph.
     * This is equivalent to manually adding a new property value using `subject.set(predicate,object)`
     * @param value the node to add
     */
    ShapeValuesSet.prototype.add = function (value) {
        if (!this.subject.has(this.property, value.node)) {
            this.subject.set(this.property, value.node);
            return _super.prototype.add.call(this, value);
        }
    };
    /**
     * Remove a Shape from this set of values.
     * Also removes a quad in the local graph (if the node was an existing value)
     * This is equivalent to manually removing a property value using `subject.unset(predicate,object)`
     * @param value the node to remove
     */
    ShapeValuesSet.prototype.delete = function (value) {
        this.subject.unset(this.property, value.node);
        return _super.prototype.delete.call(this, value);
    };
    /**
     * Listen to any changes in the valueset for this subject + property combination
     * If you provide context (usually 'this'), removing the onChange listener will remove all listeners for this property & context, regardless of what callback you provide. (this is helpful if you dont have access to the excact same callback function)
     * @param callback
     * @param context
     */
    ShapeValuesSet.prototype.onChange = function (callback, context) {
        this.subject.onChange(this.property, callback, context);
    };
    /**
     * Remove listener for changes in the valueset for this subject + property combination
     * If you provide context (usually 'this'), removing the onChange listener will remove all listeners for this property & context, regardless of what callback you provide. (this is helpful if you dont have access to the excact same callback function)
     * @param callback
     * @param context
     */
    ShapeValuesSet.prototype.removeOnChange = function (callback, context) {
        this.subject.removeOnChange(this.property, callback, context);
    };
    return ShapeValuesSet;
}(ShapeSet_js_1.ShapeSet));
exports.ShapeValuesSet = ShapeValuesSet;
//# sourceMappingURL=ShapeValuesSet.js.map