"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Quad = exports.defaultGraph = exports.Graph = exports.Literal = exports.BlankNode = exports.NamedNode = exports.Node = void 0;
var types_js_1 = require("rdflib/lib/types.js");
var default_graph_uri_js_1 = require("rdflib/lib/utils/default-graph-uri.js");
var QuadSet_js_1 = require("./collections/QuadSet.js");
var CoreMap_js_1 = require("./collections/CoreMap.js");
var QuadMap_js_1 = require("./collections/QuadMap.js");
var QuadArray_js_1 = require("./collections/QuadArray.js");
var NodeSet_js_1 = require("./collections/NodeSet.js");
var NodeValuesSet_js_1 = require("./collections/NodeValuesSet.js");
var EventBatcher_js_1 = require("./events/EventBatcher.js");
var EventEmitter_js_1 = require("./events/EventEmitter.js");
var NodeMap_js_1 = require("./collections/NodeMap.js");
var NodeURIMappings_js_1 = require("./collections/NodeURIMappings.js");
var CoreSet_js_1 = require("./collections/CoreSet.js");
var Prefix_js_1 = require("./utils/Prefix.js");
var Node = /** @class */ (function (_super) {
    __extends(Node, _super);
    function Node(_value) {
        var _this = _super.call(this) || this;
        _this._value = _value;
        return _this;
    }
    Object.defineProperty(Node.prototype, "value", {
        get: function () {
            return this._value;
        },
        set: function (val) {
            this._value = val;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Create an instance of the given class (or one of its subclasses) as a presentation of this node.
     * NOTE: this node MUST have the static.type of the given class as its rdf:type property
     * @param type - a class that extends Shape and thus who's instances represent a node as an instance of one specific type.
     */
    Node.prototype.getAs = function (type) {
        return type.getOf(this);
    };
    /**
     * Create an instance of the given class as a presentation of this node.
     * Other than getAs this 'strict' message will ONLY return an exact instance of the given class, not one of its subclasses
     * rdf.type properties of the node are IGNORED. This method can therefore also come in handy in circumstances when you don't have the node it's rdf.type properties at hand.
     * Do not misuse this method though, the main use case is if you don't want to allow any subclass instances. If that's not neccecarily the case and it would make also sense to have the properties loaded, make sure to load them and use getAs.
     * OR use getAsAsync automatically ensures the data of the node is fully loaded before creating an instance.
     * @param type - a class that extends Shape and thus who's instances represent a node as an instance of one specific type.
     */
    Node.prototype.getStrictlyAs = function (type) {
        return type.getStrictlyOf(this);
    };
    /**
     * Compares whether the two nodes are equal
     * @param other The other node
     */
    Node.prototype.equals = function (other) {
        if (!other) {
            return false;
        }
        return this.termType === other.termType && this.value === other.value;
    };
    Node.prototype.set = function (property, value) {
        return false;
    };
    Node.prototype.setValue = function (property, value) {
        return false;
    };
    Node.prototype.has = function (property, value) {
        return false;
    };
    Node.prototype.hasValue = function (property, value) {
        return false;
    };
    Node.prototype.hasExplicit = function (property, value) {
        return false;
    };
    Node.prototype.hasExact = function (property, value) {
        return false;
    };
    Node.prototype.hasProperty = function (property) {
        return false;
    };
    Node.prototype.hasInverseProperty = function (property) {
        return false;
    };
    Node.prototype.hasInverse = function (property, value) {
        return false;
    };
    Node.prototype.mset = function (property, values) {
        return false;
    };
    Node.prototype.getProperties = function (includeFromIncomingArcs) {
        if (includeFromIncomingArcs === void 0) { includeFromIncomingArcs = false; }
        return new NodeSet_js_1.NodeSet();
    };
    Node.prototype.getInverseProperties = function () {
        return new NodeSet_js_1.NodeSet();
    };
    Node.prototype.getOne = function (property) {
        return undefined;
    };
    Node.prototype.getAll = function (property) {
        return new NodeValuesSet_js_1.NodeValuesSet(this, property);
    };
    Node.prototype.getValue = function (property) {
        return undefined;
    };
    Node.prototype.getDeep = function (property, maxDepth, partialResult) {
        if (maxDepth === void 0) { maxDepth = -1; }
        if (partialResult === void 0) { partialResult = new NodeSet_js_1.NodeSet(); }
        return partialResult;
    };
    Node.prototype.getOneInverse = function (property) {
        return undefined;
    };
    Node.prototype.getOneWhere = function (property, filterProperty, filterValue) {
        return undefined;
    };
    Node.prototype.getOneWhereEquivalent = function (property, filterProperty, filterValue, caseSensitive) {
        return undefined;
    };
    Node.prototype.getAllExplicit = function (property) {
        return undefined;
    };
    Node.prototype.getAllInverse = function (property) {
        return undefined;
    };
    Node.prototype.getMultiple = function (properties) {
        return new NodeSet_js_1.NodeSet();
    };
    Node.prototype.hasPath = function (properties) {
        return false;
    };
    Node.prototype.hasPathTo = function (properties, value) {
        return false;
    };
    Node.prototype.hasPathToSomeInSet = function (properties, endPoints) {
        return false;
    };
    Node.prototype.getOneFromPath = function () {
        var properties = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            properties[_i] = arguments[_i];
        }
        return undefined;
    };
    Node.prototype.getAllFromPath = function () {
        var properties = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            properties[_i] = arguments[_i];
        }
        return new NodeSet_js_1.NodeSet();
    };
    Node.prototype.getQuads = function (property, value) {
        return new QuadSet_js_1.QuadSet();
    };
    Node.prototype.getInverseQuad = function (property, subject) {
        return undefined;
    };
    Node.prototype.getInverseQuads = function (property) {
        return new QuadSet_js_1.QuadSet();
    };
    Node.prototype.getAllInverseQuads = function (includeImplicit) {
        return new QuadArray_js_1.QuadArray();
    };
    Node.prototype.getAllQuads = function (includeAsObject, includeImplicit) {
        if (includeAsObject === void 0) { includeAsObject = false; }
        if (includeImplicit === void 0) { includeImplicit = false; }
        return null;
    };
    Node.prototype.overwrite = function (property, value) {
        return false;
    };
    Node.prototype.moverwrite = function (property, value) {
        return false;
    };
    Node.prototype.unset = function (property, value) {
        return false;
    };
    Node.prototype.unsetAll = function (property) {
        return false;
    };
    Node.prototype.isLoaded = function (includingIncomingProperties) {
        return false;
    };
    Node.prototype.promiseLoaded = function (loadInverseProperties) {
        return null;
    };
    Node.prototype.getMultipleInverse = function (properties) {
        return new NodeSet_js_1.NodeSet();
    };
    /**
     * @internal
     * @param quad
     */
    Node.prototype.unregisterInverseProperty = function (quad, alteration, emitEvents) { };
    /**
     * registers the use of a quad. Since a quad can only be used in 1 quad
     * this method makes a clone of the Literal if it's used a second time,
     * and returns that new Literal so it will be used by the quad
     * @internal
     * @param quad
     */
    Node.prototype.registerInverseProperty = function (quad, alteration, emitEvents) {
        return null;
    };
    Node.prototype.clone = function () {
        return null;
    };
    Node.prototype.print = function () {
        return '';
    };
    return Node;
}(EventEmitter_js_1.EventEmitter));
exports.Node = Node;
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
var NamedNode = /** @class */ (function (_super) {
    __extends(NamedNode, _super);
    /**
     * WARNING: Do not directly create a Node, instead use NamedNode.getOrCreate(uri)
     * This ensures the same node is used for the same uri system wide
     * @param uri - the URI (more generic form of a URL) of the NamedNode
     * @param _isTemporaryNode - set to true if this node is only temporarily available in the local environment
     */
    function NamedNode(uri, _isTemporaryNode) {
        if (uri === void 0) { uri = ''; }
        if (_isTemporaryNode === void 0) { _isTemporaryNode = false; }
        var _this = _super.call(this, uri) || this;
        _this._isTemporaryNode = _isTemporaryNode;
        /**
         * map of QuadMaps indexed by property (where this node occurs as subject)
         * NOTE: 'properties' serves only to increase lookup speed but also costs memory
         * since reverse lookup (where this node occurs as object) will be much less frequent
         * the inverse of 'properties' is not kept, so all results for reverse lookup will be created from 'asObject'
         * @internal
         */
        _this.properties = new CoreMap_js_1.CoreMap();
        // private static termType: string = 'NamedNode';
        _this.termType = 'NamedNode';
        /**
         * map of QuadMaps indexed by property where this node occurs as subject
         * NOTE: we use QuadMap here because in ES5 a quadMap is much faster than a quadSet, because we can check by key with uri directly if the quad exists instead of having to look in an array with indexOf (ES5 does not support objects as keys)
         * @internal
         */
        _this.asSubject = new Map();
        if (_this._isTemporaryNode) {
            //created locally, so we know everything about it there is to know
            // this.allPropertiesLoaded = {promise: Promise.resolve(this), done: true};
        }
        return _this;
    }
    Object.defineProperty(NamedNode.prototype, "isStoring", {
        get: function () {
            return this._isStoring && true;
        },
        set: function (storing) {
            var _this = this;
            //when storing
            if (storing) {
                //create a deferred promise and store it as _isStoring
                this._isStoring = {};
                this._isStoring.promise = new Promise(function (resolve, reject) {
                    _this._isStoring.resolve = resolve;
                    _this._isStoring.reject = reject;
                });
            }
            else {
                //when done storing, resolve the promise
                this._isStoring.resolve();
                delete this._isStoring;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NamedNode.prototype, "uri", {
        /**
         * JSLib.js documentation states: "Alias for value, favored by Tim" ... LINCD author René agrees with Tim
         * @see https://github.com/linkeddata/rdflib.js/blob/bbf456390afe7743020e0c8c4db20b10cfb808c7/src/named-node.ts#L88
         */
        get: function () {
            return this._value;
        },
        set: function (uri) {
            this.value = uri;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NamedNode.prototype, "isTemporaryNode", {
        /**
         * Returns true if this node has a temporary URI and only exists in the local environment.
         * e.g. this is usually true if you create a new NamedNode without having specified a URI yet
         */
        get: function () {
            return this._isTemporaryNode;
        },
        set: function (val) {
            this._isTemporaryNode = val;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NamedNode.prototype, "value", {
        get: function () {
            return this._value;
        },
        set: function (newUri) {
            if (NamedNode.namedNodes.has(newUri)) {
                throw new Error('Cannot update URI. A node with this URI already exists: ' +
                    newUri +
                    '. You tried to update the URI of ' +
                    this._value);
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
            EventBatcher_js_1.eventBatcher.register(NamedNode);
            NamedNode.nodesURIUpdated.set(this, [oldUri, newUri]);
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Emits the batched (property) events of the NamedNode CLASS (meaning events that relate to all nodes)
     * Used internally by the framework to batch and emit change events
     * @internal
     */
    NamedNode.emitBatchedEvents = function (resolve, reject) {
        if (this.nodesToRemove.size) {
            this.emitter.emit(NamedNode.REMOVE_NODES, this.nodesToRemove);
            this.nodesToRemove = new CoreSet_js_1.CoreSet();
        }
        if (this.nodesToSave.size) {
            this.emitter.emit(NamedNode.STORE_NODES, this.nodesToSave);
            this.nodesToSave = new NodeSet_js_1.NodeSet();
        }
        if (this.nodesToLoad.size || this.nodesToLoadFully.size) {
            this.emitter.emit(NamedNode.LOAD_NODES, this.nodesToLoad, this.nodesToLoadFully);
            this.nodesToLoad = new NodeSet_js_1.NodeSet();
            this.nodesToLoadFully = new NodeSet_js_1.NodeSet();
        }
        if (this.nodesURIUpdated.size) {
            this.emitter.emit(NamedNode.URI_UPDATED, this.nodesURIUpdated);
            this.nodesURIUpdated = new CoreMap_js_1.CoreMap();
        }
        if (this.clearedProperties.size) {
            this.emitter.emit(NamedNode.CLEARED_PROPERTIES, this.clearedProperties);
            this.clearedProperties = new CoreMap_js_1.CoreMap();
        }
    };
    /**
     * Returns true if this node has any batched events waiting to be emitted
     * Used internally by the framework to batch and emit change events
     * @internal
     */
    NamedNode.hasBatchedEvents = function () {
        return (this.nodesToRemove.size > 0 ||
            this.nodesToSave.size > 0 ||
            this.nodesToLoad.size ||
            this.nodesToLoadFully.size > 0 ||
            this.nodesURIUpdated.size > 0 ||
            this.clearedProperties.size > 0);
    };
    /**
     * Converts the string '<http://some.uri>' into a NamedNode
     * @param uriString the string representation of a NamedNode, consisting of its URI surrounded by brackets: '<' URI '>'
     */
    NamedNode.fromString = function (uriString) {
        var firstChar = uriString.substr(0, 1);
        if (firstChar == '<') {
            return this.getOrCreate(uriString.substr(1, uriString.length - 2));
        }
        else {
            throw new Error('fromString expects a URI wrapped in brackets, like <http://www.example.com>');
        }
    };
    /**
     * Resets the map of nodes that is known in this local environment
     * Mostly used for test functionality
     */
    NamedNode.reset = function () {
        this.tempCounter = 0;
        this.namedNodes = new NodeMap_js_1.NodeMap();
    };
    /**
     * Create a new local NamedNode. A temporary URI will be generated for its URI.
     * This node will not exist in the graph database (persistent storage) until you call `node.save()`
     * Until saved, `node.isTemporaryNode()` will return true.
     */
    NamedNode.create = function () {
        var tmpURI = this.createNewTempUri();
        while (this.getNamedNode(tmpURI)) {
            this.tempCounter++;
            tmpURI = this.createNewTempUri();
        }
        return this._create(tmpURI, true);
    };
    /**
     * Registers a NamedNode to the locally known list of nodes
     * @internal
     * @param node
     */
    NamedNode.register = function (node) {
        if (this.namedNodes.has(node.uri)) {
            throw new Error('A node with this URI already exists: "' +
                node.uri +
                '". You should probably use NamedNode.getOrCreate instead of NamedNode.create (' +
                node.uri +
                ')');
        }
        this.namedNodes.set(node.uri, node);
    };
    /**
     * Unregisters a NamedNode from the locally known list of nodes
     * @internal
     * @param node
     */
    NamedNode.unregister = function (node) {
        if (!this.namedNodes.has(node.uri)) {
            throw new Error('This node has already been removed from the registry: ' + node.uri);
        }
        this.namedNodes.delete(node.uri);
    };
    /**
     * Returns a map of all locally known nodes.
     * The map will have URI's as keys and NamedNodes as values
     * @param node
     */
    NamedNode.getAllNamedNodes = function () {
        return this.namedNodes;
    };
    /**
     * Returns a map of all locally known nodes.
     * The map will have URI's as keys and NamedNodes as values
     * @param node
     */
    NamedNode.createNewTempUri = function () {
        return this.TEMP_URI_BASE + this.tempCounter++; //+'/';+Date.now()+Math.random();
    };
    NamedNode.getCounter = function () {
        return this.tempCounter;
    };
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
    NamedNode.getOrCreate = function (uri, isTemporaryNode) {
        if (isTemporaryNode === void 0) { isTemporaryNode = false; }
        return this.getNamedNode(uri) || this._create(uri, isTemporaryNode);
    };
    /**
     * Returns the NamedNode with the given URI, IF it exists.
     * DOES NOT create a new NamedNode if it didn't exist yet, instead it returns undefined.
     * You can therefore use this method to see if a NamedNode already exists locally.
     * Use `getOrCreate()` if you want to simply get a NamedNode for a certain URI
     * @param uri
     */
    NamedNode.getNamedNode = function (uri) {
        return this.namedNodes.get(uri);
    };
    NamedNode._create = function (uri, isLocalNode) {
        if (isLocalNode === void 0) { isLocalNode = false; }
        var node = new NamedNode(uri, isLocalNode);
        this.register(node);
        return node;
    };
    /**
     * Used by Quads to signal their subject about a new property
     * @internal
     * @param quad
     * @param alteration
     * @param emitEvents
     */
    NamedNode.prototype.registerProperty = function (quad, alteration, emitEvents) {
        if (alteration === void 0) { alteration = false; }
        if (emitEvents === void 0) { emitEvents = true; }
        var predicate = quad.predicate;
        //first make sure we have a QuadMap value for key=predicate
        if (!this.asSubject.has(predicate)) {
            this.asSubject.set(predicate, new QuadMap_js_1.QuadMap());
            this.properties.set(predicate, new NodeValuesSet_js_1.NodeValuesSet(this, predicate));
        }
        //Add the quad to the QuadMap (see implementation for more details)
        var quadMap = this.asSubject.get(predicate);
        //make sure we have a QuadSet ready for the object of this quad
        quadMap.__set(quad.object, quad);
        //Now for the property index (which gives direct access to the object values of a certain predicate)
        //Because multiple graphs can hold the same subj-pred-obj triple, we want to avoid adding literal values
        //that have the exact same literal value, so we need to test for equality here before adding it
        if (!this.properties
            .get(predicate)
            .some(function (object) { return object.equals(quad.object); })) {
            this.properties.get(predicate).__add(quad.object);
        }
        //add this quad to the map of events to send on the next tick
        if (emitEvents) {
            if (!this.changedProperties)
                this.changedProperties = new CoreMap_js_1.CoreMap();
            if (alteration && !this.alteredProperties)
                this.alteredProperties = new CoreMap_js_1.CoreMap();
            //register this change as alteration (user input) or as normal (automatic, data based) property change
            this.registerPropertyChange(quad, alteration
                ? [this.changedProperties, this.alteredProperties]
                : [this.changedProperties]);
        }
    };
    /**
     * Inverse property can be thought of as "this node is the value (object) of another nodes' property"
     * This method is used by the class Quad to communicate its existence to the quads object
     * @internal
     * @param quad
     * @param alteration
     * @param emitEvents
     */
    NamedNode.prototype.registerInverseProperty = function (quad, alteration, emitEvents) {
        if (alteration === void 0) { alteration = false; }
        if (emitEvents === void 0) { emitEvents = true; }
        //asObject is not always initialised - to save some memory on nodes without incoming properties (only used as subject)
        if (!this.asObject) {
            this.asObject = new CoreMap_js_1.CoreMap();
        }
        var index = quad.predicate;
        if (!this.asObject.has(index)) {
            this.asObject.set(index, new QuadMap_js_1.QuadMap());
        }
        this.asObject.get(index).__set(quad.subject, quad);
        //add this quad to the map of events to send on the next tick
        if (emitEvents) {
            if (!this.changedInverseProperties)
                this.changedInverseProperties = new CoreMap_js_1.CoreMap();
            if (alteration && !this.alteredInverseProperties)
                this.alteredInverseProperties = new CoreMap_js_1.CoreMap();
            this.registerPropertyChange(quad, alteration
                ? [this.changedInverseProperties, this.alteredInverseProperties]
                : [this.changedInverseProperties]);
        }
        //need to return this, see Literal
        return this;
    };
    /**
     * This method is used by the class Quad to communicate with its nodes
     * @internal
     * @param quad
     * @param alteration
     */
    NamedNode.prototype.registerValueChange = function (quad, alteration) {
        if (alteration === void 0) { alteration = false; }
        if (!this.changedProperties)
            this.changedProperties = new CoreMap_js_1.CoreMap();
        if (alteration) {
            if (!this.alteredProperties)
                this.alteredProperties = new CoreMap_js_1.CoreMap();
        }
        this.registerPropertyChange(quad, alteration
            ? [this.changedProperties, this.alteredProperties]
            : [this.changedProperties]);
    };
    /**
     * Called when this node occurs as predicate in a quad
     * @internal
     */
    NamedNode.prototype.registerAsPredicate = function (quad, alteration, emitEvents) {
        if (alteration === void 0) { alteration = false; }
        if (emitEvents === void 0) { emitEvents = true; }
        //asPredicate is not always initialised because only properties can occur as predicate
        if (!this.asPredicate) {
            this.asPredicate = new QuadArray_js_1.QuadArray();
        }
        this.asPredicate.push(quad);
        if (emitEvents) {
            this.registerPredicateChange(quad, alteration);
        }
    };
    /**
     * This method is used by the class Quad to communicate with its nodes
     * @internal
     */
    NamedNode.prototype.unregisterProperty = function (quad, alteration, emitEvents) {
        if (alteration === void 0) { alteration = false; }
        if (emitEvents === void 0) { emitEvents = true; }
        var predicate = quad.predicate;
        //start by looking through the QuadMap (it is more complete than the quick & easy properties index, as it accounts for multiple quads per object value in different graphs)
        var quadMap = this.asSubject.get(predicate);
        if (quadMap) {
            var valueQuads = quadMap.get(quad.object);
            valueQuads.delete(quad);
            //if we no longer hold any quads for this object
            if (valueQuads.size == 0) {
                //remove the key
                quadMap.__delete(quad.object);
                //for this.properties we just keep ONE value for identical literals (in case multiple graphs hold the same subject-pred-obj triple)
                //so here we check if any other object that is still registered equals the current object
                if (!__spreadArray([], __read(quadMap.keys()), false).some(function (object) { return quad.object.equals(object); })) {
                    //if that's not the case, then also remove this object from the propertySet index (the index should exist)
                    //Note: in some cases, for example when a quad moved between graphs, the object registered here as property value might not be the same as the as the object of the quad that is still registered,
                    // therefor we also check & remove equivalent values in case regular removal didnt work
                    //TODO: we could improve this by making sure that this.properties stays up to date with the actual quads
                    this.properties.get(predicate).__delete(quad.object) ||
                        this.properties
                            .get(predicate)
                            .__delete(this.properties
                            .get(predicate)
                            .find(function (object) { return object.equals(quad.object); }));
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
            if (!this.changedProperties)
                this.changedProperties = new CoreMap_js_1.CoreMap();
            if (alteration && !this.alteredProperties)
                this.alteredProperties = new CoreMap_js_1.CoreMap();
            this.registerPropertyChange(quad, alteration
                ? [this.changedProperties, this.alteredProperties]
                : [this.changedProperties]);
        }
    };
    /**
     * This method is used by the class Quad to communicate with its nodes
     * @internal
     */
    NamedNode.prototype.unregisterInverseProperty = function (quad, alteration, emitEvents) {
        if (alteration === void 0) { alteration = false; }
        if (emitEvents === void 0) { emitEvents = true; }
        //start by looking through the QuadMap (it is more complete than the quick & easy properties index, as it accounts for identical sub-pred-obj triples that occur in different graphs)
        //here we get a map of all the quads for the given predicate, grouped by subject (each map contains identical triples, but with different graphs)
        var quadMap = this.asObject.get(quad.predicate);
        if (quadMap) {
            var quadSet = quadMap.get(quad.subject);
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
                this.changedInverseProperties = new CoreMap_js_1.CoreMap();
            if (alteration && !this.alteredInverseProperties)
                this.alteredInverseProperties = new CoreMap_js_1.CoreMap();
            this.registerPropertyChange(quad, alteration
                ? [this.changedInverseProperties, this.alteredInverseProperties]
                : [this.changedInverseProperties]);
        }
    };
    /**
     * This method is used by the class Quad to communicate with its nodes
     * @internal
     */
    NamedNode.prototype.unregisterAsPredicate = function (quad, alteration, emitEvents) {
        if (alteration === void 0) { alteration = false; }
        if (emitEvents === void 0) { emitEvents = true; }
        this.asPredicate.splice(this.asPredicate.indexOf(quad), 1);
        if (emitEvents) {
            this.registerPredicateChange(quad, alteration);
        }
    };
    /**
     * Returns a list of quads in which this node is now used as predicate
     * BEFORE these changes are sent as events in the normal event flow
     * Currently used by Reasoner to allow for immediate application of reasoning
     */
    NamedNode.prototype.getPendingPredicateChanges = function () {
        return this.changedAsPredicate;
    };
    /**
     * Returns a list of quads in which this node is now used as object
     * BEFORE these changes are sent as events in the normal event flow
     * Currently used by Reasoner to allow for immediate application of reasoning
     */
    NamedNode.prototype.getPendingInverseChanges = function (property) {
        return this.changedInverseProperties
            ? this.changedInverseProperties.get(property)
            : new QuadSet_js_1.QuadSet();
    };
    /**
     * Returns a list of quads in which this node is now used as subject
     * BEFORE these changes are sent as events in the normal event flow
     * Currently used by Reasoner to allow for immediate application of reasoning
     */
    NamedNode.prototype.getPendingChanges = function (property) {
        return this.changedProperties.get(property);
    };
    /**
     * Set the a single property value
     * Creates a single connection between two nodes in the graph: from this node, to the node given as value, with the property as the connecting 'edge' between them
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param value - the node that this new graph-edge points to. The object of the quad to be created.
     */
    NamedNode.prototype.set = function (property, value) {
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
    };
    /**
     * Same as set() except this method allows you to pass a string as value and converts it to a Literal for you
     * @param property
     * @param value
     */
    NamedNode.prototype.setValue = function (property, value) {
        return this.set(property, new Literal(value));
    };
    /**
     * Set multiple values at once for a single property.
     * You can use this for example to state that this node (a person) has a 'hasFriend' connection to multiple people (friends) in 1 statement
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param values - an array or set of nodes. Can be NamedNodes or Literals
     */
    NamedNode.prototype.mset = function (property, values) {
        var e_1, _a;
        //if(save) dacore.system.storageQueueStart(this);
        var res = false;
        try {
            for (var values_1 = __values(values), values_1_1 = values_1.next(); !values_1_1.done; values_1_1 = values_1.next()) {
                var value = values_1_1.value;
                res = this.set(property, value) || res;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (values_1_1 && !values_1_1.done && (_a = values_1.return)) _a.call(values_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return res;
    };
    /**
     * Returns true if this node has the given value as the value of the given property
     * NOTE: returns true when a literal node is provided that is EQUIVALENT to any of the values that this node has for this property (whilst not neccecarilly being the exact same object in memory)
     * See also: Literal.equals
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param value - a single node. Can be a NamedNode or Literal
     */
    NamedNode.prototype.has = function (property, value) {
        if (!value) {
            throw new Error('No value provided to NamedNode.has(). Did you mean `hasProperty`?');
        }
        var properties = this.properties.get(property);
        return (properties &&
            (properties.has(value) ||
                properties.some(function (object) { return object.equals(value); })));
    };
    /**
     * Returns true if this node has the given value for the given property in an EXPLICIT quad.
     * That is, this property-value has been explicitly set, and is NOT generated by the Reasoner.
     * See the documentation for more information about implicit vs explicit
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param value - a single node. Can be a NamedNode or Literal
     */
    NamedNode.prototype.hasExplicit = function (property, value) {
        if (!this.asSubject.has(property))
            return false;
        return this.getQuadsByValue(property, value).some(function (quad) { return !quad.implicit; });
    };
    /**
     * Returns true if this node has ANY explicit quad with the given property
     * See the documentation for more information about implicit vs explicit
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    NamedNode.prototype.hasExplicitProperty = function (property) {
        if (!this.asSubject.has(property))
            return false;
        return this.getQuads(property).some(function (quad) { return !quad.implicit; });
    };
    /**
     * Returns true if this node has a Literal as value of the given property who's literal-value (a string) matches the given value
     * So works the same as `has()` except you can provide a string as value, and will obviously not match any NamedNode values
     * And unlike has() this method will NOT check for the Literal its datatype. Instead only checking the literal-value
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param value - the string value we want to check for
     */
    NamedNode.prototype.hasValue = function (property, value) {
        var properties = this.properties.get(property);
        return (properties &&
            properties.some(function (object) { return 'value' in object && object['value'] === value; }));
    };
    /**
     * Returns true if this node has the given value as the value of the given property with an EXACT match (meaning the same object in memory)
     * So works the same as has() except for Literals this only returns true if the value of the property is exactly the same object as the given value
     * UNLIKE `has()` which checks if the literal value, datatype and language tag of two literal nodes are equivalent
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param value - a single node. Can be a NamedNode or Literal
     */
    NamedNode.prototype.hasExact = function (property, value) {
        var properties = this.properties.get(property);
        return properties && properties.has(value);
    };
    /**
     * Returns true if this node has ANY value set for the given property.
     * That is, if any quad exists that has this node as the subject and the given property as predicate
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    NamedNode.prototype.hasProperty = function (property) {
        //properties can be empty sets, so we need to check if there are any values in the set
        return (this.properties.has(property) && this.properties.get(property).size > 0);
    };
    /**
     * Returns true if the given end point can be reached by following the given properties in order
     * Example: hasPathTo([foaf.hasFriend,rdf.type],foaf.Person) will return true if any of the friends of this node (this person in this example) is of the type foaf:Person
     * @param properties an array of NamedNodes
     * @param endPoint the node to reach, a Literal or a NamedNode
     */
    NamedNode.prototype.hasPathTo = function (properties, endPoint) {
        var e_2, _a;
        //we just need to find one matching path, so we do a depth-first algorithm which will be more performant, so:
        //take first property
        var property = properties.shift();
        //if more properties left
        if (properties.length > 0) {
            var res;
            try {
                //check if any of the values of that property for this node
                //has a path to the rest of the properties, and if so return the found value
                for (var _b = __values(this.getAll(property)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var value = _c.value;
                    if ((res = value.hasPathTo(__spreadArray([], __read(properties), false), endPoint))) {
                        return res;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return false;
        }
        else {
            //if last property
            //see if we can reach the value if a value was given
            //else: see if any value (any path) exists
            if (endPoint) {
                return this.has(property, endPoint);
            }
            else {
                return this.hasProperty(property);
            }
        }
    };
    NamedNode.prototype.getAs = function (type) {
        return type.getOf(this);
    };
    /**
     * returns true if ANY of the given end points can be reached by following the given properties in the given order
     * Example: hasPathTo([foaf.hasFriend,foaf.hasFriend],[mike,jenny]) will return true if this node (person) has a friend that has mike or jenny as a friend
     * @param properties an array of NamedNodes
     * @param endPoint the node to reach, a Literal or a NamedNode
     */
    NamedNode.prototype.hasPathToSomeInSet = function (properties, endPoints) {
        var e_3, _a;
        var _this = this;
        //we just need to find one matching path, so we do a depth-first algorithm which will be more performant, so:
        //take first property
        var property = properties.shift();
        //if more properties left
        if (properties.length > 0) {
            var res;
            try {
                //check if any of the values of that property for this node
                //has a path to the rest of the properties, and if so return the found value
                for (var _b = __values(this.getAll(property)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var value = _c.value;
                    if ((res = value.hasPathToSomeInSet(__spreadArray([], __read(properties), false), endPoints))) {
                        return res;
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_3) throw e_3.error; }
            }
            return false;
        }
        else {
            //if last property
            //see if we can reach the value if a value was given
            //else: see if any value (any path) exists
            return endPoints.some(function (endPoint) { return _this.has(property, endPoint); });
        }
    };
    /**
     * returns true if ANY end point (node) can be reached by following the given properties in order
     * @param properties an array of NamedNodes
     */
    NamedNode.prototype.hasPath = function (properties) {
        var e_4, _a;
        //we just need to find one matching path, so we do a depth-first algorithm which will be more performant, so:
        //take first property
        var property = properties.shift();
        //if more properties left
        if (properties.length > 0) {
            var res;
            try {
                //check if any of the values of that property for this node
                //has a path to the rest of the properties, and if so return the found value
                for (var _b = __values(this.getAll(property)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var value = _c.value;
                    if ((res = value.hasPath(__spreadArray([], __read(properties), false)))) {
                        return res;
                    }
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_4) throw e_4.error; }
            }
            return false;
        }
        else {
            //if last property
            //see if we can reach the value if a value was given
            //else: see if any value (any path) exists
            return this.hasProperty(property);
        }
    };
    /**
     * Returns a set of all the properties this node has.
     * That is, all unique predicates of quads where this node is the subject
     * @param includeFromIncomingArcs if true, also includes predicates (properties) of quads where this node is the VALUE of another nodes' property. Default: false
     */
    NamedNode.prototype.getProperties = function (includeFromIncomingArcs) {
        if (includeFromIncomingArcs === void 0) { includeFromIncomingArcs = false; }
        if (includeFromIncomingArcs) {
            return new NodeSet_js_1.NodeSet((this.asObject
                ? __spreadArray(__spreadArray([], __read(this.asSubject.keys()), false), __read(this.asObject.keys()), false) : this.asSubject.keys()));
        }
        else {
            return new NodeSet_js_1.NodeSet(this.asSubject.keys());
        }
    };
    /**
     * Returns a set of all the properties used by this node in EXPLICIT facts (quads)
     * See the documentation for more information about implicit vs explicit facts
     * @param includeFromIncomingArcs if true, also includes predicates (properties) of quads where this node is the VALUE of another nodes' property. Default: false
     */
    NamedNode.prototype.getExplicitProperties = function (includeFromIncomingArcs) {
        if (includeFromIncomingArcs === void 0) { includeFromIncomingArcs = false; }
        return new NodeSet_js_1.NodeSet(__spreadArray([], __read(this.getAllQuads(includeFromIncomingArcs)
            .filter(function (t) { return !t.implicit; })
            .map(function (t) { return t.predicate; })), false));
    };
    /**
     * Returns a set of all the properties used by other nodes where this node is the VALUE of that property
     * For example if this node is Jenny and the following is true: Mike foaf:hasFriend Jenny, calling this method on Jenny will return hasFriend
     */
    NamedNode.prototype.getInverseProperties = function () {
        return this.asObject
            ? new NodeSet_js_1.NodeSet(this.asObject.keys())
            : new NodeSet_js_1.NodeSet();
    };
    /**
     * If this node has values for the given property, the first value is returned
     * NOTE: the order of multiple values CANNOT be guaranteed. Therefore use this value if it DOESN'T matter to you which of multiple possible values for this property you'll get OR if you're certain there will be only 1 value.
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    NamedNode.prototype.getOne = function (property) {
        return this.properties.has(property)
            ? this.properties.get(property).first()
            : undefined;
    };
    /**
     * If this node has EXPLICIT values for the given property, the first value is returned
     * Same as `getOne()` except only explicit quads / facts are considered
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    NamedNode.prototype.getOneExplicit = function (property) {
        var e_5, _a;
        try {
            for (var _b = __values(this.getQuads(property)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var quad = _c.value;
                if (!quad.implicit) {
                    return quad.object;
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
    };
    /**
     * Returns all values this node has for the given property
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    NamedNode.prototype.getAll = function (property) {
        //we usually just index all the existing properties
        //but to have consistent behaviour with PropertyValueSets, when you request a property that has no values
        //we need to create an index for the empty result set
        if (!this.properties.has(property)) {
            this.asSubject.set(property, new QuadMap_js_1.QuadMap());
            this.properties.set(property, new NodeValuesSet_js_1.NodeValuesSet(this, property));
        }
        return this.properties.get(property);
        // return this.properties.has(property)
        // 	? this.properties.get(property)
        // 	: new PropertyValueSet(this,property);
    };
    /**
     * Returns all values this node EXPLICITLY has for the given property
     * So, same as `getAll()` except only explicit facts are considered.
     * See the documentation for more information about implicit vs explicit
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    NamedNode.prototype.getAllExplicit = function (property) {
        return this.getExplicitQuads(property).getObjects();
    };
    /**
     * Returns the literal value of the first Literal value for the given property
     * Only returns a results in the disired language if specified.
     * For example if `this rdfs:label "my name" then this.getValue(rdfs.label) will return "my name".
     * So, works the same as getOne() except it will return the literal (string) value of the first found Literal
     * NOTE: the order of multiple values CANNOT be guaranteed. Therefore use this value if it DOESN'T matter to you which of multiple possible values for this property you'll get OR if you're certain there will be only one value.
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    //NOTE: we have to overload getValue without parameters here to be compatible with Literal
    NamedNode.prototype.getValue = function (property, language) {
        var e_6, _a;
        try {
            //going over all property values
            for (var _b = __values(this.getAll(property)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var valueObject = _c.value;
                //see if its a Literal
                //we do this by checking if value exists in the valueObject.
                //And we do that like this because we dont want to explicitly import Literal here.
                //@TODO: Possibly create an interface to avoid this 'hacky' workaround
                if (valueObject['value'] &&
                    (!language || valueObject['isOfLanguage'](language))) {
                    return valueObject.value;
                }
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_6) throw e_6.error; }
        }
    };
    /**
     * Returns the literal values (strings) of all Literals this this node has a value for the given property
     * For example if `this rdfs:label "my name" and `this rdfs:label "my other name"  it will return ["my name","my other name"].
     * So, works the same as getAll() except it will return an array of strings
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    NamedNode.prototype.getValues = function (property) {
        var valueObjects = this.getAll(property);
        var res = [];
        valueObjects.forEach(function (valueObject) {
            if ('value' in valueObject) {
                res.push(valueObject['value']);
            }
        });
        return res;
    };
    /**
     * Returns any value (node, node) that is connected to this node with one or more connections of the given property.
     * For example getDeep(hasFriend) will return all the people that are my friends or friends of friends
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param maxDepth - the maximum number of connections that resulting nodes are removed from this node. In the example above maxDepth=2 would return only friends and friends of friends
     */
    NamedNode.prototype.getDeep = function (property, maxDepth) {
        var e_7, _a, e_8, _b;
        if (maxDepth === void 0) { maxDepth = Infinity; }
        var result = new NodeSet_js_1.NodeSet();
        var stack = new NodeSet_js_1.NodeSet([this]);
        while (stack.size > 0 && maxDepth > 0) {
            var nextLevelStack = new NodeSet_js_1.NodeSet();
            try {
                for (var stack_1 = (e_7 = void 0, __values(stack)), stack_1_1 = stack_1.next(); !stack_1_1.done; stack_1_1 = stack_1.next()) {
                    var node = stack_1_1.value;
                    try {
                        for (var _c = (e_8 = void 0, __values(node.getAll(property))), _d = _c.next(); !_d.done; _d = _c.next()) {
                            var value = _d.value;
                            if (!result.has(value)) {
                                result.add(value);
                                nextLevelStack.add(value);
                            }
                        }
                    }
                    catch (e_8_1) { e_8 = { error: e_8_1 }; }
                    finally {
                        try {
                            if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                        }
                        finally { if (e_8) throw e_8.error; }
                    }
                }
            }
            catch (e_7_1) { e_7 = { error: e_7_1 }; }
            finally {
                try {
                    if (stack_1_1 && !stack_1_1.done && (_a = stack_1.return)) _a.call(stack_1);
                }
                finally { if (e_7) throw e_7.error; }
            }
            stack = nextLevelStack;
            maxDepth--;
        }
        return result;
    };
    /**
     * Returns the first found value following the given properties in the given order.
     * For example: getOneFromPath([hasFriend,hasFather]) would return the first found father out of the set 'fathers of my friends'
     * @param properties - an array of NamedNodes. Which are nodes with rdf:type rdf:Property, the edges in the graph, the predicates of quads.
     */
    NamedNode.prototype.getOneFromPath = function () {
        var e_9, _a;
        var properties = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            properties[_i] = arguments[_i];
        }
        //we just need one, so we do a depth-first algorithm which will be more performant, so:
        //take first property
        var property = properties.shift();
        //if more properties left
        if (properties.length > 0) {
            var res;
            try {
                //check if any of the values of that property for this node
                //has a path to the rest of the properties, and if so return the found value
                for (var _b = __values(this.getAll(property)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var value = _c.value;
                    if ((res = value.getOneFromPath.apply(value, __spreadArray([], __read(properties), false)))) {
                        return res;
                    }
                }
            }
            catch (e_9_1) { e_9 = { error: e_9_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_9) throw e_9.error; }
            }
        }
        else {
            //return the first value possible
            return this.getOne(property);
        }
    };
    /**
     * Returns all values that can be reached by following the given properties in order.
     * For example getAllFromPath([hasFriend,hasFather]) will return all fathers of all my (direct) friends
     * @param properties - an array of NamedNodes. Which are nodes with rdf:type rdf:Property, the edges in the graph, the predicates of quads.
     */
    NamedNode.prototype.getAllFromPath = function () {
        var _a;
        var properties = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            properties[_i] = arguments[_i];
        }
        //we just need all paths, so we can do a breadth first implementation
        //take first property
        var property = properties.shift();
        if (properties.length > 0) {
            //and ask the whole set of values to return all values of the rest of the path
            return (_a = this.getAll(property)).getAllFromPath.apply(_a, __spreadArray([], __read(properties), false));
        }
        else {
            return this.getAll(property);
        }
    };
    /**
     * Same as getDeep() but for inverse properties.
     * Best understood with an example: if this is a person. this.getInverseDeep(hasChild) would return all this persons ancestors (which had children that eventually had this person as their child)
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param maxDepth - the maximum number of connections that resulting nodes are removed from this node. In the example above maxDepth=2 would return only the parents and grand parents
     */
    NamedNode.prototype.getInverseDeep = function (property, maxDepth) {
        var e_10, _a, e_11, _b;
        if (maxDepth === void 0) { maxDepth = Infinity; }
        var result = new NodeSet_js_1.NodeSet();
        var stack = new NodeSet_js_1.NodeSet([this]);
        while (stack.size > 0 && maxDepth > 0) {
            var nextLevelStack = new NodeSet_js_1.NodeSet();
            try {
                for (var stack_2 = (e_10 = void 0, __values(stack)), stack_2_1 = stack_2.next(); !stack_2_1.done; stack_2_1 = stack_2.next()) {
                    var node = stack_2_1.value;
                    try {
                        for (var _c = (e_11 = void 0, __values(node.getAllInverse(property))), _d = _c.next(); !_d.done; _d = _c.next()) {
                            var value = _d.value;
                            if (!result.has(value)) {
                                result.add(value);
                                nextLevelStack.add(value);
                            }
                        }
                    }
                    catch (e_11_1) { e_11 = { error: e_11_1 }; }
                    finally {
                        try {
                            if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                        }
                        finally { if (e_11) throw e_11.error; }
                    }
                }
            }
            catch (e_10_1) { e_10 = { error: e_10_1 }; }
            finally {
                try {
                    if (stack_2_1 && !stack_2_1.done && (_a = stack_2.return)) _a.call(stack_2);
                }
                finally { if (e_10) throw e_10.error; }
            }
            stack = nextLevelStack;
            maxDepth--;
        }
        return result;
    };
    /**
     * Returns true if the given value can be reached with one or more connections of the given property
     * Example: if this is a person. this.hasDeep(hasFriend,Mike) returns true if this person has Mike as a friend, or if any this persons friends or friends of friends have Mike as a friend.
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param maxDepth - the maximum number of connections that resulting nodes are removed from this node. In the example above maxDepth=2 would return true only if Mike is the persons friend, or friend of a friend
     */
    NamedNode.prototype.hasDeep = function (property, value, maxDepth) {
        var e_12, _a, e_13, _b;
        if (maxDepth === void 0) { maxDepth = Infinity; }
        var checked = new NodeSet_js_1.NodeSet();
        var stack = new NodeSet_js_1.NodeSet([this]);
        while (stack.size > 0 && maxDepth > 0) {
            var nextLevelStack = new NodeSet_js_1.NodeSet();
            try {
                for (var stack_3 = (e_12 = void 0, __values(stack)), stack_3_1 = stack_3.next(); !stack_3_1.done; stack_3_1 = stack_3.next()) {
                    var node = stack_3_1.value;
                    try {
                        for (var _c = (e_13 = void 0, __values(node.getAll(property))), _d = _c.next(); !_d.done; _d = _c.next()) {
                            var propertyValue = _d.value;
                            if (propertyValue === value) {
                                return true;
                            }
                            if (!checked.has(propertyValue)) {
                                checked.add(propertyValue);
                                nextLevelStack.add(propertyValue);
                            }
                        }
                    }
                    catch (e_13_1) { e_13 = { error: e_13_1 }; }
                    finally {
                        try {
                            if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                        }
                        finally { if (e_13) throw e_13.error; }
                    }
                }
            }
            catch (e_12_1) { e_12 = { error: e_12_1 }; }
            finally {
                try {
                    if (stack_3_1 && !stack_3_1.done && (_a = stack_3.return)) _a.call(stack_3);
                }
                finally { if (e_12) throw e_12.error; }
            }
            stack = nextLevelStack;
            maxDepth--;
        }
        return false;
    };
    /**
     * Returns the first node that has this node as the valu eof the given property.
     * Same as getOne() but for 'inverse properties'. Meaning nodes that have this node as their value.
     * Example: if this is a person. this.getOneInverse(hasChild) returns one of the persons parents
     * NOTE: the order of multiple (inverse) values CANNOT be guaranteed. Therefore use this value if it DOESN'T matter to you which of multiple possible inverse values for this property you'll get OR if you're certain there will be only one value.
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    NamedNode.prototype.getOneInverse = function (property) {
        if (!this.asObject)
            return undefined;
        var quads = this.asObject.get(property);
        return quads ? quads.keys().next().value : undefined;
    };
    /**
     * Returns all the nodes that have this node as the value of the given property.
     * Same as getAll() but for 'inverse properties'. Meaning nodes that have this node as their value.
     * Example: if this is a person. this.getAllInverse(hasChild) returns all the persons parents
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    NamedNode.prototype.getAllInverse = function (property) {
        if (!this.asObject || !this.asObject.has(property))
            return new NodeSet_js_1.NodeSet();
        return this.asObject.get(property).getSubjects();
    };
    /**
     * Returns all the nodes that have this node as the EXPLICIT value of the given property.
     * Same as getAll() but only considers explicit facts (excluding implicit facts generated by the reasoner)
     * Example: if this is a person. this.getAllInverse(hasChild) returns all the persons parents, as long as the fact that these are this persons parents is explicitly stated
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    NamedNode.prototype.getAllInverseExplicit = function (property) {
        return this.getExplicitInverseQuads(property).getSubjects();
    };
    /**
     * Get all the values of multiple properties at once
     * Same as getAll() but for multiple properties at once
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    NamedNode.prototype.getMultiple = function (properties) {
        var e_14, _a;
        var res = new NodeSet_js_1.NodeSet();
        try {
            for (var properties_1 = __values(properties), properties_1_1 = properties_1.next(); !properties_1_1.done; properties_1_1 = properties_1.next()) {
                var property = properties_1_1.value;
                res = res.concat(this.getAll(property));
            }
        }
        catch (e_14_1) { e_14 = { error: e_14_1 }; }
        finally {
            try {
                if (properties_1_1 && !properties_1_1.done && (_a = properties_1.return)) _a.call(properties_1);
            }
            finally { if (e_14) throw e_14.error; }
        }
        return res;
    };
    /**
     * Get all the nodes that have this node as their value for any of the given properties
     * Same as getMultiple() but for the opposite direction
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    NamedNode.prototype.getMultipleInverse = function (properties) {
        var e_15, _a;
        var res = new NodeSet_js_1.NodeSet();
        try {
            for (var properties_2 = __values(properties), properties_2_1 = properties_2.next(); !properties_2_1.done; properties_2_1 = properties_2.next()) {
                var property = properties_2_1.value;
                res = res.concat(this.getAllInverse(property));
            }
        }
        catch (e_15_1) { e_15 = { error: e_15_1 }; }
        finally {
            try {
                if (properties_2_1 && !properties_2_1.done && (_a = properties_2.return)) _a.call(properties_2);
            }
            finally { if (e_15) throw e_15.error; }
        }
        return res;
    };
    /**
     * Get the quad that represent the connection from this node to the given value, connected by the given property
     * NOTE: accessing quads is a very low level functionality required for the framework itself
     * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param value - the node that this new graph-edge points to. The object of the quad to be created.
     */
    NamedNode.prototype.getQuads = function (property, value) {
        if (!this.asSubject.has(property))
            return new QuadSet_js_1.QuadSet();
        if (value) {
            return this.getQuadsByValue(property, value);
        }
        else {
            return this.asSubject.get(property).getQuadSet();
        }
    };
    /**
     * Get all the quads that represent EXPLICIT connections from this node to another node, connected by the given property
     * NOTE: accessing quads is a very low level functionality required for the framework itself
     * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    NamedNode.prototype.getExplicitQuads = function (property) {
        return this.getQuads(property).filter(function (quad) { return !quad.implicit; });
    };
    /**
     * Get all the quads that represent EXPLICIT connections from another node that has this node as its value for the given property
     * NOTE: accessing quads is a very low level functionality required for the framework itself
     * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    NamedNode.prototype.getExplicitInverseQuads = function (property) {
        return this.getInverseQuads(property).filter(function (quad) { return !quad.implicit; });
    };
    /**
     * Get all quads that represent connections from another node that has this node as its value for the given property
     * NOTE: accessing quads is a very low level functionality required for the framework itself
     * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    NamedNode.prototype.getInverseQuads = function (property) {
        if (!this.asObject.has(property))
            return undefined;
        return this.asObject.get(property).getQuadSet();
        // return this.asObject && this.asObject.has(property)
        // 	? this.asObject.get(property)
        // 	: new QuadMap();
    };
    /**
     * Get all (by default explicit) quads that represent connections from another node that has this node as its value for ANY property
     * NOTE: accessing quads is a very low level functionality required for the framework itself
     * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
     * @param includeImplicit if true, includes both implicit and explicit quads. By default false, so will only return explicit quads
     */
    NamedNode.prototype.getAllInverseQuads = function (includeImplicit) {
        if (includeImplicit === void 0) { includeImplicit = false; }
        var res = new QuadArray_js_1.QuadArray();
        if (this.asObject) {
            this.asObject.forEach(function (quadSet) {
                quadSet.forEach(function (quad) {
                    if (!includeImplicit && quad.implicit)
                        return;
                    res.push(quad);
                });
            });
        }
        return res;
    };
    /**
     * Get all (by default explicit) quads that represent connections for all values of this node (so quads where this node is the subject)
     * NOTE: accessing quads is a very low level functionality required for the framework itself
     * and SHOULD GENERALLY NOT BE USED. Use methods to get/set properties instead
     * @param includeAsObject if true, includes quads from both directions (so also inverse properties where this node is the object of the quad)
     * @param includeImplicit if true, includes both implicit and explicit quads. By default false, so will only return explicit quads
     */
    NamedNode.prototype.getAllQuads = function (includeAsObject, includeImplicit) {
        var _this = this;
        if (includeAsObject === void 0) { includeAsObject = false; }
        if (includeImplicit === void 0) { includeImplicit = false; }
        var res = new QuadArray_js_1.QuadArray();
        this.asSubject.forEach(function (quadMap) {
            quadMap.forEach(function (quad) {
                if (!includeImplicit && quad.implicit)
                    return;
                res.push(quad);
            });
        });
        if (includeAsObject && this.asObject) {
            this.asObject.forEach(function (quadMap) {
                quadMap.forEach(function (quad) {
                    //we manually filter duplicates from the result set here so that we can keep using QuadArray, which is much faster in ES5
                    //and the only duplicates will be a node with itself as subject AND object, so we filter the second occurrence here
                    if (!includeImplicit && quad.implicit)
                        return;
                    if (quad.subject === _this)
                        return;
                    res.push(quad);
                });
            });
        }
        return res;
    };
    /**
     * Update a certain property so that only the given value is a value of this property.
     * Overwrites (and thus removes) any previously set values
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param value - a single node. Can be a NamedNode or Literal
     */
    NamedNode.prototype.overwrite = function (property, value) {
        //don't do anything if the current value is already equivalent to the new value
        if (this.getAll(property).size == 1 && value && this.has(property, value))
            return false;
        //clear all values and set new value
        this.unsetAll(property);
        if (value) {
            return this.set(property, value);
        }
    };
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
    NamedNode.prototype.moverwrite = function (property, values) {
        var _this = this;
        //don't update if the new set of values is the same (or equivalent) as the old set of values
        if (this.getAll(property).size === (values.size || values.length) &&
            values.every(function (value) { return _this.has(property, value); })) {
            return false;
        }
        this.unsetAll(property);
        return this.mset(property, values);
    };
    /**
     * Removes this node from the graph, locally and remotely, in all connected QuadStores.
     * All properties will be unset, both where this node is the subject or the object.
     * Emits an event from the node itself and from the NamedNode class
     */
    NamedNode.prototype.remove = function () {
        //collect all the quads that are about to be removed
        var removedQuads = this.getAllQuads(true);
        //remove all quads locally
        this.asSubject.forEach(function (quads) { return quads.removeAll(true); });
        if (this.asObject)
            this.asObject.forEach(function (quads) { return quads.removeAll(true); });
        //emit event from this node itself, with all the quads that were removed
        this.emit(NamedNode.NODE_REMOVED, this, removedQuads);
        //clean up anything connected to this node
        this.removeAllListeners();
        //remove form list
        NamedNode.unregister(this);
        //make sure a global event is emitted that nodes are moved (picked up by storage)
        EventBatcher_js_1.eventBatcher.register(NamedNode);
        NamedNode.nodesToRemove.add([this, removedQuads]);
    };
    /**
     * UNSET (remove) a single property value connection.
     * Remove a single connection between two nodes in the graph: from this node, to the node given as value, with the property as the connecting 'edge' between them
     * In the graph, this will remove the edge between two nodes.
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param value - the node that this new graph-edge points to. The object of the quad to be created.
     */
    NamedNode.prototype.unset = function (property, value) {
        if (this.has(property, value)) {
            this.getQuads(property, value).removeAll(true);
            return true;
        }
        return false;
    };
    /**
     * unset (remove) all values of a certain property.
     * Removes all connections (edges) in the graph between this node and other nodes, where the given property is used as the connecting 'edge' between them
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    NamedNode.prototype.unsetAll = function (property) {
        NamedNode.emitClearedProperty(this, property);
        if (this.hasProperty(property)) {
            //false as parameter because we don't need alteration events for each single quad, but rather manage this with clearedProperties events
            this.asSubject.get(property).removeAll(false);
            return true;
        }
        return false;
    };
    NamedNode.emitClearedProperty = function (node, property) {
        //if not a local node we will emit events for storage controllers to be picked up
        if (!node.isTemporaryNode) {
            //regardless of how many values are known 'locally', we want to emit this event so that the source of data can eventually properly clear all values
            if (!NamedNode.clearedProperties.has(node)) {
                NamedNode.clearedProperties.set(node, []);
                EventBatcher_js_1.eventBatcher.register(NamedNode);
            }
            //we save the property that was cleared AND the quads that were cleared
            NamedNode.clearedProperties
                .get(node)
                .push([
                property,
                node.asSubject.has(property)
                    ? new (QuadArray_js_1.QuadArray.bind.apply(QuadArray_js_1.QuadArray, __spreadArray([void 0], __read(node.asSubject.get(property).getQuadSet()), false)))() : null,
            ]);
        }
    };
    /**
     * returns true if ANY node has this node as the value of the given property
     * Example: if 'this' is a person, this.hasInverseProperty(hasChild) returns true if any facts stating `someParent hasChild thisPerson` are known
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     */
    NamedNode.prototype.hasInverseProperty = function (property) {
        return this.asObject && this.asObject.has(property);
    };
    /**
     * returns true if the given inverse 'value' has this node as the (real) value of the given property
     * Example: if 'this' is a person, this.hasInverseProperty(hasChild,someParent) returns true if someParent indeed has this person as a child
     * @param property - a NamedNode with rdf:type rdf:Property, the edge in the graph, the predicate of a quad
     * @param value - a single node. Can be a NamedNode or Literal
     */
    NamedNode.prototype.hasInverse = function (property, value) {
        return (this.asObject &&
            this.asObject.get(property).some(function (quad) { return quad.subject.equals(value); }));
    };
    /**
     * returns true if this node is equivaluent to the given node.
     * For NamedNodes it simply returns true if this === the given object. So if its the same object in memory.
     * It exists mainly for comparing Literals, where two different objects can still be equivalent
     * @param other another node
     */
    NamedNode.prototype.equals = function (other) {
        return other === this;
    };
    NamedNode.prototype.createPromise = function () {
        var resolve, reject;
        var promise = new Promise(function (res, rej) {
            resolve = res;
            reject = rej;
        });
        return { promise: promise, resolve: resolve, reject: reject };
    };
    /**
     * Save this node into the graph database.
     * Newly created nodes will exist only in local memory until you call this function
     * @returns a promise that resolves when the node has received a permanent URI
     */
    NamedNode.prototype.save = function () {
        if (this.isTemporaryNode) {
            if (!this._isStoring) {
                //this creates a promise that will resolve when the node is stored
                this.isStoring = true;
                NamedNode.nodesToSave.add(this);
                EventBatcher_js_1.eventBatcher.register(NamedNode);
            }
            //always return a promise
            return this._isStoring.promise;
        }
    };
    /**
     * Create a new URI Node with the same properties as the current node
     * NOTE: does NOT clone the inverse properties (where this node is the value of another node its properties)
     */
    NamedNode.prototype.clone = function () {
        var node = NamedNode.create();
        this.getAllQuads().forEach(function (quad) {
            node.set(quad.predicate, quad.object);
        });
        return node;
    };
    /**
     * Returns a string representation of this node.
     * Returns the URI for a NamedNode
     */
    NamedNode.prototype.toString = function () {
        return this.uri;
    };
    NamedNode.prototype.print = function (includeIncomingProperties) {
        if (includeIncomingProperties === void 0) { includeIncomingProperties = true; }
        var print = '';
        this.getAsSubjectQuads().forEach(function (quadMap) {
            BlankNode.includeBlankNodes(quadMap.getQuadSet()).forEach(function (quad) { return (print += '\t' + quad.print() + '.\n'); });
        });
        if (this.asObject && includeIncomingProperties) {
            print += '<----\n';
            this.asObject.forEach(function (quadMap) {
                BlankNode.includeBlankNodes(quadMap.getQuadSet(), false, true).forEach(function (quad) { return (print += '\t' + quad.print() + '.\n'); });
            });
        }
        return print;
    };
    /**
     * Fires the given call back when ANY property of this node changes.
     * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
     * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
     */
    NamedNode.prototype.onChangeAny = function (callback, context) {
        this.on(NamedNode.PROPERTY_CHANGED, callback, context);
    };
    /**
     * Fires the given call back when this node become the value or is no longer the value of another node
     * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
     * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
     */
    NamedNode.prototype.onChangeAnyInverse = function (callback, context) {
        this.on(NamedNode.INVERSE_PROPERTY_CHANGED, callback, context);
    };
    /**
     * Fires the given call back when this node changes the values of the given property
     * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
     * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
     */
    NamedNode.prototype.onChange = function (property, callback, context) {
        this.on(NamedNode.PROPERTY_CHANGED + property.uri, callback, context);
    };
    /**
     * Fires the given callback when this node become the value or is no longer the value of the given property of another node
     * Example: if someGroup hasParticipant thisResource, and the group removes this node from its participants, it will trigger onChangeInverse for this node
     * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
     * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
     */
    NamedNode.prototype.onChangeInverse = function (property, callback, context) {
        this.on(NamedNode.INVERSE_PROPERTY_CHANGED + property.uri, callback, context);
    };
    /**
     * Call this when you want to stop listening for onChangeAny events. Make sure to provide the exact same BOUND instance of a method to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
     * @param callback the exact same method you supplied to onChangeAny
     * @param context the same context you supplied to onChangeAny
     */
    NamedNode.prototype.removeOnChangeAny = function (callback, context) {
        this.off(NamedNode.PROPERTY_CHANGED, callback, context);
    };
    /**
     * Call this when you want to stop listening for onChangeAnyInverse events. Make sure to provide the exact same BOUND instance of a method to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
     * @param callback the exact same method you supplied to onChangeAnyInverse
     * @param context the same context you supplied to onChangeAnyInverse
     */
    NamedNode.prototype.removeOnChangeAnyInverse = function (callback, context) {
        this.off(NamedNode.INVERSE_PROPERTY_CHANGED, callback, context);
    };
    /* #######################################################################
     * ######################### STATIC METHODS ##############################
     * #######################################################################
     */
    /**
     * Call this when you want to stop listening for onChange events. Make sure to provide the exact same BOUND instance of a method as callback to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
     * @param callback the exact same method you supplied to onChange
     * @param context the same context you supplied to onChange
     */
    NamedNode.prototype.removeOnChange = function (property, callback, context) {
        this.off(NamedNode.PROPERTY_CHANGED + property.uri, callback, context);
    };
    /**
     * Call this when you want to stop listening for onChangeInverse events. Make sure to provide the exact same BOUND instance of a method as callback to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
     * @param callback the exact same method you supplied to onChangeInverse
     * @param context the same context you supplied to onChangeInverse
     */
    NamedNode.prototype.removeOnChangeInverse = function (property, callback, context) {
        this.off(NamedNode.INVERSE_PROPERTY_CHANGED + property.uri, callback, context);
    };
    /**
     * Call this when you want to stop listening for onChangeAny events. Other then removeOnChangeAny you only have to supply the context.
     * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChangeAny
     * @param context the same context you supplied to onChangeAny
     */
    NamedNode.prototype.clearOnChangeAny = function (context) {
        this.removeListenerByContext(NamedNode.PROPERTY_CHANGED, context);
    };
    /**
     * Call this when you want to stop listening for onChangeAnyInverse events. Other then removeOnChangeAnyInverse you only have to supply the context.
     * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChangeAnyInverse
     * @param context the same context you supplied to onChangeAnyInverse
     */
    NamedNode.prototype.clearOnChangeAnyInverse = function (context) {
        this.removeListenerByContext(NamedNode.INVERSE_PROPERTY_CHANGED, context);
    };
    /**
     * Call this when you want to stop listening for onChange events. Other then removeOnChange you only have to supply the context.
     * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChange
     * @param context the same context you supplied to onChange
     */
    NamedNode.prototype.clearOnChange = function (property, context) {
        this.removeListenerByContext(NamedNode.PROPERTY_CHANGED + property.uri, context);
    };
    /**
     * Call this when you want to stop listening for onChangeInverse events. Other then removeOnChangeInverse you only have to supply the context.
     * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChangeInverse
     * @param context the same context you supplied to onChangeAny
     */
    NamedNode.prototype.clearOnChangeInverse = function (property, context) {
        this.removeListenerByContext(NamedNode.INVERSE_PROPERTY_CHANGED + property.uri, context);
    };
    /**
     * Call this when you want to stop listening for onPredicateChange events
     * @param context the same context you supplied to onPredicateChange
     */
    NamedNode.prototype.clearOnPredicateChange = function (context) {
        this.removeListenerByContext(NamedNode.AS_PREDICATE_CHANGED, context);
    };
    /**
     * Emits the batched (property) events of a NamedNode INSTANCE (meaning for this specific node)
     * Used internally by the framework to manage emitting change events
     * @internal
     */
    NamedNode.prototype.emitBatchedEvents = function () {
        var _this = this;
        //for each type of property change (and the map of batched changes for that type of change)
        [
            [this.changedProperties, NamedNode.PROPERTY_CHANGED],
            [this.changedInverseProperties, NamedNode.INVERSE_PROPERTY_CHANGED],
            [this.alteredProperties, NamedNode.PROPERTY_ALTERED],
            [this.alteredInverseProperties, NamedNode.INVERSE_PROPERTY_ALTERED],
        ].forEach(function (_a) {
            var _b = __read(_a, 2), map = _b[0], event = _b[1];
            if (!map)
                return;
            //for each individual change that was made
            map.forEach(function (quads, property) {
                //emit the specific event that THIS property has changed
                _this.emit(event + property.uri, quads, property);
            });
            if (map.size > 0) {
                //emit the general event that A property has changed/altered
                _this.emit(event, map);
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
    };
    NamedNode.prototype.getAsSubjectQuads = function () {
        return this.asSubject;
    };
    NamedNode.prototype.getAsPredicateQuads = function () {
        return this.asPredicate;
    };
    NamedNode.prototype.getAsObjectQuads = function () {
        return this.asObject;
    };
    /**
     * Adds the quad to all given maps
     * @param quad
     * @param maps
     * @private
     */
    NamedNode.prototype.registerPropertyChange = function (quad, maps) {
        //register that this class has some events to emit
        EventBatcher_js_1.eventBatcher.register(this);
        //for each given map
        maps.forEach(function (map) {
            //add this quad under the predicate as key
            if (!map.has(quad.predicate)) {
                map.set(quad.predicate, new QuadSet_js_1.QuadSet());
            }
            map.get(quad.predicate).add(quad);
        });
    };
    NamedNode.prototype.registerPredicateChange = function (quad, alteration) {
        EventBatcher_js_1.eventBatcher.register(this);
        if (!this.changedAsPredicate) {
            this.changedAsPredicate = new QuadArray_js_1.QuadArray();
        }
        this.changedAsPredicate.push(quad);
        if (alteration) {
            if (!this.alteredAsPredicate) {
                this.alteredAsPredicate = new QuadArray_js_1.QuadArray();
            }
            this.alteredAsPredicate.push(quad);
        }
    };
    NamedNode.prototype.getQuadsByValue = function (property, value) {
        return value instanceof NamedNode
            ? this.asSubject.get(property).has(value)
                ? this.asSubject.get(property).get(value)
                : new QuadSet_js_1.QuadSet()
            : this.asSubject
                .get(property)
                .filter(function (quad) { return quad.object.equals(value); }, QuadSet_js_1.QuadSet);
    };
    /**
     * The base of temporary URI's
     * @internal
     */
    NamedNode.TEMP_URI_BASE = 'lin://tmp/';
    /**
     * Emitter used by the class itself by static methods emitting events.
     * Anyone wanting to listen to that should therefore add a listener with NamedNode.emitter.on(...)
     * @internal
     */
    NamedNode.emitter = new EventEmitter_js_1.EventEmitter();
    /**
     * event emitted when nodes need to be stored
     * @internal
     */
    NamedNode.STORE_NODES = 'STORE_NODES';
    /**
     * Event emitted when previous values have been overwritten (for example with update or moverwrite)
     * NOTE: Locally we may not know all the properties, but the intend of update / moverwrite is to overwrite ANY existing properties. So event handlers listening to this event should clear any previous property values they can find.
     * @internal
     */
    NamedNode.CLEARED_PROPERTIES = 'CLEARED_PROPERTIES';
    /**
     * event emitted when nodes need to be removed
     * @internal
     */
    NamedNode.REMOVE_NODES = 'REMOVE_NODES';
    /**
     * event emitted when the URI of a node has been updated
     */
    NamedNode.URI_UPDATED = 'URI_UPDATED';
    /**
     * event emitted when nodes need to be loaded
     * @internal
     */
    NamedNode.LOAD_NODES = 'LOAD_NODES';
    /**
     * event emitted by a single node when its properties have changed
     * @internal
     */
    NamedNode.PROPERTY_CHANGED = 'PROPERTY_CHANGED';
    /**
     * event emitted by a single node when its properties have been altered
     * NOTE: we use 'altered' for changes made by user interaction vs 'changed' for changes that
     * could for example be due to new data being loaded
     * @internal
     */
    NamedNode.PROPERTY_ALTERED = 'PROPERTY_ALTERED';
    /**
     * event emitted by a single node when its inverse properties have been changed
     * @internal
     */
    NamedNode.INVERSE_PROPERTY_CHANGED = 'INVERSE_PROPERTY_CHANGED';
    //### event types ###
    /**
     * event emitted by a single node when its inverse properties have been altered
     * NOTE: we use 'altered' for changes made by user interaction vs 'changed' for changes that
     * could for example be due to new data being loaded
     * @internal
     */
    NamedNode.INVERSE_PROPERTY_ALTERED = 'INVERSE_PROPERTY_ALTERED';
    /**
     * event emitted by a single node when its used or not used anymore as a predicate
     * @internal
     */
    NamedNode.AS_PREDICATE_CHANGED = 'AS_PREDICATE_CHANGED';
    /**
     * event emitted by a single node when its used or not used anymore as a predicate due to user requested alterations
     * @internal
     */
    NamedNode.AS_PREDICATE_ALTERED = 'AS_PREDICATE_ALTERED';
    /**
     * event emitted by a single node when it's been removed
     */
    NamedNode.NODE_REMOVED = 'NODE_REMOVED';
    NamedNode.namedNodes = new NodeMap_js_1.NodeMap();
    NamedNode.tempCounter = 0;
    NamedNode.nodesToSave = new NodeSet_js_1.NodeSet();
    NamedNode.nodesToLoad = new NodeSet_js_1.NodeSet();
    NamedNode.nodesToLoadFully = new NodeSet_js_1.NodeSet();
    NamedNode.nodesToRemove = new CoreSet_js_1.CoreSet();
    NamedNode.nodesURIUpdated = new CoreMap_js_1.CoreMap();
    NamedNode.clearedProperties = new CoreMap_js_1.CoreMap();
    return NamedNode;
}(Node));
exports.NamedNode = NamedNode;
//cannot import from xsd ontology here without creating circular dependencies
var rdfLangString = NamedNode.getOrCreate('http://www.w3.org/1999/02/22-rdf-syntax-ns#langString');
var xsdString = NamedNode.getOrCreate('http://www.w3.org/2001/XMLSchema#string');
var BlankNode = /** @class */ (function (_super) {
    __extends(BlankNode, _super);
    function BlankNode(uri, isTemporaryNode) {
        if (isTemporaryNode === void 0) { isTemporaryNode = false; }
        var _this = _super.call(this, uri || BlankNode.createUri(), isTemporaryNode) || this;
        _this.termType = 'BlankNode';
        NamedNode.register(_this);
        return _this;
    }
    Object.defineProperty(BlankNode.prototype, "uri", {
        get: function () {
            return this._value;
        },
        set: function (uri) {
            throw new Error('You should not set the URI of a BlankNode. Make sure the node is created as a NamedNode. BlankNode data:\n' +
                BlankNode.includeBlankNodes(this.getAllQuads()).toString());
        },
        enumerable: false,
        configurable: true
    });
    BlankNode.create = function (isTemporaryNode) {
        if (isTemporaryNode === void 0) { isTemporaryNode = false; }
        return new BlankNode(null, isTemporaryNode);
    };
    BlankNode.createUri = function () {
        return '_:' + this.counter++;
    };
    BlankNode.includeBlankNodes = function (quads, includeObjectBlankNodes, includeSubjectBlankNodes, blankNodes) {
        var _this = this;
        if (includeObjectBlankNodes === void 0) { includeObjectBlankNodes = true; }
        if (includeSubjectBlankNodes === void 0) { includeSubjectBlankNodes = false; }
        if (blankNodes === void 0) { blankNodes = new NodeURIMappings_js_1.NodeURIMappings(); }
        var add = quads instanceof Set ? quads.add.bind(quads) : quads.push.bind(quads);
        quads.forEach(function (quad) {
            if (includeObjectBlankNodes && quad.object instanceof BlankNode) {
                _this.addBlankNodeQuads(quad.object, add, blankNodes);
            }
            if (includeSubjectBlankNodes && quad.subject instanceof BlankNode) {
                //also add quads of subjects that are blank nodes, iteratively, but don't include the blank node objects of those quads
                _this.addBlankNodeQuads(quad.subject, add, blankNodes, true);
            }
        });
        return quads;
    };
    BlankNode.addBlankNodeQuads = function (blankNode, add, blankNodes, inverseIteration) {
        var _this = this;
        if (inverseIteration === void 0) { inverseIteration = false; }
        // console.log('adding quads of ' + blankNode.uri);
        blankNodes.set(blankNode.uri, blankNode);
        blankNode.getAllQuads().forEach(function (quad) {
            if (!(quad instanceof Quad)) {
                throw new Error('Not a quad');
            }
            add(quad);
            //also, iteratively include quads of blank-node values of blank-nodes
            if (!inverseIteration && quad.object instanceof BlankNode) {
                //if we've not seen this blank node yet during this collection (avoiding loops from circular references between blank nodes)
                if (!blankNodes.has(quad.object.uri)) {
                    _this.addBlankNodeQuads(quad.object, add, blankNodes);
                }
            }
            if (inverseIteration && quad.subject instanceof BlankNode) {
                //if we've not seen this blank node yet during this collection (avoiding loops from circular references between blank nodes)
                if (!blankNodes.has(quad.subject.uri)) {
                    _this.addBlankNodeQuads(quad.subject, add, blankNodes, true);
                }
            }
        });
    };
    BlankNode.counter = 0;
    return BlankNode;
}(NamedNode));
exports.BlankNode = BlankNode;
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
var Literal = /** @class */ (function (_super) {
    __extends(Literal, _super);
    /**
     * Other than with NamedNodes, its fine to do `new Literal("my string value")`
     * Datatype and language tags are optional
     * @param value
     * @param datatype
     * @param language
     */
    function Literal(value, _datatype, _language) {
        if (_datatype === void 0) { _datatype = null; }
        if (_language === void 0) { _language = ''; }
        var _this = _super.call(this, value) || this;
        _this._datatype = _datatype;
        _this._language = _language;
        _this.termType = 'Literal';
        if (typeof value !== 'string') {
            throw new Error('Literal value must be a string. Given value was a ' +
                typeof value +
                ' (' +
                value +
                ')');
        }
        return _this;
    }
    Object.defineProperty(Literal.prototype, "language", {
        /**
         * get the language tag of this literal which states which language this literal is written in
         * See also: http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
         */
        get: function () {
            //list of language tags: http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
            return this._language;
        },
        /**
         * update the language tag of this literal
         */
        set: function (lang) {
            this._language = lang;
            //the datatype of any literal with a language tag is rdf:langString
            this._datatype = rdfLangString;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Literal.prototype, "datatype", {
        /**
         * returns the datatype of this literal
         * Note that datatypes are NamedNodes themselves, who always have rdf:type rdf:Datatype
         * If no datatype is set, the default datatype xsd:string will be returned
         * If a language tag is set, the returned datatype will be rdf:langString
         */
        get: function () {
            if (this._datatype) {
                return this._datatype;
            }
            //default datatype is xsd:string, if language is set this.datatype should be langString already
            return xsdString;
        },
        /**
         * Update the datatype of this literal
         * @param datatype
         */
        set: function (datatype) {
            this._datatype = datatype;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Literal.prototype, "value", {
        /**
         * Return the value of this literal
         * @param datatype
         */
        get: function () {
            return this._value;
        },
        /**
         * update the literal value of this literal
         * @param datatype
         */
        set: function (value) {
            var previousValue;
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
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Returns the literal value of the first Literal that occurs as object for the given subject and property and optionally also matches the given language
     * @param subject
     * @param property
     * @param language
     * @deprecated
     * @returns {string|undefined}
     */
    Literal.getValue = function (subject, property, language) {
        var e_16, _a;
        if (language === void 0) { language = ''; }
        try {
            for (var _b = __values(subject.getAll(property)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var value = _c.value;
                if (value instanceof Literal &&
                    (!language || value.isOfLanguage(language))) {
                    return value.value;
                }
            }
        }
        catch (e_16_1) { e_16 = { error: e_16_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_16) throw e_16.error; }
        }
        return undefined;
    };
    /**
     * Returns all literal values of the Literals that occur as object for the given subject and property and optionally also match the given language
     * @param subject
     * @param property
     * @param language
     * @returns {string[]}
     */
    Literal.getValues = function (subject, property, language) {
        var e_17, _a;
        if (language === void 0) { language = ''; }
        var res = [];
        try {
            for (var _b = __values(subject.getAll(property)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var value = _c.value;
                if (value instanceof Literal &&
                    (!language || value.isOfLanguage(language))) {
                    res.push(value.value);
                }
            }
        }
        catch (e_17_1) { e_17 = { error: e_17_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_17) throw e_17.error; }
        }
        return res;
    };
    Literal.isLiteralString = function (literalString) {
        var regex = new RegExp('(\\"[^\\"^\\n]*\\")(@[a-z]{1,3}|\\^\\^[a-zA-Z]+\\:[a-zA-Z0-9_-]+|\\<https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)\\>)?');
        return regex.test(literalString);
    };
    Literal.fromString = function (literalString) {
        //self made regex thatL
        // match anything between quotes or quad quotes (the quotes are group 1 and 3)
        // except escaped quotes (2)
        //and everything behind it (4) for language or datatype
        //..with a little help on the escaped quotes from here
        //https://stackoverflow.com/questions/38563414/javascript-regex-to-select-quoted-string-but-not-escape-quotes
        var match = literalString.match(/("|""")([^"\\]*(?:\\.[^"\\]*)*)("|""")(.*)/);
        //NOTE: if \n replacement turns out to be not correct here it should at least be moved to JSONLDParser, see https://github.com/digitalbazaar/jsonld.js/issues/242
        var literal = (match[2] ? match[2] : '')
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n');
        var suffix = match[4];
        if (!suffix) {
            return new Literal(literal);
        }
        if (suffix[0] == '@') {
            return new Literal(literal, null, suffix.substr(1));
        }
        else if (suffix[0] == '^') {
            var dataType = NamedNode.fromString(suffix.substr(2));
            return new Literal(literal, dataType);
        }
        else {
            throw new Error('Invalid literal string format: ' + literalString);
        }
    };
    Literal.prototype.getAs = function (type) {
        return type.getOf(this);
    };
    /**
     * @internal
     * @param quad
     */
    Literal.prototype.registerProperty = function (quad) {
        throw new Error('Literal nodes should not be used as subjects');
    };
    /**
     * registers the use of a quad. Since a quad can only be used in 1 quad
     * this method makes a clone of the Literal if it's used a second time,
     * and returns that new Literal so it will be used by the quad
     * @internal
     * @param quad
     */
    Literal.prototype.registerInverseProperty = function (quad) {
        //if this Literal is already being used in another quad
        if (this.referenceQuad) {
            //then return a clone
            //(this allows things like a.set(label,b.getOne(label)))
            return this.clone().registerInverseProperty(quad);
        }
        this.referenceQuad = quad;
        return this;
    };
    /**
     * @internal
     * @param quad
     */
    Literal.prototype.unregisterProperty = function (quad) {
        throw new Error('Literal nodes should not be used as subjects');
    };
    /**
     * @internal
     * @param quad
     */
    Literal.prototype.unregisterInverseProperty = function (quad) {
        this.referenceQuad = null;
    };
    /**
     * returns true if this literal node has a language tag
     */
    Literal.prototype.hasLanguage = function () {
        return this._language != '';
    };
    /**
     * returns true if the language tag of this literal matches the given language
     */
    Literal.prototype.isOfLanguage = function (language) {
        return this._language === language;
    };
    /**
     * returns true if this literal has a datatype
     */
    Literal.prototype.hasDatatype = function () {
        //checks for null and undefined
        return this._datatype != null;
    };
    /**
     * Returns true if both are literal nodes, with equal literal values, equal language tags and equal data types
     * Other than NamedNodes, two different literal node instances can be deemed equivalent if all their properties are the same
     * @param other
     * @param caseSensitive
     */
    Literal.prototype.equals = function (other) {
        return this._equals(other);
    };
    /**
     * Returns true if both are literal nodes, with equal literal values (CASE INSENSITIVE CHECK), equal language tags and equal data types
     * Other than NamedNodes, two different literal node instances can be deemed equivalent if all their properties are the same
     * @param other
     */
    Literal.prototype.equalsCaseInsensitive = function (other) {
        return this._equals(other, false);
    };
    /**
     * Creates a new Literal with exact the same properties (value,datatype and language)
     */
    Literal.prototype.clone = function () {
        return new Literal(this._value, this.datatype, this.language);
    };
    Literal.prototype.getReferenceQuad = function () {
        return this.referenceQuad;
    };
    Literal.prototype.hasInverseProperty = function (property) {
        return this.referenceQuad && this.referenceQuad.predicate === property;
    };
    Literal.prototype.hasInverse = function (property, value) {
        return (this.referenceQuad &&
            this.referenceQuad.predicate === property &&
            this.referenceQuad.subject === value);
    };
    Literal.prototype.getOneInverse = function (property) {
        return this.referenceQuad && this.referenceQuad.predicate === property
            ? this.referenceQuad.subject
            : undefined;
    };
    Literal.prototype.getMultipleInverse = function (properties) {
        var _this = this;
        if (properties.find(function (p) { return p === _this.referenceQuad.predicate; })) {
            return new NodeSet_js_1.NodeSet([this.referenceQuad.subject]);
        }
        return new NodeSet_js_1.NodeSet();
    };
    Literal.prototype.getAllInverseQuads = function (includeImplicit) {
        return !includeImplicit || !this.referenceQuad.implicit
            ? new QuadArray_js_1.QuadArray(this.referenceQuad)
            : new QuadArray_js_1.QuadArray();
    };
    Literal.prototype.getAllQuads = function (includeAsObject, includeImplicit) {
        if (includeAsObject === void 0) { includeAsObject = false; }
        if (includeImplicit === void 0) { includeImplicit = false; }
        return includeAsObject && (!includeImplicit || !this.referenceQuad.implicit)
            ? new QuadArray_js_1.QuadArray(this.referenceQuad)
            : new QuadArray_js_1.QuadArray();
    };
    Literal.prototype.promiseLoaded = function (loadInverseProperties) {
        if (loadInverseProperties === void 0) { loadInverseProperties = false; }
        return Promise.resolve(true);
    };
    Literal.prototype.isLoaded = function (includingInverseProperties) {
        if (includingInverseProperties === void 0) { includingInverseProperties = false; }
        return true;
    };
    Literal.prototype.toString = function () {
        //quotes are needed to differentiate the literal "http://test.com" from the URI http://test.com, so the literal value is always surrounded by quotes
        //quad quotes are needed in case of newlines
        // let quotes = this._value.indexOf("\n") != -1 ? '"""' : '"';
        var quotes = '"';
        var suffix = '';
        if (this.hasLanguage()) {
            suffix = '@' + this.language;
        }
        else if (this.hasDatatype()) {
            suffix = '^^<' + this.datatype.uri + '>';
        }
        //quotes in the value need to be escaped
        return (quotes +
            this._value.replace(/\"/g, '\\"').replace(/\n/g, '\\n') +
            quotes +
            suffix);
    };
    Literal.prototype.print = function (includeIncomingProperties) {
        if (includeIncomingProperties === void 0) { includeIncomingProperties = true; }
        return this.toString();
    };
    Literal.prototype._equals = function (other, caseSensitive) {
        if (caseSensitive === void 0) { caseSensitive = true; }
        if (other === this)
            return true;
        var valueToMatch;
        var languageToMatch;
        var dataTypeToMatch;
        if (other instanceof Literal) {
            valueToMatch = other.value;
            languageToMatch = other.language;
            dataTypeToMatch = other.datatype; //direct access to avoid default, alternatively build a boolean parameter 'returnDefault=true' into getDataType()
        }
        else {
            var type = typeof other;
            if (type == 'string' || type == 'number' || type == 'boolean') {
                //if you don't specify a datatype we accept all
                valueToMatch = other.toString();
                languageToMatch = '';
                dataTypeToMatch = null;
            }
            else {
                return false;
            }
        }
        //do the actual matching
        var valueMatch;
        if (caseSensitive) {
            valueMatch = this._value === valueToMatch;
        }
        else {
            valueMatch =
                this._value.toLocaleLowerCase() == valueToMatch.toLocaleLowerCase();
        }
        //if values match
        if (valueMatch) {
            //if there is a language
            if (this.hasLanguage()) {
                //then only the languages need to match
                return this.language == languageToMatch;
            }
            else {
                //no language = datatypes need to match
                //we check with this.datatype, not this.datatype which can return the default xsd:String
                //a literal without datatypespecified is however considered different from a a literal with a explicit xsd:String datatype
                //that is, like some SPARQL quad stores, you should be able to create two otherwise identical (sub&pred) quads for those two literals
                return this.datatype === dataTypeToMatch;
            }
        }
        return false;
    };
    return Literal;
}(Node));
exports.Literal = Literal;
var Graph = /** @class */ (function () {
    function Graph(value, quads) {
        this.value = value;
        // private static addedQuads: Map<Graph,QuadArray> = new Map();
        // private static removedQuads: Map<Graph,QuadArray> = new Map();
        // private static addedQuadsAlterations: Map<Graph,QuadArray> = new Map();
        this.termType = 'Graph';
        // super();
        this._node = NamedNode.getOrCreate(value);
        this.quads = quads ? quads : new QuadSet_js_1.QuadSet();
    }
    Object.defineProperty(Graph.prototype, "node", {
        get: function () {
            return this._node;
        },
        enumerable: false,
        configurable: true
    });
    //Static methods
    /**
     * Resets the map of nodes that is known in this environment
     */
    Graph.reset = function () {
        this.graphs = new CoreMap_js_1.CoreMap();
    };
    Graph.create = function (quads) {
        var uri = NamedNode.createNewTempUri();
        return this._create(uri, quads);
    };
    /**
     * @internal
     * @param graph
     */
    Graph.register = function (graph) {
        if (this.graphs.has(graph.node.uri)) {
            throw new Error('A graph with this URI already exists. You should probably use Graph.getOrCreate instead of Graph.create (' +
                graph.node.uri +
                ')');
        }
        this.graphs.set(graph.node.uri, graph);
        // super.register(graph);
    };
    /**
     * @internal
     * @param graph
     */
    Graph.unregister = function (graph) {
        if (!this.graphs.has(graph.node.uri)) {
            throw new Error('This node has already been removed from the registry: ' +
                graph.node.uri);
        }
        this.graphs.delete(graph.node.uri);
    };
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
    Graph.getOrCreate = function (uri) {
        return this.getGraph(uri) || this._create(uri);
    };
    Graph.getGraph = function (uri, mustExist) {
        if (mustExist === void 0) { mustExist = false; }
        //look it up in known full uri node map
        if (this.graphs.has(uri)) {
            return this.graphs.get(uri);
        }
        if (mustExist) {
            throw Error('Could not find graph for: ' + uri);
        }
        return null;
    };
    Graph.updateUri = function (graph, uri) {
        graph.node.uri = uri;
    };
    Graph.getAll = function () {
        return this.graphs;
    };
    Graph._create = function (uri, quads) {
        var graph = new Graph(uri, quads);
        this.register(graph);
        return graph;
    };
    Graph.prototype.equals = function (other) {
        return other === this;
    };
    /**
     * @internal
     * @param quad
     */
    Graph.prototype.registerQuad = function (quad, alteration, emitEvents) {
        if (alteration === void 0) { alteration = false; }
        if (emitEvents === void 0) { emitEvents = true; }
        this.quads.add(quad);
        // if(emitEvents)
        // {
        //   Graph.registerGraphEvent(this,quad,alteration ? [Graph.addedQuads] : [Graph.addedQuads,Graph.addedQuadsAlterations]);
        // }
    };
    /**
     * @internal
     * @param quad
     */
    Graph.prototype.unregisterQuad = function (quad, alteration, emitEvents) {
        if (alteration === void 0) { alteration = false; }
        if (emitEvents === void 0) { emitEvents = true; }
        this.quads.delete(quad);
        // if(emitEvents)
        // {
        //   Graph.registerGraphEvent(this,quad,alteration ? [Graph.removedQuads] : [Graph.removedQuads,Graph.removedQuadsAlterations])
        // }
    };
    Graph.prototype.hasQuad = function (quad) {
        return this.quads.has(quad);
    };
    //Note: cannot name this getQuads, because NamedNode already uses that for getting all quads of all its properties
    Graph.prototype.getContents = function () {
        return this.quads;
    };
    Graph.prototype.setContents = function (quads) {
        this.quads = quads;
    };
    Graph.prototype.toString = function () {
        return ('Graph: [' +
            this.node.uri.toString() +
            ' - ' +
            this.quads.size +
            ' quads]');
    };
    // private static removedQuadsAlterations: Map<Graph,QuadArray> = new Map();
    /**
     * Emitted when changes have been made to this graph. Only emitted when data has actually changed, not just when data is loaded
     */
    Graph.CONTENTS_ALTERED = 'CONTENTS_ALTERED';
    /**
     * Emitted when the contents of this graph have changed. Can also be due to loading data
     */
    Graph.CONTENTS_CHANGED = 'CONTENTS_ALTERED';
    Graph.graphs = new CoreMap_js_1.CoreMap();
    return Graph;
}());
exports.Graph = Graph;
var DefaultGraph = /** @class */ (function (_super) {
    __extends(DefaultGraph, _super);
    function DefaultGraph() {
        //empty string for default graph URI (part of the standard)
        //https://rdf.js.org/data-model-spec/#defaultgraph-interface
        var _this = _super.call(this, '') || this;
        _this.value = '';
        _this.termType = types_js_1.DefaultGraphTermType;
        _this.uri = default_graph_uri_js_1.defaultGraphURI;
        return _this;
    }
    DefaultGraph.prototype.toString = function () {
        return 'DefaultGraph';
    };
    return DefaultGraph;
}(Graph));
exports.defaultGraph = new DefaultGraph();
var Quad = /** @class */ (function (_super) {
    __extends(Quad, _super);
    /**
     * Creates the quad
     * @param subject - the subject of the quad
     * @param predicate
     * @param object
     */
    function Quad(subject, predicate, object, _graph, implicit, alteration, emitEvents) {
        if (_graph === void 0) { _graph = exports.defaultGraph; }
        if (implicit === void 0) { implicit = false; }
        if (alteration === void 0) { alteration = false; }
        if (emitEvents === void 0) { emitEvents = true; }
        var _this = _super.call(this) || this;
        _this.subject = subject;
        _this.predicate = predicate;
        _this.object = object;
        _this._graph = _graph;
        _this.implicit = implicit;
        _this.setup(alteration, emitEvents);
        return _this;
    }
    Object.defineProperty(Quad.prototype, "graph", {
        get: function () {
            return this._graph;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Quad.prototype, "isRemoved", {
        /**
         * Returns true if this quad still exists as an object in memory, but is no longer actively used in the graph
         */
        get: function () {
            return this._removed;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @internal
     * Returns true if events of newly created quads or removed quads are currently batched and waiting to be emitted
     */
    Quad.hasBatchedEvents = function () {
        return this.createdQuads.size > 0 || this.removedQuads.size > 0;
    };
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
    Quad.emitBatchedEvents = function () {
        var _this = this;
        if (this.createdQuads.size > 0 && this.removedQuads.size > 0) {
            //if both created and removed quads are batched then we remove the quad from both sets
            this.createdQuads.forEach(function (quad) {
                if (_this.removedQuads.has(quad)) {
                    _this.createdQuads.delete(quad);
                    _this.removedQuads.delete(quad);
                }
            });
        }
        if (this.createdQuads.size > 0) {
            this.emitter.emit(Quad.QUADS_CREATED, this.createdQuads);
            this.createdQuads = new QuadSet_js_1.QuadSet();
        }
        if (this.removedQuads.size > 0) {
            this.emitter.emit(Quad.QUADS_REMOVED, this.removedQuads);
            this.removedQuads = new QuadSet_js_1.QuadSet();
        }
        if (this.createdQuadsAltered.size > 0 ||
            this.removedQuadsAltered.size > 0) {
            this.emitter.emit(Quad.QUADS_ALTERED, this.createdQuadsAltered, this.removedQuadsAltered);
            this.createdQuadsAltered = new QuadSet_js_1.QuadSet();
            this.removedQuadsAltered = new QuadSet_js_1.QuadSet();
        }
    };
    /**
     * Get the existing quad for the given subject,predicate and object, or create it if it didn't exists yet.
     * @param subject
     * @param predicate
     * @param object
     * @param implicit
     * @param alteration - states whether this quad has been created by a user interaction (true) or simply because of updated data has been loaded
     */
    Quad.getOrCreate = function (subject, predicate, object, graph, implicit, alteration, emitEvents) {
        if (graph === void 0) { graph = exports.defaultGraph; }
        if (implicit === void 0) { implicit = false; }
        if (alteration === void 0) { alteration = false; }
        if (emitEvents === void 0) { emitEvents = true; }
        return (this.get(subject, predicate, object, graph) ||
            new Quad(subject, predicate, object, graph, implicit, alteration, emitEvents));
    };
    /**
     * Gets the existing quad for the given subject,predicate and object.
     * Will return any quad with an equivalent object. See Literal.isEquivalentTo() and NamedNode.isEquivalentTo() for more information.
     * @param subject
     * @param predicate
     * @param object
     */
    Quad.get = function (subject, predicate, object, graph) {
        if (!subject || !predicate || !object)
            return null;
        return subject.getQuads(predicate, object).find(function (q) { return q._graph === graph; });
    };
    Quad.moveQuadsToGraph = function (quads, graph, alteration) {
        if (alteration === void 0) { alteration = false; }
        var result = new (Object.getPrototypeOf(quads).constructor)();
        quads.forEach(function (quad) {
            result.push(quad.moveToGraph(graph, alteration));
        });
        return result;
    };
    /**
     * Removes this quad and creates a new quad with the same subject,predicate,object, but a new graph.
     * Returns the new quad
     * @param newGraph
     */
    Quad.prototype.moveToGraph = function (newGraph, alteration) {
        if (alteration === void 0) { alteration = true; }
        if (newGraph === this._graph) {
            return this;
        }
        var newQuad = Quad.getOrCreate(this.subject, this.predicate, this.object, newGraph, this.implicit, alteration);
        this.remove(alteration);
        return newQuad;
    };
    /**
     * Turns off a quad. Meaning it will no longer be active in the graph.
     * Comes in handy in very specific use cases when for example quads have already been created, but you want to check what the state was before these quads were created
     */
    Quad.prototype.turnOff = function () {
        this.subject.unregisterProperty(this, false, false);
        this.predicate.unregisterAsPredicate(this, false, false);
        this.object.unregisterInverseProperty(this, false, false);
        this.graph.unregisterQuad(this, false, false);
    };
    /**
     * Turns on a quad. Meaning it will be active (again) in the graph.
     * Only use this if you've had to turn quads off first.
     */
    Quad.prototype.turnOn = function () {
        this.subject.registerProperty(this, false, false);
        this.predicate.registerAsPredicate(this, false, false);
        this.object.registerInverseProperty(this, false, false);
        this.graph.registerQuad(this, false, false);
    };
    /**
     * Turn an implicit quad into an explicit quad (because an explicit user action generated it as an independent explicit fact now)
     */
    Quad.prototype.makeExplicit = function () {
        if (this.implicit) {
            //unregister and make explicit
            this.turnOff();
            this.implicit = false;
            //re-register and make it an 'alteration' so it will be picked up by the storage
            this.setup(true);
        }
    };
    /**
     * Remove this quad from the graph
     * Will be removed both locally and from the graph database
     * @param alteration
     */
    Quad.prototype.remove = function (alteration, emitEvents) {
        if (alteration === void 0) { alteration = false; }
        if (emitEvents === void 0) { emitEvents = true; }
        if (this._removed)
            return;
        //first set removed is true so event handlers can detect the difference between added or removed values
        this._removed = true;
        this.subject.unregisterProperty(this);
        this.predicate.unregisterAsPredicate(this);
        this.object.unregisterInverseProperty(this);
        this.graph.unregisterQuad(this, alteration);
        if (emitEvents) {
            Quad.emitRemovedQuad(this, alteration);
        }
        Quad.globalNumQuads--;
    };
    Quad.emitRemovedQuad = function (quad, alteration) {
        if (alteration === void 0) { alteration = false; }
        //removed quad events are batched together and emitted on the next tick
        //so here we make sure the Quad class will emit its batched events on the next tick
        EventBatcher_js_1.eventBatcher.register(Quad);
        //and here we save this quad to a set of removedQuads which is a static property of the Quad class
        Quad.removedQuads.add(quad);
        if (alteration && !quad.implicit) {
            Quad.removedQuadsAltered.add(quad);
        }
        //we need to let this quad emit this event straight away because for example the reasoner needs to listen to this exact quad to retract
        quad.emit(Quad.QUAD_REMOVED);
    };
    /**
     * Cancel the removal of a quad
     */
    Quad.prototype.undoRemoval = function () {
        this.setup();
        this._removed = false;
    };
    Quad.prototype.onValueChanged = function (oldValue) {
        var oldQuad = new Quad(this.subject, this.predicate, oldValue, this.graph, this.implicit, false, false);
        this.mimicEventsOnUpdate(oldQuad);
    };
    Quad.prototype.print = function () {
        return (Prefix_js_1.Prefix.toPrefixedIfPossible(this.subject.uri) +
            ' ' +
            Prefix_js_1.Prefix.toPrefixedIfPossible(this.predicate.uri) +
            ' ' +
            (this.object instanceof NamedNode
                ? Prefix_js_1.Prefix.toPrefixedIfPossible(this.object.uri)
                : this.object.toString()));
    };
    /**
     * Print this quad as a string
     */
    Quad.prototype.toString = function () {
        return (this.subject.toString() +
            ' ' +
            this.predicate.toString() +
            ' ' +
            this.object.toString() +
            ' ' +
            this.graph.toString() +
            (this.isRemoved ? ' (removed)' : ''));
    };
    Quad.prototype.setup = function (alteration, emitEvents) {
        // if(this.predicate.uri == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && this.object['uri'] == "http://data.dacore.org/ontologies/core/Editor")
        // {
        // 	debugger;
        // }
        if (alteration === void 0) { alteration = false; }
        if (emitEvents === void 0) { emitEvents = true; }
        //let nodes take note of this quad in which they occur
        //first, we overwrite the property this.object with the result of register because a Literal may return a clone
        this.object = this.object.registerInverseProperty(this, alteration);
        this.subject.registerProperty(this, alteration);
        this.predicate.registerAsPredicate(this, alteration);
        this._graph.registerQuad(this, alteration);
        if (emitEvents) {
            Quad.emitCreatedQuad(this, alteration);
        }
        Quad.globalNumQuads++;
    };
    Quad.emitCreatedQuad = function (quad, alteration) {
        if (alteration === void 0) { alteration = false; }
        //new quad events are batched together and emitted on the next tick
        //so here we make sure the Quad class will emit its batched events on the next tick
        EventBatcher_js_1.eventBatcher.register(Quad);
        //and here we save this quad to a set of newQuads which is a static property of the Quad class
        Quad.createdQuads.add(quad);
        //only if it's an alteration AND it's relevant to storage controllers do we emit the QUADS_ALTERED event for this quad
        if (alteration && !quad.implicit) {
            Quad.createdQuadsAltered.add(quad);
        }
    };
    Quad.prototype.mimicEventsOnUpdate = function (oldQuad) {
        //manually mimic the fact the old quad was removed and the new quad was added (storage requires this to add/remove those quads to/from the right quad stores)
        EventBatcher_js_1.eventBatcher.register(Quad);
        Quad.removedQuads.add(oldQuad);
        Quad.removedQuadsAltered.add(oldQuad);
        Quad.createdQuads.add(this);
        Quad.createdQuadsAltered.add(this);
    };
    /**
     * Emitter used by the class itself by static methods emitting events.
     * Anyone wanting to listen to that should therefore add a listener with Quad.emitter.on(...)
     * @internal
     */
    Quad.emitter = new EventEmitter_js_1.EventEmitter();
    /**
     * The number of quads active in this system
     */
    Quad.globalNumQuads = 0;
    /**
     * @internal
     * emitted when new quads have been created
     * TODO: possibly we can remove this, it may never be used. Only alterations are of interest?
     */
    Quad.QUADS_CREATED = 'QUADS_CREATED';
    /**
     * @internal
     * emitted by the Quad class itself when quads have been removed
     * TODO: possibly we can remove this, it may never be used. Only alterations are of interest?
     */
    Quad.QUADS_REMOVED = 'QUADS_REMOVED';
    /**
     * emitted by a quad when that quad is being removed
     * TODO: possibly we can remove this, it may never be used. Only alterations are of interest?
     */
    Quad.QUAD_REMOVED = 'QUAD_REMOVED';
    /**
     * emitted when quads have been altered by user interaction
     * @internal
     */
    Quad.QUADS_ALTERED = 'QUADS_ALTERED';
    //TODO: possibly we can remove these first two, they may never be used. Only alterations are of interest?
    Quad.createdQuads = new QuadSet_js_1.QuadSet();
    Quad.removedQuads = new QuadSet_js_1.QuadSet();
    Quad.removedQuadsAltered = new QuadSet_js_1.QuadSet();
    Quad.createdQuadsAltered = new QuadSet_js_1.QuadSet();
    return Quad;
}(EventEmitter_js_1.EventEmitter));
exports.Quad = Quad;
//for debugging purposes
var getNode = function (uri) {
    return NamedNode.getOrCreate(uri);
};
if (typeof window !== 'undefined') {
    window['getNode'] = getNode;
}
else if (typeof global !== 'undefined') {
    global['getNode'] = getNode;
}
//# sourceMappingURL=models.js.map