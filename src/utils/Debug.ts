/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {Prefix} from './Prefix';
import {BlankNode, Literal, NamedNode} from '../models';

export class Debug {
	//TODO: move stuff back into actual models, keep a general method here that handles numbers etc, so that imports of this file are minimal
	//TODO: and so that dprint is not undefined if this file is not imported from index
	static print(node, includeInverseProperties: boolean = true): string {
		if (typeof node == 'number') {
			node = NamedNode.TEMP_URI_BASE + node.toString();
		}
		if (typeof node == 'string') {
			let namedNode = NamedNode.getNamedNode(node);
			if (!namedNode) return node;
			node = namedNode;
		}
		// if (node instanceof Shape) {
		// 	node = node.node;
		// }
		if (node instanceof Set || Array.isArray(node)) {
			let r: string[] = [];
			node.forEach((item) => r.push(this.print(item)));
			return `Set [\n${r.join('\n')}\n]`;
			// return 'Set [\n' + node.map((r) => this.print(r)).join(',') + '\n]';
		}
		if (node instanceof Literal) {
			return node.toString();
		}
		var print = '';
		var printQuad = (quad) => {
			return (
        Prefix.toPrefixedIfPossible(quad.subject.uri) +
        ' ' +
				Prefix.toPrefixedIfPossible(quad.predicate.uri) +
				' ' +
				(quad.object instanceof NamedNode
					? Prefix.toPrefixedIfPossible(quad.object.uri)
					: quad.object.toString())
			);
		};
		// var printInverseQuad = (quad) => {
		// 	return (
		// 		Prefix.toPrefixedIfPossible(quad.subject.uri) +
		// 		' ' +
		// 		Prefix.toPrefixedIfPossible(quad.predicate.uri)
		// 	);
		// };

		node.getAsSubjectQuads().forEach((quadMap) => {
			BlankNode.includeBlankNodes(quadMap.getQuadSet()).forEach(
				(quad) => (print += '\t' + printQuad(quad) + '.\n'),
			);
		});
		if (node.asObject && includeInverseProperties) {
			print += '<----\n';
			node.asObject.forEach((quadMap, index) => {
				BlankNode.includeBlankNodes(quadMap.getQuadSet(),false,true).forEach(
					(quad) => (print += '\t' + printQuad(quad) + '.\n'),
				);
			});
		}
		return print;
	}
}

//attach dprint to global or window object
let g =
	typeof window !== 'undefined'
		? window
		: typeof global !== 'undefined'
		? global
		: null;
if (g) {
	g['dprint'] = (item: any, includeIncomingProperties: boolean = true) =>
		console.log(Debug.print(item, includeIncomingProperties));
}
