import { NodeSet } from './NodeSet.js';
import { NamedNode, Node } from '../models.js';
import { QuadSet } from './QuadSet.js';
export declare class NodeValuesSet extends NodeSet {
    private _subject;
    private _property;
    constructor(_subject: Node, _property: NamedNode, iterable?: Iterable<Node>);
    get subject(): Node;
    get property(): NamedNode;
    /**
     * Listen to any changes in the valueset for this subject + property combination
     * If you provide context (usually 'this'), removing the onChange listener will remove all listeners for this property & context, regardless of what callback you provide. (this is helpful if you dont have access to the excact same callback function)
     * @param callback
     * @param context
     */
    onChange(callback: (quads?: QuadSet, property?: NamedNode) => void, context?: any): void;
    /**
     * Remove listener for changes in the valueset for this subject + property combination
     * If you provide context (usually 'this'), removing the onChange listener will remove all listeners for this property & context, regardless of what callback you provide. (this is helpful if you dont have access to the excact same callback function)
     * @param callback
     * @param context
     */
    removeOnChange(callback: (quads?: QuadSet, property?: NamedNode) => void, context?: any): void;
    /**
     * When cloned we switch to a NodeSet of all the values
     * And detach from the magic of PropertyValueSets, which are only meant to be used internally in the NamedNode model
     * @param args
     */
    createNew(...args: any[]): any;
    /**
     * Add a new node to this set of values.
     * This creates a new quad in the local graph.
     * This is equivalent to manually adding a new property value using `subject.set(predicate,object)`
     * @param value the node to add
     */
    add(value: Node): this;
    /**
     * Remove a node from this set of values.
     * This removes a quad in the local graph (if the node was an existing value)
     * This is equivalent to manually removing a property value using `subject.unset(predicate,object)`
     * @param value the node to remove
     */
    delete(value: Node): boolean;
    /**
     * Actually removes a node from this value set. Does not remove any quads in the local graph
     * DO NOT use this method.
     * Use subject.getAll(predicate).remove(object) or subject.unset(predicate,object) instead
     * @internal
     * @param v
     */
    __delete(v: any): boolean;
    /**
     * Adds a value directly to this value set. Does not create new quads in the local graph
     * DO NOT USE this method.
     * Use subject.getAll(predicate).add(object) or subject.set(predicate,object) instead.
     * @internal
     * @param v
     */
    __add(v: any): this;
    sort(compareFn?: any, thisArg?: any): NodeSet | any;
    concat(...sets: any[]): NodeSet | any;
    filter(fn: any): this;
}
