"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageHelper = exports.Shape = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var next_tick_1 = __importDefault(require("next-tick"));
var models_js_1 = require("../models.js");
var rdf_js_1 = require("../ontologies/rdf.js");
var NodeValuesSet_js_1 = require("../collections/NodeValuesSet.js");
var rdfs_js_1 = require("../ontologies/rdfs.js");
var NodeSet_js_1 = require("../collections/NodeSet.js");
var Find_js_1 = require("../utils/Find.js");
var ShapeSet_js_1 = require("../collections/ShapeSet.js");
var CoreSet_js_1 = require("../collections/CoreSet.js");
var ShapeValuesSet_js_1 = require("../collections/ShapeValuesSet.js");
var ShapeClass_js_1 = require("../utils/ShapeClass.js");
var LinkedQuery_js_1 = require("../utils/LinkedQuery.js");
var IStorageController_js_1 = require("../interfaces/IStorageController.js");
var TraceShape_js_1 = require("../utils/TraceShape.js");
/**
 * The base class of all classes that represent a rdfs:Class in the graph.
 *
 * This class helps form a bridge between the graph (RDF) world & the Object-Oriented typescript world.
 * Each Shape class has a static type property pointing to the rdfs:Class that it represents.
 * Each instance of a class that extends this Shape class points to a single node (NamedNode or Literal), that MUST have this rdfs:Class as its rdf:type in the graph.
 *
 * Classes that extend this class can thereby help simplify interactions with nodes that have a certain rdf:type by replacing low level property access (NamedNode.getAll(), getOne() etc) with high level methods that do not require knowledge of the underlying graph structure.
 *
 * @example
 * An Example:
 * ```tsx
 * @linkedShape
 * class Person extends Shape {
 *  static type = foaf.Person
 *  get friends() {
 *    return this.getAll(foaf.hasFriend)
 *  }
 * }
 *
 * let personNode = NamedNode.getOrCreate();
 * personNode.set(rdf.type,foaf.Person);
 *
 * //creates an instance of the class Person, which points to (represents) personResource.
 * let person = new Person(personNode);
 *
 * //will log all the friends of the personResource (currently none)
 * console.log(person.friends);
 * ```
 */
