import { CoreSet } from './CoreSet.js';
import { NamedNode, Node } from '../models.js';
import { Shape } from '../shapes/Shape.js';
import { IGraphObjectSet } from '../interfaces/IGraphObjectSet.js';
import { QuadSet } from './QuadSet.js';
import { QuadArray } from './QuadArray.js';
import { NodeSet } from './NodeSet.js';
import { ICoreIterable } from '../interfaces/ICoreIterable.js';
export declare class ShapeSet<R extends Shape = Shape> extends CoreSet<R> implements IGraphObjectSet<R> {
    constructor(iterable?: Iterable<R>);
    getLeastSpecificShape(): any;
    /**
     * Returns true if this set contains the exact same shape OR a shape that has same node and is an instance of the same class as the given shape
     * Why? you can create two identical shapes of the same node, but they are not the same instance
     * To avoid having to account for that, by default, ShapeSets return true if the node matches and the shapes are instances of the same class
     * @param value the shape you want to check for
     * @param matchOnNodes set to false if you only want to check for true matches of identical instances
     */
    has(value: R, matchOnNodes?: boolean): boolean;
    delete(value: R): boolean;
    getProperties(includeFromIncomingArcs?: boolean): NodeSet<NamedNode>;
    concat(...sets: ICoreIterable<R>[]): this;
    getInverseProperties(): NodeSet<NamedNode>;
    getOne(property: NamedNode): Node | undefined;
    /**
     * Returns a NodeSet containing the merged results of node.get(property) for each node in this set
     * @param property
     * @returns {NodeSet}
     */
    getAll(property: NamedNode): NodeSet;
    getOneFromPath(...properties: NamedNode[]): Node | undefined;
    getAllFromPath(...properties: NamedNode[]): NodeSet;
    getOneInverse(property: NamedNode): NamedNode | undefined;
    getAllInverse(property: NamedNode): NodeSet<NamedNode>;
    getMultipleInverse(properties: ICoreIterable<NamedNode>): NodeSet;
    getMultiple(properties: ICoreIterable<NamedNode>): NodeSet;
    getDeep(property: NamedNode, maxDepth?: number): NodeSet;
    getQuads(property: NamedNode): QuadSet;
    getInverseQuads(property: NamedNode): QuadSet | any;
    getAllQuads(includeAsObject?: boolean, includeImplicit?: boolean): QuadArray;
    getAllInverseQuads(includeImplicit?: boolean): QuadArray;
    where(property: NamedNode, value: Node): this;
    getWhere(property: NamedNode, value: Node): Shape | undefined;
    setEach(property: NamedNode, value: Node): boolean;
    msetEach(property: NamedNode, values: ICoreIterable<Node>): boolean;
    updateEach(property: NamedNode, value: Node): boolean;
    mupdateEach(property: NamedNode, values: ICoreIterable<Node>): boolean;
    unsetEach(property: NamedNode, value: Node): boolean;
    unsetAllEach(property: NamedNode): boolean;
    getNodes(): NodeSet;
    promiseLoaded(loadInverseProperties?: boolean): Promise<boolean>;
    isLoaded(includingInverseProperties?: boolean): boolean;
    toString(): string;
}
