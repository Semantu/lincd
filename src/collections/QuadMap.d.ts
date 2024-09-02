import { NamedNode, Node, Quad } from '../models.js';
import { NodeSet } from './NodeSet.js';
import { QuadSet } from './QuadSet.js';
import { CoreSet } from './CoreSet.js';
import { ICoreIterable } from '../interfaces/ICoreIterable.js';
/**
 * A map who's values are sets
 * When you iterate over this map with methods like map and forEach you'll iterate over the values of the sets
 */
declare class CoreMapToSet<K, S extends CoreSet<V>, V> extends Map<K, S> implements ICoreIterable<V> {
    /**
     * Determines whether all the members of an array satisfy the specified test.
     * @param callbackfn A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    every(callbackfn: (value: V, key: K, map: CoreMapToSet<K, S, V>) => boolean, thisArg?: any): boolean;
    /**
     * This object is a Map whos values are sets.
     * This forEach method calls the callback-function for each items in each of those sets.
     * The first parameter has the type of the items in the sets
     * The second parameter is the key
     * The type information can unfortunately not be defined as they would conflict with the usual forEach method
     * @param callbackfn
     * @param thisArg
     */
    forEach(callbackfn: (value: any, key: any, map: any) => void, thisArg?: any): void;
    /**
     * Determines whether the specified callback function returns true for any element of an array.
     * @param callbackfn A function that accepts up to three arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    some(callbackfn: (value: V, key: K, set: S, map: this) => boolean, thisArg?: any): boolean;
    /**
     * Maps all values contained in this map of set into a new single set
     * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    map<R extends CoreSet<any>>(callbackfn: (value: V, key: K, set: S, map: this) => any, resultType?: typeof CoreSet, thisArg?: any): R;
    /**
     * Returns the end values in the map that meet the condition specified in a callback function.
     * The result will be a single set of values
     * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    filter<R extends CoreSet<any>>(callbackfn: (value: V, key: K, set: S, map: this) => any, resultType?: typeof CoreSet, thisArg?: any): R;
    first(): V | null;
    /**
     * Returns the value of the first element in the Set where predicate is true, and undefined
     * otherwise.
     */
    find(predicate: (value: V, index: K, set: S) => boolean, thisArg?: any): V | undefined;
    toString(): string;
}
export declare class QuadMap extends CoreMapToSet<Node, QuadSet, Quad> {
    removeAll(alteration?: boolean): void;
    getSubjects(): NodeSet<NamedNode>;
    getPredicates(): NodeSet<NamedNode>;
    getObjects(): NodeSet;
    getQuadSet(): QuadSet;
    delete(v: any): boolean;
    __delete(v: any): boolean;
    __set(k: Node, v: Quad): void;
}
export {};
