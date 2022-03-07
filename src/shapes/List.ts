/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NodeSet} from '../collections/NodeSet';
import {rdf} from '../ontologies/rdf';
import {NamedNode} from '../models/NamedNode';
import {Node} from '../models/Node';
import {BlankNode} from '../models/BlankNode';
import {Shape} from './Shape';

export class List extends Shape {
	static targetClass: NamedNode = rdf.List;

	constructor(blanknode: BlankNode = new BlankNode()) {
		super(blanknode);
		if (
			!blanknode.hasProperty(rdf.first) &&
			!blanknode.has(rdf.rest, rdf.nil)
		) {
			//starting a NEW empty list is a bit difficult. Because officially the only empty list is rdf:nil.
			//But then how do we later add things to that list? We would need to switch out the node of this instance, which is not ideal in case the consumer of this class had saved/used that node already
			//So instead we're using a blanknode with rdf:type rdf:List
			blanknode.set(rdf.type, rdf.List);
		}
	}

	getContents() {
		return List.getContentNodes(this.namedNode);
	}

	isEmpty() {
		return !this.hasProperty(rdf.first);
	}
	addItem(item: Node) {
		//we need to check if the list is empty when adding items one by one
		//we keep this out of _append for performance reasons
		if (this.isEmpty()) {
			this.set(rdf.first, item);
			this.set(rdf.rest, rdf.nil);
		} else {
			List._append(item, List.getLastListItem(this.namedNode));
		}
	}

	private static getFirstItem(items: NodeSet | Node[]) {
		if (items instanceof NodeSet) {
			let firstItem = items.first();
			items.delete(firstItem);
			return firstItem;
		} else {
			return items.shift();
		}
	}
	addItems(items: NodeSet | Node[]) {
		let endPoint;
		if (this.isEmpty()) {
			endPoint = this.node;
			let firstItem = List.getFirstItem(items);
			this.set(rdf.first, firstItem);
		} else {
			endPoint = List.getLastListItem(this.namedNode);
		}

		//add all items to the end of the list
		List.appendItems(endPoint, items);
	}

	private static appendItems(endPoint, items) {
		items.forEach((item) => {
			let rest = List._createListEntry(item);
			endPoint.set(rdf.rest, rest);
			endPoint = rest;
		});
		//close the list
		endPoint.set(rdf.rest, rdf.nil);

		return endPoint;
	}

	//TODO: not working, needs to be fixed
	//see example here: http://www.snee.com/bobdc.blog/2014/04/rdf-lists-and-sparql.html
	// removeItem(item: Node): boolean {
	// 	return this._removeItem(this.namedNode, item);
	// }
	// private _removeItem(list: NamedNode, item: Node): boolean {
	// 	if (list.has(rdf.first, item)) {
	// 		let prev = list.getOneInverse(rdf.rest);
	// 		prev.overwrite(rdf.rest, list.getOne(rdf.rest));
	// 		list.remove();
	// 		return true;
	// 	} else if (!list.has(rdf.rest, rdf.nil)) {
	// 		return this._removeItem(list.getOne(rdf.rest) as NamedNode, item);
	// 	}
	// }

	private static getLastListItem(list: NamedNode) {
		let last;
		while (list && !list.has(rdf.rest, rdf.nil)) {
			last = list;
			list = list.getOne(rdf.rest) as NamedNode;
		}
		return list || last;
	}

	private static _createListEntry(item: Node): BlankNode {
		let list = BlankNode.create();
		list.set(rdf.first, item);
		list.set(rdf.rest, rdf.nil);
		return list;
	}
	private static _append(item: Node, last: NamedNode): NamedNode {
		let next = this._createListEntry(item);
		last.overwrite(rdf.rest, next);
		return next;
	}

	/**
	 * Create a new list from a given set of nodes
	 * Most performant way to create a new list if you already have the items in the list
	 * @param items
	 */
	static createFrom(items: NodeSet | Node[]): List {
		//NOTE: this method exists because new List(nodes) will not work because all shapes require a node as first parameter, hence a static method

		let firstItem = this.getFirstItem(items);

		//create the list and the first entry manually
		let list = BlankNode.create();
		list.set(rdf.type, rdf.List);
		list.set(rdf.first, firstItem);

		//add all the other items
		List.appendItems(list, items);

		return List.getOf(list);
	}

	private static getContentNodes(list: NamedNode, result = new NodeSet()) {
		if (list.hasProperty(rdf.first)) {
			result.add(list.getOne(rdf.first));
		}
		if (list.hasProperty(rdf.rest)) {
			let rest = list.getOne(rdf.rest) as NamedNode;
			if (rest !== rdf.nil) {
				return List.getContentNodes(rest, result);
			}
		}
		return result;
	}
}