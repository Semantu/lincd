import {Shape} from '../shapes/Shape.js';
import {NodeShape, PropertyShape} from '../shapes/SHACL.js';
import {ICoreIterable} from '../interfaces/ICoreIterable.js';
import {NodeReferenceValue} from './NodeReference.js';

const resolveTargetClassId = (
  targetClass?: NodeReferenceValue | null,
): string | null => {
  return targetClass?.id ?? null;
};

let subShapesSpecificityCache: Map<string, (typeof Shape)[][]> = new Map();
let subShapesCache: Map<string, (typeof Shape)[]> = new Map();
let mostSpecificSubShapesCache: Map<string, (typeof Shape)[]> = new Map();
let nodeShapeToShapeClass: Map<string, typeof Shape> = new Map();
let shouldResetCache = false;

export function addNodeShapeToShapeClass(
  nodeShape: NodeShape,
  shapeClass: typeof Shape,
) {
  if (!nodeShape?.id) {
    return;
  }
  nodeShapeToShapeClass.set(nodeShape.id, shapeClass);
  //make sure that the cache is reset after the next event loop
  if (!shouldResetCache) {
    shouldResetCache = true;
    setTimeout(() => {
      subShapesSpecificityCache.clear();
      subShapesCache.clear();
      mostSpecificSubShapesCache.clear();
      shouldResetCache = false;
    }, 0);
  }
}

export function getShapeClass(
  nodeShape: NodeReferenceValue | {id: string} | string,
): typeof Shape {
  const id = typeof nodeShape === 'string' ? nodeShape : nodeShape?.id;
  if (!id) {
    return null;
  }
  return nodeShapeToShapeClass.get(id);
}

/**
 * Returns all the sub shapes of the given shape
 * That is all the shapes that extend this shape
 * @param shape
 */

