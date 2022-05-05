/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
//declare var require:Function;
//require('core-js/fn/set');
//import * as Set from 'core-js/es6/set';
import {Graph,Quad} from '../models';
import {CoreSet} from './CoreSet';
import {Node} from '../models';
import {NodeSet} from './NodeSet';
import {NamedNode} from '../models';

export class QuadSet extends CoreSet<Quad> {
	removeAll(alteration: boolean = false) {
			this.forEach((quad) => quad.remove(alteration));
	}

	moveTo(graph:Graph)
	{
		this.forEach(quad => quad.graph = graph);
	}

	makeExplicit()
	{
		this.forEach(quad => quad.makeExplicit())
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

	getNamedNodeObjects(): NodeSet<NamedNode> {
		var res = new NodeSet<NamedNode>();
		for (var quad of this) {
			//using instanceof NamedNode here will cause circular references
			if ('uri' in quad.object) {
				res.add(quad.object as NamedNode);
			}
		}
		return res;
	}

	getLiteralObjects(): NodeSet {
		var res = new NodeSet();
		for (var quad of this) {
			//using instanceof Literal here will cause circular references
			if (!('uri' in quad.object)) {
				res.add(quad.object);
			}
		}
		return res;
	}

	getLike(subject?: NamedNode, predicate?: NamedNode, object?: Node): this {
		return this.filter((quad) => {
			return (
				(!subject || quad.subject === subject) &&
				(!predicate || quad.predicate === predicate) &&
				(!object || quad.object === object)
			);
		});
	}

	getNamedNodes(): NodeSet<NamedNode> {
		return new NodeSet<NamedNode>()
			.concat(this.getSubjects())
			.concat(this.getPredicates())
			.concat(this.getNamedNodeObjects());
	}

	getNodes(): NodeSet {
		return new NodeSet()
			.concat(this.getSubjects())
			.concat(this.getPredicates())
			.concat(this.getObjects());
	}

	hasResource(resource: Node) {
		return this.some((quad) => {
			return (
				quad.subject === resource ||
				quad.predicate === resource ||
				quad.object === resource
			);
		});
	}

	getExplicit() {
		return this.filter((quad) => !quad.implicit);
	}

	getImplicit() {
		return this.filter((quad) => quad.implicit);
	}

	turnOn() {
		return this.forEach((t) => t.turnOn());
	}

	turnOff() {
		return this.forEach((t) => t.turnOff());
	}

	toString() {
		var str = '';
		this.forEach((item) => (str += '\t' + item.toString() + '\n'));
		return 'QuadSet(' + this.size + ') [\n' + str + ']';
	}
}
