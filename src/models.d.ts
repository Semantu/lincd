import { DefaultGraph as TFDefaultGraph, Literal as ILiteral, NamedNode as INamedNode, Term } from 'rdflib/lib/tf-types.js';
import { DefaultGraphTermType, TermType } from 'rdflib/lib/types.js';
import { QuadSet } from './collections/QuadSet.js';
import { CoreMap } from './collections/CoreMap.js';
import { QuadMap } from './collections/QuadMap.js';
import { QuadArray } from './collections/QuadArray.js';
import { NodeSet } from './collections/NodeSet.js';
import { ICoreIterable } from './interfaces/ICoreIterable.js';
import { IShape } from './interfaces/IShape.js';
import { IGraphObject } from './interfaces/IGraphObject.js';
import { NodeValuesSet } from './collections/NodeValuesSet.js';
import { BatchedEventEmitter } from './events/EventBatcher.js';
import { EventEmitter } from './events/EventEmitter.js';
import { NodeMap } from './collections/NodeMap.js';
import { NodeURIMappings } from './collections/NodeURIMappings.js';
export declare abstract class Node extends EventEmitter {
    protected _value: string;
    /** The type of node */
    termType: TermType;
    constructor(_value: string);
    get value(): string;
    set value(val: string);
    /**
     * Create an instance of the given class (or one of its subclasses) as a presentation of this node.
     * NOTE: this node MUST have the static.type of the given class as its rdf:type property
     * @param type - a class that extends Shape and thus who's instances represent a node as an instance of one specific type.
     */
    getAs<T extends IShape>(type: {
        new (): T;
        getOf(node: Node): T;
    }): T;
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
        getStrictlyOf(node: Node): T;
    }): T;
    /**
     * Compares whether the two nodes are equal
     * @param other The other node
     */
    equals(other: Term): boolean;
    set(property: NamedNode, value: Node): boolean;
    setValue(property: NamedNode, value: string): boolean;
    has(property: NamedNode, value: Node): boolean;
    hasValue(property: NamedNode, value: string): boolean;
    hasExplicit(property: NamedNode, value: Node): boolean;
    hasExact(property: NamedNode, value: Node): boolean;
    hasProperty(property: NamedNode): boolean;
    hasInverseProperty(property: NamedNode): boolean;
    hasInverse(property: NamedNode, value: Node): boolean;
    mset(property: NamedNode, values: Iterable<Node>): boolean;
    getProperties(includeFromIncomingArcs?: boolean): NodeSet<NamedNode>;
    getInverseProperties(): any;
    getOne(property: NamedNode): Node | undefined;
    getAll(property: NamedNode): NodeValuesSet;
    getValue(property?: NamedNode): string;
    getDeep(property: NamedNode, maxDepth?: number, partialResult?: NodeSet): NodeSet;
    getOneInverse(property: NamedNode): NamedNode | undefined;
    getOneWhere(property: NamedNode, filterProperty: NamedNode, filterValue: Node): undefined;
    getOneWhereEquivalent(property: NamedNode, filterProperty: NamedNode, filterValue: Node, caseSensitive?: boolean): undefined;
    getAllExplicit(property: NamedNode): NodeSet;
    getAllInverse(property: NamedNode): NodeSet<NamedNode> | undefined;
    getMultiple(properties: ICoreIterable<NamedNode>): NodeSet;
    hasPath(properties: NamedNode[]): boolean;
    hasPathTo(properties: NamedNode[], value?: Node): boolean;
    hasPathToSomeInSet(properties: NamedNode[], endPoints?: ICoreIterable<Node>): boolean;
    getOneFromPath(...properties: NamedNode[]): Node | undefined;
    getAllFromPath(...properties: NamedNode[]): NodeSet;
    getQuads(property: NamedNode, value?: Node): QuadSet;
    getInverseQuad(property: NamedNode, subject: NamedNode): Quad | undefined;
    getInverseQuads(property: NamedNode): QuadSet;
    getAllInverseQuads(includeImplicit?: boolean): QuadArray;
    getAllQuads(includeAsObject?: boolean, includeImplicit?: boolean): QuadArray;
    overwrite(property: NamedNode, value: any): boolean;
    moverwrite(property: NamedNode, value: any): boolean;
    unset(property: NamedNode, value: Node): boolean;
    unsetAll(property: NamedNode): boolean;
    isLoaded(includingIncomingProperties?: boolean): boolean;
    promiseLoaded(loadInverseProperties?: boolean): Promise<boolean>;
    getMultipleInverse(properties: ICoreIterable<NamedNode>): NodeSet;
    /**
     * @internal
     * @param quad
     */
    unregisterInverseProperty(quad: Quad, alteration?: boolean, emitEvents?: boolean): void;
    /**
     * registers the use of a quad. Since a quad can only be used in 1 quad
     * this method makes a clone of the Literal if it's used a second time,
     * and returns that new Literal so it will be used by the quad
     * @internal
     * @param quad
     */
    registerInverseProperty(quad: Quad, alteration?: boolean, emitEvents?: boolean): Node;
    clone(): Node;
    print(): string;
}
/**
 * A Named Node in the graph is a node that has outgoing edges to other nodes.
 *
 * In RDF specifications, a Named Node is a URI Node.
 * You can manage this by setting and getting 'properties' of this node, which will reflect in which nodes this node is connected with.
 * A Named Node is one of the two types of nodes in a graph in the semantic web / RDF.
 * The other one being Literal
 * @see https://www.w3.org/TR/rdf-concepts/#section-Graph-URIref
 *
 * @example
 *
 * Use NamedNode.getOrCreate() if you have a URI
 * Use NamedNode.create() to create a new NamedNode without specifying a URI
 * Do NOT use the constructor
 *
 * ```
 * let node = NamedNode.create();
 * let node = NamedNode.getOrCreate("http://url.of.some/node")
 * ```
 */
