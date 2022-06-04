/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NodeSet} from '../collections/NodeSet';
import {NamedNode, Node} from '../models';
import {rdfs} from '../ontologies/rdfs';

export class Order {
	static propertiesByDepth(properties: NodeSet<NamedNode>): NodeSet<NamedNode> {
		return properties.sort((c1, c2) => {
			return c1.has(rdfs.subPropertyOf, c2) ? -1 : 1;
		});
	}

	/**
	 * Counts the number of connections each node makes to antoher
	 * and then returns a new set of the same nodes sorted by that numb connections with the most connections first
	 * @param nodes
	 * @param property
	 * @param shortestPathFirst
	 * @returns {NodeSet<NamedNode>}
	 */
	static byCrossPaths(
		nodes: NodeSet,
		property: NamedNode,
		shortestPathFirst: boolean = false,
	): NodeSet {
		var counts = this.getCrossPaths(nodes, property);
		if (shortestPathFirst) {
			return nodes.sort((r1, r2) => {
				//use strings as backup when counts are equal to make sure sorting is always the same
				if (counts.get(r1) == counts.get(r2)) {
					return r1.toString() >= r2.toString() ? 1 : -1;
				}
				return counts.get(r1) > counts.get(r2) ? 1 : -1; //if bigger, then 1, thus lower
			});
		} else {
			//by default return the longest path first
			return nodes.sort((r1, r2) => {
				//use strings as backup when counts are equal to make sure sorting is always the same
				if (counts.get(r1) == counts.get(r2)) {
					return r1.toString() >= r2.toString() ? -1 : 1;
				}
				return counts.get(r1) >= counts.get(r2) ? -1 : 1; //if bigger, then -1, thus higher
			});
		}
	}

	private static getCrossPaths(
		nodes: NodeSet,
		property: NamedNode,
	): Map<Node, number> {
		var counts: Map<Node, number> = new Map();
		nodes.forEach((node) => {
			var crossRelations = 0;
			nodes.forEach((resource2) => {
				//'cross' => against others => not against self
				if (node === resource2) return;

				if (node.has(property, resource2)) {
					//counts.set(node.uri,[counts.get(node.uri)[0]++,node]);
					//counts[node.uri]++;
					crossRelations++;
				}
			});
			counts.set(node, crossRelations);
		});
		return counts;
	}
}
