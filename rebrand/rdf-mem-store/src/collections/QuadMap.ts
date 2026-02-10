/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode,Node,Quad} from '../models.js';
import {NodeSet} from './NodeSet.js';
import {QuadSet} from './QuadSet.js';
import {CoreSet} from '@_linked/core/collections/CoreSet';
import {ICoreIterable} from '@_linked/core/interfaces/ICoreIterable';

/**
 * A map who's values are sets
 * When you iterate over this map with methods like map and forEach you'll iterate over the values of the sets
 */
class CoreMapToSet<K, S extends CoreSet<V>, V>
  extends Map<K, S>
  implements ICoreIterable<V>
{
  /**
   * Determines whether all the members of an array satisfy the specified test.
   * @param callbackfn A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
   * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
   */
  every(
    callbackfn: (value: V, key: K, map: CoreMapToSet<K, S, V>) => boolean,
    thisArg?: any,
  ): boolean {
    for (let [key, set] of this) {
      for (let value of set) {
        if (!callbackfn.apply(thisArg, [value, key, this])) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * This object is a Map whos values are sets.
   * This forEach method calls the callback-function for each items in each of those sets.
   * The first parameter has the type of the items in the sets
   * The second parameter is the key
   * The type information can unfortunately not be defined as they would conflict with the usual forEach method
   * @param callbackfn
   * @param thisArg
   */
  forEach(
    callbackfn: (value: any, key: any, map: any) => void,
    thisArg?: any,
  ): void {
    for (let [key, set] of this) {
      for (let value of set) {
        callbackfn.apply(thisArg, [value, key, this]);
      }
    }
  }

  /**
   * Determines whether the specified callback function returns true for any element of an array.
   * @param callbackfn A function that accepts up to three arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
   * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
   */
  some(
    callbackfn: (value: V, key: K, set: S, map: this) => boolean,
    thisArg?: any,
  ): boolean {
    for (let [key, set] of this) {
      for (let value of set) {
        if (callbackfn.apply(thisArg, [value, key, set, this])) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Maps all values contained in this map of set into a new single set
   * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
   * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
   */
  map<R extends CoreSet<any>>(
    callbackfn: (value: V, key: K, set: S, map: this) => any,
    resultType: typeof CoreSet = CoreSet,
    thisArg?: any,
  ): R {
    //create the result map, whos values will be 'mapped' into new values from the current values of this map
    //whilst maintaining set organisation
    var resultSet: CoreSet<any> = new resultType();
    for (let [key, set] of this) {
      for (let value of set) {
        //get the right set and add the mapped value to it
        resultSet.add(callbackfn.apply(thisArg, [value, key, set, this]));
      }
    }
    return resultSet as R;
  }

  /**
   * Returns the end values in the map that meet the condition specified in a callback function.
   * The result will be a single set of values
   * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
   * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
   */
  filter<R extends CoreSet<any>>(
    callbackfn: (value: V, key: K, set: S, map: this) => any,
    resultType: typeof CoreSet = CoreSet,
    thisArg?: any,
  ): R {
    //create the result map, whos values will be 'mapped' into new values from the current values of this map
    //whilst maintaining set organisation
    var resultSet: CoreSet<any> = new resultType();
    for (let [key, set] of this) {
      //use the type of the first set to determine the result type
      for (let value of set) {
        //if the filter function returns true-ish
        if (callbackfn.apply(thisArg, [value, key, set, this])) {
          //add to result set
          resultSet.add(value);
        }
      }
    }
    return resultSet as R;
  }

  first(): V | null {
    return this.values().next().value.first();
  }

  /**
   * Returns the value of the first element in the Set where predicate is true, and undefined
   * otherwise.
   */
  find(
    predicate: (value: V, index: K, set: S) => boolean,
    thisArg?: any,
  ): V | undefined {
    for (let [key, set] of this) {
      for (let value of set) {
        if (predicate.apply(thisArg, [value, key, this])) {
          return value;
        }
      }
    }
    return undefined;
  }

  toString() {
    let res = 'MapToSets:\n';
    for (let [key, set] of this) {
      res += '\t[' + key.toString() + '] => ' + set.toString() + '\n';
    }
    return res;
  }
}

export class QuadMap extends CoreMapToSet<Node, QuadSet, Quad> {
  removeAll(alteration: boolean = false) {
    this.forEach((quad) => quad.remove(alteration));
  }

  getSubjects(): NodeSet<NamedNode> {
    return this.map((quad) => quad.subject, NodeSet) as NodeSet<NamedNode>;
  }

  getPredicates(): NodeSet<NamedNode> {
    return this.map((quad) => quad.predicate, NodeSet) as NodeSet<NamedNode>;
  }

  getObjects(): NodeSet {
    return this.map((quad) => quad.predicate, NodeSet);
  }

  getQuadSet(): QuadSet {
    return this.map((q) => q, QuadSet);
  }

  delete(v): boolean {
    throw new Error(
      'Do not delete values directly from a QuadMap. Either create a new set of all values with getQuadSet() or use methods like map() and filter() which also return a new set.',
    );
    return false;
  }

  __delete(v) {
    return super.delete(v);
  }

  __set(k: Node, v: Quad) {
    //make sure we have a QuadSet ready for that key
    if (!this.has(k)) {
      this.set(k, new QuadSet());
    }
    //then add this quad to that set
    this.get(k).add(v);
  }
}