export declare class NamedNode extends Node implements IGraphObject, BatchedEventEmitter, INamedNode {
    private _isTemporaryNode;
    /**
     * The base of temporary URI's
     * @internal
     */
    static TEMP_URI_BASE: string;
    /**
     * Emitter used by the class itself by static methods emitting events.
     * Anyone wanting to listen to that should therefore add a listener with NamedNode.emitter.on(...)
     * @internal
     */
    static emitter: EventEmitter;
    /**
     * event emitted when nodes need to be stored
     * @internal
     */
    static STORE_NODES: string;
    /**
     * Event emitted when previous values have been overwritten (for example with update or moverwrite)
     * NOTE: Locally we may not know all the properties, but the intend of update / moverwrite is to overwrite ANY existing properties. So event handlers listening to this event should clear any previous property values they can find.
     * @internal
     */
    static CLEARED_PROPERTIES: string;
    /**
     * event emitted when nodes need to be removed
     * @internal
     */
    static REMOVE_NODES: string;
    /**
     * event emitted when the URI of a node has been updated
     */
    static URI_UPDATED: string;
    /**
     * event emitted when nodes need to be loaded
     * @internal
     */
    static LOAD_NODES: string;
    /**
     * event emitted by a single node when its properties have changed
     * @internal
     */
    static PROPERTY_CHANGED: string;
    /**
     * event emitted by a single node when its properties have been altered
     * NOTE: we use 'altered' for changes made by user interaction vs 'changed' for changes that
     * could for example be due to new data being loaded
     * @internal
     */
    static PROPERTY_ALTERED: string;
    /**
     * event emitted by a single node when its inverse properties have been changed
     * @internal
     */
    static INVERSE_PROPERTY_CHANGED: string;
    /**
     * event emitted by a single node when its inverse properties have been altered
     * NOTE: we use 'altered' for changes made by user interaction vs 'changed' for changes that
     * could for example be due to new data being loaded
     * @internal
     */
    static INVERSE_PROPERTY_ALTERED: string;
    /**
     * event emitted by a single node when its used or not used anymore as a predicate
     * @internal
     */
    static AS_PREDICATE_CHANGED: string;
    /**
     * event emitted by a single node when its used or not used anymore as a predicate due to user requested alterations
     * @internal
     */
    static AS_PREDICATE_ALTERED: string;
    /**
     * event emitted by a single node when it's been removed
     */
    static NODE_REMOVED: string;
    private static namedNodes;
    private static tempCounter;
    private static nodesToSave;
    private static nodesToLoad;
    private static nodesToLoadFully;
    private static nodesToRemove;
    private static nodesURIUpdated;
    private static clearedProperties;
    /**
     * map of QuadMaps indexed by property (where this node occurs as subject)
     * NOTE: 'properties' serves only to increase lookup speed but also costs memory
     * since reverse lookup (where this node occurs as object) will be much less frequent
     * the inverse of 'properties' is not kept, so all results for reverse lookup will be created from 'asObject'
     * @internal
     */
    properties: CoreMap<NamedNode, NodeValuesSet>;
    termType: any;
    /**
     * map of QuadMaps indexed by property where this node occurs as subject
     * NOTE: we use QuadMap here because in ES5 a quadMap is much faster than a quadSet, because we can check by key with uri directly if the quad exists instead of having to look in an array with indexOf (ES5 does not support objects as keys)
     * @internal
     */
    private asSubject;
    /**
     * map of QuadMaps indexed by property where this node occurs as object
     * @internal
     */
    private asObject;
    /**
     * array of Quads in which this node occurs as predicate
     * @internal
     */
    private asPredicate;
    private changedProperties;
    private alteredProperties;
    private changedInverseProperties;
    private alteredInverseProperties;
    private changedAsPredicate;
    private alteredAsPredicate;
    private savePromise;
    private removePromise;
    /**
     * WARNING: Do not directly create a Node, instead use NamedNode.getOrCreate(uri)
     * This ensures the same node is used for the same uri system wide
     * @param uri - the URI (more generic form of a URL) of the NamedNode
     * @param _isTemporaryNode - set to true if this node is only temporarily available in the local environment
     */
    constructor(uri?: string, _isTemporaryNode?: boolean);
    private _isStoring;
    get isStoring(): boolean;
    set isStoring(storing: boolean);
    /**
     * JSLib.js documentation states: "Alias for value, favored by Tim" ... LINCD author René agrees with Tim
     * @see https://github.com/linkeddata/rdflib.js/blob/bbf456390afe7743020e0c8c4db20b10cfb808c7/src/named-node.ts#L88
     */
    get uri(): string;
    set uri(uri: string);
    /**
     * Returns true if this node has a temporary URI and only exists in the local environment.
     * e.g. this is usually true if you create a new NamedNode without having specified a URI yet
     */
    get isTemporaryNode(): boolean;
    set isTemporaryNode(val: boolean);
    get value(): string;
    set value(newUri: string);
    /**
     * Emits the batched (property) events of the NamedNode CLASS (meaning events that relate to all nodes)
     * Used internally by the framework to batch and emit change events
     * @internal
     */
    static emitBatchedEvents(resolve: any, reject: any): void;
    /**
     * Returns true if this node has any batched events waiting to be emitted
     * Used internally by the framework to batch and emit change events
     * @internal
     */
    static hasBatchedEvents(): number | boolean;
    /**
     * Converts the string '<http://some.uri>' into a NamedNode
     * @param uriString the string representation of a NamedNode, consisting of its URI surrounded by brackets: '<' URI '>'
     */
    static fromString(uriString: string): NamedNode;
    /**
     * Resets the map of nodes that is known in this local environment
     * Mostly used for test functionality
     */
    static reset(): void;
    /**
     * Create a new local NamedNode. A temporary URI will be generated for its URI.
     * This node will not exist in the graph database (persistent storage) until you call `node.save()`
     * Until saved, `node.isTemporaryNode()` will return true.
     */
    static create(): NamedNode;
    /**
     * Registers a NamedNode to the locally known list of nodes
     * @internal
     * @param node
     */
    static register(node: NamedNode): void;
    /**
     * Unregisters a NamedNode from the locally known list of nodes
     * @internal
     * @param node
     */
    static unregister(node: NamedNode): void;
    /**
     * Returns a map of all locally known nodes.
     * The map will have URI's as keys and NamedNodes as values
     * @param node
     */
    static getAllNamedNodes(): NodeMap<NamedNode>;
    /**
     * Returns a map of all locally known nodes.
     * The map will have URI's as keys and NamedNodes as values
     * @param node
     */
    static createNewTempUri(): string;
    static getCounter(): number;
    /**
     * ##########################################################################
     * ############# PUBLIC METHODS FOR REGULAR USE #############
     * ##########################################################################
     */
    /**
     * The proper way to obtain a node from a URI.
     * If requested before, this returns the existing NamedNode for the given URI.
     * Or, if this is the first request for this URI, it creates a new NamedNode first, and returns that
     * Using this method over `new NamedNode()` makes sure all nodes are registered, and no duplicates will exist.
     * `new NamedNode()` should therefore never be used.
     * @param uri
     */
    static getOrCreate(uri: string, isTemporaryNode?: boolean): NamedNode;
    /**
     * Returns the NamedNode with the given URI, IF it exists.
     * DOES NOT create a new NamedNode if it didn't exist yet, instead it returns undefined.
     * You can therefore use this method to see if a NamedNode already exists locally.
     * Use `getOrCreate()` if you want to simply get a NamedNode for a certain URI
     * @param uri
     */
    static getNamedNode(uri: string): NamedNode | undefined;
    private static _create;
    /**
     * Used by Quads to signal their subject about a new property
     * @internal
     * @param quad
     * @param alteration
     * @param emitEvents
     */
    registerProperty(quad: Quad, alteration?: boolean, emitEvents?: boolean): void;
    /**
     * Inverse property can be thought of as "this node is the value (object) of another nodes' property"
     * This method is used by the class Quad to communicate its existence to the quads object
     * @internal
     * @param quad
     * @param alteration
     * @param emitEvents
     */
    registerInverseProperty(quad: Quad, alteration?: boolean, emitEvents?: boolean): Node;
    /**
     * This method is used by the class Quad to communicate with its nodes
     * @internal
     * @param quad
     * @param alteration
     */
    registerValueChange(quad: Quad, alteration?: boolean): void;
    /**
     * Called when this node occurs as predicate in a quad
     * @internal
     */
    registerAsPredicate(quad: Quad, alteration?: boolean, emitEvents?: boolean): void;
    /**
     * This method is used by the class Quad to communicate with its nodes
     * @internal
     */
    unregisterProperty(quad: Quad, alteration?: boolean, emitEvents?: boolean): void;
    /**
     * This method is used by the class Quad to communicate with its nodes
     * @internal
     */
    unregisterInverseProperty(quad: Quad, alteration?: boolean, emitEvents?: boolean): void;
    /**
     * This method is used by the class Quad to communicate with its nodes
     * @internal
     */
    unregisterAsPredicate(quad: Quad, alteration?: boolean, emitEvents?: boolean): void;
    /**
     * Returns a list of quads in which this node is now used as predicate
     * BEFORE these changes are sent as events in the normal event flow
     * Currently used by Reasoner to allow for immediate application of reasoning
     */
    getPendingPredicateChanges(): QuadArray;
    /**
     * Returns a list of quads in which this node is now used as object
     * BEFORE these changes are sent as events in the normal event flow
     * Currently used by Reasoner to allow for immediate application of reasoning
     */
    getPendingInverseChanges(property: NamedNode): QuadSet;
    /**
     * Returns a list of quads in which this node is now used as subject
     * BEFORE these changes are sent as events in the normal event flow
     * Currently used by Reasoner to allow for immediate application of reasoning
     */
    getPendingChanges(property: NamedNode): QuadSet;
    /**
     * Set the a single property value
     * Creates a single connection between two nodes in the graph: from this node, to the node given as value, with the property as the connecting 'edge' between them
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param value - the node that this new graph-edge points to. The object of the quad to be created.
     */
    set(property: NamedNode, value: Node): boolean;
    /**
     * Same as set() except this method allows you to pass a string as value and converts it to a Literal for you
     * @param property
     * @param value
     */
    setValue(property: NamedNode, value: string): boolean;
    /**
     * Set multiple values at once for a single property.
     * You can use this for example to state that this node (a person) has a 'hasFriend' connection to multiple people (friends) in 1 statement
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param values - an array or set of nodes. Can be NamedNodes or Literals
     */
    mset(property: NamedNode, values: ICoreIterable<Node>): boolean;
    /**
     * Returns true if this node has the given value as the value of the given property
     * NOTE: returns true when a literal node is provided that is EQUIVALENT to any of the values that this node has for this property (whilst not neccecarilly being the exact same object in memory)
     * See also: Literal.equals
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param value - a single node. Can be a NamedNode or Literal
     */
    has(property: NamedNode, value: Node): boolean;
    /**
     * Returns true if this node has the given value for the given property in an EXPLICIT quad.
     * That is, this property-value has been explicitly set, and is NOT generated by the Reasoner.
     * See the documentation for more information about implicit vs explicit
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param value - a single node. Can be a NamedNode or Literal
     */
    hasExplicit(property: NamedNode, value: Node): boolean;
    /**
     * Returns true if this node has ANY explicit quad with the given property
     * See the documentation for more information about implicit vs explicit
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    hasExplicitProperty(property: NamedNode): boolean;
    /**
     * Returns true if this node has a Literal as value of the given property who's literal-value (a string) matches the given value
     * So works the same as `has()` except you can provide a string as value, and will obviously not match any NamedNode values
     * And unlike has() this method will NOT check for the Literal its datatype. Instead only checking the literal-value
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param value - the string value we want to check for
     */
    hasValue(property: NamedNode, value: string): boolean;
    /**
     * Returns true if this node has the given value as the value of the given property with an EXACT match (meaning the same object in memory)
     * So works the same as has() except for Literals this only returns true if the value of the property is exactly the same object as the given value
     * UNLIKE `has()` which checks if the literal value, datatype and language tag of two literal nodes are equivalent
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param value - a single node. Can be a NamedNode or Literal
     */
    hasExact(property: NamedNode, value: Node): boolean;
    /**
     * Returns true if this node has ANY value set for the given property.
     * That is, if any quad exists that has this node as the subject and the given property as predicate
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    hasProperty(property: NamedNode): boolean;
    /**
     * Returns true if the given end point can be reached by following the given properties in order
     * Example: hasPathTo([foaf.hasFriend,rdf.type],foaf.Person) will return true if any of the friends of this node (this person in this example) is of the type foaf:Person
     * @param properties an array of NamedNodes
     * @param endPoint the node to reach, a Literal or a NamedNode
     */
    hasPathTo(properties: NamedNode[], endPoint?: Node): boolean;
    getAs<T extends IShape>(type: {
        new (): T;
        getOf(node: Node): T;
    }): T;
    /**
     * returns true if ANY of the given end points can be reached by following the given properties in the given order
     * Example: hasPathTo([foaf.hasFriend,foaf.hasFriend],[mike,jenny]) will return true if this node (person) has a friend that has mike or jenny as a friend
     * @param properties an array of NamedNodes
     * @param endPoint the node to reach, a Literal or a NamedNode
     */
    hasPathToSomeInSet(properties: NamedNode[], endPoints?: ICoreIterable<Node>): boolean;
    /**
     * returns true if ANY end point (node) can be reached by following the given properties in order
     * @param properties an array of NamedNodes
     */
    hasPath(properties: NamedNode[]): boolean;
    /**
     * Returns a set of all the properties this node has.
     * That is, all unique predicates of quads where this node is the subject
     * @param includeFromIncomingArcs if true, also includes predicates (properties) of quads where this node is the VALUE of another nodes' property. Default: false
     */
    getProperties(includeFromIncomingArcs?: boolean): NodeSet<NamedNode>;
    /**
     * Returns a set of all the properties used by this node in EXPLICIT facts (quads)
     * See the documentation for more information about implicit vs explicit facts
     * @param includeFromIncomingArcs if true, also includes predicates (properties) of quads where this node is the VALUE of another nodes' property. Default: false
     */
    getExplicitProperties(includeFromIncomingArcs?: boolean): NodeSet<NamedNode>;
    /**
     * Returns a set of all the properties used by other nodes where this node is the VALUE of that property
     * For example if this node is Jenny and the following is true: Mike foaf:hasFriend Jenny, calling this method on Jenny will return hasFriend
     */
    getInverseProperties(): NodeSet<NamedNode>;
    /**
     * If this node has values for the given property, the first value is returned
     * NOTE: the order of multiple values CANNOT be guaranteed. Therefore use this value if it DOESN'T matter to you which of multiple possible values for this property you'll get OR if you're certain there will be only 1 value.
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    getOne(property: NamedNode): Node | undefined;
    /**
     * If this node has EXPLICIT values for the given property, the first value is returned
     * Same as `getOne()` except only explicit quads / facts are considered
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    getOneExplicit(property: NamedNode): Node | undefined;
    /**
     * Returns all values this node has for the given property
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    getAll(property: NamedNode): NodeValuesSet;
    /**
     * Returns all values this node EXPLICITLY has for the given property
     * So, same as `getAll()` except only explicit facts are considered.
     * See the documentation for more information about implicit vs explicit
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    getAllExplicit(property: any): NodeSet;
    /**
     * Returns the literal value of the first Literal value for the given property
     * Only returns a results in the disired language if specified.
     * For example if `this rdfs:label "my name" then this.getValue(rdfs.label) will return "my name".
     * So, works the same as getOne() except it will return the literal (string) value of the first found Literal
     * NOTE: the order of multiple values CANNOT be guaranteed. Therefore use this value if it DOESN'T matter to you which of multiple possible values for this property you'll get OR if you're certain there will be only one value.
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    getValue(property?: NamedNode, language?: string): string;
    /**
     * Returns the literal values (strings) of all Literals this this node has a value for the given property
     * For example if `this rdfs:label "my name" and `this rdfs:label "my other name"  it will return ["my name","my other name"].
     * So, works the same as getAll() except it will return an array of strings
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    getValues(property: NamedNode): string[];
    /**
     * Returns any value (node, node) that is connected to this node with one or more connections of the given property.
     * For example getDeep(hasFriend) will return all the people that are my friends or friends of friends
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param maxDepth - the maximum number of connections that resulting nodes are removed from this node. In the example above maxDepth=2 would return only friends and friends of friends
     */
    getDeep(property: NamedNode, maxDepth?: number): NodeSet;
    /**
     * Returns the first found value following the given properties in the given order.
     * For example: getOneFromPath([hasFriend,hasFather]) would return the first found father out of the set 'fathers of my friends'
     * @param properties - an array of NamedNodes. Which are nodes with rdf:type rdf:Property, the edges in the graph, the predicates of quads.
     */
    getOneFromPath(...properties: NamedNode[]): Node | undefined;
    /**
     * Returns all values that can be reached by following the given properties in order.
     * For example getAllFromPath([hasFriend,hasFather]) will return all fathers of all my (direct) friends
     * @param properties - an array of NamedNodes. Which are nodes with rdf:type rdf:Property, the edges in the graph, the predicates of quads.
     */
    getAllFromPath(...properties: NamedNode[]): NodeSet;
    /**
     * Same as getDeep() but for inverse properties.
     * Best understood with an example: if this is a person. this.getInverseDeep(hasChild) would return all this persons ancestors (which had children that eventually had this person as their child)
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param maxDepth - the maximum number of connections that resulting nodes are removed from this node. In the example above maxDepth=2 would return only the parents and grand parents
     */
    getInverseDeep(property: NamedNode, maxDepth?: number): NodeSet;
    /**
     * Returns true if the given value can be reached with one or more connections of the given property
     * Example: if this is a person. this.hasDeep(hasFriend,Mike) returns true if this person has Mike as a friend, or if any this persons friends or friends of friends have Mike as a friend.
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param maxDepth - the maximum number of connections that resulting nodes are removed from this node. In the example above maxDepth=2 would return true only if Mike is the persons friend, or friend of a friend
     */
    hasDeep(property: NamedNode, value: Node, maxDepth?: number): boolean;
    /**
     * Returns the first node that has this node as the valu eof the given property.
     * Same as getOne() but for 'inverse properties'. Meaning nodes that have this node as their value.
     * Example: if this is a person. this.getOneInverse(hasChild) returns one of the persons parents
     * NOTE: the order of multiple (inverse) values CANNOT be guaranteed. Therefore use this value if it DOESN'T matter to you which of multiple possible inverse values for this property you'll get OR if you're certain there will be only one value.
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    getOneInverse(property: NamedNode): NamedNode | undefined;
    /**
     * Returns all the nodes that have this node as the value of the given property.
     * Same as getAll() but for 'inverse properties'. Meaning nodes that have this node as their value.
     * Example: if this is a person. this.getAllInverse(hasChild) returns all the persons parents
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    getAllInverse(property: NamedNode): NodeSet<NamedNode>;
    /**
     * Returns all the nodes that have this node as the EXPLICIT value of the given property.
     * Same as getAll() but only considers explicit facts (excluding implicit facts generated by the reasoner)
     * Example: if this is a person. this.getAllInverse(hasChild) returns all the persons parents, as long as the fact that these are this persons parents is explicitly stated
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    getAllInverseExplicit(property: any): NodeSet<NamedNode>;
    /**
     * Get all the values of multiple properties at once
     * Same as getAll() but for multiple properties at once
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    getMultiple(properties: ICoreIterable<NamedNode>): NodeSet;
    /**
     * Get all the nodes that have this node as their value for any of the given properties
     * Same as getMultiple() but for the opposite direction
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    getMultipleInverse(properties: ICoreIterable<NamedNode>): NodeSet;
    /**
     * Get the quad that represent the connection from this node to the given value, connected by the given property
     * NOTE: accessing quads is a very low level functionality required for the framework itself
     * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param value - the node that this new graph-edge points to. The object of the quad to be created.
     */
    getQuads(property: NamedNode, value?: Node): QuadSet;
    /**
     * Get all the quads that represent EXPLICIT connections from this node to another node, connected by the given property
     * NOTE: accessing quads is a very low level functionality required for the framework itself
     * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    getExplicitQuads(property: NamedNode): QuadSet;
    /**
     * Get all the quads that represent EXPLICIT connections from another node that has this node as its value for the given property
     * NOTE: accessing quads is a very low level functionality required for the framework itself
     * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    getExplicitInverseQuads(property: NamedNode): QuadSet;
    /**
     * Get all quads that represent connections from another node that has this node as its value for the given property
     * NOTE: accessing quads is a very low level functionality required for the framework itself
     * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    getInverseQuads(property: NamedNode): QuadSet | undefined;
    /**
     * Get all (by default explicit) quads that represent connections from another node that has this node as its value for ANY property
     * NOTE: accessing quads is a very low level functionality required for the framework itself
     * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
     * @param includeImplicit if true, includes both implicit and explicit quads. By default false, so will only return explicit quads
     */
    getAllInverseQuads(includeImplicit?: boolean): QuadArray;
    /**
     * Get all (by default explicit) quads that represent connections for all values of this node (so quads where this node is the subject)
     * NOTE: accessing quads is a very low level functionality required for the framework itself
     * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
     * @param includeAsObject if true, includes quads from both directions (so also inverse properties where this node is the object of the quad)
     * @param includeImplicit if true, includes both implicit and explicit quads. By default false, so will only return explicit quads
     */
    getAllQuads(includeAsObject?: boolean, includeImplicit?: boolean): QuadArray;
    /**
     * Update a certain property so that only the given value is a value of this property.
     * Overwrites (and thus removes) any previously set values
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param value - a single node. Can be a NamedNode or Literal
     */
    overwrite(property: NamedNode, value: Node): boolean;
    /**
     * #######################################################################
     * ######################## EVENT METHODS / LISTENERS ####################
     * #######################################################################
     **/
    /**
     * Update a certain property so that only the given values are the values of this property.
     * Overwrites (and thus removes) any previously set values
     * Same as overwrite() except this allows you to replace the previous values with MULTIPLE new values
     * @param property
     * @param values
     */
    moverwrite(property: NamedNode, values: ICoreIterable<Node>): boolean;
    /**
     * Removes this node from the graph, locally and remotely, in all connected QuadStores.
     * All properties will be unset, both where this node is the subject or the object.
     * Emits an event from the node itself and from the NamedNode class
     */
    remove(): void;
    /**
     * UNSET (remove) a single property value connection.
     * Remove a single connection between two nodes in the graph: from this node, to the node given as value, with the property as the connecting 'edge' between them
     * In the graph, this will remove the edge between two nodes.
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param value - the node that this new graph-edge points to. The object of the quad to be created.
     */
    unset(property: NamedNode, value: Node): boolean;
    /**
     * unset (remove) all values of a certain property.
     * Removes all connections (edges) in the graph between this node and other nodes, where the given property is used as the connecting 'edge' between them
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    unsetAll(property: NamedNode): boolean;
    static emitClearedProperty(node: NamedNode, property: NamedNode): void;
    /**
     * returns true if ANY node has this node as the value of the given property
     * Example: if 'this' is a person, this.hasInverseProperty(hasChild) returns true if any facts stating `someParent hasChild thisPerson` are known
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    hasInverseProperty(property: NamedNode): boolean;
    /**
     * returns true if the given inverse 'value' has this node as the (real) value of the given property
     * Example: if 'this' is a person, this.hasInverseProperty(hasChild,someParent) returns true if someParent indeed has this person as a child
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param value - a single node. Can be a NamedNode or Literal
     */
    hasInverse(property: NamedNode, value: Node): boolean;
    /**
     * returns true if this node is equivaluent to the given node.
     * For NamedNodes it simply returns true if this === the given object. So if its the same object in memory.
     * It exists mainly for comparing Literals, where two different objects can still be equivalent
     * @param other another node
     */
    equals(other: Term): boolean;
    private createPromise;
    /**
     * Save this node into the graph database.
     * Newly created nodes will exist only in local memory until you call this function
     * @returns a promise that resolves when the node has received a permanent URI
     */
    save(): Promise<void>;
    /**
     * Create a new URI Node with the same properties as the current node
     * NOTE: does NOT clone the inverse properties (where this node is the value of another node its properties)
     */
    clone(): NamedNode;
    /**
     * Returns a string representation of this node.
     * Returns the URI for a NamedNode
     */
    toString(): string;
    print(includeIncomingProperties?: boolean): string;
    /**
     * Fires the given call back when ANY property of this node changes.
     * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
     * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
     */
    onChangeAny(callback: (quads?: QuadSet, property?: NamedNode) => void, context?: any): void;
    /**
     * Fires the given call back when this node become the value or is no longer the value of another node
     * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
     * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
     */
    onChangeAnyInverse(callback: (quads?: QuadSet, property?: NamedNode) => void, context?: any): void;
    /**
     * Fires the given call back when this node changes the values of the given property
     * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
     * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
     */
    onChange(property: NamedNode, callback: (quads?: QuadSet, property?: NamedNode) => void, context?: any): void;
    /**
     * Fires the given callback when this node become the value or is no longer the value of the given property of another node
     * Example: if someGroup hasParticipant thisResource, and the group removes this node from its participants, it will trigger onChangeInverse for this node
     * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
     * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
     */
    onChangeInverse(property: any, callback: (quads?: QuadSet, property?: NamedNode) => void, context?: any): void;
    /**
     * Call this when you want to stop listening for onChangeAny events. Make sure to provide the exact same BOUND instance of a method to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
     * @param callback the exact same method you supplied to onChangeAny
     * @param context the same context you supplied to onChangeAny
     */
    removeOnChangeAny(callback: (quads?: QuadSet, property?: NamedNode) => void, context?: any): void;
    /**
     * Call this when you want to stop listening for onChangeAnyInverse events. Make sure to provide the exact same BOUND instance of a method to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
     * @param callback the exact same method you supplied to onChangeAnyInverse
     * @param context the same context you supplied to onChangeAnyInverse
     */
    removeOnChangeAnyInverse(callback: (quads?: QuadSet, property?: NamedNode) => void, context?: any): void;
    /**
     * Call this when you want to stop listening for onChange events. Make sure to provide the exact same BOUND instance of a method as callback to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
     * @param callback the exact same method you supplied to onChange
     * @param context the same context you supplied to onChange
     */
    removeOnChange(property: NamedNode, callback: (quads?: QuadSet, property?: NamedNode) => void, context?: any): void;
    /**
     * Call this when you want to stop listening for onChangeInverse events. Make sure to provide the exact same BOUND instance of a method as callback to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
     * @param callback the exact same method you supplied to onChangeInverse
     * @param context the same context you supplied to onChangeInverse
     */
    removeOnChangeInverse(property: any, callback: (quads?: QuadSet, property?: NamedNode) => void, context?: any): void;
    /**
     * Call this when you want to stop listening for onChangeAny events. Other then removeOnChangeAny you only have to supply the context.
     * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChangeAny
     * @param context the same context you supplied to onChangeAny
     */
    clearOnChangeAny(context: any): void;
    /**
     * Call this when you want to stop listening for onChangeAnyInverse events. Other then removeOnChangeAnyInverse you only have to supply the context.
     * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChangeAnyInverse
     * @param context the same context you supplied to onChangeAnyInverse
     */
    clearOnChangeAnyInverse(context: any): void;
    /**
     * Call this when you want to stop listening for onChange events. Other then removeOnChange you only have to supply the context.
     * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChange
     * @param context the same context you supplied to onChange
     */
    clearOnChange(property: NamedNode, context?: any): void;
    /**
     * Call this when you want to stop listening for onChangeInverse events. Other then removeOnChangeInverse you only have to supply the context.
     * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChangeInverse
     * @param context the same context you supplied to onChangeAny
     */
    clearOnChangeInverse(property: any, context: any): void;
    /**
     * Call this when you want to stop listening for onPredicateChange events
     * @param context the same context you supplied to onPredicateChange
     */
    clearOnPredicateChange(context: any): void;
    /**
     * Emits the batched (property) events of a NamedNode INSTANCE (meaning for this specific node)
     * Used internally by the framework to manage emitting change events
     * @internal
     */
    emitBatchedEvents(): void;
    getAsSubjectQuads(): Map<NamedNode, QuadMap>;
    getAsPredicateQuads(): QuadArray;
    getAsObjectQuads(): Map<NamedNode, QuadMap>;
    /**
     * Adds the quad to all given maps
     * @param quad
     * @param maps
     * @private
     */
    private registerPropertyChange;
    private registerPredicateChange;
    private getQuadsByValue;
}
export declare class BlankNode extends NamedNode {
    private static counter;
    termType: any;
    constructor(uri?: string, isTemporaryNode?: boolean);
    get uri(): string;
    set uri(uri: string);
    static create(isTemporaryNode?: boolean): BlankNode;
    static createUri(): string;
    static includeBlankNodes(quads: QuadSet | Quad[], includeObjectBlankNodes?: boolean, includeSubjectBlankNodes?: boolean, blankNodes?: NodeURIMappings): Quad[] | QuadSet;
    private static addBlankNodeQuads;
}
/**
 * One of the two main classes of nodes (nodes) in the graph.
 * Literals are endpoints. They do NOT have outgoing connections (edges) to other nodes in the graph.
 * Though a NamedNode can point to a Literal.
 * Each literal node has a literal value, like a string.
 * Besides that is can also have a language tag or a data type.
 * Literals are often saved as a single string, for example '"yes"@en' (yes in english) or '"true"^^xsd:boolean (the value true with datatype english)
 * This class represents those properties.
 * See also: https://www.w3.org/TR/rdf-concepts/#section-Graph-Literal
 */
