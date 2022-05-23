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
	 * and then returns a new set of the same resources sorted by that numb connections with the most connections first
	 * @param resources
	 * @param property
	 * @param shortestPathFirst
	 * @returns {NodeSet<NamedNode>}
	 */
	static byCrossPaths(
		resources: NodeSet,
		property: NamedNode,
		shortestPathFirst: boolean = false,
	): NodeSet {
		var counts = this.getCrossPaths(resources, property);
		if (shortestPathFirst) {
			return resources.sort((r1, r2) => {
				//use strings as backup when counts are equal to make sure sorting is always the same
				if (counts.get(r1) == counts.get(r2)) {
					return r1.toString() >= r2.toString() ? 1 : -1;
				}
				return counts.get(r1) > counts.get(r2) ? 1 : -1; //if bigger, then 1, thus lower
			});
		} else {
			//by default return the longest path first
			return resources.sort((r1, r2) => {
				//use strings as backup when counts are equal to make sure sorting is always the same
				if (counts.get(r1) == counts.get(r2)) {
					return r1.toString() >= r2.toString() ? -1 : 1;
				}
				return counts.get(r1) >= counts.get(r2) ? -1 : 1; //if bigger, then -1, thus higher
			});
		}
	}

	private static getCrossPaths(
		resources: NodeSet,
		property: NamedNode,
	): Map<Node, number> {
		var counts: Map<Node, number> = new Map();
		resources.forEach((resource) => {
			var crossRelations = 0;
			resources.forEach((resource2) => {
				//'cross' => against others => not against self
				if (resource === resource2) return;

				if (resource.has(property, resource2)) {
					//counts.set(node.uri,[counts.get(node.uri)[0]++,node]);
					//counts[node.uri]++;
					crossRelations++;
				}
			});
			counts.set(resource, crossRelations);
		});
		return counts;
	}
}
