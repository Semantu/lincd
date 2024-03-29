/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {Node} from '../models';
import {Shape} from '../shapes/Shape';
import {NodeValuesSet} from '../collections/NodeValuesSet';

export interface IClass {
	getSuperClassNodes(includeImplicit?: boolean): NodeValuesSet;

  createInstance(node?: Node, appendix?: string): Promise<Shape>;

  getInstances();
}
