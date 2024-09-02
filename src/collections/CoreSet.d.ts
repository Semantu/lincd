import { ICoreIterable } from '../interfaces/ICoreIterable.js';
export declare class CoreSet<R> extends Set<R> implements ICoreIterable<R> {
    createNew(...args: any[]): this;
    filter(fn: (value: R, index: any, thisInstance: any) => any): this;
    /**
     * Returns the value of the first element in the Set where predicate is true, and undefined
     * otherwise.
     */
    find(predicate: (value: R, index: R, obj: CoreSet<R>) => boolean, thisArg?: any): R | undefined;
    first(): R | undefined;
    /**
     * Returns the last element added to the set
     */
    last(): R;
    getFirst(n: number): this;
    slice(start?: number, end?: number): this;
    sort(compareFn?: (a: R, b: R) => number, thisArg?: any): this;
    /**
     * Determines whether all the members of an array satisfy the specified test.
     * @param callbackfn A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    every(callbackfn: (item: R, set: CoreSet<R>) => boolean, thisArg?: any): boolean;
    /**
     * Determines whether the specified callback function returns true for any element of an array.
     * @param callbackfn A function that accepts up to three arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    some(callbackfn: (item: R, set: CoreSet<R>) => boolean, thisArg?: any): boolean;
    /**
     * Calls a defined callback function on each element of the set, and returns an ARRAY that contains the results.
     * Note that this method returns an array so that sets can be more easily used with for example JSX
     * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    map<U>(callbackfn: (item: R, set: CoreSet<R>) => U, thisArg?: any): U[];
    concat(...sets: ICoreIterable<R>[]): this;
    clone(): this;
    reverse(): this;
    print(): void;
    /**
     * Similar to concat, but adds all items to THIS set instead of creating a new one
     * @param sets
     */
    addFrom(...sets: ICoreIterable<R>[]): this;
}
