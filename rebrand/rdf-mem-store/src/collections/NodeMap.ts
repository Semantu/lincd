/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {CoreMap} from '@_linked/core/collections/CoreMap';
import {IGraphObjectSet} from '../interfaces/IGraphObjectSet.js';
import {NamedNode,Node} from '../models.js';
import {QuadSet} from './QuadSet.js';
import {QuadArray} from './QuadArray.js';
import {NodeSet} from './NodeSet.js';
import {ICoreIterable} from '@_linked/core/interfaces/ICoreIterable';

export class NodeMap<R extends Node>
  extends CoreMap<string, R>
  implements IGraphObjectSet<R>
{
  constructor(iterable?: Iterable<[string, R]>) {
    super(iterable);
  }

  getQuads(property: NamedNode): QuadSet {
    var res = new QuadSet();
    for (var [key, node] of this) {
      for (var quad of node.getQuads(property)) {
        res.add(quad);
      }
    }
    return res;
  }

  getInverseQuads(property: NamedNode): QuadSet {
    var res = new QuadSet();
    for (var [key, node] of this) {
      for (var quad of node.getInverseQuads(property)) {
        res.add(quad);
      }
    }
    return res;
  }

  getAll(property: NamedNode): NodeSet {
    var res = new NodeSet();
    for (var [key, node] of this) {
      res = res.concat(node.getAll(property));
    }
    return res;
  }

  getAllInverse(property: NamedNode): NodeSet<NamedNode> {
    var res = new NodeSet<NamedNode>();
    for (var [key, node] of this) {
      res = res.concat(node.getAllInverse(property));
    }
    return res;
  }

  getMultipleInverse(properties: ICoreIterable<NamedNode>): NodeSet {
    var res = new NodeSet();
    for (var [key, node] of this) {
      for (var property of properties) {
        res = res.concat(node.getAllInverse(property));
      }
    }
    return res;
  }

  getMultiple(properties: ICoreIterable<NamedNode>): NodeSet {
    var res = new NodeSet();
    for (var [key, node] of this) {
      for (var property of properties) {
        res = res.concat(node.getAll(property));
      }
    }
    return res;
  }

  getDeep(property: NamedNode, maxDepth: number = Infinity): NodeSet {
    var result = new NodeSet();
    var stack: NodeSet = new NodeSet(this.values());
    while (stack.size > 0 && maxDepth > 0) {
      var nextLevelStack = new NodeSet();
      for (let node of stack) {
        for (var value of node.getAll(property)) {
          if (!result.has(value)) {
            result.add(value);
            nextLevelStack.add(value);
          }
        }
      }
      stack = nextLevelStack;
      maxDepth--;
    }
    return result;
  }

  getOneFromPath(...properties: NamedNode[]): Node | undefined {
    //NOTE: same implementation as in NamedNode

    //we just need one, so we do a depth-first algorithm which will be more performant, so:
    //take first property
    var property = properties.shift();

    //if more properties left
    if (properties.length > 0) {
      var res;
      //check if any of the values of that property for this node
      //has a path to the rest of the properties, and if so return the found value
      for (var value of this.getAll(property)) {
        if ((res = value.getOneFromPath(...properties))) {
          return res;
        }
      }
    } else {
      //return the first value possible
      return this.getOne(property);
    }
  }

  getAllFromPath(...properties: NamedNode[]): NodeSet {
    //we just need all paths, so we can do a breadth first implementation
    //take first property
    var property = properties.shift();

    if (properties.length > 0) {
      //and ask the whole set of values to return all values of the rest of the path
      return this.getAll(property).getAllFromPath(...properties);
    } else {
      return this.getAll(property);
    }
  }

  getProperties(includeFromIncomingArcs: boolean = false): NodeSet<NamedNode> {
    var res = new NodeSet<NamedNode>();
    for (var [key, node] of this) {
      res = res.concat(node.getProperties(includeFromIncomingArcs));
    }
    return res;
  }

  getInverseProperties(): NodeSet<NamedNode> {
    var res = new NodeSet<NamedNode>();
    for (var [key, node] of this) {
      res = res.concat(node.getInverseProperties());
    }
    return res;
  }

  getOne(property: NamedNode): Node | any {
    for (var [key, node] of this) {
      if (node.hasProperty(property)) {
        return node.getOne(property);
      }
    }
  }

  getOneInverse(property: NamedNode): NamedNode | any {
    for (var [key, node] of this) {
      if (node.hasInverseProperty(property)) {
        return node.getOneInverse(property);
      }
    }
  }

  getAllQuads(
    includeAsObject: boolean = false,
    includeImplicit: boolean = false,
  ): QuadArray {
    var res = new QuadArray();
    for (var [key, node] of this) {
      for (var item of node.getAllQuads(includeAsObject, includeImplicit)) {
        if (res.indexOf(item) === -1) {
          res.push(item);
        }
      }
    }
    return res;
  }

  getAllInverseQuads(includeImplicit?: boolean): QuadArray {
    var res = new QuadArray();
    for (var [key, node] of this) {
      for (var item of node.getAllInverseQuads(includeImplicit)) {
        if (res.indexOf(item) === -1) {
          res.push(item);
        }
      }
    }
    return res;
  }

  where(property: NamedNode, value: Node): this {
    //TODO: test performance with
    //return this.filter(r => r.has(property,value));
    var res = this.createNew();
    for (var [key, node] of this) {
      if (node.has(property, value)) {
        //as any apparently needed, strange that NamedNode is not seen as matching to R?
        res.set(key, node);
      }
    }
    return res;
  }

  getWhere(property: NamedNode, value: Node): Node | undefined {
    for (var [key, node] of this) {
      if (node.has(property, value)) {
        return node;
      }
    }
    return undefined;
  }

  setEach(property: NamedNode, value: Node): boolean {
    let res = false;
    for (var [key, node] of this) {
      res = node.set(property, value) && res;
    }
    return res;
  }

  msetEach(property: NamedNode, values: ICoreIterable<Node>): boolean {
    let res = false;
    for (var [key, node] of this) {
      res = node.mset(property, values) && res;
    }
    return res;
  }

  updateEach(property: NamedNode, value: Node): boolean {
    let res = false;
    for (var [key, node] of this) {
      res = node.overwrite(property, value) && res;
    }
    return res;
  }

  mupdateEach(property: NamedNode, values: ICoreIterable<Node>): boolean {
    let res = false;
    for (var [key, node] of this) {
      res = node.moverwrite(property, values) && res;
    }
    return res;
  }

  unsetEach(property: NamedNode, value: Node): boolean {
    let res = false;
    for (var [key, node] of this) {
      res = node.unset(property, value) && res;
    }
    return res;
  }

  unsetAllEach(property: NamedNode): boolean {
    let res = false;
    for (var [key, node] of this) {
      res = node.unsetAll(property) && res;
    }
    return res;
  }

  promiseLoaded(loadInverseProperties: boolean = false): Promise<boolean> {
    return Promise.all(
      [...this.values()].map((node) =>
        node.promiseLoaded(loadInverseProperties),
      ),
    )
      .then((res) => {
        return res.every((result) => result === true);
      })
      .catch(() => {
        return false;
      });
  }

  isLoaded(includingInverseProperties: boolean = false): boolean {
    return [...this.values()].every((value) =>
      value.isLoaded(includingInverseProperties),
    );
  }
}
