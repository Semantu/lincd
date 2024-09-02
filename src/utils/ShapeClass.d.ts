import { NamedNode } from '../models.js';
import { Shape } from '../shapes/Shape.js';
import { NodeShape, PropertyShape } from '../shapes/SHACL.js';
import { ICoreIterable } from '../interfaces/ICoreIterable.js';
export declare function addNodeShapeToShapeClass(nodeShape: NodeShape, shapeClass: typeof Shape): void;
export declare function getShapeClass(nodeShape: NamedNode): typeof Shape;
/**
 * Returns all the sub shapes of the given shape
 * That is all the shapes that extend this shape
 * @param shape
 */
export declare function getSubShapesClasses(shape: typeof Shape | (typeof Shape)[]): (typeof Shape)[];
/**
 * Returns all the superclasses of the given shape
 * That is all the shapes that it extends.
 * Results are sorted from most specific to least specific
 * @param shape
 */
export declare function getSuperShapesClasses(shape: typeof Shape | (typeof Shape)[]): (typeof Shape)[];
export declare function getPropertyShapeByLabel(shapeClass: typeof Shape, label: string): PropertyShape;
export declare function isClass(v: any): boolean;
export declare function hasSuperClass(a: Function, b: Function): boolean;
export declare function hasSubClass(a: Function, b: Function): boolean;
export declare function getLeastSpecificShapeClasses(shapes: ICoreIterable<Shape>): any;
export declare function getMostSpecificSubShapes(shape: typeof Shape | (typeof Shape)[]): (typeof Shape)[];
/**
 * Finds the most specific shape class (which extends other shape classes)
 * of all shape classes that this node matches with (that is the node is a valid instance of the shape)
 * And returns an instance of that shape
 * @param property
 * @param shape
 */
export declare function getShapeOrSubShape<S extends Shape = Shape>(node: any, shape: typeof Shape | (typeof Shape)[]): S;
export declare function getMostSpecificShapes(node: NamedNode, baseShape?: typeof Shape | (typeof Shape)[]): (typeof Shape)[];
