import { NamedNode } from '../models.js';
import { ShapeSet } from './ShapeSet.js';
import { Shape } from '../shapes/Shape.js';
import { QuadSet } from './QuadSet.js';
export declare class ShapeValuesSet<S extends Shape = Shape> extends ShapeSet<S> {
    private subject;
    private property;
    private shapeClass;
    private allowSubShapes;
    constructor(subject: NamedNode, property: NamedNode, shapeClass: typeof Shape, allowSubShapes?: boolean);
    /**
     * When cloned (by .filter() or .sort()) we switch to a ShapeSet of all the values
     * And detach from the magic of PropertyValueShapeSets that automatically add and remove items
     * @param args
     */
    createNew(...args: any[]): any;
    /**
     * Add a new Shape to this set of values.
     * This creates a new quad in the local graph.
     * This is equivalent to manually adding a new property value using `subject.set(predicate,object)`
     * @param value the node to add
     */
    add(value: S): this;
    /**
     * Remove a Shape from this set of values.
     * Also removes a quad in the local graph (if the node was an existing value)
     * This is equivalent to manually removing a property value using `subject.unset(predicate,object)`
     * @param value the node to remove
     */
    delete(value: S): boolean;
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
}
