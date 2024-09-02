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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMostSpecificShapes = exports.getShapeOrSubShape = exports.getMostSpecificSubShapes = exports.getLeastSpecificShapeClasses = exports.hasSubClass = exports.hasSuperClass = exports.isClass = exports.getPropertyShapeByLabel = exports.getSuperShapesClasses = exports.getSubShapesClasses = exports.getShapeClass = exports.addNodeShapeToShapeClass = void 0;
var Shape_js_1 = require("../shapes/Shape.js");
var nodeShapeToShapeClass = new Map();
function addNodeShapeToShapeClass(nodeShape, shapeClass) {
    nodeShapeToShapeClass.set(nodeShape.namedNode, shapeClass);
}
exports.addNodeShapeToShapeClass = addNodeShapeToShapeClass;
function getShapeClass(nodeShape) {
    return nodeShapeToShapeClass.get(nodeShape);
}
exports.getShapeClass = getShapeClass;
/**
 * Returns all the sub shapes of the given shape
 * That is all the shapes that extend this shape
 * @param shape
 */
function getSubShapesClasses(shape) {
    //make sure we have a real class
    shape = ensureShapeConstructor(shape);
    //apply the hasSuperclass function to the shape
    var filterFunction = applyFnToShapeOrArray(shape, hasSubClass);
    //filter and then sort the results based on their inheritance (most specific classes first, so we use hasSuperClass for the sorting)
    return filterShapeClasses(filterFunction).sort(function (a, b) {
        return hasSubClass(a, b) ? 1 : -1;
    });
    // let extendsGivenShapeClass = Array.isArray(shape) ? (shapeClass) => {
    //     return shape.some(s => shapeClass.constructor.prototype instanceof s);
    //   } : (shapeClass) => {
    //     return shapeClass.constructor.prototype instanceof shape;
    //   }
    //
    // let result = [];
    // nodeShapeToShapeClass.forEach((shapeClass) => {
    //   if(extendsGivenShapeClass(shapeClass)) {
    //     result.push(shapeClass);
    //   }
    // });
    // return result;
}
exports.getSubShapesClasses = getSubShapesClasses;
/**
 * Returns all the superclasses of the given shape
 * That is all the shapes that it extends.
 * Results are sorted from most specific to least specific
 * @param shape
 */
