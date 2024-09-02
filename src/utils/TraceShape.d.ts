import { Shape } from '../shapes/Shape.js';
import { NamedNode } from '../models.js';
import { PropertyShape } from '../shapes/SHACL.js';
export interface TraceShape extends Shape {
    requested: LinkedDataRequest;
    usedAccessors: any[];
    responses: any[];
}
export declare type SubRequest = LinkedDataRequest;
/**
 * An array of requested property shapes.
 * If you want to request specific property shapes of another property shape (this is called a SubRequest)
 * then replace a property shape with an array that contains the main property shape as the first element, and an array of property shapes as subRequest of that main property shape
 * e.g.: [shape1,[shape2,[shape3,shape4]]] will request shape 3 & 4 of shape 2
 */
export declare type LinkedDataRequest = SingleDataRequest[];
export declare type SingleDataRequest = PropertyShape | [PropertyShape, SubRequest];
export declare function createTraceShape<ShapeType extends Shape>(shapeClass: typeof Shape, shapeInstance?: Shape, debugName?: string): ShapeType & TraceShape;
export declare class TestNode extends NamedNode {
    property?: NamedNode;
    constructor(property?: NamedNode);
    getValue(): string;
    hasProperty(property: NamedNode): boolean;
    getAll(property: NamedNode): any;
    getOne(property: NamedNode): TestNode;
}
