/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode,Node} from '../models.js';
import {NodeSet} from '../collections/NodeSet.js';
import {QuadSet} from '../collections/QuadSet.js';
import {IGraphObject} from './IGraphObject.js';
import {ICoreIterable} from '@_linked/core/interfaces/ICoreIterable';

/**
 * a set of objects that all have IGraphObject methods, and this set itself also has those methods so you can call them directly on the set instead of for each item
 */
export interface IGraphObjectSet<R extends IGraphObject>
  extends IGraphObject,
    ICoreIterable<R> {
  getQuads(property: NamedNode): QuadSet; //other then a single node, a set always returns a QuadSet, optionally empty
  getInverseQuads(property: NamedNode): QuadSet; //other then a single node, a set always returns a QuadSet, optionally empty
  getAll(property: NamedNode): NodeSet; //always returns a set
  getAllInverse(property: NamedNode): NodeSet<NamedNode>; //always returns a set

  //@NOTE: this interface intentionally does not contain has() or allHave() or someHave(),
  //these should be written as set.some(item => item.has())

  setEach(property: NamedNode, value: Node): boolean;

  msetEach(property: NamedNode, values: ICoreIterable<Node>): boolean;

  updateEach(property: NamedNode, value: Node): boolean;

  mupdateEach(property: NamedNode, values: ICoreIterable<Node>): boolean;

  unsetEach(property: NamedNode, value: Node): boolean;

  /**
   * Unset all values for the given property for each item in the set
   * @param property
   */
  unsetAllEach(property: NamedNode): boolean;
}
