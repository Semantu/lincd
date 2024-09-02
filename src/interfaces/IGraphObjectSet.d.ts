import { NamedNode, Node } from '../models.js';
import { NodeSet } from '../collections/NodeSet.js';
import { QuadSet } from '../collections/QuadSet.js';
import { IGraphObject } from './IGraphObject.js';
import { ICoreIterable } from './ICoreIterable.js';
/**
 * a set of objects that all have IGraphObject methods, and this set itself also has those methods so you can call them directly on the set instead of for each item
 */
export interface IGraphObjectSet<R extends IGraphObject> extends IGraphObject, ICoreIterable<R> {
    getQuads(property: NamedNode): QuadSet;
    getInverseQuads(property: NamedNode): QuadSet;
    getAll(property: NamedNode): NodeSet;
    getAllInverse(property: NamedNode): NodeSet<NamedNode>;
    setEach(property: NamedNode, value: Node): boolean;
    msetEach(property: NamedNode, values: ICoreIterable<Node>): boolean;
    updateEach(property: NamedNode, value: Node): boolean;
    mupdateEach(property: NamedNode, values: ICoreIterable<Node>): boolean;
    unsetEach(property: NamedNode, value: Node): boolean;
    /**
     * Unset all values for the given property for each item in the set
     * @param property
     */
    unsetAllEach(property: NamedNode): boolean;
}
