import { NodeSet } from '../collections/NodeSet.js';
import { BlankNode, NamedNode, Node } from '../models.js';
import { Shape } from './Shape.js';
export declare class List extends Shape {
    static targetClass: NamedNode;
    constructor(blanknode?: BlankNode);
    /**
     * Create a new list from a given set of nodes
     * Most performant way to create a new list if you already have the items in the list
     * @param items
     */
    static createFrom(items: NodeSet | Node[]): List;
    /**
     * Returns the contents of a rdf.List
     * Will return an empty set if the given node is not a list
     * @param list
     * @param result
     * @private
     */
    static getContents(list: NamedNode, result?: NodeSet<Node>): NodeSet;
    private static getFirstItem;
    private static appendItems;
    private static getLastListItem;
    private static _createListEntry;
    private static _append;
    getContents(): NodeSet<Node>;
    isEmpty(): boolean;
    addItem(item: Node): void;
    addItems(items: NodeSet | Node[]): void;
}
