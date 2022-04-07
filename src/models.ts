/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {DefaultGraph as TFDefaultGraph,Literal as ILiteral,NamedNode as INamedNode,Term} from 'rdflib/lib/tf-types';
import {DefaultGraphTermType,TermType} from 'rdflib/lib/types';
import {defaultGraphURI} from 'rdflib/lib/utils/default-graph-uri';

import {QuadSet} from './collections/QuadSet';
import {CoreMap} from './collections/CoreMap';
import {QuadMap} from './collections/QuadMap';
import {QuadArray} from './collections/QuadArray';
import {NodeSet} from './collections/NodeSet';

import {ICoreIterable} from './interfaces/ICoreIterable';
import {IShape} from './interfaces/IShape';
import {IGraphObject} from './interfaces/IGraphObject';

import {PropertySet} from './collections/PropertySet';
import {BatchedEventEmitter,eventBatcher} from './events/EventBatcher';
import {EventEmitter} from './events/EventEmitter';
import {NodeMap} from './collections/NodeMap';

declare var dprint: (item, includeIncomingProperties?: boolean) => void;

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

/**
 * A Named Node in the graph is a node that has outgoing edges to other nodes.
 * In RDF specifications, a Named Node is a URI Node.
 * You can manage this by setting and getting 'properties' of this node, which will reflect in which nodes this node is connected with.
 * A Named Node is one of the two types of nodes in a graph in the semantic web / RDF.
 * The other one being Literal
 * See also: https://www.w3.org/TR/rdf-concepts/#section-Graph-URIref
 */
