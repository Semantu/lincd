import React from 'react';
import {Shape} from '@_linked/core/shapes/Shape';
import {LinkedComponentProps} from './LinkedComponent.js';

/**
 * Class component base for linked components.
 */
export class LinkedComponentClass<
  ShapeClass extends Shape,
  P = {},
  S = any,
> extends React.Component<P & LinkedComponentProps<ShapeClass>, S> {
  private _shape: ShapeClass;

  get sourceShape(): ShapeClass {
    if (typeof this._shape === 'undefined') {
      if (!this.props.source) {
        this._shape = null;
      } else {
        let shapeClass = this.constructor['shape'];
        if (!shapeClass) {
          throw new Error(`${this.constructor.name} is not linked to a shape`);
        }
        this._shape = new shapeClass(this.props.source) as ShapeClass;
      }
    }
    return this._shape;
  }

  componentDidUpdate(
    prevProps: Readonly<P & LinkedComponentProps<ShapeClass>>,
  ) {
    if (prevProps.source !== this.props.source) {
      this._shape = undefined;
    }
  }
}
