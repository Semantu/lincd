"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWatchProperty = exports.useWatchPropertySet = exports.useStyles = void 0;
var react_1 = require("react");
var react_usestateref_1 = __importDefault(require("react-usestateref"));
var Shape_js_1 = require("../shapes/Shape.js");
var models_js_1 = require("../models.js");
var ShapeClass_js_1 = require("./ShapeClass.js");
/**
 * Merges styles and class names from props with the classnames & styles given as arguments
 * @param props
 * @param classNamesOrStyles class name(s) or a style object
 * @param styles option to provide a style object if class names were given as first argument
 */
var useStyles = function (props, classNamesOrStyles, styles) {
    var classNames;
    var combinedStyles;
    var propsCopy = __assign({}, props);
    if (props.className) {
        if (typeof props.className === 'string') {
            classNames = [props.className];
        }
        else if (Array.isArray(props.className)) {
            classNames = props.className;
        }
        delete propsCopy.className;
    }
    if (props.style) {
        combinedStyles = props.style;
        delete propsCopy.style;
    }
    if (classNamesOrStyles) {
        var paramType = typeof classNamesOrStyles;
        if (paramType === 'string') {
            if (classNames) {
                classNames.push(classNamesOrStyles);
            }
            else {
                classNames = [classNamesOrStyles];
            }
        }
        else if (paramType === 'object') {
            if (Array.isArray(classNamesOrStyles)) {
                if (classNames) {
                    classNames = classNames.concat(classNamesOrStyles);
                }
                else {
                    classNames = classNamesOrStyles;
                }
            }
            else {
                //merge props.style with first param (which is a React.CSSProperties object)
                combinedStyles = __assign(__assign({}, props.style), classNamesOrStyles);
            }
        }
        if (styles) {
            //merge props.style with second param (first param must have been class names)
            combinedStyles = __assign(__assign({}, combinedStyles), styles);
        }
    }
    return __assign({ className: classNames.filter(Boolean).join(' '), style: combinedStyles }, propsCopy);
};
exports.useStyles = useStyles;
/**
 * Updates your component automatically when the values for a given subject+predicate ValuesSet change
 * @param valuesSet
 */
var useWatchPropertySet = function () {
    var valuesSets = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        valuesSets[_i] = arguments[_i];
    }
    var _a = __read((0, react_usestateref_1.default)(false), 3), bool = _a[0], setBool = _a[1], boolRef = _a[2];
    var forceUpdate = (0, react_1.useCallback)(function () {
        setBool(!boolRef.current);
    }, [bool]);
    (0, react_1.useEffect)(function () {
        valuesSets.forEach(function (valuesSet) { return valuesSet.onChange(forceUpdate); });
        return function () {
            valuesSets.forEach(function (valuesSet) { return valuesSet.removeOnChange(forceUpdate); });
        };
    }, []);
};
exports.useWatchPropertySet = useWatchPropertySet;
function useWatchProperty(source, property) {
    var _a = __read((0, react_usestateref_1.default)(false), 3), bool = _a[0], setBool = _a[1], boolRef = _a[2];
    var forceUpdate = (0, react_1.useCallback)(function () {
        setBool(!boolRef.current);
    }, [bool]);
    (0, react_1.useEffect)(function () {
        var e_1, _a;
        if (typeof property === 'string') {
            if (source instanceof Shape_js_1.Shape) {
                //we want to check all the property shapes of the given shape
                //we could access shape.nodeShape, but we actually also need the propertyShapes of all the shapes in the inheritance chain
                //this we can (currently) do by getting the shapeClass first
                var shapeClass = (0, ShapeClass_js_1.getShapeClass)(source.nodeShape.namedNode);
                //from there we can get the classes it extends
                var shapeClasses = (0, ShapeClass_js_1.getSuperShapesClasses)(shapeClass);
                //we add back the shapeClass itself, as the first shapeClass to check
                shapeClasses.unshift(shapeClass);
                try {
                    //then for each shape class
                    for (var shapeClasses_1 = __values(shapeClasses), shapeClasses_1_1 = shapeClasses_1.next(); !shapeClasses_1_1.done; shapeClasses_1_1 = shapeClasses_1.next()) {
                        var shapeClass_1 = shapeClasses_1_1.value;
                        //we can check if it has a property shape with the given name
                        var matchingPropertyShape = shapeClass_1.shape
                            .getPropertyShapes()
                            .find(function (shape) {
                            return shape.label === property;
                        });
                        if (matchingPropertyShape) {
                            //TODO: if path can be multiple props, we need to watch the whole path
                            property = matchingPropertyShape.path;
                            break;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (shapeClasses_1_1 && !shapeClasses_1_1.done && (_a = shapeClasses_1.return)) _a.call(shapeClasses_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                if (!(property instanceof models_js_1.NamedNode)) {
                    throw new Error("Can't find property ".concat(property, " on shape ").concat(source.nodeShape.label));
                }
            }
            else {
                throw new Error("Can't use string property with a NamedNode source. Provide a shape + string or NamedNode + NamedNode instead.");
            }
        }
        source.onChange(property, forceUpdate);
        return function () {
            source.removeOnChange(property, forceUpdate);
        };
    }, []);
}
exports.useWatchProperty = useWatchProperty;
//# sourceMappingURL=Hooks.js.map