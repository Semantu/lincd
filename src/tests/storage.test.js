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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestStore = exports.InMemoryStore = void 0;
var globals_1 = require("@jest/globals");
var LinkedStorage_js_1 = require("../utils/LinkedStorage.js");
var models_js_1 = require("../models.js");
var QuadSet_js_1 = require("../collections/QuadSet.js");
var rdfs_js_1 = require("../ontologies/rdfs.js");
var rdf_js_1 = require("../ontologies/rdf.js");
var Shape_js_1 = require("../shapes/Shape.js");
var QuadArray_js_1 = require("../collections/QuadArray.js");
var SHACL_js_1 = require("../shapes/SHACL.js");
var LocalQueryResolver_js_1 = require("../utils/LocalQueryResolver.js");
var InMemoryStore = /** @class */ (function (_super) {
    __extends(InMemoryStore, _super);
    function InMemoryStore(n) {
        return _super.call(this, n) || this;
    }
    InMemoryStore.prototype.init = function () {
        // console.log('Init ' + this.toString());
        if (!this.initPromise) {
            this.initPromise = this.loadContents();
        }
        return this.initPromise;
    };
    InMemoryStore.prototype.loadContents = function () {
        //by default an in-memory store starts empty - it has no permanent storage
        //overwrite this method to change that
        this.contents = new QuadSet_js_1.QuadSet();
        return Promise.resolve(this.contents);
    };
    /**
     * returns the contents of the InMemoryStore as a QuadSet
     * do NOT modify the returned QuadSet directly. Add or remove contents to this store instead
     */
    InMemoryStore.prototype.getContents = function () {
        return this.contents;
    };
    InMemoryStore.prototype.update = function (toAdd, toRemove) {
        var _this = this;
        return this.init().then(function () {
            if (toAdd) {
                _this._addMultiple(toAdd);
            }
            if (toRemove) {
                _this._deleteMultiple(toRemove);
            }
            //this method should only get called if either toAdd or toRemove is not empty
            return _this.onContentsUpdated();
        });
    };
    InMemoryStore.prototype.getDefaultGraph = function () {
        //NOTE: we changed this from a specific graph for each store BACK null, which means things will be stored in the default graph
        // because storing quads in multiple graphs easily becomes error-prone.
        // Removing a triple from one store might not remove it from the main graph.
        // for example, auth will store users serialised as JSONLD in sessions, these quads get added back to the main graph
        // until we have a better solution for this, we aim to only use the default graph as much as possible (which means no specific graph os used, thus return null)
        // return null;
        // return defaultGraph;
        return models_js_1.Graph.getOrCreate(this.namedNode.uri);
    };
    InMemoryStore.prototype.add = function (quad) {
        var _this = this;
        return this.init().then(function () {
            _this.addNewContents(new QuadArray_js_1.QuadArray(quad));
            _this.onContentsUpdated();
            return Promise.resolve(true);
        });
    };
    InMemoryStore.prototype.addMultiple = function (quads) {
        var _this = this;
        return this.init().then(function () {
            _this._addMultiple(quads);
            _this.onContentsUpdated();
            return Promise.resolve(true);
        });
    };
    InMemoryStore.prototype._addMultiple = function (quads) {
        this.addNewContents(quads);
        // this.contents = this.contents.concat(quads);
    };
    InMemoryStore.prototype.delete = function (quad) {
        var _this = this;
        return this.init().then(function () {
            // this.contents.delete(quad);
            _this._deleteMultiple(new QuadArray_js_1.QuadArray(quad));
            _this.onContentsUpdated();
            return true;
        });
    };
    InMemoryStore.prototype.deleteMultiple = function (quads) {
        var _this = this;
        return this.init().then(function () {
            _this._deleteMultiple(quads);
            _this.onContentsUpdated();
            return true;
        });
    };
    InMemoryStore.prototype._deleteMultiple = function (quads) {
        //first we add the quads to the right graph (which effectively ADDS these quads to this store)
        //then we remove them from the contents
        var _this = this;
        //get the target graph for this store, if configured
        var graph = LinkedStorage_js_1.LinkedStorage.getGraphForStore(this) || this.targetGraph || models_js_1.defaultGraph;
        //if there is one, move the quads into that graph
        if (graph) {
            quads = quads.moveTo(graph, false);
        }
        quads.forEach(function (quad) {
            _this.contents.delete(quad);
            quad.remove(false);
        });
    };
    InMemoryStore.prototype.clearProperties = function (subjectToPredicates) {
        var _this = this;
        return this.init().then(function () {
            var toDelete = new QuadSet_js_1.QuadSet();
            _this.contents.forEach(function (q) {
                if (subjectToPredicates.has(q.subject) &&
                    subjectToPredicates.get(q.subject).has(q.predicate)) {
                    toDelete.add(q);
                }
            });
            if (toDelete.size > 0) {
                return _this.deleteMultiple(toDelete);
            }
            return false;
        });
    };
    InMemoryStore.prototype.setURIs = function (nodeToCurrentUriMap) {
        //by default an in-memory store does not support setting URIs,
        // if it's used in a local context for in memory storage it doesn't really care about permanent storage URI's
        // if it's used in a different context, this method should be overwritten
        return Promise.resolve([]);
    };
    InMemoryStore.prototype.onContentsUpdated = function () {
        //by default in memory store does nothing here. But extending classes could choose to sync to a more permanent form of storage
        return Promise.resolve(false);
    };
    InMemoryStore.prototype.removeNodes = function (nodes) {
        //when storage calls removeNodes, all quads have already been removed locally
        //and an in memory store always holds all data in memory,
        //so there is nothing to do here
        return Promise.resolve(true);
    };
    InMemoryStore.prototype.query = function (query, shapeClass) {
        return Promise.resolve((0, LocalQueryResolver_js_1.resolveLocal)(query, shapeClass)).catch(function (e) {
            console.error('Error in query', e);
            return new QuadArray_js_1.QuadArray();
        });
    };
    InMemoryStore.prototype.loadShape = function (shapeInstance, request) {
        var _this = this;
        return this.init().then(function () {
            return _this.getRequestQuads(shapeInstance, request);
            //for testing: add timer
            // return new Promise((resolve, reject) => {
            //   setTimeout(() => {
            //get quads for each (nested) shape / property shape
            // let quads = this.getRequestQuads(shapeInstance, request);
            // return resolve(quads);
            // }, 1500);
            // });
        });
    };
    InMemoryStore.prototype.loadShapes = function (shapeInstances, request) {
        var _this = this;
        return this.init().then(function () {
            var quads = new QuadArray_js_1.QuadArray();
            shapeInstances.forEach(function (shapeInstance) {
                _this.getRequestQuads(shapeInstance, request, quads);
            });
            return quads;
            // return new Promise((resolve, reject) => {
            //   setTimeout(() => {
            //     //get quads for each (nested) shape / property shape
            //     //TODO: update getRequestQuads to work with shape set
            //     // possibly even merge definitions of loadShape and loadShapes? is it select? query?
            //     // let quads = this.getRequestQuads(shapeInstances, request);
            //     // return Promise.resolve(quads);
            //     // return resolve(quads);
            //     return resolve([] as any);
            //   }, 1500);
            // });
        });
    };
    InMemoryStore.prototype.getRequestQuads = function (source, request, quads) {
        var _this = this;
        if (quads === void 0) { quads = new QuadArray_js_1.QuadArray(); }
        // let {shape, properties}: {shape: typeof Shape; properties?: (PropertyShape | BoundPropertyShapes)[]} = request;
        request.forEach(function (propertyRequest) {
            var _a;
            var subRequest;
            var propertyShape;
            var propertyShapeSource;
            //if an entry is an array, then it consists of the property shape + a sub request
            if (Array.isArray(propertyRequest)) {
                _a = __read(propertyRequest, 2), propertyShape = _a[0], subRequest = _a[1];
            }
            else if (propertyRequest instanceof SHACL_js_1.PropertyShape) {
                propertyShape = propertyRequest;
            }
            if (propertyShape) {
                if (source instanceof QuadSet_js_1.QuadSet) {
                    propertyShapeSource = source
                        .getObjects()
                        .getQuads(propertyShape.path);
                }
                else if (source instanceof Shape_js_1.Shape) {
                    propertyShapeSource = source.getQuads(propertyShape.path);
                }
                propertyShapeSource.forEach(function (q) { return quads.push(q); });
            }
            if (subRequest) {
                _this.getRequestQuads(propertyShapeSource, subRequest, quads);
            }
        });
        return quads;
    };
    InMemoryStore.prototype.addNewContents = function (quads) {
        //get the target graph for this store, if configured
        var graph = LinkedStorage_js_1.LinkedStorage.getGraphForStore(this) || this.targetGraph || models_js_1.defaultGraph;
        //if there is one, move the quads into that graph
        if (graph) {
            quads = quads.moveTo(graph, false);
        }
        this.contents.addFrom(quads);
        return quads;
    };
    return InMemoryStore;
}(Shape_js_1.Shape));
exports.InMemoryStore = InMemoryStore;
var TestStore = /** @class */ (function () {
    function TestStore() {
        this.defaultGraph = models_js_1.Graph.create();
        this.contents = new QuadSet_js_1.QuadSet();
    }
    TestStore.prototype.init = function () {
        return null;
    };
    TestStore.prototype.reset = function () {
        this.contents = new QuadSet_js_1.QuadSet();
    };
    TestStore.prototype.update = function (added, removed) {
        var _this = this;
        added.forEach(function (q) { return _this.contents.add(q); });
        removed.forEach(function (q) { return _this.contents.delete(q); });
        return null;
    };
    TestStore.prototype.query = function (query, shapeClass) {
        return null;
    };
    TestStore.prototype.add = function (quad) {
        return null;
    };
    TestStore.prototype.addMultiple = function (quads) {
        return null;
    };
    TestStore.prototype.delete = function (quad) {
        return null;
    };
    TestStore.prototype.deleteMultiple = function (quads) {
        return null;
    };
    TestStore.prototype.setURIs = function (nodeToCurrentUriMap) {
        return null;
    };
    TestStore.prototype.getDefaultGraph = function () {
        return this.defaultGraph;
    };
    TestStore.prototype.removeNodes = function (nodes) {
        return null;
    };
    TestStore.prototype.loadShape = function (shapeInstance, request) {
        return null;
    };
    TestStore.prototype.loadShapes = function (shapeSet, request) {
        return null;
    };
    TestStore.prototype.clearProperties = function (subjectToPredicates) {
        var _this = this;
        var deleted = false;
        this.contents.forEach(function (q) {
            if (subjectToPredicates.has(q.subject) &&
                subjectToPredicates.get(q.subject).has(q.predicate)) {
                _this.contents.delete(q);
                deleted = true;
            }
        });
        return Promise.resolve(deleted);
    };
    return TestStore;
}());
exports.TestStore = TestStore;
var store = new TestStore();
LinkedStorage_js_1.LinkedStorage.setDefaultStore(store);
(0, globals_1.describe)('default store', function () {
    (0, globals_1.test)('does not store temporary node', function () {
        var node = models_js_1.NamedNode.create();
        node.setValue(rdfs_js_1.rdfs.label, 'test');
        (0, globals_1.expect)(store.contents.size).toBe(0);
    });
    (0, globals_1.test)('stores quads of saved node', function () { return __awaiter(void 0, void 0, void 0, function () {
        var node, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    store.reset();
                    node = models_js_1.NamedNode.create();
                    node.setValue(rdfs_js_1.rdfs.label, 'test2');
                    node.save();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, LinkedStorage_js_1.LinkedStorage.promiseUpdated()];
                case 2:
                    _a.sent();
                    (0, globals_1.expect)(store.contents.size).toBe(1);
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    console.warn('Why err?', e_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('stores new properties of existing node', function () { return __awaiter(void 0, void 0, void 0, function () {
        var node;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    store.reset();
                    node = models_js_1.NamedNode.create();
                    node.isTemporaryNode = false;
                    node.setValue(rdfs_js_1.rdfs.label, 'test3');
                    return [4 /*yield*/, LinkedStorage_js_1.LinkedStorage.promiseUpdated()];
                case 1:
                    _a.sent();
                    (0, globals_1.expect)(store.contents.size).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('unsetAll removes those properties from store', function () { return __awaiter(void 0, void 0, void 0, function () {
        var node;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    store.reset();
                    node = models_js_1.NamedNode.create();
                    node.isTemporaryNode = false;
                    node.setValue(rdfs_js_1.rdfs.label, 'test4');
                    return [4 /*yield*/, LinkedStorage_js_1.LinkedStorage.promiseUpdated()];
                case 1:
                    _a.sent();
                    node.unsetAll(rdfs_js_1.rdfs.label);
                    return [4 /*yield*/, LinkedStorage_js_1.LinkedStorage.promiseUpdated()];
                case 2:
                    _a.sent();
                    (0, globals_1.expect)(store.contents.size).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('unset removes that property from store', function () { return __awaiter(void 0, void 0, void 0, function () {
        var node;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    store.reset();
                    node = models_js_1.NamedNode.create();
                    node.isTemporaryNode = false;
                    node.setValue(rdfs_js_1.rdfs.label, 'test4');
                    return [4 /*yield*/, LinkedStorage_js_1.LinkedStorage.promiseUpdated()];
                case 1:
                    _a.sent();
                    node.unset(rdfs_js_1.rdfs.label, new models_js_1.Literal('test4'));
                    return [4 /*yield*/, LinkedStorage_js_1.LinkedStorage.promiseUpdated()];
                case 2:
                    _a.sent();
                    (0, globals_1.expect)(store.contents.size).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('remove node & properties from store', function () { return __awaiter(void 0, void 0, void 0, function () {
        var node;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    store.reset();
                    node = models_js_1.NamedNode.create();
                    node.isTemporaryNode = false;
                    node.setValue(rdfs_js_1.rdfs.label, 'test5');
                    return [4 /*yield*/, LinkedStorage_js_1.LinkedStorage.promiseUpdated()];
                case 1:
                    _a.sent();
                    node.remove();
                    return [4 /*yield*/, LinkedStorage_js_1.LinkedStorage.promiseUpdated()];
                case 2:
                    _a.sent();
                    (0, globals_1.expect)(store.contents.size).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('promiseUpdated waits for both storing nodes and altering nodes to complete', function () { return __awaiter(void 0, void 0, void 0, function () {
        var node;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    store.reset();
                    node = models_js_1.NamedNode.create();
                    node.setValue(rdfs_js_1.rdfs.label, 'test5');
                    node.save();
                    node.set(rdf_js_1.rdf.type, node);
                    return [4 /*yield*/, LinkedStorage_js_1.LinkedStorage.promiseUpdated()];
                case 1:
                    _a.sent();
                    (0, globals_1.expect)(store.contents.size).toBe(2);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=storage.test.js.map