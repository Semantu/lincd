/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {PropertyShape} from './PropertyShape';
import {shacl} from '../ontologies/shacl';
import {NamedNode} from '../models';
import {SHACL_Shape} from './SHACL_Shape';

export class NodeShape extends SHACL_Shape {
	static targetClass: NamedNode = shacl.NodeShape;

	addPropertyShape(property: PropertyShape) {
		this.set(shacl.property, property.namedNode);
	}

	get targetNode(): NamedNode {
		return this.getOne(shacl.targetNode) as NamedNode;
	}

	set targetNode(value) {
		this.overwrite(shacl.targetNode, value);
	}

	get targetClass(): NamedNode {
		return this.getOne(shacl.targetClass) as NamedNode;
	}

	set targetClass(value) {
		this.overwrite(shacl.targetClass, value);
	}
}
