/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NodeSet} from './NodeSet.js';
import {NamedNode,Node} from '../models.js';
import {QuadSet} from './QuadSet.js';

export class NodeValuesSet extends NodeSet {
  constructor(
    private _subject: Node,
    private _property: NamedNode,
    iterable?: Iterable<Node>,
  ) {
    super(iterable);
  }

  get subject() {
    return this._subject;
  }

  get property() {
    return this._property;
  }

  /**
   * Listen to any changes in the valueset for this subject + property combination
   * If you provide context (usually 'this'), removing the onChange listener will remove all listeners for this property & context, regardless of what callback you provide. (this is helpful if you dont have access to the excact same callback function)
   * @param callback
   * @param context
   */
  onChange(
    callback: (quads?: QuadSet, property?: NamedNode) => void,
    context?,
  ) {
    (this._subject as NamedNode).onChange(this._property, callback, context);
  }

  /**
   * Remove listener for changes in the valueset for this subject + property combination
   * If you provide context (usually 'this'), removing the onChange listener will remove all listeners for this property & context, regardless of what callback you provide. (this is helpful if you dont have access to the excact same callback function)
   * @param callback
   * @param context
   */
  removeOnChange(
    callback: (quads?: QuadSet, property?: NamedNode) => void,
    context?,
  ) {
    (this._subject as NamedNode).removeOnChange(
      this._property,
      callback,
      context,
    );
  }

  /**
   * When cloned we switch to a NodeSet of all the values
   * And detach from the magic of PropertyValueSets, which are only meant to be used internally in the NamedNode model
   * @param args
   */
  createNew(...args): any {
    return new NodeSet(...args);
  }

  /**
   * Add a new node to this set of values.
   * This creates a new quad in the local graph.
   * This is equivalent to manually adding a new property value using `subject.set(predicate,object)`
   * @param value the node to add
   */
  add(value: Node): this {
    this._subject.set(this._property, value);
    return this;
  }

  /**
   * Remove a node from this set of values.
   * This removes a quad in the local graph (if the node was an existing value)
   * This is equivalent to manually removing a property value using `subject.unset(predicate,object)`
   * @param value the node to remove
   */
  delete(value: Node): boolean {
    return this._subject.unset(this._property, value);
  }

  /**
   * Actually removes a node from this value set. Does not remove any quads in the local graph
   * DO NOT use this method.
   * Use subject.getAll(predicate).remove(object) or subject.unset(predicate,object) instead
   * @internal
   * @param v
   */
  __delete(v) {
    return super.delete(v);
  }

  /**
   * Adds a value directly to this value set. Does not create new quads in the local graph
   * DO NOT USE this method.
   * Use subject.getAll(predicate).add(object) or subject.set(predicate,object) instead.
   * @internal
   * @param v
   */
  __add(v) {
    return super.add(v);
  }

  //here we overload the type definitions to indicate its a NodeSet that will be returned
  //HOWEVER, without '|any' this will not be expected by Typescript unless we find a really intricate way of rewriting all methods of CoreSet / CoreIterable that return this into methods that return ...?
  sort(compareFn?, thisArg?): NodeSet | any {
    return super.sort(compareFn, thisArg) as NodeSet;
  }

  concat(...sets): NodeSet | any {
    return super.concat(...sets) as NodeSet;
  }

  filter(fn): this {
    return super.filter(fn) as NodeSet | any;
  }
}
