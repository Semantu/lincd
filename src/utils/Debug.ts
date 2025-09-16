/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {Literal,NamedNode,Node} from '../models.js';

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
    if (node instanceof Set || Array.isArray(node)) {
      let r: string[] = [];
      node.forEach((item) => r.push(this.print(item)));
      return `Set [\n${r.join('\n')}\n]`;
    }
    if (node instanceof Literal) {
      return node.toString();
    }
    if (node instanceof Node) {
      return node.print();
    }
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
