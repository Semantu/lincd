import { NodeSet } from '../collections/NodeSet.js';
import { NamedNode } from '../models.js';
export declare class Order {
    static propertiesByDepth(properties: NodeSet<NamedNode>): NodeSet<NamedNode>;
    /**
     * Counts the number of connections each node makes to antoher
     * and then returns a new set of the same nodes sorted by that numb connections with the most connections first
     * @param nodes
     * @param property
     * @param shortestPathFirst
     * @returns {NodeSet<NamedNode>}
     */
    static byCrossPaths(nodes: NodeSet, property: NamedNode, shortestPathFirst?: boolean): NodeSet;
    private static getCrossPaths;
}
