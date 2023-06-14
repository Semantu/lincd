/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode} from '../models';
import {ShapeSet} from './ShapeSet';
import {Shape} from '../shapes/Shape';
import {QuadSet} from './QuadSet';

export class ShapeValuesSet<S extends Shape = Shape> extends ShapeSet<S> {

  constructor(private subject:NamedNode,private property:NamedNode,private shapeClass:typeof Shape) {
    //we have to construct the set empty because the native Set constructor will call 'this.add()', which wont work since subject & property are not set yet
    super();
    //get all the property values nodes and add each of them to this set as instances of the given shape
    subject.getAll(property).forEach(object => {
      super.add(new (shapeClass as any)(object));
    });

    //listen for changes in the property set
    subject.onChange(property,(quads) => {
      quads.forEach(q => {
        if(q.isRemoved) {
          this.some(shape => {
            if(shape.node === q.object) {
              return super.delete(shape);
            }
          })
        }
        else
        {
          //it may have already been added if this very shapeset was used directly to add an item to
          //(we need to add it directly as that is expected behaviour when you add something to a set)
          //so if we don't have an existing shape in here for the added node, then we add it
          if(!this.some(shape => {
            return shape.node === q.object;
          }))
          {
            super.add(new (shapeClass as any)(q.object) as S)
          }
        }
      })
    })
  }
  /**
   * When cloned (by .filter() or .sort()) we switch to a ShapeSet of all the values
   * And detach from the magic of PropertyValueShapeSets that automatically add and remove items
   * @param args
   */
  createNew(...args): any {
    return new ShapeSet(...args);
  }


  /**
   * Add a new Shape to this set of values.
   * This creates a new quad in the local graph.
   * This is equivalent to manually adding a new property value using `subject.set(predicate,object)`
   * @param value the node to add
   */
  add(value:S): this {
    this.subject.set(this.property,value.node);
    return super.add(value);
  }

  /**
   * Remove a Shape from this set of values.
   * Also removes a quad in the local graph (if the node was an existing value)
   * This is equivalent to manually removing a property value using `subject.unset(predicate,object)`
   * @param value the node to remove
   */
  delete(value:S): boolean {
    this.subject.unset(this.property,value.node);
    return super.delete(value);
  }

  /**
   * Listen to any changes in the valueset for this subject + property combination
   * If you provide context (usually 'this'), removing the onChange listener will remove all listeners for this property & context, regardless of what callback you provide. (this is helpful if you dont have access to the excact same callback function)
   * @param callback
   * @param context
   */
  onChange(callback:(quads?: QuadSet, property?: NamedNode) => void,context?) {
    (this.subject as NamedNode).onChange(this.property,callback,context)
  }
  /**
   * Remove listener for changes in the valueset for this subject + property combination
   * If you provide context (usually 'this'), removing the onChange listener will remove all listeners for this property & context, regardless of what callback you provide. (this is helpful if you dont have access to the excact same callback function)
   * @param callback
   * @param context
   */
  removeOnChange(callback:(quads?: QuadSet, property?: NamedNode) => void,context?) {
    (this.subject as NamedNode).removeOnChange(this.property,callback,context)
  }

}
