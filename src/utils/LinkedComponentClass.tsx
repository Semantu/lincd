import React from "react";
import {Shape} from '../shapes/Shape';
import {LinkedComponentProps} from '../interfaces/Component';
import {NamedNode} from '../models';

export class LinkedComponentClass<
	ShapeType extends Shape,
	P = {},
	S = {},
> extends React.Component<P & LinkedComponentProps<ShapeType>, S> {
	private _shape: ShapeType;

	componentDidUpdate(
		prevProps: Readonly<P & LinkedComponentProps<ShapeType>>,
		prevState: Readonly<S>,
		snapshot?: any,
	) {
    if(prevProps.source !== this.props.source && this.props.source instanceof NamedNode)
    {
      (this.props.source as NamedNode).onChangeAny((changes, property) => {
        console.log(
          'Properties of source ' +
          this._shape.toString() +
          ' changed. Updating.',
        );
        this.forceUpdate();
      });
    }
  }

	get sourceShape(): ShapeType {
		if (typeof this._shape === 'undefined') {
			//not providing a source is allowed
			if (!this.props.source) {
				this._shape = null;
			} else {
				let shapeClass = this.constructor['shape'];
				if (!shapeClass) {
					throw new Error(`${this.constructor.name} is not linked to a shape`);
				}
				this._shape = new shapeClass(this.props.source) as ShapeType;
			}
		}
		return this._shape;
	}
}