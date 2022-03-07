/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode} from '../models/NamedNode';
import {shacl} from '../ontologies/shacl';
import {Literal} from '../models/Literal';
import {xsd} from '../ontologies/xsd';
import {List} from './List';
import {SHACL_Shape} from './SHACL_Shape';
import {BlankNode} from '../models/BlankNode';

export class PropertyShape extends SHACL_Shape {
	static preferredTermType = BlankNode;
	static targetClass: NamedNode = shacl.PropertyShape;

	get class(): NamedNode {
		return this.getOne(shacl.class) as NamedNode;
	}
	set class(value: NamedNode) {
		this.overwrite(shacl.class, value);
	}

	get datatype(): NamedNode {
		return this.getOne(shacl.datatype) as NamedNode;
	}
	set datatype(value: NamedNode) {
		this.overwrite(shacl.datatype, value);
	}

	get in(): NamedNode {
		return this.getOne(shacl.in) as NamedNode;
	}
	set in(value: NamedNode) {
		this.overwrite(shacl.in, value);
	}

	get inList(): List {
		return List.getOf(this.getOne(shacl.in));
	}
	set inList(value: List) {
		this.overwrite(shacl.in, value.node);
	}

	get maxCount(): number {
		return parseInt(this.getValue(shacl.maxCount));
	}
	set maxCount(value: number) {
		this.overwrite(shacl.maxCount, new Literal(value.toString(), xsd.integer));
	}

	get minCount(): number {
		return parseInt(this.getValue(shacl.minCount));
	}
	set minCount(value: number) {
		this.overwrite(shacl.minCount, new Literal(value.toString(), xsd.integer));
	}

	get name(): Literal {
		return this.getOne(shacl.name) as Literal;
	}
	// Setter overloading - would be nice to have one for String and another for Literal:
	// https://github.com/microsoft/TypeScript/issues/2521
	set name(value: Literal) {
		this.overwrite(shacl.name, value);
	}

	get optional(): Literal {
		return this.getOne(shacl.optional) as Literal;
	}
	set optional(value: Literal) {
		this.overwrite(shacl.optional, value);
	}

	get path(): NamedNode {
		return this.getOne(shacl.property) as NamedNode;
	}
	set path(value: NamedNode) {
		this.overwrite(shacl.property, value);
	}
}
