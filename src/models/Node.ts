/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode} from './NamedNode';
import {EventEmitter} from '../events/EventEmitter';
import {IShape} from '../interfaces/IShape';
import {PropertySet} from '../collections/PropertySet';
import {NodeSet} from '../collections/NodeSet';
import {ICoreIterable} from '../interfaces/ICoreIterable';
import {Quad} from './Quad';
import {QuadMap} from '../collections/QuadMap';
import {QuadArray} from '../collections/QuadArray';
import {Term} from 'rdflib/lib/tf-types';
import {TermType} from 'rdflib/lib/types';

export abstract class Node extends EventEmitter {
	/** The type of node */
	termType!: TermType;

	constructor(protected _value: string) {
		super();
	}

	get value(): string {
		return this._value;
	}
	set value(val: string) {
		this._value = val;
	}

	/**
	 * Create an instance of the given class (or one of its subclasses) as a presentation of this node.
	 * NOTE: this node MUST have the static.type of the given class as its rdf:type property
	 * @param type - a class that extends Shape and thus who's instances represent a node as an instance of one specific type.
	 */
	getAs<T extends IShape>(type: {new (): T; getOf(resource: Node): T}): T {
		return type.getOf(this);
	}

	/**
	 * Create an instance of the given class as a presentation of this node.
	 * Other than getAs this 'strict' message will ONLY return an exact instance of the given class, not one of its subclasses
	 * rdf.type properties of the node are IGNORED. This method can therefore also come in handy in circumstances when you don't have the node it's rdf.type properties at hand.
	 * Do not misuse this method though, the main use case is if you don't want to allow any subclass instances. If that's not neccecarily the case and it would make also sense to have the properties loaded, make sure to load them and use getAs.
	 * OR use getAsAsync automatically ensures the data of the node is fully loaded before creating an instance.
	 * @param type - a class that extends Shape and thus who's instances represent a node as an instance of one specific type.
	 */
	getStrictlyAs<T extends IShape>(type: {
		new (): T;
		getStrictlyOf(resource: Node): T;
	}): T {
		return type.getStrictlyOf(this);
	}

	/**
	 * Compares whether the two nodes are equal
	 * @param other The other node
	 */
	equals(other: Term): boolean {
		if (!other) {
			return false;
		}
		return this.termType === other.termType && this.value === other.value;
	}

	set(property: NamedNode, value: Node): boolean {
		return false;
	}

	has(property: NamedNode, value: Node): boolean {
		return false;
	}

	hasValue(property: NamedNode, value: string): boolean {
		return false;
	}

	hasExplicit(property: NamedNode, value: Node): boolean {
		return false;
	}

	hasExact(property: NamedNode, value: Node): boolean {
		return false;
	}

	hasProperty(property: NamedNode): boolean {
		return false;
	}

	hasInverseProperty(property: NamedNode): boolean {
		return false;
	}

	hasInverse(property: NamedNode, value: Node): boolean {
		return false;
	}

	mset(property: NamedNode, values: Iterable<Node>): boolean {
		return false;
	}

	getProperties(includeFromIncomingArcs: boolean = false): NodeSet<NamedNode> {
		return new NodeSet<NamedNode>();
	}

	getInverseProperties() {
		return new NodeSet<NamedNode>();
	}

	getOne(property: NamedNode): Node | undefined {
		return undefined;
	}

	getAll(property: NamedNode): PropertySet {
		return new PropertySet();
	}

	getValue(property?: NamedNode): string {
		return undefined;
	}

	getDeep(
		property: NamedNode,
		maxDepth: number = -1,
		partialResult: NodeSet = new NodeSet(),
	): NodeSet {
		return partialResult;
	}

	getOneInverse(property: NamedNode): NamedNode | undefined {
		return undefined;
	}

	getOneWhere(
		property: NamedNode,
		filterProperty: NamedNode,
		filterValue: Node,
	): undefined {
		return undefined;
	}

	getOneWhereEquivalent(
		property: NamedNode,
		filterProperty: NamedNode,
		filterValue: Node,
		caseSensitive?: boolean,
	): undefined {
		return undefined;
	}

	getAllExplicit(property: NamedNode): NodeSet {
		return undefined;
	}

	getAllInverse(property: NamedNode): NodeSet<NamedNode> | undefined {
		return undefined;
	}

	getMultiple(properties: ICoreIterable<NamedNode>): NodeSet {
		return new NodeSet();
	}

	hasPath(properties: NamedNode[]): boolean {
		return false;
	}

	hasPathTo(properties: NamedNode[], value?: Node): boolean {
		return false;
	}

	hasPathToSomeInSet(
		properties: NamedNode[],
		endPoints?: ICoreIterable<Node>,
	): boolean {
		return false;
	}

	getOneFromPath(...properties: NamedNode[]): Node | undefined {
		return undefined;
	}

	getAllFromPath(...properties: NamedNode[]): NodeSet {
		return new NodeSet();
	}

	getQuad(property: NamedNode, value: Node): Quad | undefined {
		return undefined;
	}

	getQuads(property: NamedNode): QuadMap {
		return new QuadMap();
	}

	getInverseQuad(property: NamedNode, subject: NamedNode): Quad | undefined {
		return undefined;
	}

	getInverseQuads(property: NamedNode): QuadMap {
		return new QuadMap();
	}

	getAllInverseQuads(includeImplicit?: boolean): QuadArray {
		return new QuadArray();
	}

	getAllQuads(
		includeAsObject: boolean = false,
		includeImplicit: boolean = false,
	): QuadArray {
		return null;
	}

	overwrite(property: NamedNode, value: any): boolean {
		return false;
	}

	moverwrite(property: NamedNode, value: any): boolean {
		return false;
	}

	unset(property: NamedNode, value: Node): boolean {
		return false;
	}

	unsetAll(property: NamedNode): boolean {
		return false;
	}
	isLoaded(includingIncomingProperties?: boolean): boolean {
		return false;
	}

	promiseLoaded(loadInverseProperties?: boolean): Promise<boolean> {
		return null;
	}
	getMultipleInverse(properties: ICoreIterable<NamedNode>): NodeSet {
		return new NodeSet();
	}

	/**
	 * @internal
	 * @param quad
	 */
	unregisterInverseProperty(
		quad: Quad,
		alteration?: boolean,
		emitEvents?: boolean,
	): void {}

	/**
	 * registers the use of a quad. Since a quad can only be used in 1 quad
	 * this method makes a clone of the Literal if it's used a second time,
	 * and returns that new Literal so it will be used by the quad
	 * @internal
	 * @param quad
	 */
	registerInverseProperty(
		quad: Quad,
		alteration?: boolean,
		emitEvents?: boolean,
	): Node {
		return null;
	}

	clone(): Node {
		return null;
	}
}
