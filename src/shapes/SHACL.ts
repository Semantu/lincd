/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {BlankNode, Literal, NamedNode} from '../models';
import {Shape} from './Shape';
import {shacl} from '../ontologies/shacl';
import {List} from './List';
import {xsd} from '../ontologies/xsd';
import {ShapeSet} from '../collections/ShapeSet';

export class SHACL_Shape extends Shape {
	static targetClass: NamedNode = shacl.Shape;
}

export class NodeShape extends SHACL_Shape {
	static targetClass: NamedNode = shacl.NodeShape;

	addPropertyShape(property: PropertyShape) {
		this.set(shacl.property, property.namedNode);
	}
	getPropertyShapes(): ShapeSet<PropertyShape> {
		return PropertyShape.getSetOf(this.getAll(shacl.property));
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

	get in(): NamedNode {
		return this.getOne(shacl.in) as NamedNode;
	}

	set in(value: NamedNode) {
		this.overwrite(shacl.in, value);
	}

	get inList(): List {
		return this.hasProperty(shacl.in)
			? List.getOf(this.getOne(shacl.in))
			: null;
	}

	set inList(value: List) {
		this.overwrite(shacl.in, value.node);
	}
}

export class PropertyShape extends SHACL_Shape {
	static targetClass: NamedNode = shacl.PropertyShape;
	static preferredTermType = BlankNode;

	get class(): NamedNode {
		return this.getOne(shacl.class) as NamedNode;
	}

	set class(value: NamedNode) {
		this.overwrite(shacl.class, value);
	}

	get nodeShape(): NodeShape {
		return this.hasProperty(shacl.node)
			? NodeShape.getOf(this.getOne(shacl.node))
			: null;
	}

	set nodeShape(value: NodeShape) {
		this.overwrite(shacl.node, value.node);
	}

	get datatype(): NamedNode {
		return this.getOne(shacl.datatype) as NamedNode;
	}

	set datatype(value: NamedNode) {
		this.overwrite(shacl.datatype, value);
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

	get name(): string {
		return this.getValue(shacl.name);
	}

	// Setter overloading - would be nice to have one for String and another for Literal:
	// https://github.com/microsoft/TypeScript/issues/2521
	set name(value: string) {
		this.overwrite(shacl.name, new Literal(value));
	}

	get optional(): string {
		return this.getValue(shacl.optional);
	}

	set optional(value: string) {
		this.overwrite(shacl.optional, new Literal(value, xsd.boolean));
	}

	get path(): NamedNode {
		return this.getOne(shacl.path) as NamedNode;
	}

	set path(value: NamedNode) {
		this.overwrite(shacl.path, value);
	}
}