var Shape = /** @class */ (function () {
    /**
     * Creates a new instance of this class.
     * If no node is given, a new NamedNode will be generated and it's rdf:type will be set.
     * Only use this constructor directly if you want to create a new node as well.
     * If you want to create an instance of an existing node, use `node.getAs(Class)` or `Class.getOf(node)`
     * @param node
     */
    function Shape(node) {
        this.setupNode(node);
    }
    Object.defineProperty(Shape.prototype, "node", {
        /**
         * Returns the node this instance represents.
         *
         * Since each node in RDF can have multiple types, each node can have multiple instances (multiple representations of itself reflecting the different things it 'is')
         * But each instance always only represents a single node
         */
        get: function () {
            //Instances of rdfs:Literal overwrite this method to return literalResource instead
            return this._node;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Shape.prototype, "nodeShape", {
        /**
         * returns the rdf:Class that this type of instance represents.
         */
        get: function () {
            return this.constructor.shape;
            // if (this.constructor['targetClass'])
            // {
            //   return this.constructor['targetClass'];
            // }
            // throw new Error('The constructor of this instance has not defined a static targetClass.');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Shape.prototype, "namedNode", {
        /**
         * Returns the NamedNode that this instance represents.
         *
         * Since each node in RDF can have multiple types, each node can have multiple instances (multiple representations of itself reflecting the different things it 'is')
         * But each instance always only represents a single node
         *
         * NOTE: the node of an instance is NOT GUARANTEED to be a NamedNode. There are also instance of Literals.
         * Therefore only use this method if you are certain that the instance you have represents a NamedNode.
         * In that case this method - which works exactly the same as `.node` - simply tells the compiler that the return node is certainly a NamedNode.
         */
        get: function () {
            //Instances of rdfs:Literal will return null so we can just return the node as is here, and use this method for type casting
            return this._node;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Shape.prototype, "value", {
        get: function () {
            return this._node.value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Shape.prototype, "uri", {
        get: function () {
            return this._node.value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Shape.prototype, "label", {
        //TODO: move to rdfs:Resource or owl:Thing shape? (and decide which one of those we want to promote)
        get: function () {
            return this.getValue(rdfs_js_1.rdfs.label);
        },
        set: function (val) {
            this.overwrite(rdfs_js_1.rdfs.label, new models_js_1.Literal(val));
        },
        enumerable: false,
        configurable: true
    });
    Shape.create = function (data, uri) {
        var x = uri ? this.getFromURI(uri) : new this();
        for (var k in data) {
            var key = k;
            x[key] = data[key];
        }
        return x;
    };
    /**
     * @internal
     * @param shapeClass
     * @param type
     */
    Shape.registerByType = function (shapeClass, type) {
        if (!type) {
            if (shapeClass === Shape) {
                return;
            }
            //TODO: add support for sh:targetNode, sh:targetObjectsOf and sh:targetSubjectsOf. Those would be fine as alternatives to targetClass (and the latter 2 define a PropertyShape)
            //warn developers against a common mistake: if no static shape is set by the Component it will inherit the one of the class it extends
            if (!shapeClass.hasOwnProperty('targetClass')) {
                console.warn("Shape ".concat(shapeClass.name, " is not linked to a targetClass. Please define 'static targetClass:NamedNode'"));
                return;
            }
            type = shapeClass.targetClass;
        }
        //save in a map for finding the Shape back based on the type
        if (!this.typesToShapes.has(type)) {
            this.typesToShapes.set(type, new CoreSet_js_1.CoreSet());
        }
        this.typesToShapes.get(type).add(shapeClass);
    };
    /**
     * Get a the matching shape classes that have a targetClass equal to the given type node
     * @internal
     * @param type
     * @param allowSuperClass
     */
    Shape.getClassesForType = function (type, allowSuperClass) {
        var _this = this;
        if (allowSuperClass === void 0) { allowSuperClass = false; }
        var instanceClasses = this.typesToShapes.get(type);
        if (allowSuperClass) {
            var subClasses = type.getDeep(rdfs_js_1.rdfs.subClassOf);
            // subClasses = Order.typesByDepth(subClasses);
            subClasses.delete(type); //<-- only delete after ordering, as it will be a new set and not the original PropertySet
            subClasses.forEach(function (subViewType) {
                if (_this.typesToShapes.has(subViewType)) {
                    instanceClasses = instanceClasses.concat(_this.typesToShapes.get(subViewType));
                }
            });
        }
        return instanceClasses;
    };
    Shape.isValidNode = function (node) {
        this.ensureLinkedShape();
        return this.shape.validateNode(node);
    };
    Shape.query = function (queryFn) {
        var query = new LinkedQuery_js_1.LinkedQuery(this, queryFn);
        return query;
    };
    //Shape.select(selectFn:(p:QueryShape)=>QueryValue[])
    Shape.select = function (
    // this: typeof Shape,
    selectFn) {
        var query = new LinkedQuery_js_1.LinkedQuery(this, selectFn);
        var p = new Promise(function (resolve, reject) {
            (0, next_tick_1.default)(function () {
                StorageHelper.query(query)
                    .then(function (result) {
                    resolve(result);
                })
                    .catch(function (err) {
                    reject(err);
                });
            });
        });
        return query.patchResultPromise(p);
        // return StorageHelper.query<ResultType>(query);
    };
    Shape.mapPropertyShapes = function (mapFunction) {
        var dummyNode = new TraceShape_js_1.TestNode();
        var dummyShape = new this(dummyNode);
        //store the proxy on the shape, so we can access it later
        dummyShape.proxy = new Proxy(dummyShape, {
            get: function (target, key, receiver) {
                //if the key is a string
                if (typeof key === 'string') {
                    //if this is a get method that is implemented by the QueryShape, then use that
                    if (key in dummyShape) {
                        //if it's a function, then bind it to the queryShape and return it so it can be called
                        if (typeof dummyShape[key] === 'function') {
                            return target[key].bind(target);
                        }
                        //if not, then a method/accessor of the original shape was called
                        //then check if we have indexed any property shapes with that name for this shapes NodeShape
                        var propertyShape = (0, ShapeClass_js_1.getPropertyShapeByLabel)(dummyShape.constructor, key.toString());
                        if (propertyShape) {
                            //this method does not allow any further chaining, so we return the value of the property
                            return propertyShape;
                        }
                        //otherwise return the value of the property on the original shape
                        throw new Error("".concat(this.name, ".").concat(key.toString(), " is missing a @linkedProperty decorator. This method can only access decorated get/set methods."));
                    }
                }
            },
        });
        //call the provided method with the proxy. When the method requests get/set methods, it will get the property shapes instead
        return mapFunction(dummyShape.proxy);
    };
    Shape.isInstanceOfTargetClass = function (node) {
        return node.has(rdf_js_1.rdf.type, this.targetClass);
    };
    Shape.getInstanceByType = function (node) {
        var shapes = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            shapes[_i - 1] = arguments[_i];
        }
        var matchingShape = shapes.find(function (shape) {
            return node.has(rdf_js_1.rdf.type, shape.targetClass);
        });
        if (matchingShape) {
            return matchingShape.getOf(node);
        }
    };
    /**
     * Searches instances with the given properties only from the local graph
     * @param properties
     * @param sanitized
     */
    Shape.searchLocal = function (properties, sanitized) {
        var e_1, _a;
        if (sanitized === void 0) { sanitized = false; }
        var quads = Find_js_1.Find.byPropertyValues(properties, this.targetClass, true, true, sanitized);
        var set = new ShapeSet_js_1.ShapeSet();
        try {
            for (var _b = __values(quads.getSubjects()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var node = _c.value;
                set.add(new this(node));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return set;
    };
    /**
     * Searches instances with given properties
     * And if results are returned, it returns an instance of the first result, else null
     * @param properties
     */
    Shape.findLocal = function (properties, sanitized) {
        if (sanitized === void 0) { sanitized = false; }
        var results = this.searchLocal(properties, sanitized);
        if (results.size > 0) {
            return results.first();
        }
    };
    Shape.getLocalInstances = function (explicitInstancesOnly) {
        if (explicitInstancesOnly === void 0) { explicitInstancesOnly = false; }
        //'this' is listed as a parameter ti be able to return a set of instances with the type of the actual class that extends Shape
        // https://www.typescriptlang.org/docs/handbook/generics.html#using-class-types-in-generics
        // https://stackoverflow.com/questions/34098023/typescript-self-referencing-return-type-for-static-methods-in-inheriting-classe?rq=1
        return this.getSetOf(this.getLocalInstanceNodes());
    };
    //TODO: to find Shape instances we need to not just check type, but all the constraints of this shape class
    Shape.getNumLocalInstances = function () {
        return this.getLocalInstanceNodes().size;
    };
    Shape.getLocalInstanceNodes = function (explicitInstancesOnly) {
        if (explicitInstancesOnly === void 0) { explicitInstancesOnly = false; }
        var instanceNodes = new NodeSet_js_1.NodeSet();
        //by default, look for instances of this shape class and all classes that extend it
        var targetClasses = [this].concat((0, ShapeClass_js_1.getSubShapesClasses)(this));
        targetClasses.forEach(function (shapeClass) {
            if (!shapeClass.targetClass) {
                console.warn('Shape class ' +
                    shapeClass.name +
                    ' does not have a targetClass. Please define a static targetClass:NamedNode');
                return;
            }
            var potentialInstances = new NodeSet_js_1.NodeSet();
            if (explicitInstancesOnly) {
                potentialInstances = shapeClass.targetClass
                    .getInverseQuads(rdf_js_1.rdf.type)
                    .filter(function (quad) { return !quad.implicit; })
                    .getSubjects();
            }
            else {
                potentialInstances = shapeClass.targetClass.getAllInverse(rdf_js_1.rdf.type);
            }
            //return only those instance nodes that are actual valid instances of this shape
            instanceNodes = instanceNodes.concat(potentialInstances.filter(function (node) { return shapeClass.isValidNode(node); }));
        });
        return instanceNodes;
    };
    /**
     * use new Shape(node) instead, where Shape can be any class that extends Shape
     * @deprecated
     * @param node
     */
    Shape.getOf = function (node) {
        return new this(node);
    };
    /**
     * Retrieves an existing node or creates a new (temporary) node and then sets the right rdf:type
     * Then uses that node to return an instance of the Shape that you call this method from
     * So it works just like NamedNode.getOrCreate() but creates an instance of the right shape straight away.
     * Note that if the URI did not yet exist, it creates a temporary node, and hence only once you SAVE that node or shape
     * Will it (and its properties) be stored in permanent storage.
     *
     * @param uri
     * @param isTemporaryNodeIfNew
     */
    Shape.getFromURI = function (uri, isTemporaryNodeIfNew) {
        if (isTemporaryNodeIfNew === void 0) { isTemporaryNodeIfNew = true; }
        var node = models_js_1.NamedNode.getNamedNode(uri);
        if (node) {
            return new this(node);
        }
        else {
            node = models_js_1.NamedNode.getOrCreate(uri, isTemporaryNodeIfNew);
            if (this.targetClass) {
                node.set(rdf_js_1.rdf.type, this.targetClass);
            }
            return new this(node);
        }
        return new this(models_js_1.NamedNode.getOrCreate(uri));
    };
    /**
     * Generates a URI from the given prefixURI + optional unique parameters
     * Then returns an instance of this shape with that URI, either from an existing or new node
     * This method is intended to be extended by other shapes.
     * The base implementation in Shape.ts will generate a unique URI if no uniqueParams are given, so extending methods may use super.getFromParams() when no params are given
     * @param prefixURI
     * @param uniqueParams
     */
    Shape.getFromParams = function (prefixURI) {
        var uniqueParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            uniqueParams[_i - 1] = arguments[_i];
        }
        var postfix;
        if (uniqueParams.length) {
            postfix = uniqueParams.join('/');
        }
        else {
            //here we expect that we'll create a new node, so the counter will be increased when we actually create it
            postfix = models_js_1.NamedNode.getCounter() + 1;
        }
        var uri = prefixURI + this.name + '/' + postfix;
        return this.getFromURI(uri);
    };
    Shape.getSetOf = function (nodes, allowSubShapes) {
        var _this = this;
        if (allowSubShapes === void 0) { allowSubShapes = false; }
        if (!nodes) {
            throw new Error('No nodes provided to create shape instances of');
        }
        if (nodes instanceof NodeValuesSet_js_1.NodeValuesSet && nodes.subject instanceof models_js_1.NamedNode) {
            return new ShapeValuesSet_js_1.ShapeValuesSet(nodes.subject, nodes.property, this, allowSubShapes);
        }
        return new ShapeSet_js_1.ShapeSet(nodes.map(function (node) {
            return allowSubShapes
                ? (0, ShapeClass_js_1.getShapeOrSubShape)(node, _this)
                : new _this(node);
        }));
    };
    Shape.ensureLinkedShape = function () {
        if (!this.shape) {
            console.warn(this.name +
                ' is not a linked shape. Did you forget to use the @linkedShape decorator?');
        }
    };
    /**
     * Get all values of a certain property as instances of a certain shape.
     * The returned set of shape will automatically update when the property values change in the graph.
     * @param property
     * @param shapeClass
     */
    Shape.prototype.getAllAs = function (property, shapeClass, allowSubShapes) {
        if (allowSubShapes === void 0) { allowSubShapes = false; }
        return new ShapeValuesSet_js_1.ShapeValuesSet(this.namedNode, property, shapeClass, allowSubShapes);
    };
    /**
     * If a value exists for the given property, this returns that value as an instance of the given shape
     * If not, returns null
     * @param property
     * @param shape
     */
    Shape.prototype.getOneAs = function (property, shape, allowSubShapes) {
        if (allowSubShapes === void 0) { allowSubShapes = false; }
        if (this.hasProperty(property)) {
            var value = this.getOne(property);
            if (allowSubShapes) {
                shape = (0, ShapeClass_js_1.getMostSpecificShapes)(value, shape)[0];
            }
            return new shape(value);
        }
        // return this.hasProperty(property) ? new (shape as any)(this.getOne(property)) as S : null;
    };
    Shape.prototype.equals = function (other, checkShapeType) {
        if (checkShapeType === void 0) { checkShapeType = false; }
        return (other instanceof Shape &&
            other.node === this.node &&
            (!checkShapeType ||
                Object.getPrototypeOf(other) === Object.getPrototypeOf(this)));
    };
    /**
     * Makes sure that the node that this instance represents has the right rdf.type
     * Also makes sure that this instance is destructed if the node is removed
     * @internal
     * @param node
     */
    Shape.prototype.setupNode = function (node) {
        if (node) {
            if (!(node instanceof models_js_1.Node)) {
                console.error('Invalid argument to constructor of shape:', node);
                throw new Error('Invalid argument provided to constructor of shape. Please provide an instance of a node.');
            }
            this._node = node;
        }
        else {
            //this code gets triggered when you call new SomeShapeClass() without providing a node
            //some classes prefer a certain term type. E.g. RdfsLiteral will create a Literal node, and NodeShape will create a BlankNode
            //TODO: also look at inheritance chain, so that a class without preferredNodeKind that extends a class with preferredTermType still gets that inherited termType
            var termType = this.constructor['nodeKind'] ||
                this.constructor['preferredNodeKind'] ||
                models_js_1.NamedNode;
            //create a new temporary node, a Literal, NamedNode or BlankNode
            this._node = termType.create(true);
            var nodeShape = this.nodeShape;
            if (nodeShape && nodeShape.targetClass) {
                this._node.set(rdf_js_1.rdf.type, nodeShape.targetClass);
            }
        }
        //@TODO: do this for RdfsLiteral as well if they implement events at some point?
        if (this._node instanceof models_js_1.NamedNode) {
            this._node.on(models_js_1.NamedNode.NODE_REMOVED, this.destruct.bind(this));
        }
    };
    /**
     * Destructs the instance. Removes event listeners etc. Overwrite in each subclass of this class that uses custom event listeners
     */
    Shape.prototype.destruct = function () {
        if (this._node instanceof models_js_1.NamedNode) {
            this._node.removeAllListeners();
        }
    };
    Shape.prototype.validate = function () {
        var _a;
        return ((_a = this.nodeShape) === null || _a === void 0 ? void 0 : _a.validateNode(this.node)) || false;
    };
    Shape.prototype.getOne = function (property) {
        return this._node.getOne(property);
    };
    Shape.prototype.getAll = function (property) {
        return this._node.getAll(property);
    };
    Shape.prototype.getAllExplicit = function (property) {
        return this._node.getAllExplicit(property);
    };
    Shape.prototype.getOneFromPath = function () {
        var _a;
        var properties = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            properties[_i] = arguments[_i];
        }
        return (_a = this.node).getOneFromPath.apply(_a, __spreadArray([], __read(properties), false));
    };
    Shape.prototype.getAllFromPath = function () {
        var _a;
        var properties = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            properties[_i] = arguments[_i];
        }
        return (_a = this.node).getAllFromPath.apply(_a, __spreadArray([], __read(properties), false));
    };
    Shape.prototype.getOneInverse = function (property) {
        return this._node.getOneInverse(property);
    };
    Shape.prototype.getAllInverse = function (property) {
        return this._node.getAllInverse(property);
    };
    Shape.prototype.set = function (property, value) {
        return this._node.set(property, value);
    };
    Shape.prototype.setValue = function (property, value) {
        return this._node.setValue(property, value);
    };
    Shape.prototype.mset = function (property, values) {
        return this._node.mset(property, values);
    };
    Shape.prototype.overwrite = function (property, value) {
        return this._node.overwrite(property, value);
    };
    Shape.prototype.moverwrite = function (property, values) {
        return this._node.moverwrite(property, values);
    };
    Shape.prototype.remove = function () {
        return this.namedNode.remove();
    };
    Shape.prototype.save = function () {
        return this.namedNode.save();
    };
    Shape.prototype.unset = function (property, value) {
        return this._node.unset(property, value);
    };
    Shape.prototype.unsetAll = function (property) {
        return this._node.unsetAll(property);
    };
    Shape.prototype.has = function (property, value) {
        return this._node.has(property, value);
    };
    Shape.prototype.hasValue = function (property, value) {
        return this._node.hasValue(property, value);
    };
    Shape.prototype.hasExplicit = function (property, value) {
        return this._node.hasExplicit(property, value);
    };
    Shape.prototype.hasPath = function (properties) {
        return this._node.hasPath(properties);
    };
    Shape.prototype.hasPathTo = function (properties, endPoint) {
        return this._node.hasPathTo(properties, endPoint);
    };
    Shape.prototype.hasPathToSomeInSet = function (properties, endPoints) {
        return this._node.hasPathToSomeInSet(properties, endPoints);
    };
    /**
     * Checks if the node has a value for this property that is the exact same object as the given value
     * (as opposed to has() which also returns true for equivalent literal values in Literal objects)
     * @param property
     * @param value
     * @returns {boolean}
     */
    Shape.prototype.hasExact = function (property, value) {
        if (value === void 0) { value = null; }
        return this._node.hasExact(property, value);
    };
    Shape.prototype.hasProperty = function (property) {
        return this._node.hasProperty(property);
    };
    Shape.prototype.hasInverse = function (property, value) {
        if (value === void 0) { value = null; }
        return this._node.hasInverse(property, value);
    };
    Shape.prototype.hasInverseProperty = function (property) {
        return this._node.hasInverseProperty(property);
    };
    Shape.prototype.getValue = function (property, language) {
        if (language === void 0) { language = ''; }
        return this._node.getValue(property, language);
    };
    Shape.prototype.getProperties = function (includeFromIncomingArcs) {
        if (includeFromIncomingArcs === void 0) { includeFromIncomingArcs = false; }
        return this._node.getProperties(includeFromIncomingArcs);
    };
    Shape.prototype.getInverseProperties = function () {
        return this._node.getInverseProperties();
    };
    Shape.prototype.getMultiple = function (properties) {
        return this._node.getMultiple(properties);
    };
    Shape.prototype.getMultipleInverse = function (properties) {
        return this._node.getMultipleInverse(properties);
    };
    Shape.prototype.getDeep = function (property, maxDepth) {
        return this._node.getDeep(property, maxDepth);
    };
    Shape.prototype.getQuads = function (property, value) {
        return this._node.getQuads(property, value);
    };
    Shape.prototype.getInverseQuads = function (property) {
        return this._node.getInverseQuads(property);
    };
    Shape.prototype.getAllInverseQuads = function (includeImplicit) {
        return this._node.getAllInverseQuads(includeImplicit);
    };
    Shape.prototype.getAllQuads = function (includeAsObject, includeImplicit) {
        if (includeAsObject === void 0) { includeAsObject = false; }
        if (includeImplicit === void 0) { includeImplicit = false; }
        return this._node.getAllQuads(includeAsObject, includeImplicit);
    };
    /**
     * Returns all quads related to this shape.
     * Overwrite this method to automatically send over quads to the frontend when this shape is sent over
     * This method is used internally by JSONWriter when sending a shape between environments by converting it to JSON & JSON-LD
     * @param includeImplicit
     */
    Shape.prototype.getDataQuads = function (includeImplicit) {
        if (includeImplicit === void 0) { includeImplicit = false; }
        return this._node.getAllQuads(includeImplicit);
    };
    /**
     * Fires the given call back when ANY property of this node changes.
     * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
     * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
     */
    Shape.prototype.onChangeAny = function (callback, context) {
        var _a;
        (_a = this.namedNode) === null || _a === void 0 ? void 0 : _a.onChangeAny(callback, context);
    };
    /**
     * Fires the given call back when this node become the value or is no longer the value of another node
     * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
     * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
     */
    Shape.prototype.onChangeAnyInverse = function (callback, context) {
        var _a;
        (_a = this.namedNode) === null || _a === void 0 ? void 0 : _a.onChangeAnyInverse(callback, context);
    };
    /**
     * Fires the given call back when this node changes the values of the given property
     * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
     * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
     */
    Shape.prototype.onChange = function (property, callback, context) {
        var _a;
        (_a = this.namedNode) === null || _a === void 0 ? void 0 : _a.onChange(property, callback, context);
    };
    /**
     * Fires the given callback when this node become the value or is no longer the value of the given property of another node
     * Example: if someGroup hasParticipant thisResource, and the group removes this node from its participants, it will trigger onChangeInverse for this node
     * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
     * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
     */
    Shape.prototype.onChangeInverse = function (property, callback, context) {
        var _a;
        (_a = this.namedNode) === null || _a === void 0 ? void 0 : _a.onChangeInverse(property, callback, context);
    };
    /**
     * Call this when you want to stop listening for onChangeAny events. Make sure to provide the exact same BOUND instance of a method to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
     * @param callback the exact same method you supplied to onChangeAny
     * @param context the same context you supplied to onChangeAny
     */
    Shape.prototype.removeOnChangeAny = function (callback, context) {
        var _a;
        (_a = this.namedNode) === null || _a === void 0 ? void 0 : _a.removeOnChangeAny(callback, context);
    };
    /**
     * Call this when you want to stop listening for onChangeAnyInverse events. Make sure to provide the exact same BOUND instance of a method to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
     * @param callback the exact same method you supplied to onChangeAnyInverse
     * @param context the same context you supplied to onChangeAnyInverse
     */
    Shape.prototype.removeOnChangeAnyInverse = function (callback, context) {
        var _a;
        (_a = this.namedNode) === null || _a === void 0 ? void 0 : _a.removeOnChangeAnyInverse(callback, context);
    };
    /**
     * Call this when you want to stop listening for onChange events. Make sure to provide the exact same BOUND instance of a method as callback to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
     * @param callback the exact same method you supplied to onChange
     * @param context the same context you supplied to onChange
     */
    Shape.prototype.removeOnChange = function (property, callback, context) {
        var _a;
        (_a = this.namedNode) === null || _a === void 0 ? void 0 : _a.removeOnChange(property, callback, context);
    };
    /**
     * Call this when you want to stop listening for onChangeInverse events. Make sure to provide the exact same BOUND instance of a method as callback to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
     * @param callback the exact same method you supplied to onChangeInverse
     * @param context the same context you supplied to onChangeInverse
     */
    Shape.prototype.removeOnChangeInverse = function (property, callback, context) {
        var _a;
        (_a = this.namedNode) === null || _a === void 0 ? void 0 : _a.removeOnChangeInverse(property, callback, context);
    };
    /**
     * Call this when you want to stop listening for onChangeAny events. Other then removeOnChangeAny you only have to supply the context.
     * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChangeAny
     * @param context the same context you supplied to onChangeAny
     */
    Shape.prototype.clearOnChangeAny = function (context) {
        var _a;
        (_a = this.namedNode) === null || _a === void 0 ? void 0 : _a.clearOnChangeAny(context);
    };
    /**
     * Call this when you want to stop listening for onChangeAnyInverse events. Other then removeOnChangeAnyInverse you only have to supply the context.
     * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChangeAnyInverse
     * @param context the same context you supplied to onChangeAnyInverse
     */
    Shape.prototype.clearOnChangeAnyInverse = function (context) {
        var _a;
        (_a = this.namedNode) === null || _a === void 0 ? void 0 : _a.clearOnChangeAnyInverse(context);
    };
    /**
     * Call this when you want to stop listening for onChange events. Other then removeOnChange you only have to supply the context.
     * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChange
     * @param context the same context you supplied to onChange
     */
    Shape.prototype.clearOnChange = function (property, context) {
        var _a;
        (_a = this.namedNode) === null || _a === void 0 ? void 0 : _a.clearOnChange(property, context);
    };
    /**
     * Call this when you want to stop listening for onChangeInverse events. Other then removeOnChangeInverse you only have to supply the context.
     * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChangeInverse
     * @param context the same context you supplied to onChangeAny
     */
    Shape.prototype.clearOnChangeInverse = function (property, context) {
        var _a;
        (_a = this.namedNode) === null || _a === void 0 ? void 0 : _a.clearOnChangeInverse(property, context);
    };
    /**
     * Call this when you want to stop listening for onPredicateChange events
     * @param context the same context you supplied to onPredicateChange
     */
    Shape.prototype.clearOnPredicateChange = function (context) {
        var _a;
        (_a = this.namedNode) === null || _a === void 0 ? void 0 : _a.clearOnPredicateChange(context);
    };
    /**
     * Returns true if this instance has the given type as the value of rdf.type
     * Syntactic sugar for this.has(rdf.type,type)
     * @param type
     */
    Shape.prototype.isa = function (type) {
        return this.has(rdf_js_1.rdf.type, type);
    };
    /**
     * Other than NamedNode.promiseLoaded, a Shape will preload whatever data it requires to fulfill the constraints of the shape
     * NOTE: loading is handled by the current StorageController, by default there is no StorageController
     * @param {boolean} loadInverseProperties
     * @returns {Promise<boolean>}
     */
    Shape.prototype.promiseLoaded = function (loadInverseProperties) {
        var _this = this;
        if (loadInverseProperties === void 0) { loadInverseProperties = false; }
        if (!this.loadPromise) {
            var promise = this.load(loadInverseProperties);
            this.loadPromise = {
                done: false,
                promise: promise,
            };
            promise.then(function (res) {
                _this.loadPromise.done = true;
                return res;
            });
        }
        return this.loadPromise.promise;
    };
    /**
     * Returns true if this instance has had its promiseLoaded function called and the loading has completed
     * NOTE: will return false if the instance has never loaded, regardless of whether the namedNode it represents is already loaded, and even if this instance would not load anything else
     */
    Shape.prototype.isLoaded = function (includingInverseProperties) {
        if (includingInverseProperties === void 0) { includingInverseProperties = false; }
        return this.node instanceof models_js_1.NamedNode
            ? this.namedNode.isLoaded(includingInverseProperties)
            : true;
    };
    Shape.prototype.reload = function () {
        this.loadPromise = null;
        return this.promiseLoaded();
    };
    Shape.prototype.load = function (loadInverseProperties) {
        if (loadInverseProperties === void 0) { loadInverseProperties = false; }
        if (!this.namedNode)
            return Promise.resolve(true);
        //load the node itself
        return this.namedNode.promiseLoaded(loadInverseProperties).then(function () {
            //make sure the reasoner has run on the loaded properties
            // return Reasoning.promiseComplete();
            return null;
        });
    };
    Shape.prototype.toString = function () {
        return '[' + this.node + ' as ' + this.constructor.name + ']';
    };
    Shape.prototype.print = function (includeIncomingProperties) {
        if (includeIncomingProperties === void 0) { includeIncomingProperties = true; }
        // return Debug.print(this.node,includeIncomingProperties);
        return "".concat(this.constructor.name, " of ").concat(this.node.print());
        // typeof (typeof window !== 'undefined' ? window['dprint'] : global.dprint)(this, includeIncomingProperties);
    };
    /**
     * Returns a new cloned instance with the exact same quads
     * The instance only exists locally (as it's not yet saved)
     * @returns {T}
     */
    Shape.prototype.clone = function () {
        var prototype = Object.getPrototypeOf(this);
        return new prototype(this.node.clone());
    };
    /**
     * Points to the rdfs:Class that this typescript class represents. Each class extending Shape MUST define this explicitly.
     The appointed NamedNode value must be a rdfs:Class ([value] rdf:type rdfs:Class in the graph)
  
     @example
     An example Shape class that states that all matching nodes must have `rdf:type foaf:Person`.
     ```tsx
     import {foaf} from "./ontologies/foaf";
     @linkedShape
     export class Person extends Shape {
     static targetClass:NamedNode = foaf.Person;
     }
     ```
     */
    Shape.targetClass = null;
    /**
     * Tracks which types (named nodes) map to which Shapes
     * @internal
     */
    Shape.typesToShapes = new Map();
    Shape.instancesLoaded = new Map();
    return Shape;
}());
exports.Shape = Shape;
var StorageHelper = /** @class */ (function () {
    function StorageHelper() {
    }
    StorageHelper.query = function (query) {
        this.checkSetup();
        return this.storageController.query(query);
    };
    StorageHelper.checkSetup = function () {
        if (!this.storageController) {
            throw new Error('LinkedStorage is not configured.');
        }
    };
    StorageHelper = __decorate([
        (0, IStorageController_js_1.staticImplements)() /* this statement implements both normal interface & static interface */
    ], StorageHelper);
    return StorageHelper;
}());
exports.StorageHelper = StorageHelper;
//# sourceMappingURL=Shape.js.map