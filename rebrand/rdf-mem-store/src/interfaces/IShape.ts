/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {IGraphObject} from './IGraphObject.js';
import {NamedNode,Node} from '../models.js';
import {ICoreIterable} from '@_linked/core/interfaces/ICoreIterable';

export interface IShape extends IGraphObject {
  namedNode: NamedNode;
  node: Node;

  set(property: NamedNode, value: Node): boolean;

  mset(property: NamedNode, values: ICoreIterable<Node>): boolean;

  overwrite(property: NamedNode, value: Node): boolean;

  moverwrite(property: NamedNode, values: ICoreIterable<Node>): boolean;

  unset(property: NamedNode, value: Node): boolean;

  unsetAll(property: NamedNode): boolean;

  hasExact(property: NamedNode, value: Node): boolean;

  has(property: NamedNode, value: Node): boolean;

  hasProperty(property: NamedNode): boolean;

  hasInverseProperty(property: NamedNode): boolean;

  hasInverse(property: NamedNode, value: Node): boolean;

  hasPath(properties: NamedNode[]): boolean;

  hasPathTo(properties: NamedNode[], value?: Node): boolean;

  hasPathToSomeInSet(
    properties: NamedNode[],
    endPoints?: ICoreIterable<Node>,
  ): boolean;

  hasExplicit(property: NamedNode, value: Node): boolean;
}
