/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {Quad} from '../models/Quad';
import {Node} from '../models/Node';
import {CoreMap} from './CoreMap';
import {NodeSet} from './NodeSet';
import {NamedNode} from '../models/NamedNode';

export class QuadMap extends CoreMap<Node, Quad> {
	removeAll(alteration: boolean = false) {
		this.forEach((quad) => quad.remove(alteration));
	}

	getSubjects(): NodeSet<NamedNode> {
		//return new NodeSet<NamedNode>(this.map(quad => quad.subject).values());
		//that's short, but probably this is faster:
		var res = new NodeSet<NamedNode>();
		for (var [key, quad] of this) {
			res.add(quad.subject);
		}
		return res;
	}

	getPredicates(): NodeSet<NamedNode> {
		var res = new NodeSet<NamedNode>();
		for (var [key, quad] of this) {
			res.add(quad.predicate);
		}
		return res;
	}

	getObjects(): NodeSet {
		var res = new NodeSet();
		for (var [key, quad] of this) {
			res.add(quad.object);
		}
		return res;
	}
}