function getSuperShapesClasses(shape) {
    //make sure we have a real class
    shape = ensureShapeConstructor(shape);
    //apply the hasSuperclass function to the shape
    var filterFunction = applyFnToShapeOrArray(shape, hasSuperClass);
    //filter and then sort the results based on their inheritance
    return filterShapeClasses(filterFunction).sort(function (a, b) {
        return hasSubClass(a, b) ? 1 : -1;
    });
}
exports.getSuperShapesClasses = getSuperShapesClasses;
function getPropertyShapeByLabel(shapeClass, label) {
    var e_1, _a;
    //get all the shapes that this shape extends
    var shapeChain = getSuperShapesClasses(shapeClass);
    //include the shape itself as the first shape in the array
    shapeChain.unshift(shapeClass);
    var propertyShape;
    try {
        for (var shapeChain_1 = __values(shapeChain), shapeChain_1_1 = shapeChain_1.next(); !shapeChain_1_1.done; shapeChain_1_1 = shapeChain_1.next()) {
            var sClass = shapeChain_1_1.value;
            propertyShape = sClass.shape
                .getPropertyShapes()
                .find(function (propertyShape) { return propertyShape.label === label; });
            if (propertyShape) {
                break;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (shapeChain_1_1 && !shapeChain_1_1.done && (_a = shapeChain_1.return)) _a.call(shapeChain_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return propertyShape;
}
exports.getPropertyShapeByLabel = getPropertyShapeByLabel;
//https://stackoverflow.com/a/30760236
function isClass(v) {
    return typeof v === 'function' && /^\s*class\s+/.test(v.toString());
}
exports.isClass = isClass;
function ensureShapeConstructor(shape) {
    //TODO: figure out why sometimes we need shape.prototype, sometimes we need shape.constructor.prototype
    // in other words, why we sometimes get a ES6 Class and sometimes its constructor?
    //make sure we have a real class
    //NOTE: update, this started breaking for when classes are functions. the constructor is native Function
    //had to turn it off for now, waiting for issues to come back up to understand what needs to happen
    return shape;
    // if(Array.isArray(shape))
    // {
    //   return shape.map(s => {
    //     if (!isClass(s))
    //     {
    //       return s.constructor as any;
    //     }
    //     return s;
    //   }) as any[];
    // } else {
    //   if (!isClass(shape))
    //   {
    //     return shape.constructor as any;
    //   }
    //   return shape;
    // }
}
function hasSuperClass(a, b) {
    return a.prototype instanceof b;
}
exports.hasSuperClass = hasSuperClass;
function hasSubClass(a, b) {
    return b.prototype instanceof a;
}
exports.hasSubClass = hasSubClass;
function applyFnToShapeOrArray(shape, filterFn) {
    if (Array.isArray(shape)) {
        return function (shapeClass) {
            //returns true if one of the given shapes extends the shapeClass passed as argument
            return shape.some(function (s) { return filterFn(s, shapeClass); });
        };
    }
    else {
        //first argument will be the given shape class, second argument will be each stored shape class in the map
        //will filter down where the given shape extends the stored shape
        return filterFn.bind(null, shape);
    }
}
function filterShapeClasses(filterFn) {
    var result = [];
    nodeShapeToShapeClass.forEach(function (shapeClass) {
        if (filterFn(shapeClass)) {
            result.push(shapeClass);
        }
    });
    return result;
}
function getLeastSpecificShapeClasses(shapes) {
    var shapeClasses = shapes.map(function (shape) {
        return getShapeClass(shape.nodeShape.namedNode);
    });
    return filterShapesToLeastSpecific(shapeClasses);
}
exports.getLeastSpecificShapeClasses = getLeastSpecificShapeClasses;
function getMostSpecificSubShapes(shape) {
    if (!Array.isArray(shape)) {
        shape = [shape];
    }
    //get the subshapes of the given shapes
    var subShapes = getSubShapesClasses(shape);
    //filter them down to the most specific ones (that are not extended by any other shape)
    return filterShapesToMostSpecific(subShapes);
}
exports.getMostSpecificSubShapes = getMostSpecificSubShapes;
/**
 * Filters out all shapes that are extended by any other shape in the given set/array
 * @param subShapes
 */
function filterShapesToMostSpecific(subShapes) {
    return subShapes.filter(function (subShape) {
        return !subShapes.some(function (otherSubShape) {
            return otherSubShape.prototype instanceof subShape;
        });
    });
}
/**
 * Filters out all shapes that extend any other shape in the given set/array
 * @param shapeClasses
 */
function filterShapesToLeastSpecific(shapeClasses) {
    return shapeClasses.filter(function (shapeClass) {
        return !shapeClasses.some(function (otherShapeClass) {
            return (otherShapeClass !== shapeClass &&
                shapeClass.prototype instanceof otherShapeClass);
        });
    });
}
/**
 * Finds the most specific shape class (which extends other shape classes)
 * of all shape classes that this node matches with (that is the node is a valid instance of the shape)
 * And returns an instance of that shape
 * @param property
 * @param shape
 */
function getShapeOrSubShape(node, shape) {
    if (!node)
        return null;
    //new:
    //find all shapes that extend the given shape(s)
    var mostSpecificShapes = getMostSpecificShapes(node, shape);
    //take the first one and return a new instance of that shape
    if (mostSpecificShapes.length > 0) {
        return new mostSpecificShapes[0](node);
    }
    //by default, if no more specific shapes were found, just create an instance of the (first) given shape
    if (Array.isArray(shape)) {
        return new shape[0](node);
    }
    return new shape(node);
    // //start with the shape itself, but add any extending shapes
    // let extendingShapes:typeof Shape[] = [];
    //
    // //if shape is an array, we check if the node is an instance of any of the shapes in the array
    // //NOTE: I'm not exactly sure why we have to add .constructor, but the shapeClasses coming in are
    // //apparently not of the same kind (class) as the shapeClasses in the nodeShapeToShapeClass map
    // //so, we have to compare by its constructors prototype, that seems to work
    // let classExtendsGivenShapeClass = Array.isArray(shape) ? (shapeClass) => {
    //   return shape.some(s => shapeClass.constructor.prototype instanceof s);
    // } : (shapeClass) => {
    //   return shapeClass.constructor.prototype instanceof shape;
    // }
    //
    // let shapesOfNode = NodeShape.getShapesOf(node);
    // shapesOfNode.forEach(nodeShape => {
    //   let shapeClass = getShapeClass(nodeShape.namedNode);
    //   if(classExtendsGivenShapeClass(shapeClass.prototype)) {
    //     extendingShapes.push(shapeClass);
    //   }
    // });
    //
    // extendingShapes.sort((s1,s2) => {
    //   return s1.prototype instanceof s2 ? -1 : 1;
    // });
    // if(extendingShapes.length > 0) {
    //   return new (extendingShapes[0] as any)(node) as S;
    // }
    //
    // return new (shape as any)(node) as S;
}
exports.getShapeOrSubShape = getShapeOrSubShape;
function getMostSpecificShapes(node, baseShape) {
    // let mostSpecificShapes = getMostSpecificShapes(node,shape);
    if (baseShape === void 0) { baseShape = Shape_js_1.Shape; }
    //get the subshapes of the given base shape(s)
    var subShapes = getSubShapesClasses(baseShape);
    while (subShapes.length > 0) {
        //get the most specific shapes out of all remaining subshapes
        var mostSpecificSubShapes = filterShapesToMostSpecific(subShapes);
        //filter them down to the ones that this node is a valid instance of
        var shapesThatMatchNode = mostSpecificSubShapes.filter(function (subShape) {
            return subShape.shape.validateNode(node);
        });
        //if any of them can create a valid instance for this node, then return that
        if (shapesThatMatchNode.length > 0) {
            return shapesThatMatchNode;
        }
        //else, remove the shapes we just tried from the subShapes array
        //and try again with less specific shapes
        mostSpecificSubShapes.forEach(function (mostSpecificSubShape) {
            subShapes.splice(subShapes.indexOf(mostSpecificSubShape), 1);
        });
    }
    return [];
}
exports.getMostSpecificShapes = getMostSpecificShapes;
//# sourceMappingURL=ShapeClass.js.map