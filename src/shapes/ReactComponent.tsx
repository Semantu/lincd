/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import * as ReactDOM from 'react-dom';
import * as React from 'react';
import {BlankNode, Literal, NamedNode, Node} from '../models';
import {Shape} from './Shape';

/**
 * @deprecated
 */
export {React, ReactDOM};

export interface ReactComponentProps {
	source?: Node;
}

/**
 * @deprecated
 * Adds extra utility methods to React.Component, like working with styles/css classes,
 * passing props and keeping track of whether the component is mounted (for now)
 */
export class ReactComponent<
	P,
	S,
	ShapeType extends Shape = null
> extends React.Component<P & ReactComponentProps, S> {
	static shape: typeof Shape;
	private _shape: ShapeType;

	constructor(props?, context?) {
		super(props, context);
		this.state = {} as any;
	}

	get sourceShape(): ShapeType {
		if (typeof this._shape === 'undefined') {
			let shapeClass = (this.constructor as typeof ReactComponent).shape;

			//not providing a source is allowed
			if (!this.props.source) {
				this._shape = null;
			} else {
				//TODO, replace with instanceof Node
				if (
					this.props.source instanceof NamedNode ||
					this.props.source instanceof BlankNode ||
					this.props.source instanceof Literal
				) {
					//this will throw if the rdf:type is not correct or the data does not have this shape
					// Shacl.validate(node,shapeClass);
					this._shape = this.props.source.getAs(shapeClass as any) as ShapeType;
					//or
					// this._shape = ShapeType.getOf(this.props.source);
				} else if (this.props.source instanceof shapeClass) {
					this._shape = (this.props.source as any) as ShapeType;
				} else {
					throw new Error(
						'Please provide a NamedNode with rdf:type ' +
							this.constructor.prototype.shape.type.uri +
							' OR an instance of ' +
							this.constructor.prototype.shape.name +
							" as 'source' prop to this type of component: " +
							this.constructor.prototype.name,
					);
				}
			}

			if (this._shape && this._shape.node instanceof NamedNode) {
				this._shape.node.onChangeAny((changes, property) => {
					console.log(
						'Properties of source ' +
							this._shape.toString() +
							' changed. Updating.',
					);
					// console.log(changes.toString());
					// console.log(property);
					this.forceUpdate();
				});
			}
		}
		return this._shape;
	}
}
