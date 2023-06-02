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

/**
 * Finds the most specific shape class (which extends other shape classes)
 * of all shape classes that this node matches with (that is the node is a valid instance of the shape)
 * @param property
 * @param shape
 */
export function getShapeOrSubShape<S extends Shape = Shape>(node,shape: typeof Shape|typeof Shape[]): S
{
  if(!node) return null;
  //start with the shape itself, but add any extending shapes
  let extendingShapes:typeof Shape[] = [];

  //if shape is an array, we check if the node is an instance of any of the shapes in the array
  //NOTE: I'm not exactly sure why we have to add .constructor, but the shapeClasses coming in are
  //apparently not of the same kind (class) as the shapeClasses in the nodeShapeToShapeClass map
  //so, we have to compare by its constructors prototype, that seems to work
  let classExtendsGivenShapeClass = Array.isArray(shape) ? (shapeClass) => {
    return shape.some(s => shapeClass.constructor.prototype instanceof s);
  } : (shapeClass) => {
    return shapeClass.constructor.prototype instanceof shape;
  }

  let shapesOfNode = NodeShape.getShapesOf(node);
  shapesOfNode.forEach(nodeShape => {
    let shapeClass = getShapeClass(nodeShape.namedNode);
    if(classExtendsGivenShapeClass(shapeClass.prototype)) {
      extendingShapes.push(shapeClass);
    }
  })
  extendingShapes.sort((s1,s2) => {
    return s1.prototype instanceof s2 ? -1 : 1;
  });
  if(extendingShapes.length > 0) {
    return new (extendingShapes[0] as any)(node) as S;
  }
  return new (shape as any)(node) as S;
}