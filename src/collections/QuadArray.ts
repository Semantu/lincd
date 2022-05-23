/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {Graph, NamedNode, Quad} from '../models';
import {NodeSet} from './NodeSet';

//TODO: test performance of QuadArray vs QuadSet and probably remove QuadArray
export class QuadArray extends Array<Quad> {
	removeAll(alteration: boolean = false) {
		this.forEach((quad) => quad.remove(alteration));
	}

	moveTo(graph: Graph) {
		this.forEach((quad) => (quad.graph = graph));
	}

	makeExplicit() {
		this.forEach((quad) => quad.makeExplicit());
	}

	getSubjects(): NodeSet<NamedNode> {
		//return new NamedNodeSet(this.map(quad => quad.subject).values());
		//that's short, but probably this is faster:
		var res = new NodeSet<NamedNode>();
		for (var quad of this) {
			res.add(quad.subject);
		}
		return res;
	}

	getPredicates(): NodeSet<NamedNode> {
		var res = new NodeSet<NamedNode>();
		for (var quad of this) {
			res.add(quad.predicate);
		}
		return res;
	}

	getObjects(): NodeSet {
		var res = new NodeSet();
		for (var quad of this) {
			res.add(quad.object);
		}
		return res;
	}

	getExplicit() {
		return this.filter((quad) => !quad.implicit);
	}

	getImplicit() {
		return this.filter((quad) => quad.implicit);
	}

	turnOn() {
		this.forEach((quad) => quad.turnOn());
	}

	turnOff() {
		this.forEach((quad) => quad.turnOff());
	}

	toString() {
		//without this the toString() would print 3 URI's for each quad followed by a ',' which looks messy and unclear
		return this.join('\n');
	}
}
