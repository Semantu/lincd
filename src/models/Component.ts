/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {CoreSet} from '../collections/CoreSet';
import {Shape} from '../shapes/Shape';
import {Component, FunctionalComponent} from '../interfaces/Component';

let shapeToComponents: Map<typeof Shape, CoreSet<Component>> = new Map();

//TODO: also support functions
// export function linkedComponent(constructor) {
// 	registerComponent(constructor);
// 	return constructor;
// }

export function registerComponent(
	exportedComponent: Component,
	shape?: typeof Shape,
) {
	if (!shape) {
		//warn developers against a common mistake: if no static shape is set by the Component it will inherit the one of the class it extends
		if (!exportedComponent.hasOwnProperty('shape')) {
			console.warn(
				`Component ${exportedComponent.displayName || exportedComponent.name} is not linked to a shape. Please define 'static shape:NamedNode'`,
			);
			return;
		}
		shape = exportedComponent.shape;
	}

	if (!shapeToComponents.has(shape)) {
		shapeToComponents.set(shape, new CoreSet<any>());
	}

	shapeToComponents.get(shape).add(exportedComponent);

	//TODO: add to global tree.. but won't work without reference to module.
	//TODO: Can we find module from class? else, do we want to add it to class info with a static, OR do we want to keep exporting from index
	//TODO: we'll make module/index.ts call registerModule which returns wrapped functions that can be used to register components for this module
}
