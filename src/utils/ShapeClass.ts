import {NamedNode, Node} from '../models';
import {Shape} from '../shapes/Shape';
import {NodeShape} from '../shapes/SHACL';
import {CoreSet} from '../collections/CoreSet';

let nodeShapeToShapeClass: Map<NamedNode, typeof Shape> = new Map();
export function addNodeShapeToShapeClass(nodeShape: NodeShape, shapeClass: typeof Shape) {
  nodeShapeToShapeClass.set(nodeShape.namedNode, shapeClass);
}
export function getShapeClass(nodeShape: NamedNode): typeof Shape {
  return nodeShapeToShapeClass.get(nodeShape);
}

export function getSubShapesClasses(shape: typeof Shape | (typeof Shape)[]): (typeof Shape)[] {
  //make sure we have a real class
  shape = ensureShapeConstructor(shape);
  //apply the hasSuperclass function to the shape
  let filterFunction = applyFnToShapeOrArray(shape, hasSubClass);
  //filter and then sort the results based on their inheritance (most specific classes first, so we use hasSuperClass for the sorting)
  return filterShapeClasses(filterFunction).sort((a, b) => {
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

export function getSuperShapesClasses(shape: typeof Shape | (typeof Shape)[]): (typeof Shape)[] {
  //make sure we have a real class
  shape = ensureShapeConstructor(shape);
  //apply the hasSuperclass function to the shape
  let filterFunction = applyFnToShapeOrArray(shape, hasSuperClass);
  //filter and then sort the results based on their inheritance
  return filterShapeClasses(filterFunction).sort((a, b) => {
    return hasSubClass(a, b) ? 1 : -1;
  });
}

//https://stackoverflow.com/a/30760236
function isClass(v) {
  return typeof v === 'function' && /^\s*class\s+/.test(v.toString());
}

function ensureShapeConstructor(shape: typeof Shape | (typeof Shape)[]) {
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
export function hasSuperClass(a: Function, b: Function) {
  return (a as Function).prototype instanceof b;
}
export function hasSubClass(a: Function, b: Function) {
  return (b as Function).prototype instanceof a;
}

function applyFnToShapeOrArray(shape, filterFn) {
  if (Array.isArray(shape)) {
    return (shapeClass) => {
      //returns true if one of the given shapes extends the shapeClass passed as argument
      return (shape as Function[]).some((s) => filterFn(s, shapeClass));
    };
  } else {
    //first argument will be the given shape class, second argument will be each stored shape class in the map
    //will filter down where the given shape extends the stored shape
    return filterFn.bind(null, shape);
  }
}

function filterShapeClasses(filterFn) {
  let result = [];
  nodeShapeToShapeClass.forEach((shapeClass) => {
    if (filterFn(shapeClass)) {
      result.push(shapeClass);
    }
  });
  return result;
}

export function getMostSpecificSubShapes(shape: typeof Shape | (typeof Shape)[]): (typeof Shape)[] {
  if (!Array.isArray(shape)) {
    shape = [shape];
  }
  //get the subshapes of the given shapes
  let subShapes: (typeof Shape)[] = getSubShapesClasses(shape);
  //filter them down to the most specific ones (that are not extended by any other shape)
  return filterShapesToMostSpecific(subShapes);
}

function filterShapesToMostSpecific(subShapes) {
  return subShapes.filter((subShape) => {
    return !subShapes.some((otherSubShape) => {
      return otherSubShape.prototype instanceof subShape;
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
export function getShapeOrSubShape<S extends Shape = Shape>(node, shape: typeof Shape | (typeof Shape)[]): S {
  if (!node) return null;

  //new:
  //find all shapes that extend the given shape(s)
  let mostSpecificShapes = getMostSpecificShapes(node, shape);

  //take the first one and return a new instance of that shape
  if (mostSpecificShapes.length > 0) {
    return new (mostSpecificShapes[0] as any)(node) as S;
  }
  //by default, if no more specific shapes were found, just create an instance of the (first) given shape
  if (Array.isArray(shape)) {
    return new (shape[0] as any)(node) as S;
  }
  return new (shape as any)(node) as S;

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

export function getMostSpecificShapes(
  node: NamedNode,
  baseShape: typeof Shape | (typeof Shape)[] = Shape,
): (typeof Shape)[] {
  // let mostSpecificShapes = getMostSpecificShapes(node,shape);

  //get the subshapes of the given base shape(s)
  let subShapes: (typeof Shape)[] = getSubShapesClasses(baseShape);

  while (subShapes.length > 0) {
    //get the most specific shapes out of all remaining subshapes
    let mostSpecificSubShapes = filterShapesToMostSpecific(subShapes);

    //filter them down to the ones that this node is a valid instance of
    let shapesThatMatchNode = mostSpecificSubShapes.filter((subShape) => {
      return subShape.shape.validateNode(node);
    });
    //if any of them can create a valid instance for this node, then return that
    if (shapesThatMatchNode.length > 0) {
      return shapesThatMatchNode;
    }
    //else, remove the shapes we just tried from the subShapes array
    //and try again with less specific shapes
    mostSpecificSubShapes.forEach((mostSpecificSubShape) => {
      subShapes.splice(subShapes.indexOf(mostSpecificSubShape), 1);
    });
  }
  return [];
}
