import { CoreSet } from './CoreSet.js';
import { NamedNode, Node } from '../models.js';
import { IGraphObjectSet } from '../interfaces/IGraphObjectSet.js';
import { QuadSet } from './QuadSet.js';
import { QuadArray } from './QuadArray.js';
import { ICoreIterable } from '../interfaces/ICoreIterable.js';
export declare class NodeSet<R extends Node = Node> extends CoreSet<R> implements IGraphObjectSet<Node> {
    constructor(iterable?: Iterable<R>);
    static fromValues<T extends Node = Node>(strings: string[]): NodeSet<T>;
    getProperties(includeFromIncomingArcs?: boolean): NodeSet<NamedNode>;
    getInverseProperties(): NodeSet<NamedNode>;
    getOne(property: NamedNode): Node | undefined;
    /**
     * Returns a NodeSet containing the merged results of node.get(property) for each node in this set
     * @param property
     * @returns {NodeSet}
     */
    getAll(property: NamedNode): NodeSet;
    getValues(property: NamedNode): string[];
    /**
     * Returns an array of the URI's or literal values (for Literals) of the nodes in this set
     */
    getNodeValues(): string[];
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
    getWhere(property: NamedNode, value: Node): Node | undefined;
    setEach(property: NamedNode, value: Node): boolean;
    msetEach(property: NamedNode, values: ICoreIterable<Node>): boolean;
    updateEach(property: NamedNode, value: Node): boolean;
    mupdateEach(property: NamedNode, values: ICoreIterable<Node>): boolean;
    unsetEach(property: NamedNode, value: Node): boolean;
    unsetAllEach(property: NamedNode): boolean;
    /**
     * @deprecated
     * @param loadInverseProperties
     */
    promiseLoaded(loadInverseProperties?: boolean): Promise<boolean>;
    /**
     * @deprecated
     * @param includingInverseProperties
     */
    isLoaded(includingInverseProperties?: boolean): boolean;
    toString(): string;
    print(includeIncomingProperties?: boolean): string;
}
