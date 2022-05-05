/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {CoreSet} from './CoreSet';
import {NamedNode} from '../models';
import {Quad} from '../models';
import {IGraphObjectSet} from '../interfaces/IGraphObjectSet';
import {QuadSet} from './QuadSet';
import {QuadArray} from './QuadArray';
import {ICoreIterable} from '../interfaces/ICoreIterable';
import {Node} from '../models';

export class NodeSet<R extends Node = Node>
	extends CoreSet<R>
	implements IGraphObjectSet<Node>
{
	constructor(iterable?: Iterable<R>) {
		super(iterable);
	}

	//we cannot use NamedNodeSet here because of requirement loops
	getProperties(includeFromIncomingArcs: boolean = false): NodeSet<NamedNode> {
		var res = new NodeSet<NamedNode>();
		for (var resource of this) {
			res = res.concat(resource.getProperties(includeFromIncomingArcs));
		}
		return res;
	}

	getInverseProperties(): NodeSet<NamedNode> {
		var res = new NodeSet<NamedNode>();
		for (var resource of this) {
			res = res.concat(resource.getInverseProperties());
		}
		return res;
	}

	getOne(property: NamedNode): Node | undefined {
		for (var resource of this) {
			if (resource.hasProperty(property)) {
				return resource.getOne(property);
			}
		}
		return undefined;
	}

	/**
	 * Returns a NodeSet containing the merged results of node.get(property) for each node in this set
	 * @param property
	 * @returns {NodeSet}
	 */
	getAll(property: NamedNode): NodeSet {
		var res = new NodeSet();
		for (var resource of this) {
			res = res.concat(resource.getAll(property));
		}
		return res;
	}

	getValues(property: NamedNode): string[] {
		var res = [];
		for (var resource of this) {
			res.push(resource.getValue(property));
		}
		return res;
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

	getOneInverse(property: NamedNode): NamedNode | undefined {
		for (var resource of this) {
			if (resource.hasInverseProperty(property)) {
				return resource.getOneInverse(property);
			}
		}
		return undefined;
	}

	getAllInverse(property: NamedNode): NodeSet<NamedNode> {
		var res = new NodeSet<NamedNode>();
		for (var resource of this) {
			res = res.concat(resource.getAllInverse(property));
		}
		return res;
	}

	getMultipleInverse(properties: ICoreIterable<NamedNode>): NodeSet {
		var res = new NodeSet();
		for (var instance of this) {
			for (var property of properties) {
				res = res.concat(instance.getAllInverse(property));
			}
		}
		return res;
	}

	getMultiple(properties: ICoreIterable<NamedNode>): NodeSet {
		var res = new NodeSet();
		for (var resource of this) {
			for (var property of properties) {
				res = res.concat(resource.getAll(property));
			}
		}
		return res;
	}

	getDeep(property: NamedNode, maxDepth: number = Infinity): NodeSet {
		var result = new NodeSet();
		var stack: NodeSet = this;
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

	getQuad(property: NamedNode, value: Node): Quad | undefined {
		for (var resource of this) {
			if (resource.has(property, value)) {
				return resource.getQuad(property, value);
			}
		}
		return undefined;
	}

	getQuads(property: NamedNode): QuadSet {
		var res = new QuadSet();
		for (var resource of this) {
			for (var quad of resource.getQuads(property)) {
				res.add(quad);
			}
		}
		return res;
	}

	getInverseQuad(property: NamedNode, subject: NamedNode): Quad | any {
		for (var resource of this) {
			if (resource.hasInverse(property, subject)) {
				return resource.getInverseQuad(property, subject);
			}
		}
	}

	getInverseQuads(property: NamedNode): QuadSet | any {
		var res = new QuadSet();
		for (var resource of this) {
			for (var quad of resource.getInverseQuads(property)) {
				res.add(quad);
			}
		}
		return res;
	}

	getAllQuads(
		includeAsObject?: boolean,
		includeImplicit: boolean = false,
	): QuadArray {
		var res = new QuadArray();
		for (var resource of this) {
			for (var item of resource.getAllQuads(includeAsObject, includeImplicit)) {
				if (res.indexOf(item) === -1) {
					res.push(item);
				}
			}
			//res = res.concat(node.getAllQuads(includeAsObject));
		}
		return res;
	}

	getAllInverseQuads(includeImplicit?: boolean): QuadArray {
		var res = new QuadArray();
		for (var resource of this) {
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
		for (var resource of this) {
			if (resource.has(property, value)) {
				//as any apparently needed, strange that NamedNode is not seen as matching to R?
				res.add(resource as any);
			}
		}
		return res;
	}

	getWhere(property: NamedNode, value: Node): Node | undefined {
		for (var resource of this) {
			if (resource.has(property, value)) {
				return resource;
			}
		}
		return undefined;
	}

	setEach(property: NamedNode, value: Node): boolean {
		let res = false;
		for (var resource of this) {
			res = resource.set(property, value) && res;
		}
		return res;
	}

	msetEach(property: NamedNode, values: ICoreIterable<Node>): boolean {
		let res = false;
		for (var resource of this) {
			res = resource.mset(property, values) && res;
		}
		return res;
	}

	updateEach(property: NamedNode, value: Node): boolean {
		let res = false;
		for (var resource of this) {
			res = resource.overwrite(property, value) && res;
		}
		return res;
	}

	mupdateEach(property: NamedNode, values: ICoreIterable<Node>): boolean {
		let res = false;
		for (var resource of this) {
			res = resource.moverwrite(property, values) && res;
		}
		return res;
	}

	unsetEach(property: NamedNode, value: Node): boolean {
		let res = false;
		for (var resource of this) {
			res = resource.unset(property, value) && res;
		}
		return res;
	}

	unsetAllEach(property: NamedNode): boolean {
		let res = false;
		for (var resource of this) {
			res = resource.unsetAll(property) && res;
		}
		return res;
	}

	promiseLoaded(loadInverseProperties: boolean = false): Promise<boolean> {
		return Promise.all(
			this.map((resource) => resource.promiseLoaded(loadInverseProperties)),
		)
			.then((res) => {
				return res.every((result) => result === true);
			})
			.catch(() => {
				return false;
			});
	}

	isLoaded(includingInverseProperties: boolean = false): boolean {
		return this.every((resource) =>
			resource.isLoaded(includingInverseProperties),
		);
	}

	toString(): string {
		return (
			'NodeSet {\n' +
			[...this].map((resource) => '\t' + resource.toString()).join(',\n') +
			'\n}'
		);
	}
}