export declare class Literal extends Node implements IGraphObject, ILiteral {
    protected _datatype: NamedNode;
    private _language;
    termType: 'Literal';
    private referenceQuad;
    /**
     * Other than with NamedNodes, its fine to do `new Literal("my string value")`
     * Datatype and language tags are optional
     * @param value
     * @param datatype
     * @param language
     */
    constructor(value: string, _datatype?: NamedNode, _language?: string);
    /**
     * get the language tag of this literal which states which language this literal is written in
     * See also: http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
     */
    get language(): string;
    /**
     * update the language tag of this literal
     */
    set language(lang: string);
    /**
     * returns the datatype of this literal
     * Note that datatypes are NamedNodes themselves, who always have rdf:type rdf:Datatype
     * If no datatype is set, the default datatype xsd:string will be returned
     * If a language tag is set, the returned datatype will be rdf:langString
     */
    get datatype(): NamedNode;
    /**
     * Update the datatype of this literal
     * @param datatype
     */
    set datatype(datatype: NamedNode);
    /**
     * Return the value of this literal
     * @param datatype
     */
    get value(): string;
    /**
     * update the literal value of this literal
     * @param datatype
     */
    set value(value: string);
    /**
     * Returns the literal value of the first Literal that occurs as object for the given subject and property and optionally also matches the given language
     * @param subject
     * @param property
     * @param language
     * @deprecated
     * @returns {string|undefined}
     */
    static getValue(subject: NamedNode, property: NamedNode, language?: string): string | undefined;
    /**
     * Returns all literal values of the Literals that occur as object for the given subject and property and optionally also match the given language
     * @param subject
     * @param property
     * @param language
     * @returns {string[]}
     */
    static getValues(subject: NamedNode, property: NamedNode, language?: string): string[];
    static isLiteralString(literalString: string): boolean;
    static fromString(literalString: string): Literal;
    getAs<T extends IShape>(type: {
        new (): T;
        getOf(node: Node): T;
    }): T;
    /**
     * @internal
     * @param quad
     */
    registerProperty(quad: Quad): void;
    /**
     * registers the use of a quad. Since a quad can only be used in 1 quad
     * this method makes a clone of the Literal if it's used a second time,
     * and returns that new Literal so it will be used by the quad
     * @internal
     * @param quad
     */
    registerInverseProperty(quad: Quad): Node;
    /**
     * @internal
     * @param quad
     */
    unregisterProperty(quad: Quad): void;
    /**
     * @internal
     * @param quad
     */
    unregisterInverseProperty(quad: Quad): void;
    /**
     * returns true if this literal node has a language tag
     */
    hasLanguage(): boolean;
    /**
     * returns true if the language tag of this literal matches the given language
     */
    isOfLanguage(language: string): boolean;
    /**
     * returns true if this literal has a datatype
     */
    hasDatatype(): boolean;
    /**
     * Returns true if both are literal nodes, with equal literal values, equal language tags and equal data types
     * Other than NamedNodes, two different literal node instances can be deemed equivalent if all their properties are the same
     * @param other
     * @param caseSensitive
     */
    equals(other: Term): boolean;
    /**
     * Returns true if both are literal nodes, with equal literal values (CASE INSENSITIVE CHECK), equal language tags and equal data types
     * Other than NamedNodes, two different literal node instances can be deemed equivalent if all their properties are the same
     * @param other
     */
    equalsCaseInsensitive(other: Term): boolean;
    /**
     * Creates a new Literal with exact the same properties (value,datatype and language)
     */
    clone(): Literal;
    getReferenceQuad(): Quad;
    hasInverseProperty(property: NamedNode): boolean;
    hasInverse(property: NamedNode, value: Node): boolean;
    getOneInverse(property: NamedNode): NamedNode | undefined;
    getMultipleInverse(properties: ICoreIterable<NamedNode>): NodeSet<NamedNode>;
    getAllInverseQuads(includeImplicit?: boolean): QuadArray;
    getAllQuads(includeAsObject?: boolean, includeImplicit?: boolean): QuadArray;
    promiseLoaded(loadInverseProperties?: boolean): Promise<boolean>;
    isLoaded(includingInverseProperties?: boolean): boolean;
    toString(): string;
    print(includeIncomingProperties?: boolean): string;
    private _equals;
}
export declare class Graph implements Term {
    value: string;
    /**
     * Emitted when changes have been made to this graph. Only emitted when data has actually changed, not just when data is loaded
     */
    static CONTENTS_ALTERED: string;
    /**
     * Emitted when the contents of this graph have changed. Can also be due to loading data
     */
    static CONTENTS_CHANGED: string;
    private static graphs;
    termType: string;
    private quads;
    constructor(value: string, quads?: QuadSet);
    private _node;
    get node(): NamedNode;
    /**
     * Resets the map of nodes that is known in this environment
     */
    static reset(): void;
    static create(quads?: QuadSet): Graph;
    /**
     * @internal
     * @param graph
     */
    static register(graph: Graph): void;
    /**
     * @internal
     * @param graph
     */
    static unregister(graph: Graph): void;
    /**
     * Adds the quad to all given maps
     * @param quad
     * @param maps
     * @private
     */
    static getOrCreate(uri: string): Graph;
    static getGraph(uri: string, mustExist?: boolean): Graph | null;
    static updateUri(graph: Graph, uri: string): void;
    static getAll(): CoreMap<string, Graph>;
    private static _create;
    equals(other: Term): any;
    /**
     * @internal
     * @param quad
     */
    registerQuad(quad: Quad, alteration?: boolean, emitEvents?: boolean): void;
    /**
     * @internal
     * @param quad
     */
    unregisterQuad(quad: Quad, alteration?: boolean, emitEvents?: boolean): void;
    hasQuad(quad: Quad): boolean;
    getContents(): QuadSet;
    setContents(quads: QuadSet): void;
    toString(): string;
}
declare class DefaultGraph extends Graph implements TFDefaultGraph {
    value: '';
    termType: typeof DefaultGraphTermType;
    uri: string;
    constructor();
    toString(): string;
}
export declare const defaultGraph: DefaultGraph;
export declare class Quad extends EventEmitter {
    subject: NamedNode;
    predicate: NamedNode;
    object: Node;
    private _graph;
    implicit: boolean;
    /**
     * Emitter used by the class itself by static methods emitting events.
     * Anyone wanting to listen to that should therefore add a listener with Quad.emitter.on(...)
     * @internal
     */
    static emitter: EventEmitter;
    /**
     * The number of quads active in this system
     */
    static globalNumQuads: number;
    /**
     * @internal
     * emitted when new quads have been created
     * TODO: possibly we can remove this, it may never be used. Only alterations are of interest?
     */
    static QUADS_CREATED: string;
    /**
     * @internal
     * emitted by the Quad class itself when quads have been removed
     * TODO: possibly we can remove this, it may never be used. Only alterations are of interest?
     */
    static QUADS_REMOVED: string;
    /**
     * emitted by a quad when that quad is being removed
     * TODO: possibly we can remove this, it may never be used. Only alterations are of interest?
     */
    static QUAD_REMOVED: string;
    /**
     * emitted when quads have been altered by user interaction
     * @internal
     */
    static QUADS_ALTERED: string;
    private static createdQuads;
    private static removedQuads;
    private static removedQuadsAltered;
    private static createdQuadsAltered;
    private _removed;
    /**
     * Creates the quad
     * @param subject - the subject of the quad
     * @param predicate
     * @param object
     */
    constructor(subject: NamedNode, predicate: NamedNode, object: Node, _graph?: Graph, implicit?: boolean, alteration?: boolean, emitEvents?: boolean);
    get graph(): Graph;
    /**
     * Returns true if this quad still exists as an object in memory, but is no longer actively used in the graph
     */
    get isRemoved(): boolean;
    /**
     * @internal
     * Returns true if events of newly created quads or removed quads are currently batched and waiting to be emitted
     */
    static hasBatchedEvents(): boolean;
    /**
     * @internal
     */
    static emitBatchedEvents(): void;
    /**
     * Get the existing quad for the given subject,predicate and object, or create it if it didn't exists yet.
     * @param subject
     * @param predicate
     * @param object
     * @param implicit
     * @param alteration - states whether this quad has been created by a user interaction (true) or simply because of updated data has been loaded
     */
    static getOrCreate(subject: NamedNode, predicate: NamedNode, object: Node, graph?: Graph, implicit?: boolean, alteration?: boolean, emitEvents?: boolean): Quad;
    /**
     * Gets the existing quad for the given subject,predicate and object.
     * Will return any quad with an equivalent object. See Literal.isEquivalentTo() and NamedNode.isEquivalentTo() for more information.
     * @param subject
     * @param predicate
     * @param object
     */
    static get(subject: NamedNode, predicate: NamedNode, object: Node, graph: Graph): Quad | null;
    static moveQuadsToGraph(quads: Quad[], graph: Graph, alteration?: boolean): any;
    /**
     * Removes this quad and creates a new quad with the same subject,predicate,object, but a new graph.
     * Returns the new quad
     * @param newGraph
     */
    moveToGraph(newGraph: Graph, alteration?: boolean): Quad;
    /**
     * Turns off a quad. Meaning it will no longer be active in the graph.
     * Comes in handy in very specific use cases when for example quads have already been created, but you want to check what the state was before these quads were created
     */
    turnOff(): void;
    /**
     * Turns on a quad. Meaning it will be active (again) in the graph.
     * Only use this if you've had to turn quads off first.
     */
    turnOn(): void;
    /**
     * Turn an implicit quad into an explicit quad (because an explicit user action generated it as an independent explicit fact now)
     */
    makeExplicit(): void;
    /**
     * Remove this quad from the graph
     * Will be removed both locally and from the graph database
     * @param alteration
     */
    remove(alteration?: boolean, emitEvents?: boolean): void;
    static emitRemovedQuad(quad: Quad, alteration?: boolean): void;
    /**
     * Cancel the removal of a quad
     */
    undoRemoval(): void;
    onValueChanged(oldValue: Literal): void;
    print(): string;
    /**
     * Print this quad as a string
     */
    toString(): string;
    private setup;
    static emitCreatedQuad(quad: Quad, alteration?: boolean): void;
    private mimicEventsOnUpdate;
}
export {};