export function getSubShapesClasses(
  shape: typeof Shape | (typeof Shape)[],
  _internalKey?: string,
): (typeof Shape)[] {
  let key = _internalKey || getKey(shape);
  if (!subShapesCache.has(key)) {
    //make sure we have a real class
    shape = ensureShapeConstructor(shape);
    //apply the hasSuperclass function to the shape
    let filterFunction = applyFnToShapeOrArray(shape, hasSubClass);
    //filter and then sort the results based on their inheritance (most specific classes first, so we use hasSuperClass for the sorting)
    subShapesCache.set(
      key,
      filterShapeClasses(filterFunction).sort((a, b) => {
        return hasSubClass(a, b) ? 1 : -1;
      }),
    );
  }
  //return a copy of the array to prevent it from being modified
  return [...subShapesCache.get(key)];

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

/**
 * Returns all the superclasses of the given shape
 * That is all the shapes that it extends.
 * Results are sorted from most specific to least specific
 * @param shape
 */
export function getSuperShapesClasses(
  shape: typeof Shape | (typeof Shape)[],
): (typeof Shape)[] {
  //make sure we have a real class
  shape = ensureShapeConstructor(shape);
  //apply the hasSuperclass function to the shape
  let filterFunction = applyFnToShapeOrArray(shape, hasSuperClass);
  //filter and then sort the results based on their inheritance
  return filterShapeClasses(filterFunction).sort((a, b) => {
    return hasSubClass(a, b) ? 1 : -1;
  });
}

export function getPropertyShapeByLabel(
  shapeClass: typeof Shape,
  label: string,
): PropertyShape {
  //get all the shapes that this shape extends
  let shapeChain: (typeof Shape)[] = getSuperShapesClasses(
    shapeClass as typeof Shape,
  );
  //include the shape itself as the first shape in the array
  shapeChain.unshift(shapeClass as typeof Shape);

  let propertyShape: PropertyShape;
  for (let sClass of shapeChain) {
    propertyShape = sClass.shape
      .getPropertyShapes()
      .find((propertyShape) => propertyShape.label === label);
    if (propertyShape) {
      break;
    }
  }
  return propertyShape;
}

//https://stackoverflow.com/a/30760236
export function isClass(v) {
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

export function getLeastSpecificShapeClasses(shapes: ICoreIterable<Shape>) {
  let shapeClasses = shapes.map((shape) =>
    getShapeClass(shape.nodeShape.id),
  );
  return filterShapesToLeastSpecific(shapeClasses);
}

export function getMostSpecificSubShapes(
  shape: typeof Shape | (typeof Shape)[],
): (typeof Shape)[] {
  if (!Array.isArray(shape)) {
    shape = [shape];
  }
  //get the subshapes of the given shapes
  let key = shape.map((s) => s.name).join(',');
  if (!mostSpecificSubShapesCache.has(key)) {
    //get the subshapes of the given shapes
    let subShapes: (typeof Shape)[] = getSubShapesClasses(shape, key);
    //filter them down to the most specific ones (that are not extended by any other shape)
    mostSpecificSubShapesCache.set(key, filterShapesToMostSpecific(subShapes));
  }
  return mostSpecificSubShapesCache.get(key);
}

/**
 * Filters out all shapes that are extended by any other shape in the given set/array
 * @param subShapes
 */
function filterShapesToMostSpecific(subShapes) {
  return subShapes.filter((subShape) => {
    return !subShapes.some((otherSubShape) => {
      return otherSubShape.prototype instanceof subShape;
    });
  });
}

/**
 * Filters out all shapes that extend any other shape in the given set/array
 * @param shapeClasses
 */
function filterShapesToLeastSpecific(shapeClasses) {
  return shapeClasses.filter((shapeClass) => {
    return !shapeClasses.some((otherShapeClass) => {
      return (
        otherShapeClass !== shapeClass &&
        shapeClass.prototype instanceof otherShapeClass
      );
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
export function getShapeOrSubShape<S extends Shape = Shape>(
  _node: unknown,
  _shape: typeof Shape | (typeof Shape)[],
): S {
  throw new Error(
    'getShapeOrSubShape requires RDF node models and is not supported in @_linked/core.',
  );
}

export function getMostSpecificShapes(
  _node: unknown,
  _baseShape: typeof Shape | (typeof Shape)[] = Shape,
): (typeof Shape)[] {
  throw new Error(
    'getMostSpecificShapes requires RDF node models and is not supported in @_linked/core.',
  );
}

export function getMostSpecificShapesByType(
  _node: unknown,
  _baseShape: typeof Shape | (typeof Shape)[] = Shape,
): (typeof Shape)[] {
  throw new Error(
    'getMostSpecificShapesByType requires RDF node models and is not supported in @_linked/core.',
  );
}

function getKey(shape: typeof Shape | (typeof Shape)[]) {
  return Array.isArray(shape)
    ? shape.map((s) => getShapeKey(s)).join(',')
    : getShapeKey(shape);
}

function getShapeKey(shape: typeof Shape) {
  //return a unique string for each shape
  return (
    resolveTargetClassId(shape.targetClass) ||
    shape.name + shape.prototype.constructor.toString().substring(0, 80)
  );
}

function getSubShapesClassesSortedBySpecificity(
  baseShape: typeof Shape | (typeof Shape)[] = Shape,
) {
  let key = getKey(baseShape);
  if (!subShapesSpecificityCache.has(key)) {
    let subShapes: (typeof Shape)[] = getSubShapesClasses(baseShape, key);
    let specificityGroups: (typeof Shape)[][] = [];
    while (subShapes.length > 0) {
      let mostSpecificSubShapes = filterShapesToMostSpecific(subShapes);
      specificityGroups.push(mostSpecificSubShapes);
      mostSpecificSubShapes.forEach((mostSpecificSubShape) => {
        subShapes.splice(subShapes.indexOf(mostSpecificSubShape), 1);
      });
    }
    subShapesSpecificityCache.set(key, specificityGroups);
  }
  return subShapesSpecificityCache.get(key);
}

function _getMostSpecificShapes(
  baseShape: typeof Shape | (typeof Shape)[] = Shape,
  shapeValidationFn,
) {
  //get the subshapes of the given base shape(s)
  let subShapes = getSubShapesClassesSortedBySpecificity(baseShape);

  let res;
  //for each group of most specific subshapes (before going to the next group of less specific subshapes)
  for (let subShapeGroup of subShapes) {
    //filter them down to the ones that this node is a valid instance of
    let shapesThatMatchNode = subShapeGroup.filter(shapeValidationFn); //if any of them can create a valid instance for this node, then return that

    //if any of them can create a valid instance for this node, then return that
    if (shapesThatMatchNode.length > 0) {
      res = shapesThatMatchNode;
      break;
    }
  }
  if (!res) {
    res = [];
  }
  return res;
}
