/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode} from '../models';
import {NodeSet} from '../collections/NodeSet';
import {Quad} from '../models';
import {QuadSet} from '../collections/QuadSet';
import {QuadMap} from '../collections/QuadMap';
import {QuadArray} from '../collections/QuadArray';
import {ICoreIterable} from './ICoreIterable';
import {Node} from '../models';

export interface IGraphObject {
	getProperties(
		includeFromIncomingArcs?: boolean,
		includeImplicitFacts?: boolean,
	): NodeSet<NamedNode>;

	getInverseProperties(): NodeSet<NamedNode>;

	/**
	 * Returns the first property value, if any
	 * For sets, returns the first property value for the first node that has values for this property
	 * @param property
	 */
	getOne(property: NamedNode): Node | undefined;

	getOneInverse(property: NamedNode): NamedNode | undefined;

	getAll(property: NamedNode): NodeSet;

	getAllInverse(property: NamedNode): NodeSet<NamedNode>;

	getMultiple(properties: ICoreIterable<NamedNode>): NodeSet;

	getMultipleInverse(properties: ICoreIterable<NamedNode>): NodeSet;

	getDeep(
		property: NamedNode,
		maxDepth?: number,
		partialResult?: NodeSet,
	): NodeSet;

	//TODO: since the implementation of these methods is pretty much the same across all classes that implement IGraphObjects maybe it should be moved to Find or another UTIL to avoid repeating ourselves
	getOneFromPath(...properties: NamedNode[]): Node | undefined;

	getAllFromPath(...properties: NamedNode[]): NodeSet;

	// getOneWhere(property:NamedNode,filterProperty:NamedNode,filterValue:Node):Node|undefined;
	// getOneWhereEquivalent(property:NamedNode,filterProperty:NamedNode,filterValue:Node,caseSensitive?:boolean):Node|undefined;

	getQuad(property: NamedNode, value: Node): Quad | undefined;

	getQuads(property: NamedNode): QuadSet;

	getInverseQuad(property: NamedNode, subject: NamedNode): Quad | undefined;

	getInverseQuads(property: NamedNode): QuadSet;

	getAllQuads(includeAsObject?: boolean, includeImplicit?: boolean): QuadArray;

	getAllInverseQuads(includeImplicit?: boolean): QuadArray;

	isLoaded(includingIncomingProperties?: boolean): boolean;

	promiseLoaded(loadInverseProperties?: boolean): Promise<boolean>;
}
