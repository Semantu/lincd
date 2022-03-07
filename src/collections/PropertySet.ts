/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NodeSet} from './NodeSet';
import {Node} from '../models/Node';

export class PropertySet extends NodeSet {
	constructor(iterable?: Iterable<Node>) {
		super(iterable);
	}

	createNew(...args): any {
		return new NodeSet(...args);
	}

	add(v): this {
		throw new Error(
			'Do not add values directly to a PropertySet. Instead use a copy of the set before manipulating it. Either create a new set or use methods like sort() and filter() which also return a new set.',
		);
		return this;
	}

	delete(v): boolean {
		throw new Error(
			'Do not delete values directly to a PropertySet. Instead use a copy of the set before manipulating it. Either create a new set or use methods like sort() and filter() which also return a new set.',
		);
		return false;
	}

	__delete(v) {
		return super.delete(v);
	}

	__add(v) {
		return super.add(v);
	}

	//here we overload the type definitions to indicate its a NodeSet that will be returned
	//HOWEVER, without '|any' this will not be expected by Typescript unless we find a really intricate way of rewriting all methods of CoreSet / CoreIterable that return this into methods that return ...?
	sort(compareFn?, thisArg?): NodeSet | any {
		return super.sort(compareFn, thisArg) as NodeSet;
	}

	concat(...sets): NodeSet | any {
		return super.concat(...sets) as NodeSet;
	}

	filter(fn): this {
		return super.filter(fn) as NodeSet | any;
	}
}
