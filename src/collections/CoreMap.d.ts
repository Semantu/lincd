import { ICoreIterable } from '../interfaces/ICoreIterable.js';
export declare class CoreMap<K, V> extends Map<K, V> implements ICoreIterable<V> {
    createNew(...args: any[]): this;
    /**
     * Determines whether all the members of an array satisfy the specified test.
     * @param callbackfn A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    every(callbackfn: (value: V, key: K, map: CoreMap<K, V>) => boolean, thisArg?: any): boolean;
    /**
     * Determines whether the specified callback function returns true for any element of an array.
     * @param callbackfn A function that accepts up to three arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    some(callbackfn: (value: V, key: K, map: CoreMap<K, V>) => boolean, thisArg?: any): boolean;
    /**
     * Calls a defined callback function on each element of an array, and returns an array that contains the results.
     * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    map<U>(callbackfn: (value: V, key: K, map: Map<K, V>) => U, thisArg?: any): this;
    /**
     * Returns the elements of an array that meet the condition specified in a callback function.
     * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    filter(callbackfn: (value: V, key: K, map: Map<K, V>) => any, thisArg?: any): this;
    first(): V | null;
    /**
     * Returns the value of the first element in the Set where predicate is true, and undefined
     * otherwise.
     */
    find(predicate: (value: V, index: K, obj: CoreMap<K, V>) => boolean, thisArg?: any): V | undefined;
    merge(...maps: CoreMap<K, V>[]): this;
    toString(): string;
    print(): void;
}
