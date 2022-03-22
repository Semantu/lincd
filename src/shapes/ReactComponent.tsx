/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import * as ReactDOM from 'react-dom';
import * as React from 'react';
import {NamedNode} from '../models';
import {Node} from '../models';
import {Shape} from './Shape';
import {Literal} from '../models';
import {BlankNode} from '../models';

export {React, ReactDOM};

export interface FunctionalReactComponent {
	(props: any): any;
	shape: typeof Shape;
	/**
	 * The renderType that this component extends/implements. By default: ReactComponent
	 */
	renderType?: any;
}

export const functionalReactComponent = (
	shape: typeof Shape,
	component: (props: any) => any,
): FunctionalReactComponent => {
	// (component as FunctionalReactComponent).viewType = viewType;
	(component as FunctionalReactComponent).shape = shape;
	(component as FunctionalReactComponent).renderType = ReactComponent;
	return component as FunctionalReactComponent;
};

export interface ReactComponentProps {
	source?: Node;
	className?: string;
}

/**
 * Adds extra utility methods to React.Component, like working with styles/css classes,
 * passing props and keeping track of whether the component is mounted (for now)
 */
export class ReactComponent<
	P,
	S,
	ShapeType extends Shape = null,
> extends React.Component<P & ReactComponentProps, S> {
	protected _mounted: boolean;
	static shape: typeof Shape;
	private _shape: ShapeType;

	constructor(props?, context?) {
		super(props, context);
		this.state = {} as any;
	}

	get source(): ShapeType {
		if (!this._shape) {
			let shapeClass = (this.constructor as typeof ReactComponent).shape;
			//TODO, replace with instanceof Node
			if (
				this.props.source instanceof NamedNode ||
				this.props.source instanceof BlankNode ||
				this.props.source instanceof Literal
			) {
				//this will throw if the rdf:type is not correct or the data does not have this shape
				// Shacl.validate(node,shapeClass);
				this._shape = this.props.source.getAs(shapeClass) as ShapeType;
				//or
				// this._shape = ShapeType.getOf(this.props.source);
			} else if (this.props.source instanceof shapeClass) {
				this._shape = this.props.source as any as ShapeType;
			}

			if (!this._shape) {
				throw new Error(
					'Please provide a NamedNode with rdf:type ' +
						this.constructor.prototype.shape.type.uri +
						' OR an instance of ' +
						this.constructor.prototype.shape.name +
						" as 'source' prop to this type of component: " +
						this.constructor.prototype.name,
				);
			}

			if (this._shape.node instanceof NamedNode) {
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

	/**
	 * Joins an array of CSS class names into a single string
	 * Also adds this.props.className as the first class if it's set
	 * @param names - an array of css class names
	 * @returns {string}
	 */
	class(...names: string[]) {
		return ReactComponent.getClass(...names);
	}

	/**
	 * returns the given class names plus the class name from this.props.className
	 * @param names
	 */
	mainClass(...names: string[]) {
		return ReactComponent.mainClass(this.props, ...names);
	}

	/**
	 * Intended to be used to pass on properties of this component to the most top-level JSX element in render methods
	 * Specifically for "native" elements like <div> <h1> <span> as opposed to a class that extends ReactComponent, use passComponentProps for that
	 * @param props
	 * @param filterOut
	 */
	passProps(filterOut?: string[]) {
		//shallow copy all properties into a new props object
		let props = {...(this.props as any)};

		//auto passing on of this.props as component props
		if (filterOut) {
			//copy all properties except those explicitly filtered
			for (var key of filterOut) {
				delete props[key];
			}
		}

		delete props['refCallback'];

		return props;
	}

	static mainClass(props, ...names: string[]) {
		//convert names to one string and if a className is given in props, add it
		return (
			this.getClass(...names) + (props.className ? ' ' + props.className : '')
		);
	}

	/**
	 * Converts an array of strings to a single string with
	 * @param props
	 * @param styles
	 * @param names
	 */
	static getClass(...names: string[]): string {
		return names.join(' ');
	}
}
