/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {ICoreIterable} from '../interfaces/ICoreIterable';

export class CoreMap<K, V> extends Map<K, V> implements ICoreIterable<V> {
  createNew(...args): this {
    return new (<any>this.constructor)(...args) as this;
  }

  /**
   * Determines whether all the members of an array satisfy the specified test.
   * @param callbackfn A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
   * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
   */
  every(callbackfn: (value: V, key: K, map: CoreMap<K, V>) => boolean, thisArg?: any): boolean {
    for (let [key, value] of this) {
      if (!callbackfn.apply(thisArg, [value, key, this])) {
        return false;
      }
    }
    return true;
  }

  /**
   * Determines whether the specified callback function returns true for any element of an array.
   * @param callbackfn A function that accepts up to three arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
   * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
   */
  some(callbackfn: (value: V, key: K, map: CoreMap<K, V>) => boolean, thisArg?: any): boolean {
    for (let [key, value] of this) {
      if (callbackfn.apply(thisArg, [value, key, this])) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calls a defined callback function on each element of an array, and returns an array that contains the results.
   * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
   * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
   */
  map<U>(callbackfn: (value: V, key: K, map: Map<K, V>) => U, thisArg?: any): this {
    //create the result map, whos values will be 'mapped' into new values from the current values of this map
    //var mappedMap = new (<any> this.constructor)() as CoreMap<K,U>;
    var mappedMap = new (<any>this.constructor)(); // as CoreMap<K,U>;
    for (let [key, value] of this) {
      //do the mapping
      mappedMap.set(key, callbackfn.apply(thisArg, [value, key, this]));
    }
    return mappedMap;
  }

  /**
   * Returns the elements of an array that meet the condition specified in a callback function.
   * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
   * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
   */
  filter(callbackfn: (value: V, key: K, map: Map<K, V>) => any, thisArg?: any): this {
    //create the result map, whos values will be 'mapped' into new values from the current values of this map
    var filteredMap = new (<any>this.constructor)(); //this.createNew();//new Map<K,V>();
    for (let [key, value] of this) {
      //do the mapping
      if (callbackfn.apply(thisArg, [value, key, this])) {
        filteredMap.set(key, value);
      }
    }
    return filteredMap;
  }

  first(): V | null {
    return this.values().next().value;
  }

  /**
   * Returns the value of the first element in the Set where predicate is true, and undefined
   * otherwise.
   */
  find(predicate: (value: V, index: K, obj: CoreMap<K, V>) => boolean, thisArg?: any): V | undefined {
    for (let [key, value] of this) {
      if (predicate.apply(thisArg, [value, key, this])) {
        return value;
      }
    }
    return undefined;
  }

  merge(...maps: CoreMap<K, V>[]) {
    var res = this.createNew(this);
    for (var map of maps) {
      map.forEach((value, index) => {
        res.set(index, value);
      });
    }
    return res;
  }

  toString() {
    let res = 'Map:\n';
    for (let [key, value] of this) {
      res += '\t[' + key.toString() + '] => ' + value.toString() + '\n';
    }
    return res;
  }
}
