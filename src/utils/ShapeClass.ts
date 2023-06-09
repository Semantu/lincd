import {NamedNode,Node} from '../models';
import {Shape} from '../shapes/Shape';
import {NodeShape} from '../shapes/SHACL';

let nodeShapeToShapeClass: Map<NamedNode,typeof Shape> = new Map();
export function addNodeShapeToShapeClass(nodeShape:NodeShape,shapeClass: typeof Shape) {
  nodeShapeToShapeClass.set(nodeShape.namedNode,shapeClass);
}
export function getShapeClass(nodeShape:NamedNode):typeof Shape {
  return nodeShapeToShapeClass.get(nodeShape);
}

export function getSubShapesClasses(shape:typeof Shape|typeof Shape[]):typeof Shape[] {
  let extendsGivenShapeClass = Array.isArray(shape) ? (shapeClass) => {
      return shape.some(s => shapeClass.constructor.prototype instanceof s);
    } : (shapeClass) => {
      return shapeClass.constructor.prototype instanceof shape;
    }

  let result = [];
  nodeShapeToShapeClass.forEach((shapeClass) => {
    if(extendsGivenShapeClass(shapeClass)) {
      result.push(shapeClass);
    }
  });
  return result;
}

export function getMostSpecificSubShapes(shape:typeof Shape|typeof Shape[]):typeof Shape[] {
  if(!Array.isArray(shape)) {
    shape = [shape];
  }
  //get the subshapes of the given shapes
  let subShapes:typeof Shape[] = getSubShapesClasses(shape);
  //filter them down to the most specific ones (that are not extended by any other shape)
  return subShapes.filter(subShape => {
    return !subShapes.some(otherSubShape => {
      return otherSubShape.prototype instanceof subShape;
    });
  })
}
/**
 * Finds the most specific shape class (which extends other shape classes)
 * of all shape classes that this node matches with (that is the node is a valid instance of the shape)
 * And returns an instance of that shape
 * @param property
 * @param shape
 */
export function getShapeOrSubShape<S extends Shape = Shape>(node,shape: typeof Shape|typeof Shape[]): S
{
  if(!node) return null;


  //new:
  //find all shapes that extend the given shape(s)
  let mostSpecificShapes = getMostSpecificShapes(node,shape);

  //take the first one and return a new instance of that shape
  if(mostSpecificShapes.length > 0) {
    return new (mostSpecificShapes[0] as any)(node) as S;
  }
  //by default, if no more specific shapes were found, just create an instance of the (first) given shape
  if(Array.isArray(shape)) {
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



export function getMostSpecificShapes(node:NamedNode,baseShape:typeof Shape|typeof Shape[]=Shape):typeof Shape[] {
  //get the most specific shapes of the given base shape
  let mostSpecificSubShapes = getMostSpecificSubShapes(baseShape);
  //filter them down to the ones that this node is a valid instance of
  return mostSpecificSubShapes.filter(subShape => {
    return subShape.shape.validateNode(node);
  })
}