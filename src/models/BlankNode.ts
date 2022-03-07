/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode} from './NamedNode';

export class BlankNode extends NamedNode {
	private static counter: number = 0;

	termType: any = 'BlankNode';
	constructor() {
		//passing true because a BlankNode is always a "local node", as it's URI is only valid in local context
		super(BlankNode.createUri(), true);
		NamedNode.register(this);
	}

	static create(): BlankNode {
		return new BlankNode();
	}

	static createUri() {
		return '_:' + this.counter++;
	}
}
