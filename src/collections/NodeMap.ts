/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {CoreMap} from './CoreMap';
import {IGraphObjectSet} from '../interfaces/IGraphObjectSet';
import {NamedNode} from '../models';
import {Quad} from '../models';
import {QuadSet} from './QuadSet';
import {QuadArray} from './QuadArray';
import {NodeSet} from './NodeSet';
import {ICoreIterable} from '../interfaces/ICoreIterable';
import {Node} from '../models';

export class NodeMap<R extends Node>
	extends CoreMap<string, R>
	implements IGraphObjectSet<R>
{
	constructor(iterable?: Iterable<[string, R]>) {
		super(iterable);
	}

	getQuads(property: NamedNode): QuadSet {
		var res = new QuadSet();
		for (var [key, resource] of this) {
			for (var [object, quad] of resource.getQuads(property)) {
				res.add(quad);
			}
		}
		return res;
	}

	getInverseQuads(property: NamedNode): QuadSet {
		var res = new QuadSet();
		for (var [key, resource] of this) {
			for (var [subject, quad] of resource.getInverseQuads(property)) {
				res.add(quad);
			}
		}
		return res;
	}

	getAll(property: NamedNode): NodeSet {
		var res = new NodeSet();
		for (var [key, resource] of this) {
			res = res.concat(resource.getAll(property));
		}
		return res;
	}

	getAllInverse(property: NamedNode): NodeSet<NamedNode> {
		var res = new NodeSet<NamedNode>();
		for (var [key, resource] of this) {
			res = res.concat(resource.getAllInverse(property));
		}
		return res;
	}

	getMultipleInverse(properties: ICoreIterable<NamedNode>): NodeSet {
		var res = new NodeSet();
		for (var [key, resource] of this) {
			for (var property of properties) {
				res = res.concat(resource.getAllInverse(property));
			}
		}
		return res;
	}

	getMultiple(properties: ICoreIterable<NamedNode>): NodeSet {
		var res = new NodeSet();
		for (var [key, resource] of this) {
			for (var property of properties) {
				res = res.concat(resource.getAll(property));
			}
		}
		return res;
	}

	getDeep(property: NamedNode, maxDepth: number = Infinity): NodeSet {
		var result = new NodeSet();
		var stack: NodeSet = new NodeSet(this.values());
		while (stack.size > 0 && maxDepth > 0) {
			var nextLevelStack = new NodeSet();
			for (let resource of stack) {
				for (var value of resource.getAll(property)) {
					if (!result.has(value)) {
						result.add(value);
						nextLevelStack.add(value);
					}
				}
			}
			stack = nextLevelStack;
			maxDepth--;
		}
		return result;
	}

	getOneFromPath(...properties: NamedNode[]): Node | undefined {
		//NOTE: same implementation as in NamedNode

		//we just need one, so we do a depth-first algorithm which will be more performant, so:
		//take first property
		var property = properties.shift();

		//if more properties left
		if (properties.length > 0) {
			var res;
			//check if any of the values of that property for this node
			//has a path to the rest of the properties, and if so return the found value
			for (var value of this.getAll(property)) {
				if ((res = value.getOneFromPath(...properties))) {
					return res;
				}
			}
		} else {
			//return the first value possible
			return this.getOne(property);
		}
	}

	getAllFromPath(...properties: NamedNode[]): NodeSet {
		//we just need all paths, so we can do a breadth first implementation
		//take first property
		var property = properties.shift();

		if (properties.length > 0) {
			//and ask the whole set of values to return all values of the rest of the path
			return this.getAll(property).getAllFromPath(...properties);
		} else {
			return this.getAll(property);
		}
	}

	getProperties(includeFromIncomingArcs: boolean = false): NodeSet<NamedNode> {
		var res = new NodeSet<NamedNode>();
		for (var [key, resource] of this) {
			res = res.concat(resource.getProperties(includeFromIncomingArcs));
		}
		return res;
	}

	getInverseProperties(): NodeSet<NamedNode> {
		var res = new NodeSet<NamedNode>();
		for (var [key, resource] of this) {
			res = res.concat(resource.getInverseProperties());
		}
		return res;
	}

	getOne(property: NamedNode): Node | any {
		for (var [key, resource] of this) {
			if (resource.hasProperty(property)) {
				return resource.getOne(property);
			}
		}
	}

	getOneInverse(property: NamedNode): NamedNode | any {
		for (var [key, resource] of this) {
			if (resource.hasInverseProperty(property)) {
				return resource.getOneInverse(property);
			}
		}
	}

	getQuad(property: NamedNode, value: Node): Quad | any {
		for (var [key, resource] of this) {
			if (resource.has(property, value)) {
				return resource.getQuad(property, value);
			}
		}
	}

	getInverseQuad(property: NamedNode, subject: NamedNode): Quad | any {
		for (var [key, resource] of this) {
			if (resource.hasInverse(property, subject)) {
				return resource.getInverseQuad(property, subject);
			}
		}
	}

	getAllQuads(
		includeAsObject: boolean = false,
		includeImplicit: boolean = false,
	): QuadArray {
		var res = new QuadArray();
		for (var [key, resource] of this) {
			for (var item of resource.getAllQuads(includeAsObject, includeImplicit)) {
				if (res.indexOf(item) === -1) {
					res.push(item);
				}
			}
		}
		return res;
	}

	getAllInverseQuads(includeImplicit?: boolean): QuadArray {
		var res = new QuadArray();
		for (var [key, resource] of this) {
			for (var item of resource.getAllInverseQuads(includeImplicit)) {
				if (res.indexOf(item) === -1) {
					res.push(item);
				}
			}
		}
		return res;
	}

	where(property: NamedNode, value: Node): this {
		//TODO: test performance with
		//return this.filter(r => r.has(property,value));
		var res = this.createNew();
		for (var [key, resource] of this) {
			if (resource.has(property, value)) {
				//as any apparently needed, strange that NamedNode is not seen as matching to R?
				res.set(key, resource);
			}
		}
		return res;
	}

	getWhere(property: NamedNode, value: Node): Node | undefined {
		for (var [key, resource] of this) {
			if (resource.has(property, value)) {
				return resource;
			}
		}
		return undefined;
	}

	setEach(property: NamedNode, value: Node): boolean {
		let res = false;
		for (var [key, resource] of this) {
			res = resource.set(property, value) && res;
		}
		return res;
	}

	msetEach(property: NamedNode, values: ICoreIterable<Node>): boolean {
		let res = false;
		for (var [key, resource] of this) {
			res = resource.mset(property, values) && res;
		}
		return res;
	}

	updateEach(property: NamedNode, value: Node): boolean {
		let res = false;
		for (var [key, resource] of this) {
			res = resource.overwrite(property, value) && res;
		}
		return res;
	}

	mupdateEach(property: NamedNode, values: ICoreIterable<Node>): boolean {
		let res = false;
		for (var [key, resource] of this) {
			res = resource.moverwrite(property, values) && res;
		}
		return res;
	}

	unsetEach(property: NamedNode, value: Node): boolean {
		let res = false;
		for (var [key, resource] of this) {
			res = resource.unset(property, value) && res;
		}
		return res;
	}

	unsetAllEach(property: NamedNode): boolean {
		let res = false;
		for (var [key, resource] of this) {
			res = resource.unsetAll(property) && res;
		}
		return res;
	}

	promiseLoaded(loadInverseProperties: boolean = false): Promise<boolean> {
		return Promise.all(
			[...this.values()].map((resource) =>
				resource.promiseLoaded(loadInverseProperties),
			),
		)
			.then((res) => {
				return res.every((result) => result === true);
			})
			.catch(() => {
				return false;
			});
	}

	isLoaded(includingInverseProperties: boolean = false): boolean {
		return [...this.values()].every((value) =>
			value.isLoaded(includingInverseProperties),
		);
	}
}
