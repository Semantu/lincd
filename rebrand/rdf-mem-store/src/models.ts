/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {
  DefaultGraph as TFDefaultGraph,
  Literal as ILiteral,
  NamedNode as INamedNode,
  Term,
} from 'rdflib/lib/tf-types.js';
import {DefaultGraphTermType,TermType} from 'rdflib/lib/types.js';
import {defaultGraphURI} from 'rdflib/lib/utils/default-graph-uri.js';

import {QuadSet} from './collections/QuadSet.js';
import {CoreMap} from '@_linked/core/collections/CoreMap';
import {QuadMap} from './collections/QuadMap.js';
import {QuadArray} from './collections/QuadArray.js';
import {NodeSet} from './collections/NodeSet.js';

import {ICoreIterable} from '@_linked/core/interfaces/ICoreIterable';
import {IShape} from './interfaces/IShape.js';
import {IGraphObject} from './interfaces/IGraphObject.js';

import {NodeValuesSet} from './collections/NodeValuesSet.js';
import {BatchedEventEmitter,eventBatcher} from './events/EventBatcher.js';
import {EventEmitter} from './events/EventEmitter.js';
import {NodeMap} from './collections/NodeMap.js';
import {NodeURIMappings} from './collections/NodeURIMappings.js';
import {CoreSet} from '@_linked/core/collections/CoreSet';
import {Prefix} from '@_linked/core/utils/Prefix';

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
  getAs<T extends IShape>(type: {new (): T; getOf(node: Node): T}): T {
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
    getStrictlyOf(node: Node): T;
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

  setValue(property: NamedNode, value: string) {
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

  getAll(property: NamedNode): NodeValuesSet {
    return new NodeValuesSet(this, property);
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

  getQuads(property: NamedNode, value?: Node): QuadSet {
    return new QuadSet();
  }

  getInverseQuad(property: NamedNode, subject: NamedNode): Quad | undefined {
    return undefined;
  }

  getInverseQuads(property: NamedNode): QuadSet {
    return new QuadSet();
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

  print() {
    return '';
  }
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
export class NamedNode
  extends Node
  implements IGraphObject, BatchedEventEmitter, INamedNode
{
  /**
   * The base of temporary URI's
   * @internal
   */
  public static TEMP_URI_BASE: string = 'lin://tmp/';
  /**
   * Emitter used by the class itself by static methods emitting events.
   * Anyone wanting to listen to that should therefore add a listener with NamedNode.emitter.on(...)
   * @internal
   */
  static emitter = new EventEmitter();
  /**
   * event emitted when nodes need to be stored
   * @internal
   */
  static STORE_NODES: string = 'STORE_NODES';
  /**
   * Event emitted when previous values have been overwritten (for example with update or moverwrite)
   * NOTE: Locally we may not know all the properties, but the intend of update / moverwrite is to overwrite ANY existing properties. So event handlers listening to this event should clear any previous property values they can find.
   * @internal
   */
  static CLEARED_PROPERTIES: string = 'CLEARED_PROPERTIES';
  /**
   * event emitted when nodes need to be removed
   * @internal
   */
  static REMOVE_NODES: string = 'REMOVE_NODES';
  /**
   * event emitted when the URI of a node has been updated
   */
  static URI_UPDATED: string = 'URI_UPDATED';
  /**
   * event emitted when nodes need to be loaded
   * @internal
   */
  static LOAD_NODES: string = 'LOAD_NODES';
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

  //### event types ###
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
  static NODE_REMOVED: string = 'NODE_REMOVED';
  private static namedNodes: NodeMap<NamedNode> = new NodeMap();
  private static tempCounter: number = 0;
  private static nodesToSave: NodeSet<NamedNode> = new NodeSet();
  private static nodesToLoad: NodeSet<NamedNode> = new NodeSet();
  private static nodesToLoadFully: NodeSet<NamedNode> = new NodeSet();
  private static nodesToRemove: CoreSet<[NamedNode, QuadArray]> = new CoreSet();
  private static nodesURIUpdated: CoreMap<NamedNode, [string, string]> =
    new CoreMap();
  private static clearedProperties: CoreMap<
    NamedNode,
    [NamedNode, QuadArray][]
  > = new CoreMap();
  /**
   * map of QuadMaps indexed by property (where this node occurs as subject)
   * NOTE: 'properties' serves only to increase lookup speed but also costs memory
   * since reverse lookup (where this node occurs as object) will be much less frequent
   * the inverse of 'properties' is not kept, so all results for reverse lookup will be created from 'asObject'
   * @internal
   */
  properties: CoreMap<NamedNode, NodeValuesSet> = new CoreMap<
    NamedNode,
    NodeValuesSet
  >();
  // private static termType: string = 'NamedNode';
  termType: any = 'NamedNode';
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

  //keeping track of changes to be emitted in one batched event
  /**
   * array of Quads in which this node occurs as predicate
   * @internal
   */
  // private asPredicate: QuadArray;
  //NOTE: the quad sets in these maps will contain both newly ADDED and REMOVED quads
  private changedProperties: CoreMap<NamedNode, QuadSet>;
  private alteredProperties: CoreMap<NamedNode, QuadSet>;
  private changedInverseProperties: CoreMap<NamedNode, QuadSet>;
  private alteredInverseProperties: CoreMap<NamedNode, QuadSet>;
  // private changedAsPredicate: QuadArray;
  // private alteredAsPredicate: QuadArray;
  //keep track of promises so that we only do loading/removing/saving once
  private savePromise: {
    promise: Promise<any>;
    resolve: any;
    reject: any;
    done?: boolean;
  };
  private removePromise: {promise: Promise<any>; resolve: any; reject: any};

  /**
   * WARNING: Do not directly create a Node, instead use NamedNode.getOrCreate(uri)
   * This ensures the same node is used for the same uri system wide
   * @param uri - the URI (more generic form of a URL) of the NamedNode
   * @param _isTemporaryNode - set to true if this node is only temporarily available in the local environment
   */
  constructor(
    uri: string = '',
    private _isTemporaryNode: boolean = false,
  ) {
    super(uri);
    if (this._isTemporaryNode) {
      //created locally, so we know everything about it there is to know
      // this.allPropertiesLoaded = {promise: Promise.resolve(this), done: true};
    }
  }

  private _isStoring: {promise?; resolve?; reject?};

  get isStoring(): boolean {
    return this._isStoring && true;
  }

  set isStoring(storing: boolean) {
    //when storing
    if (storing) {
      //create a deferred promise and store it as _isStoring
      this._isStoring = {};
      this._isStoring.promise = new Promise((resolve, reject) => {
        this._isStoring.resolve = resolve;
        this._isStoring.reject = reject;
      });
    } else {
      //when done storing, resolve the promise
      this._isStoring.resolve();
      delete this._isStoring;
    }
  }

  /**
   * JSLib.js documentation states: "Alias for value, favored by Tim" ... LINCD author René agrees with Tim
   * @see https://github.com/linkeddata/rdflib.js/blob/bbf456390afe7743020e0c8c4db20b10cfb808c7/src/named-node.ts#L88
   */
  get uri(): string {
    return this._value;
  }

  set uri(uri: string) {
    this.value = uri;
  }

  /**
   * Alias for uri, so NamedNode satisfies NodeReferenceValue ({id: string}) from core.
   */
  get id(): string {
    return this._value;
  }

  /**
   * Returns true if this node has a temporary URI and only exists in the local environment.
   * e.g. this is usually true if you create a new NamedNode without having specified a URI yet
   */
  get isTemporaryNode(): boolean {
    return this._isTemporaryNode;
  }

  set isTemporaryNode(val: boolean) {
    this._isTemporaryNode = val;
  }

  get value(): string {
    return this._value;
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

    // //if this node had a temporary URI
    // if (this._isTemporaryNode) {
    // 	//it now has an explicit URI, so it's no longer temporary
    // 	this._isTemporaryNode = false;
    // }

    this.emit(NamedNode.URI_UPDATED, this, oldUri, newUri);

    eventBatcher.register(NamedNode);
    NamedNode.nodesURIUpdated.set(this, [oldUri, newUri]);
  }

  /**
   * Emits the batched (property) events of the NamedNode CLASS (meaning events that relate to all nodes)
   * Used internally by the framework to batch and emit change events
   * @internal
   */
  static emitBatchedEvents(resolve, reject) {
    if (this.nodesToRemove.size) {
      this.emitter.emit(NamedNode.REMOVE_NODES, this.nodesToRemove);
      this.nodesToRemove = new CoreSet<[NamedNode, QuadArray]>();
    }

    if (this.nodesToSave.size) {
      this.emitter.emit(NamedNode.STORE_NODES, this.nodesToSave);
      this.nodesToSave = new NodeSet<NamedNode>();
    }

    if (this.nodesToLoad.size || this.nodesToLoadFully.size) {
      this.emitter.emit(
        NamedNode.LOAD_NODES,
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

    if (this.clearedProperties.size) {
      this.emitter.emit(NamedNode.CLEARED_PROPERTIES, this.clearedProperties);
      this.clearedProperties = new CoreMap();
    }
  }

  /**
   * Returns true if this node has any batched events waiting to be emitted
   * Used internally by the framework to batch and emit change events
   * @internal
   */
  static hasBatchedEvents() {
    return (
      this.nodesToRemove.size > 0 ||
      this.nodesToSave.size > 0 ||
      this.nodesToLoad.size ||
      this.nodesToLoadFully.size > 0 ||
      this.nodesURIUpdated.size > 0 ||
      this.clearedProperties.size > 0
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
   * Resets the map of nodes that is known in this local environment
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
    let tmpURI = this.createNewTempUri();
    while (this.getNamedNode(tmpURI)) {
      this.tempCounter++;
      tmpURI = this.createNewTempUri();
    }
    return this._create(tmpURI, true);
  }

  /**
   * Registers a NamedNode to the locally known list of nodes
   * @internal
   * @param node
   */
  static register(node: NamedNode) {
    if (this.namedNodes.has(node.uri)) {
      throw new Error(
        'A node with this URI already exists: "' +
          node.uri +
          '". You should probably use NamedNode.getOrCreate instead of NamedNode.create (' +
          node.uri +
          ')',
      );
    }
    this.namedNodes.set(node.uri, node);
  }

  /**
   * Unregisters a NamedNode from the locally known list of nodes
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
   * Returns a map of all locally known nodes.
   * The map will have URI's as keys and NamedNodes as values
   * @param node
   */
  static getAllNamedNodes(): NodeMap<NamedNode> {
    return this.namedNodes;
  }

  /**
   * Returns a map of all locally known nodes.
   * The map will have URI's as keys and NamedNodes as values
   * @param node
   */
  static createNewTempUri() {
    return this.TEMP_URI_BASE + this.tempCounter++; //+'/';+Date.now()+Math.random();
  }

  static getCounter(): number {
    return this.tempCounter;
  }

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
  static getOrCreate(uri: string, isTemporaryNode: boolean = false) {
    return this.getNamedNode(uri) || this._create(uri, isTemporaryNode);
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

  static emitClearedProperty(node: NamedNode, property: NamedNode) {
    //if not a local node we will emit events for storage controllers to be picked up
    if (!node.isTemporaryNode) {
      //regardless of how many values are known 'locally', we want to emit this event so that the source of data can eventually properly clear all values
      if (!NamedNode.clearedProperties.has(node)) {
        NamedNode.clearedProperties.set(node, []);
        eventBatcher.register(NamedNode);
      }
      //we save the property that was cleared AND the quads that were cleared
      NamedNode.clearedProperties
        .get(node)
        .push([
          property,
          node.asSubject.has(property)
            ? new QuadArray(...node.asSubject.get(property).getQuadSet())
            : null,
        ]);
    }
  }

  private static _create(uri: string, isLocalNode: boolean = false): NamedNode {
    var node = new NamedNode(uri, isLocalNode);
    this.register(node);
    return node;
  }

  /**
   * Used by Quads to signal their subject about a new property
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
    var predicate: NamedNode = quad.predicate;
    //first make sure we have a QuadMap value for key=predicate
    if (!this.asSubject.has(predicate)) {
      this.asSubject.set(predicate, new QuadMap());
      this.properties.set(predicate, new NodeValuesSet(this, predicate));
    }

    //Add the quad to the QuadMap (see implementation for more details)
    let quadMap = this.asSubject.get(predicate);

    //make sure we have a QuadSet ready for the object of this quad
    quadMap.__set(quad.object, quad);

    //Now for the property index (which gives direct access to the object values of a certain predicate)
    //Because multiple graphs can hold the same subj-pred-obj triple, we want to avoid adding literal values
    //that have the exact same literal value, so we need to test for equality here before adding it
    if (
      !this.properties
        .get(predicate)
        .some((object) => object.equals(quad.object))
    ) {
      this.properties.get(predicate).__add(quad.object);
    }

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
   * Inverse property can be thought of as "this node is the value (object) of another nodes' property"
   * This method is used by the class Quad to communicate its existence to the quads object
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
    //asObject is not always initialised - to save some memory on nodes without incoming properties (only used as subject)
    if (!this.asObject) {
      this.asObject = new CoreMap<NamedNode, QuadMap>();
    }
    var index: NamedNode = quad.predicate;
    if (!this.asObject.has(index)) {
      this.asObject.set(index, new QuadMap());
    }
    this.asObject.get(index).__set(quad.subject, quad);

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
   * Called when this node occurs as predicate in a quad
   * @internal
   */
  // registerAsPredicate(
  //   quad: Quad,
  //   alteration: boolean = false,
  //   emitEvents: boolean = true,
  // ) {
  //   //asPredicate is not always initialised because only properties can occur as predicate
  //   if (!this.asPredicate) {
  //     this.asPredicate = new QuadArray();
  //   }
  //   this.asPredicate.push(quad);
  //
  //   if (emitEvents) {
  //     this.registerPredicateChange(quad, alteration);
  //   }
  // }

  /**
   * This method is used by the class Quad to communicate with its nodes
   * @internal
   * @param quad
   * @param alteration
   */
  registerValueChange(quad: Quad, alteration: boolean = false) {
    if (!this.changedProperties) this.changedProperties = new CoreMap();
    if (alteration) {
      if (!this.alteredProperties) this.alteredProperties = new CoreMap();
    }
    this.registerPropertyChange(
      quad,
      alteration
        ? [this.changedProperties, this.alteredProperties]
        : [this.changedProperties],
    );
  }

  /**
   * This method is used by the class Quad to communicate with its nodes
   * @internal
   */
  unregisterProperty(
    quad: Quad,
    alteration: boolean = false,
    emitEvents: boolean = true,
  ) {
    var predicate: NamedNode = quad.predicate;

    //start by looking through the QuadMap (it is more complete than the quick & easy properties index, as it accounts for multiple quads per object value in different graphs)
    var quadMap: QuadMap = this.asSubject.get(predicate);
    if (quadMap) {
      let valueQuads = quadMap.get(quad.object);
      if (!valueQuads) return;
      valueQuads.delete(quad);
      //if we no longer hold any quads for this object
      if (valueQuads.size == 0) {
        //remove the key
        quadMap.__delete(quad.object);

        //for this.properties we just keep ONE value for identical literals (in case multiple graphs hold the same subject-pred-obj triple)
        //so here we check if any other object that is still registered equals the current object
        if (![...quadMap.keys()].some((object) => quad.object.equals(object))) {
          //if that's not the case, then also remove this object from the propertySet index (the index should exist)
          //Note: in some cases, for example when a quad moved between graphs, the object registered here as property value might not be the same as the as the object of the quad that is still registered,
          // therefor we also check & remove equivalent values in case regular removal didnt work
          //TODO: we could improve this by making sure that this.properties stays up to date with the actual quads
          this.properties.get(predicate).__delete(quad.object) ||
            this.properties
              .get(predicate)
              .__delete(
                this.properties
                  .get(predicate)
                  .find((object) => object.equals(quad.object)),
              );
        }

        //if we now also no longer hold any values for this predicate
        //NOTE: this was turned off because NodeValuesSets are reused, recreating a new one when a new value
        // is added then does not add the value to the old one.
        // if (quadMap.size === 0) {
        //   //delete both indices for this predicate
        //   this.asSubject.delete(predicate);
        //   this.properties.delete(predicate);
        // }
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
   * This method is used by the class Quad to communicate with its nodes
   * @internal
   */
  // unregisterAsPredicate(
  //   quad: Quad,
  //   alteration: boolean = false,
  //   emitEvents: boolean = true,
  // ) {
  //   this.asPredicate.splice(this.asPredicate.indexOf(quad), 1);
  //
  //   if (emitEvents) {
  //     this.registerPredicateChange(quad, alteration);
  //   }
  // }
  //
  // /**
  //  * Returns a list of quads in which this node is now used as predicate
  //  * BEFORE these changes are sent as events in the normal event flow
  //  * Currently used by Reasoner to allow for immediate application of reasoning
  //  */
  // getPendingPredicateChanges(): QuadArray {
  //   return this.changedAsPredicate;
  // }

  /**
   * This method is used by the class Quad to communicate with its nodes
   * @internal
   */
  unregisterInverseProperty(
    quad: Quad,
    alteration: boolean = false,
    emitEvents: boolean = true,
  ) {
    //start by looking through the QuadMap (it is more complete than the quick & easy properties index, as it accounts for identical sub-pred-obj triples that occur in different graphs)
    //here we get a map of all the quads for the given predicate, grouped by subject (each map contains identical triples, but with different graphs)
    var quadMap: QuadMap = this.asObject.get(quad.predicate);
    if (quadMap) {
      let quadSet = quadMap.get(quad.subject);
      if (!quadSet) return;
      //remove this quad
      quadSet.delete(quad);
      //if we no longer hold any quads for this subject
      if (quadSet.size === 0) {
        quadMap.__delete(quad.subject);
      }
      if (quadMap.size == 0) {
        this.asObject.delete(quad.predicate);
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
   * Set the a single property value
   * Creates a single connection between two nodes in the graph: from this node, to the node given as value, with the property as the connecting 'edge' between them
   * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
   * @param value - the node that this new graph-edge points to. The object of the quad to be created.
   */
  set(property: NamedNode, value: Node): boolean {
    if (!value) {
      throw Error('No value provided to set!');
    }
    //if there is already a quad with exactly this prop-value pair
    if (this.has(property, value)) {
      //make all quads with this pair explicit if they were not yet
      this.getQuads(property, value).makeExplicit();
      //yet return false because nothing was changes in the propreties
      return false;
    }
    //if this pair didn't exist yet, create a new quad (the graph is undefined for now, Storage will pick this up and place it in the right graph)
    //note that the sixth parameter is true, this indicates that this is an alteration (as in new data that triggers change events instead of a quad created for already existing data)
    new Quad(this, property, value, undefined, false, true);
    return true;
  }

  /**
   * Same as set() except this method allows you to pass a string as value and converts it to a Literal for you
   * @param property
   * @param value
   */
  setValue(property: NamedNode, value: string) {
    return this.set(property, new Literal(value));
  }

  /**
   * Set multiple values at once for a single property.
   * You can use this for example to state that this node (a person) has a 'hasFriend' connection to multiple people (friends) in 1 statement
   * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
   * @param values - an array or set of nodes. Can be NamedNodes or Literals
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
    return this.getQuadsByValue(property, value).some((quad) => !quad.implicit);
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
   * UNLIKE `has()` which checks if the literal value, datatype and language tag of two literal nodes are equivalent
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
    //properties can be empty sets, so we need to check if there are any values in the set
    return (
      this.properties.has(property) && this.properties.get(property).size > 0
    );
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

  getAs<T extends IShape>(type: {new (): T; getOf(node: Node): T}): T {
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
   * @param includeFromIncomingArcs if true, also includes predicates (properties) of quads where this node is the VALUE of another nodes' property. Default: false
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
   * @param includeFromIncomingArcs if true, also includes predicates (properties) of quads where this node is the VALUE of another nodes' property. Default: false
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
   * Returns a set of all the properties used by other nodes where this node is the VALUE of that property
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
    for (let quad of this.getQuads(property)) {
      if (!quad.implicit) {
        return quad.object;
      }
    }
  }

  /**
   * Returns all values this node has for the given property
   * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
   */
  getAll(property: NamedNode): NodeValuesSet {
    //we usually just index all the existing properties
    //but to have consistent behaviour with PropertyValueSets, when you request a property that has no values
    //we need to create an index for the empty result set
    if (!this.properties.has(property)) {
      this.asSubject.set(property, new QuadMap());
      this.properties.set(property, new NodeValuesSet(this, property));
    }
    return this.properties.get(property);
    // return this.properties.has(property)
    // 	? this.properties.get(property)
    // 	: new PropertyValueSet(this,property);
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
   * @param maxDepth - the maximum number of connections that resulting nodes are removed from this node. In the example above maxDepth=2 would return only friends and friends of friends
   */
  getDeep(property: NamedNode, maxDepth: number = Infinity): NodeSet {
    var result = new NodeSet();
    var stack = new NodeSet([this as Node]);
    while (stack.size > 0 && maxDepth > 0) {
      var nextLevelStack = new NodeSet();
      for (let node of stack) {
        for (var value of node.getAll(property)) {
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
   * @param properties - an array of NamedNodes. Which are nodes with rdf:type rdf:Property, the edges in the graph, the predicates of quads.
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
   * @param properties - an array of NamedNodes. Which are nodes with rdf:type rdf:Property, the edges in the graph, the predicates of quads.
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
   * @param maxDepth - the maximum number of connections that resulting nodes are removed from this node. In the example above maxDepth=2 would return only the parents and grand parents
   */
  getInverseDeep(property: NamedNode, maxDepth: number = Infinity): NodeSet {
    var result = new NodeSet();
    var stack = new NodeSet([this as Node]);
    while (stack.size > 0 && maxDepth > 0) {
      var nextLevelStack = new NodeSet();
      for (let node of stack) {
        for (var value of node.getAllInverse(property)) {
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
   * @param maxDepth - the maximum number of connections that resulting nodes are removed from this node. In the example above maxDepth=2 would return true only if Mike is the persons friend, or friend of a friend
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
      for (let node of stack) {
        for (var propertyValue of node.getAll(property)) {
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
   * Same as getOne() but for 'inverse properties'. Meaning nodes that have this node as their value.
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
   * Returns all the nodes that have this node as the value of the given property.
   * Same as getAll() but for 'inverse properties'. Meaning nodes that have this node as their value.
   * Example: if this is a person. this.getAllInverse(hasChild) returns all the persons parents
   * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
   */
  getAllInverse(property: NamedNode): NodeSet<NamedNode> {
    if (!this.asObject || !this.asObject.has(property))
      return new NodeSet<NamedNode>();
    return this.asObject.get(property).getSubjects();
  }

  /**
   * Returns all the nodes that have this node as the EXPLICIT value of the given property.
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
   * Get all the nodes that have this node as their value for any of the given properties
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
  getQuads(property: NamedNode, value?: Node): QuadSet {
    if (!this.asSubject.has(property)) return new QuadSet();
    if (value) {
      return this.getQuadsByValue(property, value);
    } else {
      return this.asSubject.get(property).getQuadSet();
    }
  }

  /**
   * Get all the quads that represent EXPLICIT connections from this node to another node, connected by the given property
   * NOTE: accessing quads is a very low level functionality required for the framework itself
   * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
   * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
   */
  getExplicitQuads(property: NamedNode): QuadSet {
    return this.getQuads(property).filter((quad) => !quad.implicit);
  }

  /**
   * Get all the quads that represent EXPLICIT connections from another node that has this node as its value for the given property
   * NOTE: accessing quads is a very low level functionality required for the framework itself
   * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
   * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
   */
  getExplicitInverseQuads(property: NamedNode): QuadSet {
    return this.getInverseQuads(property).filter((quad) => !quad.implicit);
  }

  /**
   * Get all quads that represent connections from another node that has this node as its value for the given property
   * NOTE: accessing quads is a very low level functionality required for the framework itself
   * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
   * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
   */
  getInverseQuads(property: NamedNode): QuadSet | undefined {
    if (!this.asObject.has(property)) return undefined;
    return this.asObject.get(property).getQuadSet();
    // return this.asObject && this.asObject.has(property)
    // 	? this.asObject.get(property)
    // 	: new QuadMap();
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
      this.asObject.forEach((quadMap) => {
        quadMap.forEach((quad) => {
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
   * #######################################################################
   * ######################## EVENT METHODS / LISTENERS ####################
   * #######################################################################
   **/

  /**
   * Update a certain property so that only the given value is a value of this property.
   * Overwrites (and thus removes) any previously set values
   * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
   * @param value - a single node. Can be a NamedNode or Literal
   */
  overwrite(property: NamedNode, value: Node): boolean {
    //don't do anything if the current value is already equivalent to the new value
    if (this.getAll(property).size == 1 && value && this.has(property, value))
      return false;

    //clear all values and set new value
    this.unsetAll(property);
    if (value) {
      return this.set(property, value);
    }
  }

  /**
   * Update a certain property so that only the given values are the values of this property.
   * Overwrites (and thus removes) any previously set values
   * Same as overwrite() except this allows you to replace the previous values with MULTIPLE new values
   * @param property
   * @param values
   */
  moverwrite(property: NamedNode, values: ICoreIterable<Node>): boolean {
    //don't update if the new set of values is the same (or equivalent) as the old set of values
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
   * Removes this node from the graph, locally and remotely, in all connected QuadStores.
   * All properties will be unset, both where this node is the subject or the object.
   * Emits an event from the node itself and from the NamedNode class
   */
  remove() {
    //collect all the quads that are about to be removed
    let removedQuads = this.getAllQuads(true);

    //remove all quads locally
    this.asSubject.forEach((quads) => quads.removeAll(true));
    if (this.asObject) this.asObject.forEach((quads) => quads.removeAll(true));

    //emit event from this node itself, with all the quads that were removed
    this.emit(NamedNode.NODE_REMOVED, this, removedQuads);
    //clean up anything connected to this node
    this.removeAllListeners();

    //remove form list
    NamedNode.unregister(this);

    //make sure a global event is emitted that nodes are moved (picked up by storage)
    eventBatcher.register(NamedNode);
    NamedNode.nodesToRemove.add([this, removedQuads]);
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
      this.getQuads(property, value).removeAll(true);
      return true;
    }
    return false;
  }

  /**
   * unset (remove) all values of a certain property.
   * Removes all connections (edges) in the graph between this node and other nodes, where the given property is used as the connecting 'edge' between them
   * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
   */
  unsetAll(property: NamedNode): boolean {
    NamedNode.emitClearedProperty(this, property);
    if (this.hasProperty(property)) {
      //false as parameter because we don't need alteration events for each single quad, but rather manage this with clearedProperties events
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
      this.asObject.get(property)?.some((quad) => quad.subject.equals(value))
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
   * Save this node into the graph database.
   * Newly created nodes will exist only in local memory until you call this function
   * @returns a promise that resolves when the node has received a permanent URI
   */
  save(): Promise<void> {
    if (this.isTemporaryNode) {
      if (!this._isStoring) {
        //this creates a promise that will resolve when the node is stored
        this.isStoring = true;
        NamedNode.nodesToSave.add(this);
        eventBatcher.register(NamedNode);
      }
      //always return a promise
      return this._isStoring.promise;
    }
  }

  /**
   * Create a new URI Node with the same properties as the current node
   * NOTE: does NOT clone the inverse properties (where this node is the value of another node its properties)
   */
  clone(): NamedNode {
    var node = NamedNode.create();
    this.getAllQuads().forEach((quad: Quad) => {
      node.set(quad.predicate, quad.object);
    });
    return node as this;
  }

  /**
   * Returns a string representation of this node.
   * Returns the URI for a NamedNode
   */
  toString() {
    return this.uri;
  }

  print(includeIncomingProperties: boolean = true) {
    var print = '';
    this.getAsSubjectQuads().forEach((quadMap) => {
      BlankNode.includeBlankNodes(quadMap.getQuadSet()).forEach(
        (quad) => (print += '\t' + quad.print() + '.\n'),
      );
    });
    if (this.asObject && includeIncomingProperties) {
      print += '<----\n';
      this.asObject.forEach((quadMap) => {
        BlankNode.includeBlankNodes(quadMap.getQuadSet(), false, true).forEach(
          (quad) => (print += '\t' + quad.print() + '.\n'),
        );
      });
    }
    return print;
  }

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

  /* #######################################################################
   * ######################### STATIC METHODS ##############################
   * #######################################################################
   */

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
      });

      if (map.size > 0) {
        //emit the general event that A property has changed/altered
        this.emit(event, map);
      }
      map.clear();
    });

    // if (this.changedAsPredicate) {
    //   this.emit(NamedNode.AS_PREDICATE_CHANGED, this.changedAsPredicate, this);
    //   this.changedAsPredicate = null;
    // }
    // if (this.alteredAsPredicate) {
    //   this.emit(NamedNode.AS_PREDICATE_ALTERED, this.alteredAsPredicate, this);
    //   this.alteredAsPredicate = null;
    // }
  }

  getAsSubjectQuads() {
    return this.asSubject;
  }

  getAsObjectQuads() {
    return this.asObject;
  }

  // getAsPredicateQuads() {
  //   return this.asPredicate;
  // }

  private createPromise() {
    var resolve, reject;
    var promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return {promise, resolve, reject};
  }

  /**
   * Adds the quad to all given maps
   * @param quad
   * @param maps
   * @private
   */
  private registerPropertyChange(quad: Quad, maps: Map<NamedNode, QuadSet>[]) {
    //register that this class has some events to emit
    eventBatcher.register(this);
    //for each given map
    maps.forEach((map) => {
      //add this quad under the predicate as key
      if (!map.has(quad.predicate)) {
        map.set(quad.predicate, new QuadSet());
      }
      map.get(quad.predicate).add(quad);
    });
  }

  // private registerPredicateChange(quad: Quad, alteration: boolean) {
  //   eventBatcher.register(this);
  //   if (!this.changedAsPredicate) {
  //     this.changedAsPredicate = new QuadArray();
  //   }
  //   this.changedAsPredicate.push(quad);
  //   if (alteration) {
  //     if (!this.alteredAsPredicate) {
  //       this.alteredAsPredicate = new QuadArray();
  //     }
  //     this.alteredAsPredicate.push(quad);
  //   }
  // }

  private getQuadsByValue(property: NamedNode, value?: Node): QuadSet {
    return value instanceof NamedNode
      ? this.asSubject.get(property).has(value)
        ? this.asSubject.get(property).get(value)
        : new QuadSet()
      : this.asSubject
          .get(property)
          .filter((quad) => quad.object.equals(value), QuadSet);
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

  constructor(uri?: string, isTemporaryNode: boolean = false) {
    super(uri || BlankNode.createUri(), isTemporaryNode);
    NamedNode.register(this);
  }

  get uri(): string {
    return this._value;
  }

  set uri(uri: string) {
    throw new Error(
      'You should not set the URI of a BlankNode. Make sure the node is created as a NamedNode. BlankNode data:\n' +
        BlankNode.includeBlankNodes(this.getAllQuads()).toString(),
    );
  }

  static create(isTemporaryNode: boolean = false): BlankNode {
    return new BlankNode(null, isTemporaryNode);
  }

  static createUri() {
    return '_:' + this.counter++;
  }

  static includeBlankNodes(
    quads: QuadSet | Quad[],
    includeObjectBlankNodes: boolean = true,
    includeSubjectBlankNodes: boolean = false,
    blankNodes: NodeURIMappings = new NodeURIMappings(),
  ) {
    let add =
      quads instanceof Set ? quads.add.bind(quads) : quads.push.bind(quads);
    quads.forEach((quad) => {
      if (includeObjectBlankNodes && quad.object instanceof BlankNode) {
        this.addBlankNodeQuads(quad.object, add, blankNodes);
      }
      if (includeSubjectBlankNodes && quad.subject instanceof BlankNode) {
        //also add quads of subjects that are blank nodes, iteratively, but don't include the blank node objects of those quads
        this.addBlankNodeQuads(quad.subject, add, blankNodes, true);
      }
    });
    return quads;
  }

  private static addBlankNodeQuads(
    blankNode: BlankNode,
    add: (n: any) => void,
    blankNodes: NodeURIMappings,
    inverseIteration: boolean = false,
  ) {
    // console.log('adding quads of ' + blankNode.uri);
    blankNodes.set(blankNode.uri, blankNode);
    blankNode.getAllQuads().forEach((quad) => {
      if (!(quad instanceof Quad)) {
        throw new Error('Not a quad');
      }
      add(quad);
      //also, iteratively include quads of blank-node values of blank-nodes
      if (!inverseIteration && quad.object instanceof BlankNode) {
        //if we've not seen this blank node yet during this collection (avoiding loops from circular references between blank nodes)
        if (!blankNodes.has(quad.object.uri)) {
          this.addBlankNodeQuads(quad.object, add, blankNodes);
        }
      }
      if (inverseIteration && quad.subject instanceof BlankNode) {
        //if we've not seen this blank node yet during this collection (avoiding loops from circular references between blank nodes)
        if (!blankNodes.has(quad.subject.uri)) {
          this.addBlankNodeQuads(quad.subject, add, blankNodes, true);
        }
      }
    });
  }
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
export class Literal extends Node implements IGraphObject, ILiteral {
  termType: 'Literal' = 'Literal';
  private referenceQuad: Quad;

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
    if (typeof value !== 'string') {
      throw new Error(
        'Literal value must be a string. Given value was a ' +
          typeof value +
          ' (' +
          value +
          ')',
      );
    }
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
   * update the language tag of this literal
   */
  set language(lang: string) {
    this._language = lang;

    //the datatype of any literal with a language tag is rdf:langString
    this._datatype = rdfLangString;
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
    let previousValue: Literal;
    //if this literal is being used in a quad
    if (this.referenceQuad) {
      //remember the previous value for the events below
      previousValue = this.clone();
    }
    //update the value
    this._value = value;
    if (this.referenceQuad) {
      //register change for subject node (for node.onChange(prop) listeners)
      this.referenceQuad.subject.registerValueChange(this.referenceQuad, true);
      //notify the graph of a change (will mimic a removed and added quad)
      // this.referenceQuad.graph.registerQuadValueChange(previousValue,this.referenceQuad);
      //notify the quad that the value of it's object has changed (will mimic a removed and added quad)
      this.referenceQuad.onValueChanged(previousValue);
    }
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
      var datatype = NamedNode.fromString(suffix.substr(2));
      return new Literal(literal, datatype);
    } else {
      throw new Error('Invalid literal string format: ' + literalString);
    }
  }

  getAs<T extends IShape>(type: {new (): T; getOf(node: Node): T}): T {
    return type.getOf(this);
  }

  /**
   * @internal
   * @param quad
   */
  registerProperty(quad: Quad): void {
    throw new Error('Literal nodes should not be used as subjects');
  }

  /**
   * registers the use of a quad. Since a quad can only be used in 1 quad
   * this method makes a clone of the Literal if it's used a second time,
   * and returns that new Literal so it will be used by the quad
   * @internal
   * @param quad
   */
  registerInverseProperty(quad: Quad): Node {
    //if this Literal is already being used in another quad
    if (this.referenceQuad) {
      //then return a clone
      //(this allows things like a.set(label,b.getOne(label)))
      return this.clone().registerInverseProperty(quad);
    }
    this.referenceQuad = quad;
    return this;
  }

  /**
   * @internal
   * @param quad
   */
  unregisterProperty(quad: Quad): void {
    throw new Error('Literal nodes should not be used as subjects');
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
   * returns true if the language tag of this literal matches the given language
   */
  isOfLanguage(language: string) {
    return this._language === language;
  }

  /**
   * returns true if this literal has a datatype
   */
  hasDatatype(): boolean {
    //checks for null and undefined
    return this._datatype != null;
  }

  /**
   * Returns true if both are literal nodes, with equal literal values, equal language tags and equal data types
   * Other than NamedNodes, two different literal node instances can be deemed equivalent if all their properties are the same
   * @param other
   * @param caseSensitive
   */
  equals(other: Term): boolean {
    return this._equals(other);
  }

  /**
   * Returns true if both are literal nodes, with equal literal values (CASE INSENSITIVE CHECK), equal language tags and equal data types
   * Other than NamedNodes, two different literal node instances can be deemed equivalent if all their properties are the same
   * @param other
   */

  equalsCaseInsensitive(other: Term) {
    return this._equals(other, false);
  }

  /**
   * Creates a new Literal with exact the same properties (value,datatype and language)
   */
  clone(): Literal {
    return new Literal(this._value, this.datatype, this.language) as this;
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
    return this.toString();
  }

  private _equals(other: Term, caseSensitive: boolean = true) {
    if (other === this) return true;

    var valueToMatch: string;
    var languageToMatch: string;
    var datatypeToMatch: NamedNode;

    if (other instanceof Literal) {
      valueToMatch = other.value;
      languageToMatch = other.language;
      datatypeToMatch = other.datatype; //direct access to avoid default, alternatively build a boolean parameter 'returnDefault=true' into getDataType()
    } else {
      var type = typeof other;
      if (type == 'string' || type == 'number' || type == 'boolean') {
        //if you don't specify a datatype we accept all
        valueToMatch = other.toString();
        languageToMatch = '';
        datatypeToMatch = null;
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
        return this.datatype === datatypeToMatch;
      }
    }
    return false;
  }
}

export class Graph implements Term {
  // private static removedQuadsAlterations: Map<Graph,QuadArray> = new Map();
  /**
   * Emitted when changes have been made to this graph. Only emitted when data has actually changed, not just when data is loaded
   */
  static CONTENTS_ALTERED = 'CONTENTS_ALTERED';
  /**
   * Emitted when the contents of this graph have changed. Can also be due to loading data
   */
  static CONTENTS_CHANGED = 'CONTENTS_ALTERED';

  private static graphs: CoreMap<string, Graph> = new CoreMap<string, Graph>();
  // private static addedQuads: Map<Graph,QuadArray> = new Map();
  // private static removedQuads: Map<Graph,QuadArray> = new Map();
  // private static addedQuadsAlterations: Map<Graph,QuadArray> = new Map();
  termType: string = 'NamedNode';
  private quads: QuadSet;

  constructor(
    public value: string,
    quads?: QuadSet,
  ) {
    // super();
    this._node = NamedNode.getOrCreate(value);
    this.quads = quads ? quads : new QuadSet();
  }

  private _node: NamedNode;

  get node(): NamedNode {
    return this._node;
  }

  //Static methods
  /**
   * Resets the map of nodes that is known in this environment
   */
  static reset() {
    this.graphs = new CoreMap<string, Graph>();
  }

  static create(quads?: QuadSet): Graph {
    var uri = NamedNode.createNewTempUri();
    return this._create(uri, quads);
  }

  /**
   * @internal
   * @param graph
   */
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

  /**
   * @internal
   * @param graph
   */
  static unregister(graph: Graph) {
    if (!this.graphs.has(graph.node.uri)) {
      throw new Error(
        'This node has already been removed from the registry: ' +
          graph.node.uri,
      );
    }
    this.graphs.delete(graph.node.uri);
  }

  /**
   * Adds the quad to all given maps
   * @param quad
   * @param maps
   * @private
   */
  /*private static registerGraphEvent(graph: Graph, quad:Quad, maps: Map<Graph, QuadArray>[]) {
    //register that this class has some events to emit
    eventBatcher.register(Graph);
    //for each given map
    maps.forEach((map) => {
      //add this quad under the predicate as key
      if (!map.has(graph)) {
        map.set(graph, new QuadArray());
      }
      map.get(graph).push(quad);
    });
  }*/

  /*static emitBatchedEvents(resolve?: any, reject?: any) {
    if(this.addedQuads.size > 0 || this.removedQuads.size > 0)
    {
      this.emitter.emit(Graph.CONTENTS_CHANGED,this.addedQuads,this.removedQuads);
      this.addedQuads = new Map();
      this.removedQuads = new Map()
    }
    if(this.addedQuadsAlterations.size > 0 || this.removedQuadsAlterations.size > 0)
    {
      this.emitter.emit(Graph.CONTENTS_ALTERED,this.addedQuadsAlterations,this.removedQuadsAlterations);
      this.addedQuadsAlterations = new Map();
      this.removedQuadsAlterations = new Map()
    }
  }*/

  static getOrCreate(uri: string) {
    return this.getGraph(uri) || this._create(uri);
  }

  static getGraph(uri: string, mustExist: boolean = false): Graph | null {
    //look it up in known full uri node map
    if (this.graphs.has(uri)) {
      return this.graphs.get(uri);
    }

    if (mustExist) {
      throw Error('Could not find graph for: ' + uri);
    }
    return null;
  }

  static updateUri(graph: Graph, uri: string) {
    (graph.node as NamedNode).uri = uri;
  }

  static getAll(): CoreMap<string, Graph> {
    return this.graphs;
  }

  private static _create(uri: string, quads?: QuadSet): Graph {
    var graph = new Graph(uri, quads);
    this.register(graph);
    return graph;
  }

  equals(other: Term) {
    return other === this;
  }

  /**
   * @internal
   * @param quad
   */
  registerQuad(
    quad: Quad,
    alteration: boolean = false,
    emitEvents: boolean = true,
  ) {
    this.quads.add(quad);
    // if(emitEvents)
    // {
    //   Graph.registerGraphEvent(this,quad,alteration ? [Graph.addedQuads] : [Graph.addedQuads,Graph.addedQuadsAlterations]);
    // }
  }

  /**
   * @internal
   * @param quad
   */
  unregisterQuad(
    quad: Quad,
    alteration: boolean = false,
    emitEvents: boolean = true,
  ) {
    this.quads.delete(quad);
    // if(emitEvents)
    // {
    //   Graph.registerGraphEvent(this,quad,alteration ? [Graph.removedQuads] : [Graph.removedQuads,Graph.removedQuadsAlterations])
    // }
  }

  hasQuad(quad: Quad) {
    return this.quads.has(quad);
  }

  //Note: cannot name this getQuads, because NamedNode already uses that for getting all quads of all its properties
  getContents(): QuadSet {
    return this.quads;
  }

  setContents(quads: QuadSet) {
    this.quads = quads;
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
  /**
   * @internal
   * emitted when new quads have been created
   * TODO: possibly we can remove this, it may never be used. Only alterations are of interest?
   */
  static QUADS_CREATED: string = 'QUADS_CREATED';
  /**
   * @internal
   * emitted by the Quad class itself when quads have been removed
   * TODO: possibly we can remove this, it may never be used. Only alterations are of interest?
   */
  static QUADS_REMOVED: string = 'QUADS_REMOVED';
  /**
   * emitted by a quad when that quad is being removed
   * TODO: possibly we can remove this, it may never be used. Only alterations are of interest?
   */
  static QUAD_REMOVED: string = 'QUAD_REMOVED';
  /**
   * emitted when quads have been altered by user interaction
   * @internal
   */
  static QUADS_ALTERED: string = 'QUADS_ALTERED';
  //TODO: possibly we can remove these first two, they may never be used. Only alterations are of interest?
  private static createdQuads: QuadSet = new QuadSet();
  private static removedQuads: QuadSet = new QuadSet();
  private static removedQuadsAltered: QuadSet = new QuadSet();
  private static createdQuadsAltered: QuadSet = new QuadSet();
  private _removed: boolean;

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
    private _graph: Graph = defaultGraph,
    public implicit: boolean = false,
    alteration: boolean = false,
    emitEvents: boolean = true,
  ) {
    super();
    this.setup(alteration, emitEvents);
  }

  get graph() {
    return this._graph;
  }

  /**
   * Returns true if this quad still exists as an object in memory, but is no longer actively used in the graph
   */
  get isRemoved(): boolean {
    return this._removed;
  }

  /**
   * @internal
   * Returns true if events of newly created quads or removed quads are currently batched and waiting to be emitted
   */
  static hasBatchedEvents() {
    return this.createdQuads.size > 0 || this.removedQuads.size > 0;
  }

  /*set graph(newGraph: Graph) {
    if(newGraph !== this._graph)
    {
      //NOTE: we could have gone a different way with Quad.moveToGraph(quad,newGraph) / quad.moveto(newGraph), which removes the old one and returns a new quad
      //if there is any issues with this implementation, go that way.
      //for now, this implementation keeps the same Quad object but mimics the adding / removing of quads

      //create a clone of this quad as it is now, without sending alteration events
      let oldQuad = new Quad(this.subject,this.predicate,this.object,this._graph,this.implicit,false,false);

      //make sure this cloned quad is not even registered
      oldQuad.turnOff();

      //remove this quad from the old graph
      this._graph.unregisterQuad(this,true);

      //update the graph
      this._graph = newGraph;

      //register this quad in the new graph
      this._graph.registerQuad(this,true);

      this.mimicEventsOnUpdate(oldQuad);
    }
	}*/

  /**
   * @internal
   */
  static emitBatchedEvents() {
    if (this.createdQuads.size > 0 && this.removedQuads.size > 0) {
      //if both created and removed quads are batched then we remove the quad from both sets
      this.createdQuads.forEach((quad) => {
        if (this.removedQuads.has(quad)) {
          this.createdQuads.delete(quad);
          this.removedQuads.delete(quad);
        }
      });
    }
    if (this.createdQuads.size > 0) {
      this.emitter.emit(Quad.QUADS_CREATED, this.createdQuads);
      this.createdQuads = new QuadSet();
    }
    if (this.removedQuads.size > 0) {
      this.emitter.emit(Quad.QUADS_REMOVED, this.removedQuads);
      this.removedQuads = new QuadSet();
    }
    if (
      this.createdQuadsAltered.size > 0 ||
      this.removedQuadsAltered.size > 0
    ) {
      this.emitter.emit(
        Quad.QUADS_ALTERED,
        this.createdQuadsAltered,
        this.removedQuadsAltered,
      );
      this.createdQuadsAltered = new QuadSet();
      this.removedQuadsAltered = new QuadSet();
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
    emitEvents: boolean = true,
  ) {
    return (
      this.get(subject, predicate, object, graph) ||
      new Quad(
        subject,
        predicate,
        object,
        graph,
        implicit,
        alteration,
        emitEvents,
      )
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
    graph: Graph,
  ): Quad | null {
    if (!subject || !predicate || !object) return null;
    return subject.getQuads(predicate, object).find((q) => q._graph === graph);
  }

  static moveQuadsToGraph(
    quads: Quad[],
    graph: Graph,
    alteration: boolean = false,
  ) {
    let result = new (Object.getPrototypeOf(quads).constructor)();
    quads.forEach((quad) => {
      result.push(quad.moveToGraph(graph, alteration));
    });
    return result;
  }

  static emitRemovedQuad(quad: Quad, alteration: boolean = false) {
    //removed quad events are batched together and emitted on the next tick
    //so here we make sure the Quad class will emit its batched events on the next tick
    eventBatcher.register(Quad);
    //and here we save this quad to a set of removedQuads which is a static property of the Quad class
    Quad.removedQuads.add(quad);

    if (alteration && !quad.implicit) {
      Quad.removedQuadsAltered.add(quad);
    }

    //we need to let this quad emit this event straight away because for example the reasoner needs to listen to this exact quad to retract
    quad.emit(Quad.QUAD_REMOVED);
  }

  static emitCreatedQuad(quad: Quad, alteration: boolean = false) {
    //new quad events are batched together and emitted on the next tick
    //so here we make sure the Quad class will emit its batched events on the next tick
    eventBatcher.register(Quad);
    //and here we save this quad to a set of newQuads which is a static property of the Quad class
    Quad.createdQuads.add(quad);

    //only if it's an alteration AND it's relevant to storage controllers do we emit the QUADS_ALTERED event for this quad
    if (alteration && !quad.implicit) {
      Quad.createdQuadsAltered.add(quad);
    }
  }

  /**
   * Removes this quad and creates a new quad with the same subject,predicate,object, but a new graph.
   * Returns the new quad
   * @param newGraph
   */
  moveToGraph(newGraph: Graph, alteration: boolean = true): Quad {
    if (newGraph === this._graph) {
      return this;
    }
    let newQuad = Quad.getOrCreate(
      this.subject,
      this.predicate,
      this.object,
      newGraph,
      this.implicit,
      alteration,
    );
    this.remove(alteration);
    return newQuad;
  }

  /**
   * Turns off a quad. Meaning it will no longer be active in the graph.
   * Comes in handy in very specific use cases when for example quads have already been created, but you want to check what the state was before these quads were created
   */
  turnOff() {
    this.subject.unregisterProperty(this, false, false);
    // this.predicate.unregisterAsPredicate(this, false, false);
    this.object.unregisterInverseProperty(this, false, false);
    this.graph.unregisterQuad(this, false, false);
  }

  /**
   * Turns on a quad. Meaning it will be active (again) in the graph.
   * Only use this if you've had to turn quads off first.
   */
  turnOn() {
    this.subject.registerProperty(this, false, false);
    // this.predicate.registerAsPredicate(this, false, false);
    this.object.registerInverseProperty(this, false, false);
    this.graph.registerQuad(this, false, false);
  }

  /**
   * Turn an implicit quad into an explicit quad (because an explicit user action generated it as an independent explicit fact now)
   */
  makeExplicit() {
    if (this.implicit) {
      //unregister and make explicit
      this.turnOff();
      this.implicit = false;
      //re-register and make it an 'alteration' so it will be picked up by the storage
      this.setup(true);
    }
  }

  /**
   * Remove this quad from the graph
   * Will be removed both locally and from the graph database
   * @param alteration
   */
  remove(alteration: boolean = false, emitEvents: boolean = true): void {
    if (this._removed) return;

    //first set removed is true so event handlers can detect the difference between added or removed values
    this._removed = true;

    this.subject.unregisterProperty(this);
    // this.predicate.unregisterAsPredicate(this);
    this.object.unregisterInverseProperty(this);
    this.graph.unregisterQuad(this, alteration);

    if (emitEvents) {
      Quad.emitRemovedQuad(this, alteration);
    }

    Quad.globalNumQuads--;
  }

  /**
   * Cancel the removal of a quad
   */
  undoRemoval() {
    this.setup();
    this._removed = false;
  }

  onValueChanged(oldValue: Literal) {
    let oldQuad = new Quad(
      this.subject,
      this.predicate,
      oldValue,
      this.graph,
      this.implicit,
      false,
      false,
    );
    this.mimicEventsOnUpdate(oldQuad);
  }

  print() {
    return (
      Prefix.toPrefixedIfPossible(this.subject.uri) +
      ' ' +
      Prefix.toPrefixedIfPossible(this.predicate.uri) +
      ' ' +
      (this.object instanceof NamedNode
        ? Prefix.toPrefixedIfPossible(this.object.uri)
        : this.object.toString())
    );
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
      this.object.toString() +
      ' ' +
      this.graph.toString() +
      (this.isRemoved ? ' (removed)' : '')
    );
  }

  private setup(alteration: boolean = false, emitEvents: boolean = true) {
    // if(this.predicate.uri == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && this.object['uri'] == "http://data.dacore.org/ontologies/core/Editor")
    // {
    // 	debugger;
    // }

    //let nodes take note of this quad in which they occur
    //first, we overwrite the property this.object with the result of register because a Literal may return a clone
    this.object = this.object.registerInverseProperty(this, alteration);
    this.subject.registerProperty(this, alteration);
    // this.predicate.registerAsPredicate(this, alteration);
    this._graph.registerQuad(this, alteration);

    if (emitEvents) {
      Quad.emitCreatedQuad(this, alteration);
    }
    Quad.globalNumQuads++;
  }

  private mimicEventsOnUpdate(oldQuad: Quad) {
    //manually mimic the fact the old quad was removed and the new quad was added (storage requires this to add/remove those quads to/from the right quad stores)
    eventBatcher.register(Quad);
    Quad.removedQuads.add(oldQuad);
    Quad.removedQuadsAltered.add(oldQuad);

    Quad.createdQuads.add(this);
    Quad.createdQuadsAltered.add(this);
  }
}

//for debugging purposes
let getNode = function (uri: string) {
  return NamedNode.getOrCreate(uri);
};
if (typeof window !== 'undefined') {
  window['getNode'] = getNode;
} else if (typeof global !== 'undefined') {
  global['getNode'] = getNode;
}
