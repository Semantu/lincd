/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {CoreSet} from './CoreSet';
import {NamedNode, Node} from '../models';
import {Shape} from '../shapes/Shape';
import {IGraphObjectSet} from '../interfaces/IGraphObjectSet';
import {QuadSet} from './QuadSet';
import {QuadArray} from './QuadArray';
import {NodeSet} from './NodeSet';
import {ICoreIterable} from '../interfaces/ICoreIterable';

export class ShapeSet<R extends Shape = Shape>
  extends CoreSet<R>
  implements IGraphObjectSet<R>
{
  constructor(iterable?: Iterable<R>) {
    super(iterable);
  }

  /**
   * Returns true if this set contains the exact same shape OR a shape that has same node and is an instance of the same class as the given shape
   * Why? you can create two identical shapes of the same node, but they are not the same instance
   * To avoid having to account for that, by default, ShapeSets return true if the node matches and the shapes are instances of the same class
   * @param value the shape you want to check for
   * @param matchOnNodes set to false if you only want to check for true matches of identical instances
   */
  has(value: R, matchOnNodes: boolean = true) {
    return (
      super.has(value) ||
      (matchOnNodes &&
        this.some(
          (shape) =>
            shape.node === value.node &&
            Object.getPrototypeOf(shape) === Object.getPrototypeOf(value),
        ))
    );
  }

  delete(value: R) {
    //if we can find a shape with the same node, delete that
    return super.delete(this.find((shape) => shape.node === value.node));
  }

  //we cannot use NamedNodeSet here because of requirement loops
  getProperties(includeFromIncomingArcs: boolean = false): NodeSet<NamedNode> {
    var res = new NodeSet<NamedNode>();
    for (var instance of this) {
      res = res.concat(instance.getProperties(includeFromIncomingArcs));
    }
    return res;
  }

  concat(...sets: ICoreIterable<R>[]): this {
    var res = this.createNew(this);
    for (var set of sets) {
      set.forEach((item) => {
        //for shape sets we need to manually check if an equivalent shape is already in the resulting shape set, to avoid duplicates
        if (!res.has(item)) {
          res.add(item);
        }
      });
    }
    return res;
  }

  getInverseProperties(): NodeSet<NamedNode> {
    var res = new NodeSet<NamedNode>();
    for (var instance of this) {
      res = res.concat(instance.getInverseProperties());
    }
    return res;
  }

  getOne(property: NamedNode): Node | undefined {
    for (var instance of this) {
      if (instance.hasProperty(property)) {
        return instance.getOne(property);
      }
    }
    return undefined;
  }

  /**
   * Returns a NodeSet containing the merged results of node.get(property) for each node in this set
   * @param property
   * @returns {NodeSet}
   */
  getAll(property: NamedNode): NodeSet {
    var res = new NodeSet();
    for (var instance of this) {
      res = res.concat(instance.getAll(property));
    }
    return res;
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

  getOneInverse(property: NamedNode): NamedNode | undefined {
    for (var instance of this) {
      if (instance.hasInverseProperty(property)) {
        return instance.getOneInverse(property);
      }
    }
    return undefined;
  }

  getAllInverse(property: NamedNode): NodeSet<NamedNode> {
    var res = new NodeSet<NamedNode>();
    for (var instance of this) {
      res = res.concat(instance.getAllInverse(property));
    }
    return res;
  }

  getMultipleInverse(properties: ICoreIterable<NamedNode>): NodeSet {
    var res = new NodeSet();
    for (var instance of this) {
      for (var property of properties) {
        res = res.concat(instance.getAllInverse(property));
      }
    }
    return res;
  }

  getMultiple(properties: ICoreIterable<NamedNode>): NodeSet {
    var res = new NodeSet();
    for (var instance of this) {
      for (var property of properties) {
        res = res.concat(instance.getAll(property));
      }
    }
    return res;
  }

  getDeep(property: NamedNode, maxDepth: number = Infinity): NodeSet {
    return this.getNodes().getDeep(property, maxDepth);
  }

  getQuads(property: NamedNode): QuadSet {
    var res = new QuadSet();
    for (var instance of this) {
      for (var quad of instance.getQuads(property)) {
        res.add(quad);
      }
    }
    return res;
  }

  getInverseQuads(property: NamedNode): QuadSet | any {
    var res = new QuadSet();
    for (var instance of this) {
      for (var quad of instance.getInverseQuads(property)) {
        res.add(quad);
      }
    }
    return res;
  }

  getAllQuads(
    includeAsObject?: boolean,
    includeImplicit: boolean = false,
  ): QuadArray {
    var res = new QuadArray();
    for (var instance of this) {
      for (var item of instance.getAllQuads(includeAsObject, includeImplicit)) {
        if (res.indexOf(item) === -1) {
          res.push(item);
        }
      }
      //res = res.concat(node.getAllQuads(includeAsObject));
    }
    return res;
  }

  getAllInverseQuads(includeImplicit?: boolean): QuadArray {
    var res = new QuadArray();
    for (var node of this) {
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
    for (var instance of this) {
      if (instance.has(property, value)) {
        //as any apparently needed, strange that NamedNode is not seen as matching to R?
        res.add(instance as any);
      }
    }
    return res;
  }

  getWhere(property: NamedNode, value: Node): Shape | undefined {
    for (var instance of this) {
      if (instance.has(property, value)) {
        return instance;
      }
    }
    return undefined;
  }

  setEach(property: NamedNode, value: Node): boolean {
    let res = false;
    for (var instance of this) {
      res = instance.set(property, value) && res;
    }
    return res;
  }

  msetEach(property: NamedNode, values: ICoreIterable<Node>): boolean {
    let res = false;
    for (var instance of this) {
      res = instance.mset(property, values) && res;
    }
    return res;
  }

  updateEach(property: NamedNode, value: Node): boolean {
    let res = false;
    for (var instance of this) {
      res = instance.overwrite(property, value) && res;
    }
    return res;
  }

  mupdateEach(property: NamedNode, values: ICoreIterable<Node>): boolean {
    let res = false;
    for (var instance of this) {
      res = instance.moverwrite(property, values) && res;
    }
    return res;
  }

  unsetEach(property: NamedNode, value: Node): boolean {
    let res = false;
    for (var instance of this) {
      res = instance.unset(property, value) && res;
    }
    return res;
  }

  unsetAllEach(property: NamedNode): boolean {
    let res = false;
    for (var instance of this) {
      res = instance.unsetAll(property) && res;
    }
    return res;
  }

  getNodes(): NodeSet {
    var res = new NodeSet();
    for (var instance of this) {
      res.add(instance.node);
    }
    return res;
  }

  promiseLoaded(loadInverseProperties: boolean = false): Promise<boolean> {
    return Promise.all(
      this.map((instance) => instance.promiseLoaded(loadInverseProperties)),
    )
      .then((res) => {
        return res.every((result) => result === true);
      })
      .catch(() => {
        return false;
      });
  }

  isLoaded(includingInverseProperties: boolean = false): boolean {
    return this.every((instance) =>
      instance.isLoaded(includingInverseProperties),
    );
  }

  toString(): string {
    return (
      'ShapeSet {\n' +
      [...this].map((instance) => '\t' + instance.toString()).join(',\n') +
      '\n}'
    );
  }
}