export class NamedNode
	extends Node
	implements IGraphObject, BatchedEventEmitter, INamedNode
{
	/**
	 * The base of temporary URI's
	 * @internal
	 */
	public static TEMP_URI_BASE: string = 'lincd://temp/';

	private static namedNodes: NodeMap<NamedNode> = new NodeMap();
	private static tempCounter: number = 0;

	/**
	 * Emitter used by the class itself by static methods emitting events.
	 * Anyone wanting to listen to that should therefore add a listener with NamedNode.emitter.on(...)
	 * @internal
	 */
	static emitter = new EventEmitter();

	// private static overwrittenProperties: CoreMap<NamedNode,[NamedNode,Node][]> = new CoreMap<NamedNode,[NamedNode,Node][]>();
	private static clearedProperties: CoreMap<
		NamedNode,
		[NamedNode, QuadArray][]
		> = new CoreMap<NamedNode, [NamedNode, QuadArray][]>();
	private static nodesToSave: NodeSet<NamedNode> = new NodeSet();
	private static nodesToLoad: NodeSet<NamedNode> = new NodeSet();
	private static nodesToLoadFully: NodeSet<NamedNode> = new NodeSet();
	private static nodesToRemove: NodeSet<NamedNode> = new NodeSet();
	private static nodesURIUpdated: CoreMap<NamedNode, [string, string]> =
		new CoreMap();

	//### event types ###

	/**
	 * event emitted when resources need to be stored
	 * @internal
	 */
	static STORE_RESOURCES: string = 'STORE_RESOURCES';

	/**
	 * Event emitted when previous values have been overwritten (for example with update or moverwrite)
	 * NOTE: Locally we may not know all the properties, but the intend of update / moverwrite is to overwrite ANY existing properties. So event handlers listening to this event should clear any previous property values they can find.
	 * @internal
	 */
	static CLEARED_PROPERTIES: string = 'CLEARED_PROPERTIES';

	/**
	 * event emitted when resources need to be removed
	 * @internal
	 */
	static REMOVE_RESOURCES: string = 'REMOVE_RESOURCES';

	/**
	 * event emitted when the URI of a node has been updated
	 */
	static URI_UPDATED: string = 'URI_UPDATED';

	/**
	 * event emitted when resources need to be loaded
	 * @internal
	 */
	static LOAD_RESOURCES: string = 'LOAD_RESOURCES';

	/**
	 * event emitted by a single node when its properties have changed
	 * @internal
	 */
	static PROPERTY_CHANGED: string = 'PROPERTY_CHANGED';

	/**
	 * event emitted by a single node when its properties have been altered
	 * NOTE: we use 'altered' for changes made by user interaction vs 'changed' for changes that
	 * could for example be due to new data being loaded
	 * @internal
	 */
	static PROPERTY_ALTERED: string = 'PROPERTY_ALTERED';

	/**
	 * event emitted by a single node when its inverse properties have been changed
	 * @internal
	 */
	static INVERSE_PROPERTY_CHANGED: string = 'INVERSE_PROPERTY_CHANGED';

	/**
	 * event emitted by a single node when its inverse properties have been altered
	 * NOTE: we use 'altered' for changes made by user interaction vs 'changed' for changes that
	 * could for example be due to new data being loaded
	 * @internal
	 */
	static INVERSE_PROPERTY_ALTERED: string = 'INVERSE_PROPERTY_ALTERED';

	/**
	 * event emitted by a single node when its used or not used anymore as a predicate
	 * @internal
	 */
	static AS_PREDICATE_CHANGED: string = 'AS_PREDICATE_CHANGED';

	/**
	 * event emitted by a single node when its used or not used anymore as a predicate due to user requested alterations
	 * @internal
	 */
	static AS_PREDICATE_ALTERED: string = 'AS_PREDICATE_ALTERED';

	/**
	 * event emitted by a single node when it's been removed
	 */
	static RESOURCE_REMOVED: string = 'RESOURCE_REMOVED';

	/**
	 * map of QuadMaps indexed by property where this node occurs as subject
	 * NOTE: we use QuadMap here because in ES5 a quadMap is much faster than a quadSet, because we can check by key with uri directly if the quad exists instead of having to look in an array with indexOf (ES5 does not support objects as keys)
	 * @internal
	 */
	private asSubject: Map<NamedNode, QuadMap> = new Map<NamedNode, QuadMap>();

	/**
	 * map of QuadMaps indexed by property where this node occurs as object
	 * @internal
	 */
	private asObject: Map<NamedNode, QuadMap>; // = new Map<NamedNode,QuadMap>();

	/**
	 * array of Quads in which this node occurs as predicate
	 * @internal
	 */
	private asPredicate: QuadArray;

	/**
	 * map of QuadMaps indexed by property (where this node occurs as subject)
	 * NOTE: 'properties' serves only to increase lookup speed but also costs memory
	 * since reverse lookup (where this node occurs as object) will be much less frequent
	 * the inverse of 'properties' is not kept, so all results for reverse lookup will be created from 'asObject'
	 * @internal
	 */
	properties: CoreMap<NamedNode, PropertySet> = new CoreMap<
		NamedNode,
		PropertySet
		>();

	//keeping track of changes to be emitted in one batched event
	//NOTE: the quad sets in these maps will contain both newly ADDED and REMOVED quads
	private changedProperties: CoreMap<NamedNode, QuadSet>;
	private alteredProperties: CoreMap<NamedNode, QuadSet>;
	private changedInverseProperties: CoreMap<NamedNode, QuadSet>;
	private alteredInverseProperties: CoreMap<NamedNode, QuadSet>;
	private changedAsPredicate: QuadArray;
	private alteredAsPredicate: QuadArray;

	//keep track of promises so that we only do loading/removing/saving once
	private savePromise: {
		promise: Promise<any>;
		resolve: any;
		reject: any;
		done?: boolean;
	};
	private removePromise: {promise: Promise<any>; resolve: any; reject: any};
	private allPropertiesLoaded: {
		promise: Promise<any>;
		resolve?: any;
		reject?: any;
		done?: boolean;
	};
	private outgoingPropertiesLoaded: {
		promise: Promise<any>;
		resolve?: any;
		reject?: any;
		done?: boolean;
	};
	// private static termType: string = 'NamedNode';
	termType: any = 'NamedNode';

	/**
	 * WARNING: Do not directly create a Node, instead use NamedNode.getOrCreate(uri)
	 * This ensures the same node is used for the same uri system wide
	 * @param pUri
	 */
	constructor(value: string = '', private _isTemporaryNode: boolean = false) {
		super(value);
		if (this._isTemporaryNode) {
			//created locally, so we know everything about it there is to know
			this.allPropertiesLoaded = {promise: Promise.resolve(this), done: true};
		}
	}

	//from rdflib.js https://github.com/linkeddata/rdflib.js/blob/bbf456390afe7743020e0c8c4db20b10cfb808c7/src/named-node.ts#L88
	/** "Alias for value, favored by Tim" ... René agrees with Tim */
	get uri(): string {
		return this._value;
	}

	set uri(uri: string) {
		this.value = uri;
	}

	get isTemporaryNode(): boolean {
		return this._isTemporaryNode;
	}

	set isTemporaryNode(val: boolean) {
		this._isTemporaryNode = val;
	}

	/**
	 * A way for quads to signal the subject of the quad about a new property
	 * NOT FOR GENERAL USE
	 * @internal
	 * @param quad
	 * @param alteration
	 * @param emitEvents
	 */
	registerProperty(
		quad: Quad,
		alteration: boolean = false,
		emitEvents: boolean = true,
	) {
		var index: NamedNode = quad.predicate;
		if (!this.asSubject.has(index)) {
			this.asSubject.set(index, new QuadMap());
			this.properties.set(index, new PropertySet());
		}
		this.asSubject.get(index).set(quad.object, quad);
		this.properties.get(index).__add(quad.object);

		//add this quad to the map of events to send on the next tick
		if (emitEvents) {
			if (!this.changedProperties) this.changedProperties = new CoreMap();
			if (alteration && !this.alteredProperties)
				this.alteredProperties = new CoreMap();
			//register this change as alteration (user input) or as normal (automatic, data based) property change
			this.registerPropertyChange(
				quad,
				alteration
					? [this.changedProperties, this.alteredProperties]
					: [this.changedProperties],
			);
		}
	}

	/**
	 * Inverse property can be thought of as "this node is the value (object) of another resources' property"
	 * This method is used by the class Quad to communicate its existence to the quads object
	 * NOT FOR GENERAL USE
	 * @internal
	 * @param quad
	 * @param alteration
	 * @param emitEvents
	 */
	registerInverseProperty(
		quad: Quad,
		alteration: boolean = false,
		emitEvents: boolean = true,
	): Node {
		//asObject is not always initialised - to save some memory on resources without incoming properties (only used as subject)
		if (!this.asObject) {
			this.asObject = new CoreMap<NamedNode, QuadMap>();
		}
		var index: NamedNode = quad.predicate;
		if (!this.asObject.has(index)) {
			this.asObject.set(index, new QuadMap());
		}
		this.asObject.get(index).set(quad.subject, quad);

		//add this quad to the map of events to send on the next tick
		if (emitEvents) {
			if (!this.changedInverseProperties)
				this.changedInverseProperties = new CoreMap();
			if (alteration && !this.alteredInverseProperties)
				this.alteredInverseProperties = new CoreMap();
			this.registerPropertyChange(
				quad,
				alteration
					? [this.changedInverseProperties, this.alteredInverseProperties]
					: [this.changedInverseProperties],
			);
		}

		//need to return this, see Literal
		return this;
	}

	/**
	 * This method is used by the class Quad to communicate with its resources
	 * NOT FOR GENERAL USE
	 * @internal
	 * @param quad
	 * @param alteration
	 */
	registerValueChange(quad: Quad, alteration: boolean = false) {
		if (!this.changedProperties) this.changedProperties = new CoreMap();
		if (alteration) {
			if (!this.alteredProperties) this.alteredProperties = new CoreMap();
			this.registerPropertyChange(quad, [
				this.changedProperties,
				this.alteredProperties,
			]);
		} else {
			this.registerPropertyChange(quad, [this.changedProperties]);
		}
	}

	private registerPropertyChange(quad: Quad, maps: Map<NamedNode, QuadSet>[]) {
		eventBatcher.register(this);
		maps.forEach((map) => {
			if (!map.has(quad.predicate)) {
				map.set(quad.predicate, new QuadSet());
			}
			map.get(quad.predicate).add(quad);
		});
	}

	/**
	 * Called when this node occurs as predicate in a quad
	 * NOT FOR GENERAL USE
	 * @internal
	 */
	registerAsPredicate(
		quad: Quad,
		alteration: boolean = false,
		emitEvents: boolean = true,
	) {
		//asPredicate is not always initialised because only properties can occur as predicate
		if (!this.asPredicate) {
			this.asPredicate = new QuadArray();
		}
		this.asPredicate.push(quad);

		if (emitEvents) {
			this.registerPredicateChange(quad, alteration);
		}
	}

	/**
	 * This method is used by the class Quad to communicate with its resources
	 * NOT FOR GENERAL USE
	 * @internal
	 */
	unregisterProperty(
		quad: Quad,
		alteration: boolean = false,
		emitEvents: boolean = true,
	) {
		var index: NamedNode = quad.predicate;
		var quadMap: QuadMap = this.asSubject.get(index);
		var propertySet: PropertySet = this.properties.get(index);

		if (propertySet) propertySet.__delete(quad.object);
		if (quadMap) {
			quadMap.delete(quad.object);
			if (quadMap.size == 0) {
				this.asSubject.delete(index);
				this.properties.delete(index);
			}
		}

		//NOTE: also when removing property values (therefore unregistering the property), we add the removed quad to the SAME list of changed properties
		//event listeners will have to filter out which quad was added or removed
		if (emitEvents) {
			if (!this.changedProperties) this.changedProperties = new CoreMap();
			if (alteration && !this.alteredProperties)
				this.alteredProperties = new CoreMap();

			this.registerPropertyChange(
				quad,
				alteration
					? [this.changedProperties, this.alteredProperties]
					: [this.changedProperties],
			);
		}
	}

	/**
	 * This method is used by the class Quad to communicate with its resources
	 * NOT FOR GENERAL USE
	 * @internal
	 */
	unregisterInverseProperty(
		quad: Quad,
		alteration: boolean = false,
		emitEvents: boolean = true,
	) {
		var index: NamedNode = quad.predicate;
		var quadMap: QuadMap = this.asObject.get(index);
		if (quadMap) {
			quadMap.delete(quad.subject);
			if (quadMap.size == 0) {
				this.asObject.delete(index);
			}
		}

		//also when removing the property do wee add the removed quad to the list of changed properties
		//event listeners will have to filter out which quad was added or removed
		if (emitEvents) {
			if (!this.changedInverseProperties)
				this.changedInverseProperties = new CoreMap();
			if (alteration && !this.alteredInverseProperties)
				this.alteredInverseProperties = new CoreMap();

			this.registerPropertyChange(
				quad,
				alteration
					? [this.changedInverseProperties, this.alteredInverseProperties]
					: [this.changedInverseProperties],
			);
		}
	}

	/**
	 * This method is used by the class Quad to communicate with its resources
	 * NOT FOR GENERAL USE
	 * @internal
	 */
	unregisterAsPredicate(
		quad: Quad,
		alteration: boolean = false,
		emitEvents: boolean = true,
	) {
		this.asPredicate.splice(this.asPredicate.indexOf(quad), 1);

		if (emitEvents) {
			this.registerPredicateChange(quad, alteration);
		}
	}

	private registerPredicateChange(quad: Quad, alteration: boolean) {
		eventBatcher.register(this);
		if (!this.changedAsPredicate) {
			this.changedAsPredicate = new QuadArray();
		}
		this.changedAsPredicate.push(quad);
		if (alteration) {
			if (!this.alteredAsPredicate) {
				this.alteredAsPredicate = new QuadArray();
			}
			this.alteredAsPredicate.push(quad);
		}
	}

	/**
	 * Returns a list of quads in which this node is now used as predicate
	 * BEFORE these changes are sent as events in the normal event flow
	 * Currently used by Reasoner to allow for immediate application of reasoning
	 */
	getPendingPredicateChanges(): QuadArray {
		return this.changedAsPredicate;
	}

	/**
	 * Returns a list of quads in which this node is now used as object
	 * BEFORE these changes are sent as events in the normal event flow
	 * Currently used by Reasoner to allow for immediate application of reasoning
	 */
	getPendingInverseChanges(property: NamedNode): QuadSet {
		return this.changedInverseProperties
			? this.changedInverseProperties.get(property)
			: new QuadSet();
	}

	/**
	 * Returns a list of quads in which this node is now used as subject
	 * BEFORE these changes are sent as events in the normal event flow
	 * Currently used by Reasoner to allow for immediate application of reasoning
	 */
	getPendingChanges(property: NamedNode): QuadSet {
		return this.changedProperties.get(property);
	}

	/**
	 * ##########################################################################
	 * ############# PUBLIC METHODS FOR REGULAR USE #############
	 * ##########################################################################
	 */

	/**
	 * Set the a single property value
	 * Creates a single connection between two nodes in the graph: from this node, to the node given as value, with the property as the connecting 'edge' between them
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 * @param value - the node that this new graph-edge points to. The object of the quad to be created.
	 */
	set(property: NamedNode, value: Node): boolean {
		if (!value) {
			throw Error('No value provided to set!');
		}
		//only create if it didnt exist yet
		if (this.has(property, value)) {
			if (this.getQuad(property, value).implicit) {
				this.getQuad(property, value).makeExplicit();
			}
			return false;
		}
		new Quad(this, property, value, undefined, false, true);
		return true;
	}

	/**
	 * Set multiple values at once for a single property.
	 * You can use this for example to state that this node (a person) has a 'hasFriend' connection to multiple people (friends) in 1 statement
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 * @param values - an array or set of resources. Can be NamedNodes or Literals
	 */
	mset(property: NamedNode, values: ICoreIterable<Node>): boolean {
		//if(save) dacore.system.storageQueueStart(this);
		var res = false;
		for (var value of values) {
			res = this.set(property, value) || res;
		}
		return res;
	}

	/**
	 * Returns true if this node has the given value as the value of the given property
	 * NOTE: returns true when a literal node is provided that is EQUIVALENT to any of the values that this node has for this property (whilst not neccecarilly being the exact same object in memory)
	 * See also: Literal.equals
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 * @param value - a single node. Can be a NamedNode or Literal
	 */
	has(property: NamedNode, value: Node): boolean {
		if (!value) {
			throw new Error(
				'No value provided to NamedNode.has(). Did you mean `hasProperty`?',
			);
		}
		var properties = this.properties.get(property);
		return (
			properties &&
			(properties.has(value) ||
				properties.some((object) => object.equals(value)))
		);
	}

	/**
	 * Returns true if this node has the given value for the given property in an EXPLICIT quad.
	 * That is, this property-value has been explicitly set, and is NOT generated by the Reasoner.
	 * See the documentation for more information about implicit vs explicit
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 * @param value - a single node. Can be a NamedNode or Literal
	 */
	hasExplicit(property: NamedNode, value: Node): boolean {
		if (!this.asSubject.has(property)) return false;
		let quad = this.getQuadByValue(property, value);
		return quad && !quad.implicit;
	}

	/**
	 * Returns true if this node has ANY explicit quad with the given property
	 * See the documentation for more information about implicit vs explicit
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	hasExplicitProperty(property: NamedNode) {
		if (!this.asSubject.has(property)) return false;
		return this.getQuads(property).some((quad) => !quad.implicit);
	}

	/**
	 * Returns true if this node has a Literal as value of the given property who's literal-value (a string) matches the given value
	 * So works the same as `has()` except you can provide a string as value, and will obviously not match any NamedNode values
	 * And unlike has() this method will NOT check for the Literal its datatype. Instead only checking the literal-value
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 * @param value - the string value we want to check for
	 */
	hasValue(property: NamedNode, value: string): boolean {
		var properties = this.properties.get(property);
		return (
			properties &&
			properties.some(
				(object) => 'value' in object && object['value'] === value,
			)
		);
	}

	/**
	 * Returns true if this node has the given value as the value of the given property with an EXACT match (meaning the same object in memory)
	 * So works the same as has() except for Literals this only returns true if the value of the property is exactly the same object as the given value
	 * UNLIKE `has()` which checks if the literal value, datatype and language tag of two literal resources are equivalent
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 * @param value - a single node. Can be a NamedNode or Literal
	 */
	hasExact(property: NamedNode, value: Node): boolean {
		var properties = this.properties.get(property);
		return properties && properties.has(value);
	}

	/**
	 * Returns true if this node has ANY value set for the given property.
	 * That is, if any quad exists that has this node as the subject and the given property as predicate
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	hasProperty(property: NamedNode): boolean {
		return this.properties.has(property);
	}

	/**
	 * Returns true if the given end point can be reached by following the given properties in order
	 * Example: hasPathTo([foaf.hasFriend,rdf.type],foaf.Person) will return true if any of the friends of this node (this person in this example) is of the type foaf:Person
	 * @param properties an array of NamedNodes
	 * @param endPoint the node to reach, a Literal or a NamedNode
	 */
	hasPathTo(properties: NamedNode[], endPoint?: Node): boolean {
		//we just need to find one matching path, so we do a depth-first algorithm which will be more performant, so:
		//take first property
		var property = properties.shift();

		//if more properties left
		if (properties.length > 0) {
			var res;
			//check if any of the values of that property for this node
			//has a path to the rest of the properties, and if so return the found value
			for (var value of this.getAll(property)) {
				if ((res = value.hasPathTo([...properties], endPoint))) {
					return res;
				}
			}
			return false;
		} else {
			//if last property
			//see if we can reach the value if a value was given
			//else: see if any value (any path) exists
			if (endPoint) {
				return this.has(property, endPoint);
			} else {
				return this.hasProperty(property);
			}
		}
	}

	getAs<T extends IShape>(type: {new (): T; getOf(resource: Node): T}): T {
		return type.getOf(this);
	}

	/**
	 * returns true if ANY of the given end points can be reached by following the given properties in the given order
	 * Example: hasPathTo([foaf.hasFriend,foaf.hasFriend],[mike,jenny]) will return true if this node (person) has a friend that has mike or jenny as a friend
	 * @param properties an array of NamedNodes
	 * @param endPoint the node to reach, a Literal or a NamedNode
	 */
	hasPathToSomeInSet(
		properties: NamedNode[],
		endPoints?: ICoreIterable<Node>,
	): boolean {
		//we just need to find one matching path, so we do a depth-first algorithm which will be more performant, so:
		//take first property
		var property = properties.shift();

		//if more properties left
		if (properties.length > 0) {
			var res;
			//check if any of the values of that property for this node
			//has a path to the rest of the properties, and if so return the found value
			for (var value of this.getAll(property)) {
				if ((res = value.hasPathToSomeInSet([...properties], endPoints))) {
					return res;
				}
			}
			return false;
		} else {
			//if last property
			//see if we can reach the value if a value was given
			//else: see if any value (any path) exists
			return endPoints.some((endPoint) => this.has(property, endPoint));
		}
	}

	/**
	 * returns true if ANY end point (node) can be reached by following the given properties in order
	 * @param properties an array of NamedNodes
	 */
	hasPath(properties: NamedNode[]): boolean {
		//we just need to find one matching path, so we do a depth-first algorithm which will be more performant, so:
		//take first property
		var property = properties.shift();

		//if more properties left
		if (properties.length > 0) {
			var res;
			//check if any of the values of that property for this node
			//has a path to the rest of the properties, and if so return the found value
			for (var value of this.getAll(property)) {
				if ((res = value.hasPath([...properties]))) {
					return res;
				}
			}
			return false;
		} else {
			//if last property
			//see if we can reach the value if a value was given
			//else: see if any value (any path) exists
			return this.hasProperty(property);
		}
	}

	/**
	 * Returns a set of all the properties this node has.
	 * That is, all unique predicates of quads where this node is the subject
	 * @param includeFromIncomingArcs if true, also includes predicates (properties) of quads where this node is the VALUE of another resources' property. Default: false
	 */
	getProperties(includeFromIncomingArcs: boolean = false): NodeSet<NamedNode> {
		if (includeFromIncomingArcs) {
			return new NodeSet<NamedNode>(
				(this.asObject
					? [...this.asSubject.keys(), ...this.asObject.keys()]
					: this.asSubject.keys()) as Iterable<NamedNode>,
			);
		} else {
			return new NodeSet<NamedNode>(this.asSubject.keys());
		}
	}

	/**
	 * Returns a set of all the properties used by this node in EXPLICIT facts (quads)
	 * See the documentation for more information about implicit vs explicit facts
	 * @param includeFromIncomingArcs if true, also includes predicates (properties) of quads where this node is the VALUE of another resources' property. Default: false
	 */
	getExplicitProperties(
		includeFromIncomingArcs: boolean = false,
	): NodeSet<NamedNode> {
		return new NodeSet<NamedNode>([
			...this.getAllQuads(includeFromIncomingArcs)
				.filter((t) => !t.implicit)
				.map((t) => t.predicate),
		]);
	}

	/**
	 * Returns a set of all the properties used by other resources where this node is the VALUE of that property
	 * For example if this node is Jenny and the following is true: Mike foaf:hasFriend Jenny, calling this method on Jenny will return hasFriend
	 */
	getInverseProperties() {
		return this.asObject
			? new NodeSet<NamedNode>(this.asObject.keys())
			: new NodeSet<NamedNode>();
	}

	/**
	 * If this node has values for the given property, the first value is returned
	 * NOTE: the order of multiple values CANNOT be guaranteed. Therefore use this value if it DOESN'T matter to you which of multiple possible values for this property you'll get OR if you're certain there will be only 1 value.
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	getOne(property: NamedNode): Node | undefined {
		return this.properties.has(property)
			? this.properties.get(property).first()
			: undefined;
	}

	/**
	 * If this node has EXPLICIT values for the given property, the first value is returned
	 * Same as `getOne()` except only explicit quads / facts are considered
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	getOneExplicit(property: NamedNode): Node | undefined {
		for (let [prop, quad] of this.getQuads(property)) {
			if (!quad.implicit) {
				return quad.object;
			}
		}
	}

	/**
	 * Returns all values this node has for the given property
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	getAll(property: NamedNode): PropertySet {
		return this.properties.has(property)
			? this.properties.get(property)
			: new PropertySet();
	}

	/**
	 * Returns all values this node EXPLICITLY has for the given property
	 * So, same as `getAll()` except only explicit facts are considered.
	 * See the documentation for more information about implicit vs explicit
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	getAllExplicit(property): NodeSet {
		return this.getExplicitQuads(property).getObjects();
	}

	/**
	 * Returns the literal value of the first Literal value for the given property
	 * Only returns a results in the disired language if specified.
	 * For example if `this rdfs:label "my name" then this.getValue(rdfs.label) will return "my name".
	 * So, works the same as getOne() except it will return the literal (string) value of the first found Literal
	 * NOTE: the order of multiple values CANNOT be guaranteed. Therefore use this value if it DOESN'T matter to you which of multiple possible values for this property you'll get OR if you're certain there will be only one value.
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	//NOTE: we have to overload getValue without parameters here to be compatible with Literal
	getValue(property?: NamedNode, language?: string): string {
		//going over all property values
		for (var valueObject of this.getAll(property)) {
			//see if its a Literal
			//we do this by checking if value exists in the valueObject.
			//And we do that like this because we dont want to explicitly import Literal here.
			//@TODO: Possibly create an interface to avoid this 'hacky' workaround
			if (
				valueObject['value'] &&
				(!language || valueObject['isOfLanguage'](language))
			) {
				return valueObject.value;
			}
		}
	}

	/**
	 * Returns the literal values (strings) of all Literals this this node has a value for the given property
	 * For example if `this rdfs:label "my name" and `this rdfs:label "my other name"  it will return ["my name","my other name"].
	 * So, works the same as getAll() except it will return an array of strings
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	getValues(property: NamedNode): string[] {
		var valueObjects = this.getAll(property);
		var res = [];
		valueObjects.forEach((valueObject) => {
			if ('value' in valueObject) {
				res.push(valueObject['value']);
			}
		});
		return res;
	}

	/**
	 * Returns any value (node, node) that is connected to this node with one or more connections of the given property.
	 * For example getDeep(hasFriend) will return all the people that are my friends or friends of friends
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 * @param maxDepth - the maximum number of connections that resulting resources are removed from this node. In the example above maxDepth=2 would return only friends and friends of friends
	 */
	getDeep(property: NamedNode, maxDepth: number = Infinity): NodeSet {
		var result = new NodeSet();
		var stack = new NodeSet([this as Node]);
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

	/**
	 * Returns the first found value following the given properties in the given order.
	 * For example: getOneFromPath([hasFriend,hasFather]) would return the first found father out of the set 'fathers of my friends'
	 * @param properties - an array of NamedNodes. Which are resources with rdf:type rdf:Property, the edges in the graph, the predicates of quads.
	 */
	getOneFromPath(...properties: NamedNode[]): Node | undefined {
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

	/**
	 * Returns all values that can be reached by following the given properties in order.
	 * For example getAllFromPath([hasFriend,hasFather]) will return all fathers of all my (direct) friends
	 * @param properties - an array of NamedNodes. Which are resources with rdf:type rdf:Property, the edges in the graph, the predicates of quads.
	 */
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

	/**
	 * Same as getDeep() but for inverse properties.
	 * Best understood with an example: if this is a person. this.getInverseDeep(hasChild) would return all this persons ancestors (which had children that eventually had this person as their child)
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 * @param maxDepth - the maximum number of connections that resulting resources are removed from this node. In the example above maxDepth=2 would return only the parents and grand parents
	 */
	getInverseDeep(property: NamedNode, maxDepth: number = Infinity): NodeSet {
		var result = new NodeSet();
		var stack = new NodeSet([this as Node]);
		while (stack.size > 0 && maxDepth > 0) {
			var nextLevelStack = new NodeSet();
			for (let resource of stack) {
				for (var value of resource.getAllInverse(property)) {
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

	/**
	 * Returns true if the given value can be reached with one or more connections of the given property
	 * Example: if this is a person. this.hasDeep(hasFriend,Mike) returns true if this person has Mike as a friend, or if any this persons friends or friends of friends have Mike as a friend.
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 * @param maxDepth - the maximum number of connections that resulting resources are removed from this node. In the example above maxDepth=2 would return true only if Mike is the persons friend, or friend of a friend
	 */
	hasDeep(
		property: NamedNode,
		value: Node,
		maxDepth: number = Infinity,
	): boolean {
		var checked = new NodeSet();
		var stack = new NodeSet([this as Node]);
		while (stack.size > 0 && maxDepth > 0) {
			var nextLevelStack = new NodeSet();
			for (let resource of stack) {
				for (var propertyValue of resource.getAll(property)) {
					if (propertyValue === value) {
						return true;
					}
					if (!checked.has(propertyValue)) {
						checked.add(propertyValue);
						nextLevelStack.add(propertyValue);
					}
				}
			}
			stack = nextLevelStack;
			maxDepth--;
		}
		return false;
	}

	/**
	 * Returns the first node that has this node as the valu eof the given property.
	 * Same as getOne() but for 'inverse properties'. Meaning resources that have this node as their value.
	 * Example: if this is a person. this.getOneInverse(hasChild) returns one of the persons parents
	 * NOTE: the order of multiple (inverse) values CANNOT be guaranteed. Therefore use this value if it DOESN'T matter to you which of multiple possible inverse values for this property you'll get OR if you're certain there will be only one value.
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	getOneInverse(property: NamedNode): NamedNode | undefined {
		if (!this.asObject) return undefined;
		var quads: QuadMap = this.asObject.get(property);
		return quads ? (quads.keys().next().value as NamedNode) : undefined;
	}

	/**
	 * Returns all the resources that have this node as the value of the given property.
	 * Same as getAll() but for 'inverse properties'. Meaning resources that have this node as their value.
	 * Example: if this is a person. this.getAllInverse(hasChild) returns all the persons parents
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	getAllInverse(property: NamedNode): NodeSet<NamedNode> {
		if (!this.asObject || !this.asObject.has(property))
			return new NodeSet<NamedNode>();
		return this.asObject.get(property).getSubjects();
	}

	/**
	 * Returns all the resources that have this node as the EXPLICIT value of the given property.
	 * Same as getAll() but only considers explicit facts (excluding implicit facts generated by the reasoner)
	 * Example: if this is a person. this.getAllInverse(hasChild) returns all the persons parents, as long as the fact that these are this persons parents is explicitly stated
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	getAllInverseExplicit(property): NodeSet<NamedNode> {
		return this.getExplicitInverseQuads(property).getSubjects();
	}

	/**
	 * Get all the values of multiple properties at once
	 * Same as getAll() but for multiple properties at once
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	getMultiple(properties: ICoreIterable<NamedNode>): NodeSet {
		var res = new NodeSet();
		for (var property of properties) {
			res = res.concat(this.getAll(property));
		}
		return res;
	}

	/**
	 * Get all the resources that have this node as their value for any of the given properties
	 * Same as getMultiple() but for the opposite direction
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	getMultipleInverse(properties: ICoreIterable<NamedNode>): NodeSet {
		var res = new NodeSet();
		for (var property of properties) {
			res = res.concat(this.getAllInverse(property));
		}
		return res;
	}

	/**
	 * Get the quad that represent the connection from this node to the given value, connected by the given property
	 * NOTE: accessing quads is a very low level functionality required for the framework itself
	 * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 * @param value - the node that this new graph-edge points to. The object of the quad to be created.
	 */
	getQuad(property: NamedNode, value?: Node): Quad | undefined {
		if (!this.asSubject.has(property)) return undefined;
		if (value) {
			return this.getQuadByValue(property, value);
		} else {
			return this.asSubject.get(property).first();
		}
	}

	private getQuadByValue(property: NamedNode, value?: Node): Quad {
		return value instanceof NamedNode
			? this.asSubject.get(property).get(value)
			: this.asSubject.get(property).find((quad) => quad.object.equals(value));
	}

	/**
	 * Get all the quads that represent the connection from this node to another node, connected by the given property
	 * NOTE: accessing quads is a very low level functionality required for the framework itself
	 * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	getQuads(property: NamedNode): QuadMap {
		return this.asSubject.has(property)
			? this.asSubject.get(property)
			: new QuadMap();
	}

	/**
	 * Get all the quads that represent EXPLICIT connections from this node to another node, connected by the given property
	 * NOTE: accessing quads is a very low level functionality required for the framework itself
	 * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	getExplicitQuads(property: NamedNode): QuadMap {
		return this.getQuads(property).filter((quad) => !quad.implicit);
	}

	/**
	 * Get all the quads that represent EXPLICIT connections from another node that has this node as its value for the given property
	 * NOTE: accessing quads is a very low level functionality required for the framework itself
	 * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	getExplicitInverseQuads(property: NamedNode): QuadMap {
		return this.getInverseQuads(property).filter((quad) => !quad.implicit);
	}

	/**
	 * Get the quad that represents the connections from another node that has this node as its value for the given property
	 * NOTE: accessing quads is a very low level functionality required for the framework itself
	 * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 * @param subject - if given, will seek out the one quad that makes this connection, if not given, will return the first found inverse quad for the given property
	 */
	getInverseQuad(property: NamedNode, subject?: NamedNode): Quad | undefined {
		if (subject) {
			if (!this.asObject || !this.asObject.has(property)) return undefined;
			return this.asObject.get(property).get(subject);
		} else {
			return this.asObject.get(property).first();
		}
	}

	/**
	 * Get all quads that represent connections from another node that has this node as its value for the given property
	 * NOTE: accessing quads is a very low level functionality required for the framework itself
	 * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	getInverseQuads(property: NamedNode): QuadMap {
		return this.asObject && this.asObject.has(property)
			? this.asObject.get(property)
			: new QuadMap();
	}

	/**
	 * Get all (by default explicit) quads that represent connections from another node that has this node as its value for ANY property
	 * NOTE: accessing quads is a very low level functionality required for the framework itself
	 * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
	 * @param includeImplicit if true, includes both implicit and explicit quads. By default false, so will only return explicit quads
	 */
	getAllInverseQuads(includeImplicit: boolean = false): QuadArray {
		var res: QuadArray = new QuadArray();
		if (this.asObject) {
			this.asObject.forEach((quadSet) => {
				quadSet.forEach((quad) => {
					if (!includeImplicit && quad.implicit) return;
					res.push(quad);
				});
			});
		}
		return res;
	}

	/**
	 * Get all (by default explicit) quads that represent connections for all values of this node (so quads where this node is the subject)
	 * NOTE: accessing quads is a very low level functionality required for the framework itself
	 * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
	 * @param includeAsObject if true, includes quads from both directions (so also inverse properties where this node is the object of the quad)
	 * @param includeImplicit if true, includes both implicit and explicit quads. By default false, so will only return explicit quads
	 */
	getAllQuads(
		includeAsObject: boolean = false,
		includeImplicit: boolean = false,
	): QuadArray {
		var res: QuadArray = new QuadArray();
		this.asSubject.forEach((quadMap) => {
			quadMap.forEach((quad) => {
				if (!includeImplicit && quad.implicit) return;
				res.push(quad);
			});
		});
		if (includeAsObject && this.asObject) {
			this.asObject.forEach((quadSet) => {
				quadSet.forEach((quad) => {
					//we manually filter duplicates from the result set here so that we can keep using QuadArray, which is much faster in ES5
					//and the only duplicates will be a node with itself as subject AND object, so we filter the second occurrence here
					if (!includeImplicit && quad.implicit) return;
					if (quad.subject === this) return;
					res.push(quad);
				});
			});
		}
		return res;
	}

	/**
	 * Update a certain property so that only the given value is a value of this property.
	 * Overwrites (and thus removes) any previously set values
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 * @param value - a single node. Can be a NamedNode or Literal
	 */
	overwrite(property: NamedNode, value: Node): boolean {
		if (this.getAll(property).size == 1 && this.has(property, value))
			return false;

		this.unsetAll(property);
		return this.set(property, value);
	}

	/**
	 * Update a certain property so that only the given values are the values of this property.
	 * Overwrites (and thus removes) any previously set values
	 * Same as update() except this allows you to replace the previous values with MULTIPLE new values
	 * @param property
	 * @param values
	 */
	moverwrite(property: NamedNode, values: ICoreIterable<Node>): boolean {
		//dont update if the new set of values is the same (or equivalent) as the old set of values
		if (
			this.getAll(property).size === (values.size || values.length) &&
			values.every((value) => this.has(property, value))
		) {
			return false;
		}
		this.unsetAll(property);
		return this.mset(property, values);
	}

	/**
	 * REMOVES this node from the graph.
	 * NOTE: only removes the node & its quads locally once its been removed from the server
	 * So immediately after calling this method, nothing will have changed yet in your local graph.
	 * Wait for the returned promise to be resolved to be sure this node does NOT occur anymore in your local graph.
	 * NOTE 2: The node object itself may still exist as long as pointers to it exist in memory, but all quads that involved this node will have been deactivated
	 * @param property
	 * @param values
	 */
	remove() {
		//lets only do this once (each instance will also call node.destruct)
		if (!this.removePromise) {
			this.removePromise = this.createPromise();

			if (this._isTemporaryNode) {
				//immediately remove local node
				this.setRemoved(true);
			} else {
				//first we emit the event that will remove the node from storage before actually removing the quads
				//because we will need to fully load the node and its quads during removal from storage
				NamedNode.nodesToRemove.add(this);
				eventBatcher.register(NamedNode);
			}
		}
		return this.removePromise.promise;
	}

	/**
	 * Used internally by the framework to indicate a node has successfully been removed or not.
	 * NOT FOR GENERAL USE
	 * @internal
	 * @param res
	 */
	setRemoved(res: boolean) {
		//now that the storage has been updated we can continue to remove locally
		this.asSubject.forEach((quads) => quads.removeAll());
		if (this.asObject) this.asObject.forEach((quads) => quads.removeAll());

		this.emit(NamedNode.RESOURCE_REMOVED, this);
		this.removeAllListeners();

		if (this.removePromise) {
			this.removePromise.resolve(res);
		}

		NamedNode.unregister(this);
	}

	/**
	 * UNSET (remove) a single property value connection.
	 * Remove a single connection between two nodes in the graph: from this node, to the node given as value, with the property as the connecting 'edge' between them
	 * In the graph, this will remove the edge between two nodes.
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 * @param value - the node that this new graph-edge points to. The object of the quad to be created.
	 */
	unset(property: NamedNode, value: Node): boolean {
		if (this.has(property, value)) {
			this.getQuad(property, value).remove(true);
			return true;
		}
		return false;
	}

	/**
	 * unset (remove) all values of a certain property.
	 * Removes all connections (edges) in the graph between this node and other resources, where the given property is used as the connecting 'edge' between them
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	unsetAll(property: NamedNode): boolean {
		//if not a local node we will emit events for storage controllers to be picked up
		if (!this.isTemporaryNode) {
			//regardless of how many tripples are known 'locally', we want to emit this event so that the source of data can eventually properly clear all values
			if (!NamedNode.clearedProperties.has(this)) {
				NamedNode.clearedProperties.set(this, []);
				eventBatcher.register(NamedNode);
			}
			//we save the property that was cleared AND the quads that were cleared
			NamedNode.clearedProperties
				.get(this)
				.push([
					property,
					this.asSubject.has(property)
						? new QuadArray(...this.asSubject.get(property).values())
						: null,
				]);
		}

		if (this.hasProperty(property)) {
			//false as parameter because we dont need alteration events for each single quad, but rather manage this with clearedProperty events
			this.asSubject.get(property).removeAll(false);
			return true;
		}
		return false;
	}

	/**
	 * returns true if ANY node has this node as the value of the given property
	 * Example: if 'this' is a person, this.hasInverseProperty(hasChild) returns true if any facts stating `someParent hasChild thisPerson` are known
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 */
	hasInverseProperty(property: NamedNode): boolean {
		return this.asObject && this.asObject.has(property);
	}

	/**
	 * returns true if the given inverse 'value' has this node as the (real) value of the given property
	 * Example: if 'this' is a person, this.hasInverseProperty(hasChild,someParent) returns true if someParent indeed has this person as a child
	 * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
	 * @param value - a single node. Can be a NamedNode or Literal
	 */
	hasInverse(property: NamedNode, value: Node): boolean {
		return (
			this.asObject &&
			this.asObject.get(property).some((quad) => quad.subject.equals(value))
		);
	}

	/**
	 * returns true if this node is equivaluent to the given node.
	 * For NamedNodes it simply returns true if this === the given object. So if its the same object in memory.
	 * It exists mainly for comparing Literals, where two different objects can still be equivalent
	 * @param other another node
	 */
	equals(other: Term): boolean {
		return other === this;
	}

	/**
	 * returns true if all the properties of this node have been loaded into memory
	 * @param includingInverseProperties if true, returns true if both normal properties AND properties (quads) where this node is used as the VALUE of another node are loaded
	 */
	isLoaded(includingInverseProperties: boolean = false): boolean {
		return (
			this.isTemporaryNode ||
			(includingInverseProperties
				? this.allPropertiesLoaded && this.allPropertiesLoaded.done
				: this.outgoingPropertiesLoaded && this.outgoingPropertiesLoaded.done)
		);
	}

	/**
	 * requests all the properties of this node to be loaded.
	 * Returns a promise that resolves when all the properties are loaded into local memory.
	 * @param loadInverseProperties if true, also loads properties where this node is used as the value
	 */
	promiseLoaded(loadInverseProperties: boolean = false): Promise<boolean> {
		if (loadInverseProperties) {
			if (!this.allPropertiesLoaded) {
				//create the promise to be fulfilled by the class that will handle the load event
				this.allPropertiesLoaded = this.createPromise();
				NamedNode.nodesToLoadFully.add(this);
				eventBatcher.register(NamedNode);
			}
			return this.allPropertiesLoaded.promise;
		} else {
			//no need to load only outgoing if everything is already loaded
			if (this.allPropertiesLoaded) return this.allPropertiesLoaded.promise;

			if (!this.outgoingPropertiesLoaded) {
				//create the promise to be fulfilled by the class that will handle the load event
				this.outgoingPropertiesLoaded = this.createPromise();
				NamedNode.nodesToLoad.add(this);
				eventBatcher.register(NamedNode);
			}
			return this.outgoingPropertiesLoaded.promise;
		}
	}

	private createPromise() {
		var resolve, reject;
		var promise = new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		});
		return {promise, resolve, reject};
	}

	/**
	 * Used by the framework to indicate the loading of a node has completed.
	 * NOT FOR GENERAL USE - you should generally not need this method
	 * @internal
	 * @param inversePropertiesLoaded
	 */
	setLoaded(inversePropertiesLoaded: boolean = false) {
		if (inversePropertiesLoaded) {
			if (!this.allPropertiesLoaded) {
				this.allPropertiesLoaded = this.createPromise();
			}
			this.allPropertiesLoaded.done = true;
			this.allPropertiesLoaded.resolve(this);
		} else {
			if (!this.outgoingPropertiesLoaded) {
				this.outgoingPropertiesLoaded = this.createPromise();
			}
			this.outgoingPropertiesLoaded.done = true;
			this.outgoingPropertiesLoaded.resolve(this);
		}
	}

	/**
	 * Save this node into the graph database.
	 * Newly created resources will exist only in local memory until you call this function
	 * Returns a promise that resolves only once the node has been stored
	 */
	save(): Promise<NamedNode> {
		if (!this.savePromise) {
			NamedNode.nodesToSave.add(this);
			eventBatcher.register(NamedNode);
			this.savePromise = this.createPromise();
		}
		return this.savePromise.promise;
	}

	/**
	 * Used internally by the framework to denote a node has been saved
	 * NOT FOR GENERAL USE
	 * @internal
	 * @param success
	 */
	setSaved(success: boolean) {
		this.isTemporaryNode = false;
		if (!this.savePromise) this.savePromise = this.createPromise();
		this.savePromise.done = true;
		success ? this.savePromise.resolve(true) : this.savePromise.reject(false);
	}

	/**
	 * Returns true if this node is currently in the process of being saved (but that hasn't completed just yet)
	 */
	isSaving(): boolean {
		return this.savePromise && !this.savePromise.done;
	}

	/**
	 * Create a new URI Node with the same properties as the current node
	 * NOTE: does NOT clone the inverse properties (where this node is the value of another node its properties)
	 */
	clone(): NamedNode {
		var resource = NamedNode.create();
		this.getAllQuads().forEach((quad: Quad) => {
			resource.set(quad.predicate, quad.object);
		});
		return resource as this;
	}

	/**
	 * Returns a string representation of this node.
	 * Returns the URI for a NamedNode
	 */
	toString() {
		return this.uri;
	}

	print(includeIncomingProperties: boolean = true) {
		dprint(this, includeIncomingProperties);
	}

	/**
	 * #######################################################################
	 * ######################## EVENT METHODS / LISTENERS ####################
	 * #######################################################################
	 **/

	/**
	 * Fires the given call back when ANY property of this node changes.
	 * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
	 * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
	 */
	onChangeAny(
		callback: (quads?: QuadSet, property?: NamedNode) => void,
		context?: any,
	) {
		this.on(NamedNode.PROPERTY_CHANGED, callback, context);
	}

	/**
	 * Fires the given call back when this node become the value or is no longer the value of another node
	 * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
	 * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
	 */
	onChangeAnyInverse(
		callback: (quads?: QuadSet, property?: NamedNode) => void,
		context?: any,
	) {
		this.on(NamedNode.INVERSE_PROPERTY_CHANGED, callback, context);
	}

	/**
	 * Fires the given call back when this node changes the values of the given property
	 * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
	 * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
	 */
	onChange(
		property: NamedNode,
		callback: (quads?: QuadSet, property?: NamedNode) => void,
		context?: any,
	) {
		this.on(NamedNode.PROPERTY_CHANGED + property.uri, callback, context);
	}

	/**
	 * Fires the given callback when this node become the value or is no longer the value of the given property of another node
	 * Example: if someGroup hasParticipant thisResource, and the group removes this node from its participants, it will trigger onChangeInverse for this node
	 * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
	 * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
	 */
	onChangeInverse(
		property,
		callback: (quads?: QuadSet, property?: NamedNode) => void,
		context?: any,
	) {
		this.on(
			NamedNode.INVERSE_PROPERTY_CHANGED + property.uri,
			callback,
			context,
		);
	}

	/**
	 * Call this when you want to stop listening for onChangeAny events. Make sure to provide the exact same BOUND instance of a method to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
	 * @param callback the exact same method you supplied to onChangeAny
	 * @param context the same context you supplied to onChangeAny
	 */
	removeOnChangeAny(
		callback: (quads?: QuadSet, property?: NamedNode) => void,
		context?: any,
	) {
		this.off(NamedNode.PROPERTY_CHANGED, callback, context);
	}

	/**
	 * Call this when you want to stop listening for onChangeAnyInverse events. Make sure to provide the exact same BOUND instance of a method to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
	 * @param callback the exact same method you supplied to onChangeAnyInverse
	 * @param context the same context you supplied to onChangeAnyInverse
	 */
	removeOnChangeAnyInverse(
		callback: (quads?: QuadSet, property?: NamedNode) => void,
		context?: any,
	) {
		this.off(NamedNode.INVERSE_PROPERTY_CHANGED, callback, context);
	}

	/**
	 * Call this when you want to stop listening for onChange events. Make sure to provide the exact same BOUND instance of a method as callback to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
	 * @param callback the exact same method you supplied to onChange
	 * @param context the same context you supplied to onChange
	 */
	removeOnChange(
		property: NamedNode,
		callback: (quads?: QuadSet, property?: NamedNode) => void,
		context?: any,
	) {
		this.off(NamedNode.PROPERTY_CHANGED + property.uri, callback, context);
	}

	/**
	 * Call this when you want to stop listening for onChangeInverse events. Make sure to provide the exact same BOUND instance of a method as callback to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
	 * @param callback the exact same method you supplied to onChangeInverse
	 * @param context the same context you supplied to onChangeInverse
	 */
	removeOnChangeInverse(
		property,
		callback: (quads?: QuadSet, property?: NamedNode) => void,
		context?: any,
	) {
		this.off(
			NamedNode.INVERSE_PROPERTY_CHANGED + property.uri,
			callback,
			context,
		);
	}

	/**
	 * Call this when you want to stop listening for onChangeAny events. Other then removeOnChangeAny you only have to supply the context.
	 * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChangeAny
	 * @param context the same context you supplied to onChangeAny
	 */
	clearOnChangeAny(context: any) {
		this.removeListenerByContext(NamedNode.PROPERTY_CHANGED, context);
	}

	/**
	 * Call this when you want to stop listening for onChangeAnyInverse events. Other then removeOnChangeAnyInverse you only have to supply the context.
	 * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChangeAnyInverse
	 * @param context the same context you supplied to onChangeAnyInverse
	 */
	clearOnChangeAnyInverse(context: any) {
		this.removeListenerByContext(NamedNode.INVERSE_PROPERTY_CHANGED, context);
	}

	/**
	 * Call this when you want to stop listening for onChange events. Other then removeOnChange you only have to supply the context.
	 * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChange
	 * @param context the same context you supplied to onChange
	 */
	clearOnChange(property: NamedNode, context?: any) {
		this.removeListenerByContext(
			NamedNode.PROPERTY_CHANGED + property.uri,
			context,
		);
	}

	/**
	 * Call this when you want to stop listening for onChangeInverse events. Other then removeOnChangeInverse you only have to supply the context.
	 * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChangeInverse
	 * @param context the same context you supplied to onChangeAny
	 */
	clearOnChangeInverse(property, context: any) {
		this.removeListenerByContext(
			NamedNode.INVERSE_PROPERTY_CHANGED + property.uri,
			context,
		);
	}

	/**
	 * Call this when you want to stop listening for onPredicateChange events
	 * @param context the same context you supplied to onPredicateChange
	 */
	clearOnPredicateChange(context: any) {
		this.removeListenerByContext(NamedNode.AS_PREDICATE_CHANGED, context);
	}

	/**
	 * Emits the batched (property) events of a NamedNode INSTANCE (meaning for this specific node)
	 * Used internally by the framework to manage emitting change events
	 * NOT FOR GENERAL USE
	 * @internal
	 */
	emitBatchedEvents() {
		//for each type of property change (and the map of batched changes for that type of change)
		[
			[this.changedProperties, NamedNode.PROPERTY_CHANGED],
			[this.changedInverseProperties, NamedNode.INVERSE_PROPERTY_CHANGED],
			[this.alteredProperties, NamedNode.PROPERTY_ALTERED],
			[this.alteredInverseProperties, NamedNode.INVERSE_PROPERTY_ALTERED],
		].forEach(([map, event]: [CoreMap<NamedNode, QuadSet>, string]) => {
			if (!map) return;
			//for each individual change that was made
			map.forEach((quads: QuadSet, property: NamedNode) => {
				//emit the specific event that THIS property has changed
				this.emit(event + property.uri, quads, property);

				//TODO: this is due to the current setup with events for literal value changes. This setup may need to be improved at some point
				//the current setup requires previousValue to be available to the event handlers that listen to changes, but is not needed afterwards
				//hence we remove it again here
				quads.forEach((quad) => {
					if (quad.object['previousValue']) {
						delete quad.object['previousValue'];
					}
				});
			});

			if (map.size > 0) {
				//emit the general event that A property has changed/altered
				this.emit(event, map);
			}
			map.clear();
		});

		if (this.changedAsPredicate) {
			this.emit(NamedNode.AS_PREDICATE_CHANGED, this.changedAsPredicate, this);
			this.changedAsPredicate = null;
		}
		if (this.alteredAsPredicate) {
			this.emit(NamedNode.AS_PREDICATE_ALTERED, this.alteredAsPredicate, this);
			this.alteredAsPredicate = null;
		}
	}

	getAsSubjectQuads() {
		return this.asSubject;
	}
	getAsPredicateQuads() {
		return this.asPredicate;
	}
	getAsObjectQuads() {
		return this.asObject;
	}

	/* #######################################################################
	 * ######################### STATIC METHODS ##############################
	 * #######################################################################
	 */

	/**
	 * Emits the batched (property) events of the NamedNode CLASS (meaning events that relate to all resources)
	 * Used internally by the framework to batch and emit change events
	 * NOT FOR GENERAL USE
	 * @internal
	 */
	static emitBatchedEvents(resolve, reject) {
		if (this.clearedProperties.size) {
			this.emitter.emit(NamedNode.CLEARED_PROPERTIES, this.clearedProperties);
			this.clearedProperties = new CoreMap();
		}

		if (this.nodesToRemove.size) {
			this.emitter.emit(NamedNode.REMOVE_RESOURCES, this.nodesToRemove);
			this.nodesToRemove = new NodeSet<NamedNode>();
		}

		if (this.nodesToSave.size) {
			this.emitter.emit(NamedNode.STORE_RESOURCES, this.nodesToSave);
			this.nodesToSave = new NodeSet<NamedNode>();
		}

		if (this.nodesToLoad.size || this.nodesToLoadFully.size) {
			this.emitter.emit(
				NamedNode.LOAD_RESOURCES,
				this.nodesToLoad,
				this.nodesToLoadFully,
			);
			this.nodesToLoad = new NodeSet<NamedNode>();
			this.nodesToLoadFully = new NodeSet<NamedNode>();
		}

		if (this.nodesURIUpdated.size) {
			this.emitter.emit(NamedNode.URI_UPDATED, this.nodesURIUpdated);
			this.nodesURIUpdated = new CoreMap();
		}
	}

	/**
	 * Returns true if this node has any batched events waiting to be emitted
	 * Used internally by the framework to batch and emit change events
	 * NOT FOR GENERAL USE
	 * @internal
	 */
	static hasBatchedEvents() {
		return (
			this.clearedProperties.size > 0 ||
			this.nodesToRemove.size > 0 ||
			this.nodesToSave.size > 0 ||
			this.nodesToLoad.size ||
			this.nodesToLoadFully.size > 0 ||
			this.nodesURIUpdated.size > 0
		);
	}

	/**
	 * Converts the string '<http://some.uri>' into a NamedNode
	 * @param uriString the string representation of a NamedNode, consisting of its URI surrounded by brackets: '<' URI '>'
	 */
	static fromString(uriString: string): NamedNode {
		var firstChar = uriString.substr(0, 1);
		if (firstChar == '<') {
			return this.getOrCreate(uriString.substr(1, uriString.length - 2));
		} else {
			throw new Error(
				'fromString expects a URI wrapped in brackets, like <http://www.example.com>',
			);
		}
	}

	/**
	 * Resets the map of resources that is known in this local environment
	 * Mostly used for test functionality
	 */
	static reset() {
		this.tempCounter = 0;
		this.namedNodes = new NodeMap();
	}

	/**
	 * Create a new local NamedNode. A temporary URI will be generated for its URI.
	 * This node will not exist in the graph database (persistent storage) until you call `node.save()`
	 * Until saved, `node.isTemporaryNode()` will return true.
	 */
	static create(): NamedNode {
		return this._create(this.createNewTempUri(), true);
	}

	private static _create(uri: string, isLocalNode: boolean = false): NamedNode {
		var resource = new NamedNode(uri, isLocalNode);
		this.register(resource);
		return resource;
	}

	/**
	 * Registers a URIResource to the locally known list of resources
	 * NOT FOR GENERAL USE
	 * @internal
	 * @param node
	 */
	static register(node: NamedNode) {
		if (this.namedNodes.has(node.uri)) {
			throw new Error(
				'A node with this URI already exists:' +
				node.uri +
				' You should probably use NamedNode.getOrCreate instead of NamedNode.create (' +
				node.uri +
				')',
			);
		}
		this.namedNodes.set(node.uri, node);
	}

	/**
	 * Unregisters a URIResource from the locally known list of resources
	 * NOT FOR GENERAL USE
	 * @internal
	 * @param node
	 */
	static unregister(node: NamedNode) {
		if (!this.namedNodes.has(node.uri)) {
			throw new Error(
				'This node has already been removed from the registry: ' + node.uri,
			);
		}
		this.namedNodes.delete(node.uri);
	}

	/**
	 * Returns a map of all locally known resources.
	 * The map will have URI's as keys and NamedNodes as values
	 * @param resource
	 */
	static getAllNamedNodes(): NodeMap<NamedNode> {
		return this.namedNodes;
	}

	/**
	 * Returns a map of all locally known resources.
	 * The map will have URI's as keys and NamedNodes as values
	 * @param resource
	 */
	static createNewTempUri() {
		return this.TEMP_URI_BASE + this.tempCounter++; //+'/';+Date.now()+Math.random();
	}

	/**
	 * The proper way to obtain a node from a URI.
	 * If requested before, this returns the existing NamedNode for the given URI.
	 * Or, if this is the first request for this URI, it creates a new NamedNode first, and returns that
	 * Using this method over `new NamedNode()` makes sure all resources are registered, and no duplicates will exist.
	 * `new NamedNode()` should therefore never be used.
	 * @param uri
	 */
	static getOrCreate(uri: string) {
		return this.getNamedNode(uri) || this._create(uri);
	}

	/**
	 * Returns the NamedNode with the given URI, IF it exists.
	 * DOES NOT create a new NamedNode if it didn't exist yet, instead it returns undefined.
	 * You can therefore use this method to see if a NamedNode already exists locally.
	 * Use `getOrCreate()` if you want to simply get a NamedNode for a certain URI
	 * @param uri
	 */
	static getNamedNode(uri: string): NamedNode | undefined {
		return this.namedNodes.get(uri);
	}

	set value(newUri: string) {
		if (NamedNode.namedNodes.has(newUri)) {
			throw new Error(
				'Cannot update URI. A node with this URI already exists: ' +
				newUri +
				'. You tried to update the URI of ' +
				this._value,
			);
		}

		var oldUri = this._value;
		NamedNode.namedNodes.delete(this._value);
		this._value = newUri;
		NamedNode.namedNodes.set(this._value, this);

		//if this node had a temporary URI
		if(this._isTemporaryNode)
		{
			//it now has an explicit URI, so it's no longer temporary
			this._isTemporaryNode = false;
		}

		this.emit(NamedNode.URI_UPDATED, this, oldUri, newUri);

		eventBatcher.register(NamedNode);
		NamedNode.nodesURIUpdated.set(this, [oldUri, newUri]);
	}
}

//cannot import from xsd ontology here without creating circular dependencies
var rdfLangString: NamedNode = NamedNode.getOrCreate(
	'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
);
var xsdString: NamedNode = NamedNode.getOrCreate(
	'http://www.w3.org/2001/XMLSchema#string',
);

export class BlankNode extends NamedNode {
	private static counter: number = 0;

	termType: any = 'BlankNode';
	constructor() {
		super(BlankNode.createUri());
		NamedNode.register(this);
	}

	static create(): BlankNode {
		return new BlankNode();
	}

	static createUri() {
		return '_:' + this.counter++;
	}
}

/**
 * One of the two main classes of resources (nodes) in the graph.
 * Literals are endpoints. They do NOT have outgoing connections (edges) to other resources in the graph.
 * Though a NamedNode can point to a Literal.
 * Each literal node has a literal value, like a string.
 * Besides that is can also have a language tag or a data type.
 * Literals are often saved as a single string, for example '"yes"@en' (yes in english) or '"true"^^xsd:boolean (the value true with datatype english)
 * This class represents those properties.
 * See also: https://www.w3.org/TR/rdf-concepts/#section-Graph-Literal
 */
export class Literal extends Node implements IGraphObject, ILiteral {
	private referenceQuad: Quad;

	/**
	 * @internal
	 */
	previousValue: Literal;

	termType: 'Literal' = 'Literal';

	/**
	 * Other than with NamedNodes, its fine to do `new Literal("my string value")`
	 * Datatype and language tags are optional
	 * @param value
	 * @param datatype
	 * @param language
	 */
	constructor(
		value: string,
		protected _datatype: NamedNode = null,
		private _language: string = '',
	) {
		super(value);
	}

	getAs<T extends IShape>(type: {new (): T; getOf(resource: Node): T}): T {
		return type.getOf(this);
	}

	/**
	 * @internal
	 * @param quad
	 */
	registerProperty(quad: Quad): void {
		throw new Error('Literal resources should not be used as subjects');
	}

	/**
	 * registers the use of a quad. Since a quad can only be used in 1 quad
	 * this method makes a clone of the Literal if it's used a second time,
	 * and returns that new Literal so it will be used by the quad
	 * @internal
	 * @param quad
	 */
	registerInverseProperty(quad: Quad): Node {
		if (this.referenceQuad) {
			return this.clone().registerInverseProperty(quad);
			// throw new Error("Literals should not be reused, create a clone instead");
		}
		this.referenceQuad = quad;
		return this;
	}

	/**
	 * @internal
	 * @param quad
	 */
	unregisterProperty(quad: Quad): void {
		throw new Error('Literal resources should not be used as subjects');
	}

	/**
	 * @internal
	 * @param quad
	 */
	unregisterInverseProperty(quad: Quad): void {
		this.referenceQuad = null;
	}

	/**
	 * returns true if this literal node has a language tag
	 */
	hasLanguage(): boolean {
		return this._language != '';
	}

	/**
	 * get the language tag of this literal which states which language this literal is written in
	 * See also: http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
	 */
	get language(): string {
		//list of language tags: http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
		return this._language;
	}

	/**
	 * returns true if the language tag of this literal matches the given language
	 */
	isOfLanguage(language: string) {
		return this._language === language;
	}

	/**
	 * update the language tag of this literal
	 */
	set language(lang: string) {
		this._language = lang;

		//the datatype of any literal with a language tag is rdf:langString
		this._datatype = rdfLangString;
	}

	/**
	 * returns true if this literal has a datatype
	 */
	hasDatatype(): boolean {
		//checks for null and undefined
		return this._datatype != null;
	}

	/**
	 * returns the datatype of this literal
	 * Note that datatypes are NamedNodes themselves, who always have rdf:type rdf:Datatype
	 * If no datatype is set, the default datatype xsd:string will be returned
	 * If a language tag is set, the returned datatype will be rdf:langString
	 */
	get datatype(): NamedNode {
		if (this._datatype) {
			return this._datatype;
		}
		//default datatype is xsd:string, if language is set this.datatype should be langString already
		return xsdString;
	}

	/**
	 * Update the datatype of this literal
	 * @param datatype
	 */
	set datatype(datatype: NamedNode) {
		this._datatype = datatype;
	}

	/**
	 * Return the value of this literal
	 * @param datatype
	 */
	get value(): string {
		return this._value;
	}

	/**
	 * update the literal value of this literal
	 * @param datatype
	 */
	set value(value: string) {
		if (this.referenceQuad) {
			// var oldValue = this.toString();
			//do we also need to save / do this for datatype / language
			if (!this.previousValue) {
				this.previousValue = this.clone();
			}
		}
		this._value = value;
		if (this.referenceQuad) {
			// var newValue = this.toString();
			this.referenceQuad.subject.registerValueChange(this.referenceQuad, true);
			this.referenceQuad.registerValueChange(this.previousValue, this, true);
		}
	}

	/**
	 * Returns true if both are literal resources, with equal literal values, equal language tags and equal data types
	 * Other than NamedNodes, two different literal node instances can be deemed equivalent if all their properties are the same
	 * @param other
	 * @param caseSensitive
	 */
	equals(other: Term): boolean {
		return this._equals(other);
	}

	/**
	 * Returns true if both are literal resources, with equal literal values (CASE INSENSITIVE CHECK), equal language tags and equal data types
	 * Other than NamedNodes, two different literal node instances can be deemed equivalent if all their properties are the same
	 * @param other
	 */

	equalsCaseInsensitive(other: Term) {
		return this._equals(other, false);
	}

	private _equals(other: Term, caseSensitive: boolean = true) {
		if (other === this) return true;

		var valueToMatch: string;
		var languageToMatch: string;
		var dataTypeToMatch: NamedNode;

		if (other instanceof Literal) {
			valueToMatch = other.value;
			languageToMatch = other.language;
			dataTypeToMatch = other.datatype; //direct access to avoid default, alternatively build a boolean parameter 'returnDefault=true' into getDataType()
		} else {
			var type = typeof other;
			if (type == 'string' || type == 'number' || type == 'boolean') {
				//if you don't specify a datatype we accept all
				valueToMatch = other.toString();
				languageToMatch = '';
				dataTypeToMatch = null;
			} else {
				return false;
			}
		}

		//do the actual matching
		var valueMatch: boolean;
		if (caseSensitive) {
			valueMatch = this._value === valueToMatch;
		} else {
			valueMatch =
				this._value.toLocaleLowerCase() == valueToMatch.toLocaleLowerCase();
		}

		//if values match
		if (valueMatch) {
			//if there is a language
			if (this.hasLanguage()) {
				//then only the languages need to match
				return this.language == languageToMatch;
			} else {
				//no language = datatypes need to match
				//we check with this.datatype, not this.datatype which can return the default xsd:String
				//a literal without datatypespecified is however considered different from a a literal with a explicit xsd:String datatype
				//that is, like some SPARQL quad stores, you should be able to create two otherwise identical (sub&pred) quads for those two literals
				return this.datatype === dataTypeToMatch;
			}
		}
		return false;
	}

	/**
	 * Creates a new Literal with exact the same properties (value,datatype and language)
	 */
	clone(): Literal {
		return new Literal(this._value, this.datatype, this.language) as this;
	}

	/**
	 * Returns the literal value of the first Literal that occurs as object for the given subject and property and optionally also matches the given language
	 * @param subject
	 * @param property
	 * @param language
	 * @deprecated
	 * @returns {string|undefined}
	 */
	static getValue(
		subject: NamedNode,
		property: NamedNode,
		language: string = '',
	): string | undefined {
		for (var value of subject.getAll(property)) {
			if (
				value instanceof Literal &&
				(!language || value.isOfLanguage(language))
			) {
				return value.value;
			}
		}
		return undefined;
	}

	/**
	 * Returns all literal values of the Literals that occur as object for the given subject and property and optionally also match the given language
	 * @param subject
	 * @param property
	 * @param language
	 * @returns {string[]}
	 */
	static getValues(
		subject: NamedNode,
		property: NamedNode,
		language: string = '',
	): string[] {
		var res = [];
		for (var value of subject.getAll(property)) {
			if (
				value instanceof Literal &&
				(!language || value.isOfLanguage(language))
			) {
				res.push(value.value);
			}
		}
		return res;
	}

	getReferenceQuad() {
		return this.referenceQuad;
	}
	hasInverseProperty(property: NamedNode): boolean {
		return this.referenceQuad && this.referenceQuad.predicate === property;
	}

	hasInverse(property: NamedNode, value: Node): boolean {
		return (
			this.referenceQuad &&
			this.referenceQuad.predicate === property &&
			this.referenceQuad.subject === value
		);
	}

	getOneInverse(property: NamedNode): NamedNode | undefined {
		return this.referenceQuad && this.referenceQuad.predicate === property
			? this.referenceQuad.subject
			: undefined;
	}

	getMultipleInverse(properties: ICoreIterable<NamedNode>): NodeSet<NamedNode> {
		if (properties.find((p) => p === this.referenceQuad.predicate)) {
			return new NodeSet<NamedNode>([this.referenceQuad.subject]);
		}
		return new NodeSet<NamedNode>();
	}

	getInverseQuad(property: NamedNode, subject: NamedNode): Quad | undefined {
		return this.referenceQuad &&
		this.referenceQuad.predicate === property &&
		this.referenceQuad.subject === subject
			? this.referenceQuad
			: undefined;
	}

	getInverseQuads(property: NamedNode): QuadMap {
		return this.referenceQuad && this.referenceQuad.predicate === property
			? new QuadMap([[this, this.referenceQuad]])
			: new QuadMap();
	}

	getAllInverseQuads(includeImplicit?: boolean): QuadArray {
		return !includeImplicit || !this.referenceQuad.implicit
			? new QuadArray(this.referenceQuad)
			: new QuadArray();
	}

	getAllQuads(
		includeAsObject: boolean = false,
		includeImplicit: boolean = false,
	): QuadArray {
		return includeAsObject && (!includeImplicit || !this.referenceQuad.implicit)
			? new QuadArray(this.referenceQuad)
			: new QuadArray();
	}

	promiseLoaded(loadInverseProperties: boolean = false): Promise<boolean> {
		return Promise.resolve(true);
	}

	isLoaded(includingInverseProperties: boolean = false): boolean {
		return true;
	}

	toString(): string {
		//quotes are needed to differentiate the literal "http://test.com" from the URI http://test.com, so the literal value is always surrounded by quotes
		//quad quotes are needed in case of newlines
		// let quotes = this._value.indexOf("\n") != -1 ? '"""' : '"';
		let quotes = '"';
		let suffix = '';
		if (this.hasLanguage()) {
			suffix = '@' + this.language;
		} else if (this.hasDatatype()) {
			suffix = '^^<' + this.datatype.uri + '>';
		}
		//quotes in the value need to be escaped
		return (
			quotes +
			this._value.replace(/\"/g, '\\"').replace(/\n/g, '\\n') +
			quotes +
			suffix
		);
	}

	print(includeIncomingProperties: boolean = true) {
		dprint(this, includeIncomingProperties);
	}

	static isLiteralString(literalString: string): boolean {
		var regex = new RegExp(
			'(\\"[^\\"^\\n]*\\")(@[a-z]{1,3}|\\^\\^[a-zA-Z]+\\:[a-zA-Z0-9_-]+|\\<https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)\\>)?',
		);
		return regex.test(literalString);
	}

	static fromString(literalString: string): Literal {
		//self made regex thatL
		// match anything between quotes or quad quotes (the quotes are group 1 and 3)
		// except escaped quotes (2)
		//and everything behind it (4) for language or datatype
		//..with a little help on the escaped quotes from here
		//https://stackoverflow.com/questions/38563414/javascript-regex-to-select-quoted-string-but-not-escape-quotes

		let match = literalString.match(
			/("|""")([^"\\]*(?:\\.[^"\\]*)*)("|""")(.*)/,
		);

		//NOTE: if \n replacement turns out to be not correct here it should at least be moved to JSONLDParser, see https://github.com/digitalbazaar/jsonld.js/issues/242
		let literal = (match[2] ? match[2] : '')
			.replace(/\\"/g, '"')
			.replace(/\\n/g, '\n');
		let suffix = match[4];
		if (!suffix) {
			return new Literal(literal);
		}
		if (suffix[0] == '@') {
			return new Literal(literal, null, suffix.substr(1));
		} else if (suffix[0] == '^') {
			var dataType = NamedNode.fromString(suffix.substr(2));
			return new Literal(literal, dataType);
		} else {
			throw new Error('Invalid literal string format: ' + literalString);
		}
	}
}

export class Graph implements Term {
	private static graphs: CoreMap<string, Graph> = new CoreMap<string, Graph>();
	private quads: QuadSet;
	private _node: NamedNode;
	termType: string = 'Graph';

	constructor(public value: string, quads?: QuadSet) {
		this._node = NamedNode.getOrCreate(value);
		this.quads = quads ? quads : new QuadSet();
	}

	equals(other: Term) {
		return other === this;
	}

	get node(): NamedNode {
		return this._node;
	}

	//Static methods
	/**
	 * Resets the map of resources that is known in this environment
	 */
	static reset() {
		this.graphs = new CoreMap<string, Graph>();
	}

	registerQuad(quad: Quad) {
		this.quads.add(quad);
	}

	hasQuad(quad: Quad) {
		return this.quads.has(quad);
	}

	//Note: cannot name this getQuads, because NamedNode already uses that for getting all quads of all its properties
	getContents(): QuadSet {
		return this.quads;
	}

	toString() {
		return (
			'Graph: [' +
			this.node.uri.toString() +
			' - ' +
			this.quads.size +
			' quads]'
		);
	}

	static create(quads?: QuadSet): Graph {
		var uri = NamedNode.createNewTempUri();
		return this._create(uri, quads);
	}

	private static _create(uri: string, quads?: QuadSet): Graph {
		var graph = new Graph(uri, quads);
		this.register(graph);
		return graph;
	}

	static register(graph: Graph) {
		if (this.graphs.has(graph.node.uri)) {
			throw new Error(
				'A graph with this URI already exists. You should probably use Graph.getOrCreate instead of Graph.create (' +
				graph.node.uri +
				')',
			);
		}
		this.graphs.set(graph.node.uri, graph);
		// super.register(graph);
	}

	static unregister(graph: Graph) {
		if (!this.graphs.has(graph.node.uri)) {
			throw new Error(
				'This node has already been removed from the registry: ' +
				graph.node.uri,
			);
		}
		this.graphs.delete(graph.node.uri);
		// super.unregister(graph);
	}

	static getOrCreate(uri: string) {
		return this.getGraph(uri) || this._create(uri);
	}

	static getGraph(uri: string, mustExist: boolean = false): Graph | null {
		//look it up in known full uri node map
		if (this.graphs.has(uri)) {
			return this.graphs.get(uri);
		}

		//by default at the moment, quads are not in any graph unless specifically assigned to one
		//this may change whenever we truly need to be able to query the quads in the default graph (that are not in any other named graph)
		//and we will need to think about behaviour, because different stores use different solutions
		//is the default graph the combined graph of all graphs + quads without graph? (like GraphDB)
		//or just the graph of quads without graph?
		//and where do inferred quads go to? (currently no graph but we could put them in the right graph)

		if (mustExist) {
			throw Error('could not find graph for: ' + uri);
		}
		return null;
	}

	static updateUri(graph: Graph, uri: string) {
		(graph.node as NamedNode).uri = uri;
	}

	static getAll(): CoreMap<string, Graph> {
		return this.graphs;
	}
}

class DefaultGraph extends Graph implements TFDefaultGraph {
	value: '' = '';
	termType: typeof DefaultGraphTermType = DefaultGraphTermType;

	uri = defaultGraphURI;

	constructor() {
		//empty string for default graph URI (part of the standard)
		//https://rdf.js.org/data-model-spec/#defaultgraph-interface
		super('');
	}

	toString() {
		return 'DefaultGraph';
	}
}

export const defaultGraph = new DefaultGraph();

export class Quad extends EventEmitter {
	/**
	 * Emitter used by the class itself by static methods emitting events.
	 * Anyone wanting to listen to that should therefore add a listener with Quad.emitter.on(...)
	 * @internal
	 */
	static emitter = new EventEmitter();

	/**
	 * The number of quads active in this system
	 */
	static globalNumQuads: number = 0;

	private static newQuads: QuadSet = new QuadSet();
	private static removedQuads: QuadSet = new QuadSet();

	//altered quads are those that contain changes made by methods of existing Resources as opposed to methods that use Quad.getOrCreate
	//this separation is used for example by automatic storage of changes made due to user input, see storage controllers.
	// private static alteredQuads = new QuadSet();
	private static alteredQuadsRemoved: QuadSet = new QuadSet();
	private static alteredQuadsCreated: QuadSet = new QuadSet();
	private static alteredQuadsUpdated: CoreMap<
		NamedNode,
		CoreMap<NamedNode, [Node, Node]>
		> = new CoreMap(); //NamedNode,string,string]>();

	/**
	 * @internal
	 * emitted when new quads have been created
	 */
	static TRIPLES_CREATED: string = 'TRIPLES_CREATED';

	/**
	 * @internal
	 * emitted when quads have been removed
	 */
	static TRIPLES_REMOVED: string = 'TRIPLES_REMOVED';

	/**
	 * emitted by a quad when that quad is being removed
	 */
	static TRIPLE_REMOVED: string = 'TRIPLE_REMOVED';

	/**
	 * emitted by a quad when the value of that quad is being changed (without removing and creating a new quad locally)
	 */
	static VALUE_CHANGED: string = 'VALUE_CHANGED';

	/**
	 * emitted when quads have been altered by user interaction
	 * @internal
	 */
	static TRIPLES_ALTERED: string = 'TRIPLES_ALTERED';

	private _removed: boolean;
	private _altered: boolean;

	/**
	 * Creates the quad
	 * @param subject - the subject of the quad
	 * @param predicate
	 * @param object
	 */
	constructor(
		public subject: NamedNode,
		public predicate: NamedNode,
		public object: Node,
		public graph: Graph = defaultGraph,
		public implicit: boolean = false,
		alteration: boolean = false,
	) {
		super();

		this.setup(alteration);
	}

	private setup(alteration: boolean = false) {
		// if(this.predicate.uri == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && this.object['uri'] == "http://data.dacore.org/ontologies/core/Editor")
		// {
		// 	debugger;
		// }

		//lets resources take note of this quad in which they occur
		//first of all we overwrite the property this.object with the result of register because a Literal may return a clone
		this.object = this.object.registerInverseProperty(this, alteration);
		this.subject.registerProperty(this, alteration);
		this.predicate.registerAsPredicate(this, alteration);
		this.graph.registerQuad(this);

		//new quad events are batched together and emitted on the next tick
		//so here we make sure the Quad class will emit its batched events on the next tick
		eventBatcher.register(Quad);
		//and here we save this quad to a set of newQuads which is a static property of the Quad class
		Quad.newQuads.add(this);

		//only if its an alteration AND its relevant to storage controllers do we emit the TRIPLES_ALTERED event for this quad
		if (
			alteration &&
			!this.implicit &&
			!this.subject.isTemporaryNode &&
			!this.predicate.isTemporaryNode &&
			(!(this.object instanceof NamedNode) ||
				!(this.object as NamedNode).isTemporaryNode)
		) {
			Quad.alteredQuadsCreated.add(this);
		}
		Quad.globalNumQuads++;
	}

	/**
	 * Turns off a quad. Meaning it will no longer be active in the graph.
	 * Comes in handy in very specific use cases when for example quads have already been created, but you want to check what the state was before these quads were created
	 */
	turnOff() {
		this.subject.unregisterProperty(this, false, false);
		this.predicate.unregisterAsPredicate(this, false, false);
		this.object.unregisterInverseProperty(this, false, false);
	}

	/**
	 * Turns on a quad. Meaning it will be active (again) in the graph.
	 * Only use this if you've had to turn quads off first.
	 */
	turnOn() {
		this.subject.registerProperty(this, false, false);
		this.predicate.registerAsPredicate(this, false, false);
		this.object.registerInverseProperty(this, false, false);
	}

	/**
	 * Turn an implicit quad into an explicit quad (because an explicit user action generated it as an independent explicit fact now)
	 */
	makeExplicit() {
		//unregister and make explicit
		this.turnOff();
		this.implicit = false;
		//re-register and make it an 'alteration' so it will be picked up by the storage
		this.setup(true);
	}

	/**
	 * @internal
	 * Returns true if events of newly created quads or removed quads are currently batched and waiting to be emitted
	 */
	static hasBatchedEvents() {
		return this.newQuads.size > 0 || this.removedQuads.size > 0;
	}

	/**
	 * @internal
	 */
	static emitBatchedEvents() {
		if (this.newQuads.size > 0) {
			this.emitter.emit(Quad.TRIPLES_CREATED, this.newQuads);
			this.newQuads = new QuadSet();
		}
		if (this.removedQuads.size > 0) {
			this.emitter.emit(Quad.TRIPLES_REMOVED, this.removedQuads);
			this.removedQuads = new QuadSet();
		}
		if (
			this.alteredQuadsCreated.size > 0 ||
			this.alteredQuadsRemoved.size > 0 ||
			this.alteredQuadsUpdated.size > 0
		) {
			this.emitter.emit(
				Quad.TRIPLES_ALTERED,
				this.alteredQuadsCreated,
				this.alteredQuadsRemoved,
				this.alteredQuadsUpdated,
			);
			this.alteredQuadsCreated = new QuadSet();
			this.alteredQuadsRemoved = new QuadSet();
			this.alteredQuadsUpdated = new CoreMap();
		}
	}

	/**
	 * Get the existing quad for the given subject,predicate and object, or create it if it didn't exists yet.
	 * @param subject
	 * @param predicate
	 * @param object
	 * @param implicit
	 * @param alteration - states whether this quad has been created by a user interaction (true) or simply because of updated data has been loaded
	 */
	static getOrCreate(
		subject: NamedNode,
		predicate: NamedNode,
		object: Node,
		graph: Graph = defaultGraph,
		implicit: boolean = false,
		alteration: boolean = false,
	) {
		return (
			this.get(subject, predicate, object) ||
			new Quad(subject, predicate, object, graph, implicit, alteration)
		);
	}

	/**
	 * Gets the existing quad for the given subject,predicate and object.
	 * Will return any quad with an equivalent object. See Literal.isEquivalentTo() and NamedNode.isEquivalentTo() for more information.
	 * @param subject
	 * @param predicate
	 * @param object
	 */
	static get(
		subject: NamedNode,
		predicate: NamedNode,
		object: Node,
	): Quad | null {
		if (!subject || !predicate || !object) return null;

		if (subject.has(predicate, object)) {
			//.has will also check equivalent literalresources, but getQuad does not, so if it returns true
			//we need to find the literal that already exists as value of this predicate
			//NOTE: we check if not uriresource because that means its a literalresource, but we dont have to include it in this file (caused dependency circle errors)
			if (!(object instanceof NamedNode)) {
				for (let [key, quad] of subject.getQuads(predicate).entries()) {
					if (object.equals(key)) {
						return quad;
					}
				}
			} else {
				return subject.getQuad(predicate, object);
			}
		}
	}

	/**
	 * Returns true if this quad was created because of a user action/input, as opposed to coming from some data that already existed
	 */
	get altered() {
		return this._altered;
	}

	/**
	 * Listen to change of the quads' literal value.
	 * @param listener
	 */
	onValueChange(listener) {
		this.on(Quad.VALUE_CHANGED, listener);
	}

	/**
	 * Stop listening to value changes
	 * @param listener
	 */
	offValueChange(listener) {
		this.off(Quad.VALUE_CHANGED, listener);
	}

	/**
	 * used by Literal to notify this quad of changes to the literel value of its object, therefor the quad is getting modified
	 * @internal
	 * @param oldValue
	 * @param newValue
	 * @param alteration
	 */
	registerValueChange(
		oldValue: Node,
		newValue: Node,
		alteration: boolean = false,
	) {
		//setting altered = true here, will be reset / deleted by emitting change events
		this._altered = true;
		this.emit(Quad.VALUE_CHANGED, oldValue, newValue, alteration);

		if (
			alteration &&
			!this.implicit &&
			!this.subject.isTemporaryNode &&
			!this.predicate.isTemporaryNode &&
			(!(this.object instanceof NamedNode) ||
				!(this.object as NamedNode).isTemporaryNode)
		) {
			eventBatcher.register(Quad);
			//make sure subject map exists
			if (!Quad.alteredQuadsUpdated.has(this.subject)) {
				Quad.alteredQuadsUpdated.set(this.subject, new CoreMap());
			}
			let map = Quad.alteredQuadsUpdated.get(this.subject);
			//if first time we set a new value for this predicate
			if (!map.has(this.predicate)) {
				//set it
				map.set(this.predicate, [oldValue, newValue]);
			} else {
				//else overwrite with a new array, reusing the old value of last time (so we keep the oldest old value)
				map.set(this.predicate, [map.get(this.predicate)[0], newValue]);
			}
		}
	}

	/**
	 * Remove this quad from the graph
	 * Will be removed both locally and from the graph database
	 * @param alteration
	 */
	remove(alteration: boolean = false): void {
		if (this._removed) return;

		//first set removed is true so event handlers can detect the difference between added or removed values
		this._removed = true;

		this.subject.unregisterProperty(this);
		this.predicate.unregisterAsPredicate(this);
		this.object.unregisterInverseProperty(this);

		//removed quad events are batched together and emitted on the next tick
		//so here we make sure the Quad class will emit its batched events on the next tick
		eventBatcher.register(Quad);
		//and here we save this quad to a set of removedQuads which is a static property of the Quad class
		Quad.removedQuads.add(this);

		if (
			alteration &&
			!this.implicit &&
			!this.subject.isTemporaryNode &&
			!this.predicate.isTemporaryNode &&
			(!(this.object instanceof NamedNode) ||
				!(this.object as NamedNode).isTemporaryNode)
		) {
			Quad.alteredQuadsRemoved.add(this);
		}

		//we need to let this quad emit this event straight away because for example the reasoner needs to listen to this exact quad to retract
		this.emit(Quad.TRIPLE_REMOVED);

		Quad.globalNumQuads--;

		//TODO:remove all event listeners here?
	}

	/**
	 * Cancel the removal of a quad
	 */
	undoRemoval() {
		this.setup();
		this._removed = false;
	}

	/**
	 * Returns true if this quad still exists as an object in memory, but is no longer actively used in the graph
	 */
	get isRemoved(): boolean {
		return this._removed;
	}

	/**
	 * Print this quad as a string
	 */
	toString() {
		return (
			this.subject.toString() +
			' ' +
			this.predicate.toString() +
			' ' +
			this.object.toString()
		);
	}
}