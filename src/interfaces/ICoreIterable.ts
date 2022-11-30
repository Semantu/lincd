/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
/**
 * Pretty open and general interface that closely resembles JS Arrays.
 * other classes like CoreMap and CoreSet can implement this so that we know which methods are available
 */
//extending Iterable<ANY> because Maps and Sets use different iterator setups that would not match with type definitions
//this allows us to still use iterators for ICoreIterable but without typing information, although for all methods below it works
export interface ICoreIterable<V> extends Iterable<any> {
  forEach: (callbackFn: (item: V, index?: any, iterable?: any) => void, context?: any) => void;

  filter(callbackfn: (value: V, index: any, thisInstance: any) => any, thisArg?: any): Iterable<any>;

  find(predicate: (value: V, index: any, obj: ICoreIterable<V>) => boolean, thisArg?: any): V | undefined;

  every(callbackfn: (item: V) => boolean, thisArg?: any): boolean;

  some(callbackfn: (item: V) => boolean, thisArg?: any): boolean;

  map<U>(callbackfn: (item: V) => U, thisArg?: any): any;

  size?: number;
  length?: number;
}
