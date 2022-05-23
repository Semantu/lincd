/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {ICoreIterable} from '../interfaces/ICoreIterable';

declare var dprint: (item, includeIncomingProperties?: boolean) => void;

export class CoreSet<R> extends Set<R> implements ICoreIterable<R> {
	createNew(...args): this {
		return new (<any>this.constructor)(...args) as this;
	}

	filter(fn: (value: R, index: any, thisInstance: any) => any): this {
		var res: this = this.createNew();
		for (var item of this) {
			if (fn(item, item, this)) {
				res.add(item);
			}
		}
		return res;
	}

	/**
	 * Returns the value of the first element in the Set where predicate is true, and undefined
	 * otherwise.
	 */
	find(
		predicate: (value: R, index: R, obj: CoreSet<R>) => boolean,
		thisArg?: any,
	): R | undefined {
		for (let item of this) {
			if (predicate.apply(thisArg, [item, item, this])) {
				return item;
			}
		}
		return undefined;
	}

	first(): R | undefined {
		return this.values().next().value;
	}

	getFirst(n: number = 1) {
		return this.createNew([...this].slice(0, n));
	}

	slice(start: number, end: number) {
		return this.createNew([...this].slice(start, end));
	}

	sort(compareFn?: (a: R, b: R) => number, thisArg?): this {
		//convert this set to an array, sort it with provided parameters, create a new set of the same type and provide the sorted array as content
		var sortedArray = thisArg
			? [...this].sort.apply(thisArg, [compareFn])
			: [...this].sort(compareFn);
		return this.createNew(sortedArray);
	}

	/**
	 * Determines whether all the members of an array satisfy the specified test.
	 * @param callbackfn A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
	 * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
	 */
	every(
		callbackfn: (item: R, set: CoreSet<R>) => boolean,
		thisArg?: any,
	): boolean {
		for (let item of this) {
			if (!callbackfn.apply(thisArg, [item, this])) {
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
	some(
		callbackfn: (item: R, set: CoreSet<R>) => boolean,
		thisArg?: any,
	): boolean {
		for (let item of this) {
			if (callbackfn.apply(thisArg, [item, this])) {
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
	map<U>(callbackfn: (item: R, set: CoreSet<R>) => U, thisArg?: any): U[] {
		//NOTE: we changed this method so that it returns an array because it
		// causes trouble in ES5 when we create a new CoreSet and try to add the mapped results which may not have a unique toString() implementation (like in React)

		//create the result map, whos values will be 'mapped' into new values from the current values of this map
		var mapped: U[] = [];
		for (let item of this) {
			//do the mapping
			mapped.push(callbackfn.apply(thisArg, [item, this]));
		}
		return mapped;
	}

	concat(...sets: ICoreIterable<R>[]): this {
		var res = this.createNew(this);
		for (var set of sets) {
			set.forEach(res.add.bind(res));
		}
		return res;
	}

	clone(): this {
		return this.createNew(this);
	}

	reverse(): this {
		return this.createNew([...this].reverse());
	}

	print(includeIncomingProperties: boolean = true) {
		dprint(this, includeIncomingProperties);
	}
}
