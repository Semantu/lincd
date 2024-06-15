"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
exports.LinkedStorage = void 0;
var models_js_1 = require("../models.js");
var QuadSet_js_1 = require("../collections/QuadSet.js");
var CoreMap_js_1 = require("../collections/CoreMap.js");
var NodeSet_js_1 = require("../collections/NodeSet.js");
var Shape_js_1 = require("../shapes/Shape.js");
var SHACL_js_1 = require("../shapes/SHACL.js");
var EventBatcher_js_1 = require("../events/EventBatcher.js");
var next_tick_1 = __importDefault(require("next-tick"));
var QuadArray_js_1 = require("../collections/QuadArray.js");
var CoreSet_js_1 = require("../collections/CoreSet.js");
var ShapeSet_js_1 = require("../collections/ShapeSet.js");
var ShapeClass_js_1 = require("./ShapeClass.js");
var LinkedStorage = /** @class */ (function () {
    function LinkedStorage() {
    }
    LinkedStorage.init = function () {
        if (!this._initialized) {
            models_js_1.Quad.emitter.on(models_js_1.Quad.QUADS_ALTERED, this.onEvent.bind(this, models_js_1.Quad.QUADS_ALTERED));
            models_js_1.NamedNode.emitter.on(models_js_1.NamedNode.STORE_NODES, this.onEvent.bind(this, models_js_1.NamedNode.STORE_NODES));
            models_js_1.NamedNode.emitter.on(models_js_1.NamedNode.REMOVE_NODES, this.onEvent.bind(this, models_js_1.NamedNode.REMOVE_NODES));
            models_js_1.NamedNode.emitter.on(models_js_1.NamedNode.CLEARED_PROPERTIES, this.onEvent.bind(this, models_js_1.NamedNode.CLEARED_PROPERTIES));
            Shape_js_1.StorageHelper.storageController = this;
            this._initialized = true;
        }
    };
    /**
     * Returns true if Storage is set up to use any specific store
     * returns false if storage is managed manually, and no call like Storage.setDefaultStore has been made
     */
    LinkedStorage.isInitialised = function () {
        return this.defaultStore && true;
    };
    LinkedStorage.onEvent = function (eventType) {
        //so either a TRIPLES_ALTERED, CLEARED_PROPERTIES, STORE_RESOURCES or REMOVE_RESOURCES event comes in
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        //if we have not stored any events yet
        if (!this.storedEvents) {
            //start storing
            this.storedEvents = {};
            //and if we're not already in an active processing cycle
            //then let's start processing whatever we store in this event cycle on the next tick
            if (!this.processingPromise) {
                this.startProcessingOnNextTick();
            }
        }
        //save the event to be processed later
        if (!this.storedEvents[eventType]) {
            this.storedEvents[eventType] = [];
        }
        this.storedEvents[eventType].push(args);
    };
    LinkedStorage.processStoredEvents = function () {
        return __awaiter(this, void 0, void 0, function () {
            var storedEvents, processOrder, created_1, removed_1, success, _loop_1, processOrder_1, processOrder_1_1, _a, eventType, handler, e_1_1;
            var e_1, _b;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        storedEvents = this.storedEvents;
                        this.storedEvents = null;
                        processOrder = [
                            [models_js_1.NamedNode.REMOVE_NODES, this.onRemoveNodes],
                            [models_js_1.NamedNode.CLEARED_PROPERTIES, this.onClearedProperties],
                            [models_js_1.NamedNode.STORE_NODES, this.onStoreNodes],
                            [models_js_1.Quad.QUADS_ALTERED, this.onQuadsAltered],
                        ];
                        //combine multiple events that want to add/remove quads into 1
                        if (storedEvents[models_js_1.Quad.QUADS_ALTERED] &&
                            storedEvents[models_js_1.Quad.QUADS_ALTERED].length > 1) {
                            created_1 = new QuadSet_js_1.QuadSet();
                            removed_1 = new QuadSet_js_1.QuadSet();
                            storedEvents[models_js_1.Quad.QUADS_ALTERED].forEach(function (_a) {
                                var _b = __read(_a, 2), quadsCreated = _b[0], quadsRemoved = _b[1];
                                quadsCreated.forEach(function (q) { return created_1.add(q); });
                                quadsRemoved.forEach(function (q) { return removed_1.add(q); });
                            });
                            //remove things that have been created & removed during the previous execution cycle
                            removed_1.forEach(function (q) {
                                if (created_1.has(q)) {
                                    removed_1.delete(q);
                                    created_1.delete(q);
                                }
                            });
                            //replace stored events with one stored event that has again 2 args, the combined sets
                            storedEvents[models_js_1.Quad.QUADS_ALTERED] = [[created_1, removed_1]];
                        }
                        //combine the Sets of multiple STORE_NODES/REMOVE_NODES/CLEARED_PROPERTIES events into one Set each
                        // note that since they have slightly different values, this will convert NodeSets of STORE_NODES  to a CoreSet (note a NodeSet)
                        [models_js_1.NamedNode.STORE_NODES, models_js_1.NamedNode.REMOVE_NODES].forEach(function (eventType) {
                            if (storedEvents[eventType] && storedEvents[eventType].length > 1) {
                                var mergedNodes_1 = new CoreSet_js_1.CoreSet();
                                storedEvents[eventType].forEach(function (_a) {
                                    var _b = __read(_a, 1), nodesCreated = _b[0];
                                    nodesCreated.forEach(function (n) { return mergedNodes_1.add(n); });
                                });
                                //replace stored events with one stored event that has again 2 args, the combined sets
                                storedEvents[eventType] = [[mergedNodes_1]];
                            }
                        });
                        success = true;
                        _loop_1 = function (eventType, handler) {
                            var _d;
                            return __generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        if (!storedEvents[eventType]) return [3 /*break*/, 3];
                                        _d = success;
                                        if (!_d) return [3 /*break*/, 2];
                                        return [4 /*yield*/, Promise.all(storedEvents[eventType].map(function (args) {
                                                return handler.apply(_this, args);
                                            }))
                                                .then(function () { return true; })
                                                .catch(function (err) {
                                                console.warn('Error whilst processing ' + eventType, err);
                                                return false;
                                            })];
                                    case 1:
                                        _d = (_e.sent());
                                        _e.label = 2;
                                    case 2:
                                        success = _d;
                                        _e.label = 3;
                                    case 3: return [2 /*return*/];
                                }
                            });
                        };
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 6, 7, 8]);
                        processOrder_1 = __values(processOrder), processOrder_1_1 = processOrder_1.next();
                        _c.label = 2;
                    case 2:
                        if (!!processOrder_1_1.done) return [3 /*break*/, 5];
                        _a = __read(processOrder_1_1.value, 2), eventType = _a[0], handler = _a[1];
                        return [5 /*yield**/, _loop_1(eventType, handler)];
                    case 3:
                        _c.sent();
                        _c.label = 4;
                    case 4:
                        processOrder_1_1 = processOrder_1.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_1_1 = _c.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (processOrder_1_1 && !processOrder_1_1.done && (_b = processOrder_1.return)) _b.call(processOrder_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 8:
                        this.finalizeProcess(success);
                        return [2 /*return*/];
                }
            });
        });
    };
    LinkedStorage.getDefaultStore = function () {
        return this.defaultStore;
    };
    LinkedStorage.setDefaultStore = function (store) {
        this.defaultStore = store;
        this.defaultStore.init();
        var defaultGraph = store.getDefaultGraph();
        if (defaultGraph) {
            this.setDefaultStorageGraph(defaultGraph);
            this.setStoreForGraph(store, defaultGraph);
        }
        else {
            // console.warn('Default store did not return a default graph.');
        }
        this.init();
    };
    LinkedStorage.setDefaultStorageGraph = function (graph) {
        this.defaultStorageGraph = graph;
    };
    LinkedStorage.setGraphForShapes = function (graph) {
        var _this = this;
        var shapeClasses = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            shapeClasses[_i - 1] = arguments[_i];
        }
        shapeClasses.forEach(function (shapeClass) {
            _this.shapesToGraph.set(shapeClass, graph);
            if (shapeClass['shape']) {
                _this.nodeShapesToGraph.set(shapeClass['shape'].namedNode, graph);
            }
        });
        this.init();
    };
    LinkedStorage.setStoreForGraph = function (store, graph) {
        this.graphToStore.set(graph, store);
    };
    LinkedStorage.getGraphForStore = function (store) {
        var e_2, _a;
        try {
            for (var _b = __values(this.graphToStore), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), graph = _d[0], targetStore = _d[1];
                //shapes don't have to be the same instance, but they share the same node
                if (store['node'] === targetStore['node']) {
                    return graph;
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
    };
    LinkedStorage.getStores = function () {
        return new CoreSet_js_1.CoreSet(__spreadArray([], __read(this.graphToStore.values()), false));
    };
    /**
     * Set the target store for instances of these shapes
     * @param store
     * @param shapes
     */
    LinkedStorage.setStoreForShapes = function (store) {
        var shapes = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            shapes[_i - 1] = arguments[_i];
        }
        var graph = store.getDefaultGraph();
        this.setStoreForGraph(store, graph);
        this.setGraphForShapes.apply(this, __spreadArray([graph], __read(shapes), false));
    };
    /**
     *
     * @returns a promise that resolves when all storage events have been processed. For example shapes that are saved() have been stored and received a permanent URI.
     */
    LinkedStorage.promiseUpdated = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.defaultStore) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.defaultStore.init()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: 
                    //we wait till all events are dispatched
                    return [2 /*return*/, EventBatcher_js_1.eventBatcher.promiseDone().then(function () {
                            //if that triggered a storage update
                            if (_this.processingPromise) {
                                //we will wait for that
                                return _this.processingPromise.promise;
                            }
                        })];
                }
            });
        });
    };
    LinkedStorage.getStoreForShapeClass = function (shapeClass) {
        var graph = this.getGraphForShapeClass(shapeClass);
        return this.getStoreForGraph(graph) || this.defaultStore;
    };
    LinkedStorage.getGraphForShapeClass = function (shapeClass) {
        var e_3, _a;
        //currently, the target graph of the very first shape that has a target graph is returned
        if (this.nodeShapesToGraph.has(shapeClass.shape.namedNode)) {
            return this.nodeShapesToGraph.get(shapeClass.shape.namedNode);
        }
        try {
            for (var _b = __values((0, ShapeClass_js_1.getSuperShapesClasses)(shapeClass)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var superShapeClass = _c.value;
                if (this.nodeShapesToGraph.has(superShapeClass.shape.namedNode)) {
                    return this.nodeShapesToGraph.get(superShapeClass.shape.namedNode);
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
        return models_js_1.defaultGraph;
    };
    LinkedStorage.getGraphForNode = function (subject, checkShapes) {
        var e_4, _a;
        if (checkShapes === void 0) { checkShapes = true; }
        if (checkShapes) {
            var subjectShapes = SHACL_js_1.NodeShape.getShapesOf(subject);
            try {
                //see if any of these shapes has a specific target graph
                for (var subjectShapes_1 = __values(subjectShapes), subjectShapes_1_1 = subjectShapes_1.next(); !subjectShapes_1_1.done; subjectShapes_1_1 = subjectShapes_1.next()) {
                    var shape = subjectShapes_1_1.value;
                    if (this.nodeShapesToGraph.has(shape.namedNode)) {
                        //currently, the target graph of the very first shape that has a target graph is returned
                        return this.nodeShapesToGraph.get(shape.namedNode);
                    }
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (subjectShapes_1_1 && !subjectShapes_1_1.done && (_a = subjectShapes_1.return)) _a.call(subjectShapes_1);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }
        //if it's not a temporary node, and we have a default graph for permanent storage, then use that
        if ((!subject.isTemporaryNode ||
            (subject.isTemporaryNode && subject.isStoring)) &&
            this.defaultStorageGraph) {
            return this.defaultStorageGraph;
        }
        //if no shape defined a target graph OR if the node is a temporary node
        //then use the default graph (which is usually not connected to any store, and just lives in local memory)
        //this prevents temporary local nodes from being automatically stored
        return models_js_1.defaultGraph;
    };
    LinkedStorage.getDefaultStorageGraph = function () {
        return this.defaultStorageGraph || models_js_1.defaultGraph;
    };
    LinkedStorage.getStoreForNode = function (node) {
        var graph = this.getGraphForNode(node);
        return this.getStoreForGraph(graph);
    };
    LinkedStorage.getStoreForGraph = function (graph) {
        return this.graphToStore.get(graph);
        // if(this.graphToStore.has(graph))
        // {
        // }
        // return this.defaultStore;
    };
    LinkedStorage.getStoreMapForNodes = function (nodes) {
        return this.getStoreMapForIGraphObjects(nodes);
    };
    LinkedStorage.getStoreMapForShapes = function (shapes) {
        return this.getStoreMapForIGraphObjects(shapes);
    };
    LinkedStorage.setURIs = function (nodeUriMap) {
        return __awaiter(this, void 0, void 0, function () {
            var nodes, storeMap, promises;
            return __generator(this, function (_a) {
                nodes = new NodeSet_js_1.NodeSet();
                nodeUriMap.forEach(function (currentEnvironmentURI, node) {
                    node['tmp'] = node.isTemporaryNode;
                    node.isTemporaryNode = false;
                    nodes.add(node);
                });
                storeMap = this.getStoreMapForNodes(nodes);
                nodes.forEach(function (node) {
                    node.isTemporaryNode = node['tmp'];
                });
                promises = [];
                //let each store update the URI's
                storeMap.forEach(function (nodes, store) {
                    var storeNodeUriMap = new CoreMap_js_1.CoreMap();
                    nodes.forEach(function (node) {
                        storeNodeUriMap.set(node, nodeUriMap.get(node));
                    });
                    promises.push(store.setURIs(storeNodeUriMap));
                });
                //combine the results to return an array of old to new URI's
                return [2 /*return*/, Promise.all(promises).then(function (results) {
                        var combinedResults = [].concat.apply([], __spreadArray([], __read(results), false));
                        return combinedResults;
                    })];
            });
        });
    };
    LinkedStorage.queryRaw = function (query, shapeClass) {
        var quadStore = this.getStoreForShapeClass(shapeClass);
        return quadStore.query(query, shapeClass);
    };
    LinkedStorage.query = function (query) {
        var quadStore = this.getStoreForShapeClass(query.shape);
        var queryObject = query.getQueryObject();
        return quadStore.query(queryObject, query.shape);
    };
    LinkedStorage.update = function (toAdd, toRemove) {
        // let storeMap = this.getStoreMapForNodes(toRemove.getSubjects());
        // storeMap.forEach((nodes, store) => {
        //   let quads = toRemove.filter(q => nodes.includes(q.subject));
        //   store.deleteMultiple(quads);
        //
        // });
        return this.onQuadsAltered(toAdd, toRemove, true, true);
    };
    LinkedStorage.clearProperties = function (subjectToPredicates) {
        var subjects = __spreadArray([], __read(subjectToPredicates.keys()), false);
        var storeMap = this.getStoreMapForNodes(subjects);
        var promises = [];
        storeMap.forEach(function (nodes, store) {
            var map = new CoreMap_js_1.CoreMap(nodes.map(function (node) {
                return [node, subjectToPredicates.get(node)];
            }));
            promises.push(store.clearProperties(map));
        });
        return Promise.all(promises).then(function (results) {
            return results.every(function (result) { return result === true; });
        });
    };
    /**
     * @deprecated
     * @param shapeInstance
     * @param shapeOrRequest
     * @param byPassCache
     */
    LinkedStorage.loadShape = function (shapeInstance, shapeOrRequest, byPassCache) {
        var _this = this;
        if (byPassCache === void 0) { byPassCache = false; }
        //if no shape is requested then we automatically request all properties of the shape
        if (!shapeOrRequest) {
            //TODO: maybe we can optimise requests by not sending all the shapes and letting the backend fill in the property shapes
            shapeOrRequest = __spreadArray([], __read(shapeInstance.nodeShape.getPropertyShapes()), false);
            //also add the property shapes of all classes that extend this shape
            var shapeClass = (0, ShapeClass_js_1.getShapeClass)(shapeInstance.nodeShape.namedNode);
            var superShapes = (0, ShapeClass_js_1.getSuperShapesClasses)(shapeClass);
            superShapes.forEach(function (superShapeClass) {
                shapeOrRequest.push.apply(shapeOrRequest, __spreadArray([], __read(superShapeClass.shape.getPropertyShapes()), false));
            });
        }
        //@TODO: optimise the shapeOrRequest. Currently if the same property is requested twice, but once with more sub properties, then both will be requested.
        // This can be merged into 1 shape request because the longer one automatically loads the shorter one
        var node = shapeInstance.node;
        if (!byPassCache) {
            var cachedResult = this.isLoaded(node, shapeOrRequest);
            if (cachedResult) {
                //return the load promise that's already in progress,
                // or a promise that resolves to true straight away if it's already been loaded
                return cachedResult === true ? Promise.resolve(true) : cachedResult;
            }
        }
        var store = this.getStoreForNode(shapeInstance.namedNode);
        if (store) {
            var promise = store
                .loadShape(shapeInstance, shapeOrRequest)
                .then(function (res) {
                //indicate that these property shapes have finished loading for this node
                _this.setNodeLoaded(node, shapeOrRequest);
                return res;
            });
            //indicate that these property shapes are being loaded for this node
            this.setNodeLoaded(node, shapeOrRequest, promise);
            return promise;
        }
        else {
            //NOTE: if we ever need to know that we could not find a store to load this node from
            //then we could setNodeLoaded to false, and we need to account for the possibility of a false value in other places
            //any place using cached results would need to differentiate between null and false
            this.setNodeLoaded(node, shapeOrRequest);
            return Promise.resolve(null);
        }
    };
    LinkedStorage.loadShapes = function (shapeSet, shapeOrRequest, byPassCache) {
        var _this = this;
        if (byPassCache === void 0) { byPassCache = false; }
        var nodes = shapeSet.getNodes();
        if (!byPassCache) {
            var cachedResult = this.nodesAreLoaded(nodes, shapeOrRequest);
            if (cachedResult) {
                //return the load promise that's already in progress,
                // or a promise that resolves to true straight away if it's already been loaded
                return cachedResult === true ? Promise.resolve(true) : cachedResult;
            }
        }
        var storeMap = this.getStoreMapForShapes(shapeSet);
        var storePromises = [];
        storeMap.map(function (shapes, store) {
            storePromises.push(store.loadShapes(new ShapeSet_js_1.ShapeSet(shapes), shapeOrRequest));
        });
        var loadPromise = Promise.all(storePromises).then(function (results) {
            // return new QuadArray();
            var quads = new QuadArray_js_1.QuadArray();
            results.forEach(function (result) {
                if (result instanceof QuadArray_js_1.QuadArray) {
                    quads.push.apply(quads, __spreadArray([], __read(result), false));
                }
            });
            //update the cache to indicate these property shapes have finished loading for these nodes
            _this.setNodesLoaded(nodes, shapeOrRequest, true);
            return quads;
        });
        //update the cache to indicate these property shapes are being loaded for these nodes
        LinkedStorage.setNodesLoaded(nodes, shapeOrRequest, loadPromise);
        return loadPromise;
    };
    LinkedStorage.nodesAreLoaded = function (nodes, dataRequest) {
        var _this = this;
        //@TODO: reimplement tracking of loaded paths for queries
        return false;
        var stillLoading = [];
        if (!nodes.every(function (node) {
            var cached = _this.isLoaded(node, dataRequest);
            if (!cached) {
                return false;
            }
            if (cached !== true) {
                //then it's a promise, this node is still loading
                stillLoading.push(node);
            }
            return true;
        })) {
            return false;
        }
        return stillLoading ? Promise.all(stillLoading) : true;
    };
    LinkedStorage.isLoaded = function (node, dataRequest) {
        var _this = this;
        //TODO fix loading for queries instead of the old property requests
        return false;
        if (!this.nodeToPropertyRequests.has(node)) {
            return false;
        }
        var propertiesRequested = this.nodeToPropertyRequests.get(node);
        //return true if every top level property request has been loaded for this source
        var stillLoading = [];
        if (!dataRequest.every(function (propertyRequest) {
            var propertyReqResult;
            //for sub requests
            if (Array.isArray(propertyRequest)) {
                //first check that property shape (that is the first entry) is loaded (same as for non-sub requests)
                propertyReqResult = propertiesRequested.get(propertyRequest[0].namedNode);
                //then let check if the subRequest is also loaded for each currently available value
                if (propertyReqResult) {
                    //if not every currently loaded value for this property-shape is loaded, then the subRequest is not loaded
                    if (!propertyRequest[0]
                        .resolveFor(node)
                        .every(function (valueNode) {
                        var subRequestLoaded = _this.isLoaded(valueNode, propertyRequest[1]);
                        if (!subRequestLoaded) {
                            return false;
                        }
                        //if the sub request is still loading that's fine, we add it to the array of promises to wait for
                        if (subRequestLoaded !== true) {
                            stillLoading.push(subRequestLoaded);
                        }
                        return true;
                    })) {
                        propertyReqResult = false;
                    }
                }
            }
            else {
                propertyReqResult = propertiesRequested.get(propertyRequest.namedNode);
            }
            if (!propertyReqResult) {
                //not every propertyRequest is loaded, return false, which stops the every() loop and resolves it to false
                return false;
            }
            if (propertyReqResult !== true) {
                stillLoading.push(propertyReqResult);
            }
            //if not false, continue to evaluate the next propertyRequest
            return true;
        })) {
            return false;
        }
        //all propertyRequests had an entry, if some are still loading, return the promise that resolves when they're all loaded
        //else return true (everything is loaded)
        return stillLoading.length > 0 ? Promise.all(stillLoading) : true;
    };
    /**
     * Sets all the property paths of the subject nodes to be loaded
     * Handy for example when the server returned data already and you don't want the automatic loading to kick in.
     * WARNING: this assumes that ALL the values of each subject-predicate pair are loaded.
     * If the server returned just one and there are more, using this method means the other values will not automatically be loaded.
     */
    LinkedStorage.setQuadsLoaded = function (quads) {
        var _this = this;
        var propShapeMap = this.getPredicateToPropertyShapesMap();
        //build a map of subject to property shapes
        var subjectToPropShapes = new Map();
        quads.forEach(function (quad) {
            if (!subjectToPropShapes.has(quad.subject)) {
                subjectToPropShapes.set(quad.subject, []);
            }
            var currentPropShapes = subjectToPropShapes.get(quad.subject);
            //get all the property shapes that match this predicate and add them to the property shapes of this subject
            if (propShapeMap.has(quad.predicate)) {
                propShapeMap
                    .get(quad.predicate)
                    .forEach(function (propShape) { return currentPropShapes.push(propShape); });
            }
        });
        subjectToPropShapes.forEach(function (propertyShapes, subject) {
            _this.setNodeLoaded(subject, propertyShapes);
        });
    };
    LinkedStorage.setNodesLoaded = function (nodes, dataRequest, requestState) {
        var _this = this;
        if (requestState === void 0) { requestState = true; }
        nodes.forEach(function (source) {
            _this.setNodeLoaded(source, dataRequest, requestState);
        });
    };
    LinkedStorage.setNodeLoaded = function (node, request, requestState) {
        var _this = this;
        if (requestState === void 0) { requestState = true; }
        if (!this.nodeToPropertyRequests.get(node)) {
            this.nodeToPropertyRequests.set(node, new CoreMap_js_1.CoreMap());
        }
        var requestedProperties = this.nodeToPropertyRequests.get(node);
        request.map(function (propertyRequest) {
            if (Array.isArray(propertyRequest)) {
                //propertyRequest is of the shape [propertyShape,subRequest]
                //update the cache for the property-shapes that regard this source
                requestedProperties.set(propertyRequest[0].namedNode, requestState);
                //if loading has finished
                if (requestState === true) {
                    //then resolve the property shape for this node (so follow the property shape from this node)
                    //then update the cache to indicate that the subRequest has been loaded
                    // for each of the nodes you get to from that property shape
                    _this.setNodesLoaded(propertyRequest[0].resolveFor(node), propertyRequest[1], requestState);
                }
            }
            else {
                //propertyRequest is a PropertyShape
                requestedProperties.set(propertyRequest.namedNode, requestState);
            }
        });
    };
    LinkedStorage.startProcessingOnNextTick = function () {
        var _this = this;
        //create the processing promise, so that any request for promiseUpdate() will already get the promise that resolves after these events are handled
        var resolve, reject;
        var promise = new Promise(function (res, rej) {
            resolve = res;
            reject = rej;
        });
        this.processingPromise = { promise: promise, resolve: resolve, reject: reject };
        //start processing the stored events on the next tick
        (0, next_tick_1.default)(function () {
            _this.processStoredEvents();
        });
    };
    LinkedStorage.finalizeProcess = function (success) {
        if (success) {
            //if we changed graphs in the process, there may be more events waiting
            if (EventBatcher_js_1.eventBatcher.hasBatchedEvents()) {
                //let's make sure we process those as well before resolving
                EventBatcher_js_1.eventBatcher.dispatchBatchedEvents();
            }
            //if we now have work to do
            if (this.storedEvents) {
                //do that and come back here later
                this.processStoredEvents();
            }
            else {
                //no more storage work to do for sure! let's resolve
                this.processingPromise.resolve();
                this.processingPromise = null;
            }
        }
        else {
            this.processingPromise.reject();
            this.processingPromise = null;
        }
    };
    LinkedStorage.assignQuadsToGraph = function (quads, removeFromSet) {
        if (removeFromSet === void 0) { removeFromSet = false; }
        var map = this.getTargetGraphMap(quads);
        var alteredNodes = new CoreMap_js_1.CoreMap();
        var movedQuads = new QuadSet_js_1.QuadSet();
        map.forEach(function (graphQuads, graph) {
            graphQuads.forEach(function (quad) {
                if (quad.graph !== graph) {
                    //move the quad to the target graph (both old and new graph will be updated)
                    //this will trigger a QUADS_ALTERED event --> onQuadsAltered
                    quad.moveToGraph(graph);
                    //we also remove the quad from the set it was in, if requested
                    //this prevents moved quads from still being added to the store of the old graph
                    if (removeFromSet) {
                        quads instanceof QuadSet_js_1.QuadSet
                            ? quads.delete(quad)
                            : quads.splice(quads.indexOf(quad), 1);
                    }
                    movedQuads.add(quad);
                    //also keep track of which nodes had a quad that moved to a different graph
                    if (!alteredNodes.has(quad.subject)) {
                        alteredNodes.set(quad.subject, graph);
                    }
                }
            });
        });
        //now that all quads have been updated, we need to check one more thing
        //changes in quads MAY have changed which shapes the subject nodes are an instance of
        //thus the target graph of the whole node may have changed, so:
        return movedQuads.concat(this.moveAllQuadsOfNodeIfRequired(alteredNodes));
    };
    LinkedStorage.moveAllQuadsOfNodeIfRequired = function (alteredNodes) {
        var movedQuads = new QuadSet_js_1.QuadSet();
        //for all subjects who have a quad that moved to a different graph
        alteredNodes.forEach(function (graph, subjectNode) {
            //go over each quad of that node
            subjectNode.getAllQuads().forEach(function (quad) {
                //and if that quad is not in the same graph as the target graph that we just determined for that node
                if (quad.graph !== graph) {
                    //then update it
                    quad.moveToGraph(graph);
                    movedQuads.add(quad);
                }
            });
        });
        return movedQuads;
    };
    LinkedStorage.onQuadsAltered = function (quadsCreated, quadsRemoved, baseStoreOnSubject, alteration) {
        var _this = this;
        if (baseStoreOnSubject === void 0) { baseStoreOnSubject = false; }
        if (alteration === void 0) { alteration = false; }
        //quads may have been removed since they have been created and emitted filter that out here
        var addMap, removeMap;
        if (quadsCreated) {
            quadsCreated = quadsCreated.filter(function (q) { return !q.isRemoved; });
            //first see if any new quads need to move to the right graphs (note that this will possibly add "mimicked" quads (with the previous graph as their graph) to quadsRemoved)
            //true, signals that we want to remove the quads from quadsCreated if they get moved
            this.assignQuadsToGraph(quadsCreated, true);
            if (baseStoreOnSubject) {
                addMap = this.getStoreMapForNodes(quadsCreated.getSubjects());
            }
            else {
                //default: get the right stores based on the graph of the quads
                addMap = this.getTargetStoreMap(quadsCreated);
            }
        }
        if (quadsRemoved) {
            if (baseStoreOnSubject) {
                removeMap = this.getStoreMapForNodes(quadsRemoved.getSubjects());
            }
            else {
                //default: get the right stores based on the graph of the quads
                removeMap = this.getTargetStoreMap(quadsRemoved);
            }
        }
        //combine the keys of both maps (which are stores)
        var stores = __spreadArray(__spreadArray([], __read((addMap ? addMap.keys() : [])), false), __read((removeMap ? removeMap.keys() : [])), false);
        //go over each store that has added/removed quads
        return Promise.all(stores.map(function (store) { return __awaiter(_this, void 0, void 0, function () {
            var storeAddQuads, storeRemoveQuads, storeAddSubjects_1, storeRemoveSubjects_1;
            return __generator(this, function (_a) {
                if (baseStoreOnSubject) {
                    storeAddSubjects_1 = addMap === null || addMap === void 0 ? void 0 : addMap.get(store);
                    storeRemoveSubjects_1 = removeMap === null || removeMap === void 0 ? void 0 : removeMap.get(store);
                    storeAddQuads = storeAddSubjects_1
                        ? quadsCreated.filter(function (q) { return storeAddSubjects_1.includes(q.subject); })
                        : null;
                    storeRemoveQuads = storeRemoveSubjects_1
                        ? quadsRemoved.filter(function (q) {
                            return storeRemoveSubjects_1.includes(q.subject);
                        })
                        : null;
                }
                else {
                    storeAddQuads = (addMap === null || addMap === void 0 ? void 0 : addMap.get(store)) || null;
                    storeRemoveQuads = (removeMap === null || removeMap === void 0 ? void 0 : removeMap.get(store)) || null;
                }
                return [2 /*return*/, store.update(storeAddQuads, storeRemoveQuads)];
            });
        }); }))
            .then(function (res) {
            return res;
        })
            .catch(function (err) {
            console.warn('Error during storage update: ', err);
        });
    };
    LinkedStorage.onClearedProperties = function (clearProperties) {
        return __awaiter(this, void 0, void 0, function () {
            var subjects, storeMap;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        subjects = new NodeSet_js_1.NodeSet(clearProperties.keys());
                        storeMap = this.getStoreMapForNodes(subjects);
                        //call on each store to remove the appropriate nodes
                        return [4 /*yield*/, Promise.all(__spreadArray([], __read(storeMap.entries()), false).map(function (_a) {
                                var _b = __read(_a, 2), store = _b[0], subjects = _b[1];
                                var storeClearMap = new CoreMap_js_1.CoreMap();
                                subjects.forEach(function (subject) {
                                    var subjectClearMap = new NodeSet_js_1.NodeSet();
                                    clearProperties.get(subject).forEach(function (_a) {
                                        var _b = __read(_a, 2), clearedProperty = _b[0], quads = _b[1];
                                        //TODO: if we ever need access to the LOCALLY cleared quads in the remote stores, grab & send them from here
                                        // However, if we don't, we can reshape the NamedNode model so that quads don't get sent in these events anymore
                                        subjectClearMap.add(clearedProperty);
                                    });
                                    storeClearMap.set(subject, subjectClearMap);
                                });
                                return store.clearProperties(storeClearMap);
                            }))
                                .then(function (res) {
                                return res;
                            })
                                .catch(function (err) {
                                console.warn('Could not clear properties: ' + err);
                            })];
                    case 1:
                        //call on each store to remove the appropriate nodes
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    LinkedStorage.onRemoveNodes = function (nodesAndQuads) {
        return __awaiter(this, void 0, void 0, function () {
            var nodes, storeMap;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nodes = new NodeSet_js_1.NodeSet();
                        nodesAndQuads.forEach(function (_a) {
                            var _b = __read(_a, 2), node = _b[0], quads = _b[1];
                            quads.turnOn();
                            nodes.add(node);
                        });
                        storeMap = this.getStoreMapForNodes(nodes);
                        //turn the quads back off (they should be removed after all)
                        nodesAndQuads.forEach(function (_a) {
                            var _b = __read(_a, 2), node = _b[0], quads = _b[1];
                            quads.turnOff();
                        });
                        //call on each store to remove the appropriate nodes
                        return [4 /*yield*/, Promise.all(__spreadArray([], __read(storeMap.entries()), false).map(function (_a) {
                                var _b = __read(_a, 2), store = _b[0], nodesToRemove = _b[1];
                                return store.removeNodes(nodesToRemove);
                            }))
                                .then(function (res) {
                                return res;
                            })
                                .catch(function (err) {
                                console.warn('Could not remove nodes from storage: ' + err);
                            })];
                    case 1:
                        //call on each store to remove the appropriate nodes
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    LinkedStorage.onStoreNodes = function (nodes) {
        return __awaiter(this, void 0, void 0, function () {
            var nodesWithTempURIs, storeMap, quads;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nodesWithTempURIs = nodes.filter(function (node) { return node.uri.indexOf(models_js_1.NamedNode.TEMP_URI_BASE) === 0; });
                        storeMap = this.getStoreMapForNodes(nodesWithTempURIs);
                        return [4 /*yield*/, Promise.all(__spreadArray([], __read(storeMap.entries()), false).map(function (_a) {
                                var _b = __read(_a, 2), store = _b[0], temporaryNodes = _b[1];
                                var nodeUriMap = new CoreMap_js_1.CoreMap();
                                temporaryNodes.forEach(function (node) {
                                    nodeUriMap.set(node, node.uri);
                                });
                                //let the store determine the URI's for these nodes
                                return store.setURIs(nodeUriMap).then(function (uriUpdates) {
                                    //and THEN update them (yes this currently needs to be separate because the frontend requests new uri's before sending data,so this URI request should not change any URI's on the backend)
                                    uriUpdates.forEach(function (_a) {
                                        var _b = __read(_a, 2), oldUri = _b[0], newUri = _b[1];
                                        var currentNode = models_js_1.NamedNode.getNamedNode(oldUri);
                                        //currently, when a node is saved and removed in the same event cycle, it will not be in the store anymore
                                        if (currentNode) {
                                            currentNode.uri = newUri;
                                        }
                                    });
                                });
                            }))];
                    case 1:
                        _a.sent();
                        quads = new QuadSet_js_1.QuadSet();
                        nodes.forEach(function (node) {
                            node.getAllQuads().forEach(function (quad) {
                                quads.add(quad);
                            });
                        });
                        this.assignQuadsToGraph(quads);
                        nodes.forEach(function (node) {
                            node.isTemporaryNode = false;
                            node.isStoring = false;
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    LinkedStorage.groupQuadsBySubject = function (quads) {
        var subjectsToQuads = new CoreMap_js_1.CoreMap();
        quads.forEach(function (quad) {
            if (!subjectsToQuads.has(quad.subject)) {
                subjectsToQuads.set(quad.subject, new QuadArray_js_1.QuadArray());
            }
            subjectsToQuads.get(quad.subject).push(quad);
        });
        return subjectsToQuads;
    };
    LinkedStorage.getTargetGraphMap = function (quads) {
        var _this = this;
        var graphMap = new CoreMap_js_1.CoreMap();
        var quadsBySubject = this.groupQuadsBySubject(quads);
        quadsBySubject.forEach(function (quads, subjectNode) {
            var targetGraph = _this.getGraphForNode(subjectNode);
            if (!graphMap.has(targetGraph)) {
                graphMap.set(targetGraph, new QuadArray_js_1.QuadArray());
            }
            graphMap.set(targetGraph, new (QuadArray_js_1.QuadArray.bind.apply(QuadArray_js_1.QuadArray, __spreadArray([void 0], __read(graphMap.get(targetGraph).concat(quads)), false)))());
        });
        return graphMap;
    };
    LinkedStorage.getStoreMapForIGraphObjects = function (objects) {
        var _this = this;
        var storeMap = new CoreMap_js_1.CoreMap();
        objects.forEach(function (object) {
            var store = _this.getStoreForNode(object.node || object);
            //if store is null, this means no store is observing this node. This will usually happen for the default graph which contains temporary nodes
            if (store) {
                if (!storeMap.has(store)) {
                    storeMap.set(store, []);
                }
                storeMap.get(store).push(object);
            }
        });
        return storeMap;
    };
    LinkedStorage.getTargetStoreMap = function (quads) {
        var _this = this;
        var storeMap = new CoreMap_js_1.CoreMap();
        quads.forEach(function (quad) {
            var store = _this.getStoreForGraph(quad.graph);
            //if store is null, this means no store is observing this quad. This will usually happen for the default graph which contains temporary nodes
            if (store) {
                if (!storeMap.has(store)) {
                    storeMap.set(store, new QuadArray_js_1.QuadArray());
                }
                storeMap.get(store).push(quad);
            }
        });
        return storeMap;
    };
    LinkedStorage.getPredicateToPropertyShapesMap = function () {
        var _this = this;
        if (!this.propShapeMap) {
            this.propShapeMap = new Map();
            SHACL_js_1.PropertyShape.getLocalInstances().forEach(function (propertyShape) {
                if (!_this.propShapeMap.has(propertyShape.path)) {
                    _this.propShapeMap.set(propertyShape.path, []);
                }
                _this.propShapeMap.get(propertyShape.path).push(propertyShape);
            });
        }
        return this.propShapeMap;
    };
    LinkedStorage.graphToStore = new CoreMap_js_1.CoreMap();
    LinkedStorage.shapesToGraph = new CoreMap_js_1.CoreMap();
    LinkedStorage.nodeShapesToGraph = new CoreMap_js_1.CoreMap();
    LinkedStorage.nodeToPropertyRequests = new CoreMap_js_1.CoreMap();
    return LinkedStorage;
}());
exports.LinkedStorage = LinkedStorage;
//# sourceMappingURL=LinkedStorage.js.map