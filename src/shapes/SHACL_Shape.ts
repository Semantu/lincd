/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode} from '../models';
import {Shape} from './Shape';
import {shacl} from '../ontologies/shacl';

export class SHACL_Shape extends Shape {
	static targetClass: NamedNode = shacl.Shape;
}
