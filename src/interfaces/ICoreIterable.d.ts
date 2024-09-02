/**
 * Pretty open and general interface that closely resembles JS Arrays.
 * other classes like CoreMap and CoreSet can implement this so that we know which methods are available
 */
export interface ICoreIterable<V> extends Iterable<any> {
    forEach: (callbackFn: (item: V, index?: any, iterable?: any) => void, context?: any) => void;
    size?: number;
    length?: number;
    filter(callbackfn: (value: V, index: any, thisInstance: any) => any, thisArg?: any): Iterable<any>;
    find(predicate: (value: V, index: any, obj: ICoreIterable<V>) => boolean, thisArg?: any): V | undefined;
    every(callbackfn: (item: V) => boolean, thisArg?: any): boolean;
    some(callbackfn: (item: V) => boolean, thisArg?: any): boolean;
    map<U>(callbackfn: (item: V) => U, thisArg?: any): any;
}
