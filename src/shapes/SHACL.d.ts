import { NamedNode, Node } from '../models.js';
import { Shape } from './Shape.js';
import { List } from './List.js';
import { ShapeSet } from '../collections/ShapeSet.js';
import { NodeSet } from '../collections/NodeSet.js';
import { CoreMap } from '../collections/CoreMap.js';
export declare class SHACL_Shape extends Shape {
    static targetClass: NamedNode;
    get type(): NamedNode;
    set type(val: NamedNode);
    protected _validateNode(node: NamedNode, validated?: CoreMap<Node, boolean>): boolean;
}
export declare class NodeShape extends SHACL_Shape {
    static targetClass: NamedNode;
    get targetNode(): NamedNode;
    set targetNode(value: NamedNode);
    get targetClass(): NamedNode;
    set targetClass(value: NamedNode);
    get in(): NamedNode;
    set in(value: NamedNode);
    get inList(): List;
    set inList(value: List);
    static getShapesOf(node: Node): ShapeSet<NodeShape>;
    addPropertyShape(property: PropertyShape): void;
    getPropertyShapes(): ShapeSet<PropertyShape>;
    /**
     * Returns all the classes and properties that are references by this shape
     */
    getOntologyEntities(): NodeSet<NamedNode>;
    validateNode(node: Node): boolean;
    protected _validateNode(node: Node, validated?: CoreMap<Node, boolean>): boolean;
}
export declare class PropertyShape extends SHACL_Shape {
    static targetClass: NamedNode;
    get class(): NamedNode;
    set class(value: NamedNode);
    /**
     * Returns the NodeShape that all value nodes need to conform to
     * On a graph level this accessor returns the value of shacl:node for this PropertyShape (if any)
     * Note: it's named valueShape because node & nodeShape are already used internally in LINCD
     * @see https://www.w3.org/TR/shacl/#NodeConstraintComponent
     *
     */
    get valueShape(): NodeShape;
    set valueShape(value: NodeShape);
    get nodeKind(): NamedNode;
    set nodeKind(value: NamedNode);
    get datatype(): NamedNode;
    set datatype(value: NamedNode);
    get maxCount(): number;
    set maxCount(value: number);
    get minCount(): number;
    set minCount(value: number);
    get name(): string;
    set name(value: string);
    get optional(): string;
    set optional(value: string);
    get path(): NamedNode;
    set path(value: NamedNode);
    get parentNodeShape(): NodeShape;
    /**
     * Returns all the classes and properties that are references by this shape
     */
    getOntologyEntities(): NodeSet<NamedNode>;
    validateNode(node: NamedNode): boolean;
    resolveFor(node: NamedNode): import("../collections/NodeValuesSet.js").NodeValuesSet;
    protected _validateNode(node: NamedNode, validated?: CoreMap<Node, boolean>): boolean;
}
