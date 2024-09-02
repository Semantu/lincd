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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedWhereQuery = exports.SetSize = exports.LinkedQuery = exports.QueryPrimitiveSet = exports.QueryNumber = exports.QueryDate = exports.QueryString = exports.QueryPrimitive = exports.Evaluation = exports.BoundComponent = exports.QueryShape = exports.QueryShapeSet = exports.QueryBuilderObject = exports.WhereMethods = void 0;
var Shape_js_1 = require("../shapes/Shape.js");
var TraceShape_js_1 = require("./TraceShape.js");
var ShapeSet_js_1 = require("../collections/ShapeSet.js");
var shacl_js_1 = require("../ontologies/shacl.js");
var CoreSet_js_1 = require("../collections/CoreSet.js");
var ShapeClass_js_1 = require("./ShapeClass.js");
var WhereMethods;
(function (WhereMethods) {
    WhereMethods["EQUALS"] = "eq";
    WhereMethods["SOME"] = "some";
    WhereMethods["EVERY"] = "every";
})(WhereMethods || (exports.WhereMethods = WhereMethods = {}));
/**
 * ###################################
 * ####  QUERY BUILDING CLASSES   ####
 * ###################################
 */
var QueryBuilderObject = /** @class */ (function () {
    function QueryBuilderObject(property, subject) {
        this.property = property;
        this.subject = subject;
        //is null by default to avoid warnings when trying to access wherePath when its undefined
        this.wherePath = null;
    }
    /**
     * Converts an original value into a query value
     * @param originalValue
     * @param requestedPropertyShape the property shape that is connected to the get accessor that returned the original value
     */
    QueryBuilderObject.convertOriginal = function (originalValue, property, subject) {
        if (originalValue instanceof Shape_js_1.Shape) {
            return QueryShape.create(originalValue, property, subject);
        }
        else if (originalValue instanceof ShapeSet_js_1.ShapeSet) {
            return QueryShapeSet.create(originalValue, property, subject);
        }
        else if (typeof originalValue === 'string') {
            return new QueryString(originalValue, property, subject);
        }
        else if (typeof originalValue === 'number') {
            return new QueryNumber(originalValue, property, subject);
        }
        else if (originalValue instanceof Date) {
            return new QueryDate(originalValue, property, subject);
        }
        else if (originalValue instanceof TraceShape_js_1.TestNode) {
            throw new Error(subject.getOriginalValue().nodeShape.label +
                '.' +
                property.label +
                ': A property accessor should return a Shape or a primitive value. Returning a NamedNode is currently not supported.');
        }
    };
    QueryBuilderObject.getOriginalSource = function (endValue) {
        var _this = this;
        if (typeof endValue === 'undefined')
            return undefined;
        if (endValue instanceof QueryPrimitiveSet) {
            return new ShapeSet_js_1.ShapeSet(endValue.contents.map(function (endValue) { return _this.getOriginalSource(endValue); }));
        }
        if (endValue instanceof QueryString) {
            return endValue.subject
                ? this.getOriginalSource(endValue.subject)
                : endValue.originalValue;
        }
        if (endValue instanceof QueryShape) {
            if (endValue.subject && !endValue.isSource) {
                return this.getOriginalSource(endValue.subject);
            }
            return endValue.originalValue;
        }
        else if (endValue instanceof Shape_js_1.Shape) {
            return endValue;
        }
        else if (endValue instanceof QueryShapeSet) {
            return new ShapeSet_js_1.ShapeSet(endValue.queryShapes.map(function (queryShape) {
                return _this.getOriginalSource(queryShape);
            }));
        }
        else {
            throw new Error('Unimplemented. Return as is?');
        }
    };
    QueryBuilderObject.prototype.getOriginalValue = function () {
        return this.originalValue;
    };
    QueryBuilderObject.prototype.getPropertyStep = function () {
        return {
            property: this.property,
            where: this.wherePath,
        };
    };
    QueryBuilderObject.prototype.preloadFor = function (component) {
        return new BoundComponent(component, this);
    };
    QueryBuilderObject.prototype.limit = function (lim) {
        console.log(lim);
    };
    /**
     * Returns the path of properties that were requested to reach this value
     */
    QueryBuilderObject.prototype.getPropertyPath = function (currentPath) {
        var path = currentPath || [];
        //add the step of this object to the beginning of the path (so that the next parent will always before the current item)
        if (this.property || this.wherePath) {
            path.unshift(this.getPropertyStep());
        }
        if (this.subject) {
            return this.subject.getPropertyPath(path);
        }
        return path;
    };
    return QueryBuilderObject;
}());
exports.QueryBuilderObject = QueryBuilderObject;
var processWhereClause = function (validation, shape) {
    if (validation instanceof Function) {
        if (!shape) {
            throw new Error('Cannot process where clause without shape');
        }
        return new LinkedWhereQuery(shape, validation).getWherePath();
    }
    else {
        return validation.getWherePath();
    }
};
var QueryShapeSet = /** @class */ (function (_super) {
    __extends(QueryShapeSet, _super);
    function QueryShapeSet(_originalValue, property, subject) {
        var _this = _super.call(this, property, subject) || this;
        //Note that QueryShapeSet intentionally does not store the _originalValue shape set, because it manipulates this.queryShapes
        // and then recreates the original shape set when getOriginalValue() is called
        _this.queryShapes = new CoreSet_js_1.CoreSet(_originalValue === null || _originalValue === void 0 ? void 0 : _originalValue.map(function (shape) {
            return QueryShape.create(shape, property, subject);
        }));
        return _this;
    }
    QueryShapeSet.create = function (originalValue, property, subject) {
        var instance = new QueryShapeSet(originalValue, property, subject);
        var proxy = this.proxifyShapeSet(instance);
        return proxy;
    };
    QueryShapeSet.proxifyShapeSet = function (queryShapeSet) {
        var originalShapeSet = queryShapeSet.getOriginalValue();
        queryShapeSet.proxy = new Proxy(queryShapeSet, {
            get: function (target, key, receiver) {
                //if the key is a string
                if (typeof key === 'string') {
                    //if this is a get method that is implemented by the QueryShapeSet, then use that
                    if (key in queryShapeSet) {
                        //if it's a function, then bind it to the queryShape and return it so it can be called
                        if (typeof queryShapeSet[key] === 'function') {
                            return target[key].bind(target);
                        }
                        //if it's a get method, then return that
                        //NOTE: we may not need this if we don't use any get methods in QueryValue classes?
                        return queryShapeSet[key];
                    }
                    //if not, then a method/accessor was called that likely fits with the methods of the original SHAPE of the items in the shape set
                    //As in Shape.friends.name -> key would be name, which is requested from (each item in!) a ShapeSet of Shapes
                    //So here we find back the shape that all items have in common, and then find the property shape that matches the key
                    //NOTE: this will only work if the key corresponds with an accessor in the shape that uses a @linkedProperty decorator
                    var leastSpecificShape = queryShapeSet
                        .getOriginalValue()
                        .getLeastSpecificShape();
                    var propertyShape = leastSpecificShape === null || leastSpecificShape === void 0 ? void 0 : leastSpecificShape.shape.getPropertyShapes().find(function (propertyShape) { return propertyShape.label === key; });
                    //if the property shape is found
                    if (propertyShape) {
                        return queryShapeSet.callPropertyShapeAccessor(propertyShape);
                    }
                    else if (
                    //else if a method of the original shape is called, like .forEach() or similar
                    originalShapeSet[key] &&
                        typeof originalShapeSet[key] === 'function') {
                        //then return that method and bind the original value as 'this'
                        return originalShapeSet[key].bind(originalShapeSet);
                    }
                    else {
                        console.warn('Could not find property shape for key ' +
                            key +
                            ' on shape ' +
                            leastSpecificShape +
                            '. Make sure the get method exists and is decorated with @linkedProperty / @objectProperty / @literalProperty');
                    }
                }
                //otherwise return the value of the property on the original shape
                return originalShapeSet[key];
            },
        });
        return queryShapeSet.proxy;
    };
    QueryShapeSet.prototype.concat = function (other) {
        if (other) {
            if (other instanceof QueryShapeSet) {
                other.queryShapes.forEach(this.queryShapes.add.bind(this.queryShapes));
            }
            else {
                throw new Error('Unknown type: ' + other);
            }
        }
        return this;
    };
    QueryShapeSet.prototype.filter = function (filterFn) {
        var clone = new QueryShapeSet(new ShapeSet_js_1.ShapeSet(), this.property, this.subject);
        clone.queryShapes = this.queryShapes.filter(filterFn);
        return clone;
    };
    QueryShapeSet.prototype.setSource = function (val) {
        this.queryShapes.forEach(function (shape) {
            shape.isSource = val;
        });
    };
    QueryShapeSet.prototype.getOriginalValue = function () {
        return new ShapeSet_js_1.ShapeSet(this.queryShapes.map(function (shape) {
            return shape.originalValue;
        }));
    };
    QueryShapeSet.prototype.callPropertyShapeAccessor = function (propertyShape) {
        //call the get method for that property shape on each item in the shape set
        //and return the result as a new shape set
        var result; //QueryValueSetOfSets;
        //if we expect the accessor to return a Primitive (string,number,boolean,Date)
        if (propertyShape.nodeKind === shacl_js_1.shacl.Literal) {
            //then return a Set of QueryPrimitives
            result = new QueryPrimitiveSet(propertyShape, this);
        }
        else {
            // result = QueryValueSetOfSets.create(propertyShape, this); //QueryShapeSet.create(null, propertyShape, this);
            result = QueryShapeSet.create(null, propertyShape, this);
        }
        var expectSingleValues = propertyShape.hasProperty(shacl_js_1.shacl.maxCount) && propertyShape.maxCount <= 1;
        this.queryShapes.forEach(function (shape) {
            //access the propertyShapes accessor,
            // since the shape should already be converted to a QueryShape, the result is a QueryValue also
            var shapeQueryValue = shape[propertyShape.label];
            //only add results if something was actually returned, if the property is not defined for this shape the result can be undefined
            if (shapeQueryValue) {
                if (expectSingleValues) {
                    result.add(shapeQueryValue);
                }
                else {
                    //if each of the shapes in a set return a new shapeset for the request accessor
                    //then we merge all the returned values into a single shapeset
                    result.concat(shapeQueryValue);
                }
            }
        });
        return result;
    };
    //countable?, resultKey?: string
    QueryShapeSet.prototype.size = function () {
        //when count() is called we want to count the number of items in the entire query path
        return new SetSize(this); //countable, resultKey
    };
    // get testItem() {}
    QueryShapeSet.prototype.where = function (validation) {
        if (this.getPropertyPath().some(function (step) { return step.where; })) {
            throw new Error('You cannot call where() from within a where() clause. Consider using some() or every() instead');
        }
        var leastSpecificShape = this.getOriginalValue().getLeastSpecificShape();
        this.wherePath = processWhereClause(validation, leastSpecificShape);
        //return this.proxy because after Shape.friends.where() we can call other methods of Shape.friends
        //and for that we need the proxy
        return this.proxy;
    };
    QueryShapeSet.prototype.select = function (subQueryFn) {
        var leastSpecificShape = this.getOriginalValue().getLeastSpecificShape();
        var subQuery = new LinkedQuery(leastSpecificShape, subQueryFn);
        subQuery.parentQueryPath = this.getPropertyPath();
        return subQuery;
    };
    QueryShapeSet.prototype.some = function (validation) {
        return this.someOrEvery(validation, WhereMethods.SOME);
    };
    QueryShapeSet.prototype.every = function (validation) {
        return this.someOrEvery(validation, WhereMethods.EVERY);
    };
    QueryShapeSet.prototype.someOrEvery = function (validation, method) {
        var leastSpecificShape = this.getOriginalValue().getLeastSpecificShape();
        //do we need to store this here? or are we accessing the evaluation and then going backwards?
        //in that case just pass it to the evaluation and don't use this.wherePath
        var wherePath = processWhereClause(validation, leastSpecificShape);
        return new SetEvaluation(this, method, [wherePath]);
    };
    return QueryShapeSet;
}(QueryBuilderObject));
exports.QueryShapeSet = QueryShapeSet;
var QueryShape = /** @class */ (function (_super) {
    __extends(QueryShape, _super);
    function QueryShape(originalValue, property, subject) {
        var _this = _super.call(this, property, subject) || this;
        _this.originalValue = originalValue;
        return _this;
    }
    // where(validation: WhereClause<S>): this {
    //   let nodeShape = this.originalValue.nodeShape;
    //   this.wherePath = processWhereClause(validation, nodeShape);
    //   //return this because after Shape.friends.where() we can call other methods of Shape.friends
    //   return this.proxy;
    // }
    QueryShape.create = function (original, property, subject) {
        var instance = new QueryShape(original, property, subject);
        var proxy = this.proxifyQueryShape(instance);
        return proxy;
    };
    QueryShape.proxifyQueryShape = function (queryShape) {
        var originalShape = queryShape.originalValue;
        queryShape.proxy = new Proxy(queryShape, {
            get: function (target, key, receiver) {
                //if the key is a string
                if (typeof key === 'string') {
                    //if this is a get method that is implemented by the QueryShape, then use that
                    if (key in queryShape) {
                        //if it's a function, then bind it to the queryShape and return it so it can be called
                        if (typeof queryShape[key] === 'function') {
                            return target[key].bind(target);
                        }
                        //if it's a get method, then return that
                        //NOTE: we may not need this if we don't use any get methods in QueryValue classes?
                        return queryShape[key];
                    }
                    //if not, then a method/accessor of the original shape was called
                    //then check if we have indexed any property shapes with that name for this shapes NodeShape
                    //NOTE: this will only work with a @linkedProperty decorator
                    // let propertyShape = originalShape.nodeShape
                    //   .getPropertyShapes()
                    //   .find((propertyShape) => propertyShape.label === key);
                    var propertyShape = (0, ShapeClass_js_1.getPropertyShapeByLabel)(originalShape.constructor, key);
                    if (propertyShape) {
                        //get the value of the property from the original shape
                        var value = originalShape[key];
                        //convert the value into a query value
                        return QueryBuilderObject.convertOriginal(value, propertyShape, queryShape);
                    }
                }
                //otherwise return the value of the property on the original shape
                throw new Error("".concat(originalShape.constructor.name, ".").concat(key.toString(), " is missing a @linkedProperty decorator. Queries can only access decorated get/set methods."));
                //return originalShape[key];
            },
        });
        return queryShape.proxy;
    };
    return QueryShape;
}(QueryBuilderObject));
exports.QueryShape = QueryShape;
var BoundComponent = /** @class */ (function (_super) {
    __extends(BoundComponent, _super);
    function BoundComponent(originalValue, source) {
        var _this = _super.call(this, null, null) || this;
        _this.originalValue = originalValue;
        _this.source = source;
        return _this;
    }
    BoundComponent.prototype.getPropertyPath = function () {
        //get the path that is passed to Component.of(some.path.here)
        var sourcePath = this.source.getPropertyPath();
        //add the path steps that this component itself requires (so we are combining the data request of 2 components)
        // let childRequests = [];
        // this.dataRequest.forEach((queryStep) => {
        //   childRequests.push(queryStep);
        // });
        var compSelectQuery = this.originalValue.query.select;
        if (Array.isArray(sourcePath)) {
            //add the path steps that this component itself requires (so we are combining the data request of 2 components)
            //if this component only requests one path, then add it directly so that the query object stays flat
            sourcePath.push(compSelectQuery.length === 1
                ? compSelectQuery[0].length === 1
                    ? compSelectQuery[0][0]
                    : compSelectQuery[0]
                : compSelectQuery);
            // sourcePath.push({
            // component: this,
            // path: childRequests as any,
            // });
        }
        return sourcePath;
    };
    return BoundComponent;
}(QueryBuilderObject));
exports.BoundComponent = BoundComponent;
var Evaluation = /** @class */ (function () {
    function Evaluation(value, method, args) {
        this.value = value;
        this.method = method;
        this.args = args;
        this._andOr = [];
    }
    Evaluation.prototype.getPropertyPath = function () {
        return this.getWherePath();
    };
    Evaluation.prototype.getWherePath = function () {
        var evalPath = {
            path: this.value.getPropertyPath(),
            method: this.method,
            args: this.args,
        };
        if (this._andOr.length > 0) {
            return {
                firstPath: evalPath,
                andOr: this._andOr,
            };
        }
        return evalPath;
    };
    Evaluation.prototype.and = function (subQuery) {
        this._andOr.push({
            and: processWhereClause(subQuery),
        });
        return this;
    };
    Evaluation.prototype.or = function (subQuery) {
        this._andOr.push({
            or: processWhereClause(subQuery),
        });
        return this;
    };
    return Evaluation;
}());
exports.Evaluation = Evaluation;
var SetEvaluation = /** @class */ (function (_super) {
    __extends(SetEvaluation, _super);
    function SetEvaluation() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return SetEvaluation;
}(Evaluation));
var QueryBoolean = /** @class */ (function (_super) {
    __extends(QueryBoolean, _super);
    function QueryBoolean(property, subject) {
        return _super.call(this, property, subject) || this;
    }
    return QueryBoolean;
}(QueryBuilderObject));
/**
 * The class that is used for when JS primitives are converted to a QueryValue
 * This is extended by QueryString, QueryNumber, QueryBoolean, etc
 */
var QueryPrimitive = /** @class */ (function (_super) {
    __extends(QueryPrimitive, _super);
    function QueryPrimitive(originalValue, property, subject) {
        var _this = _super.call(this, property, subject) || this;
        _this.originalValue = originalValue;
        _this.property = property;
        _this.subject = subject;
        return _this;
    }
    QueryPrimitive.prototype.equals = function (otherValue) {
        return new Evaluation(this, WhereMethods.EQUALS, [otherValue]);
    };
    QueryPrimitive.prototype.where = function (validation) {
        // let nodeShape = this.subject.getOriginalValue().nodeShape;
        this.wherePath = processWhereClause(validation, new QueryString(''));
        //return this because after Shape.friends.where() we can call other methods of Shape.friends
        return this;
    };
    return QueryPrimitive;
}(QueryBuilderObject));
exports.QueryPrimitive = QueryPrimitive;
var QueryString = /** @class */ (function (_super) {
    __extends(QueryString, _super);
    function QueryString() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return QueryString;
}(QueryPrimitive));
exports.QueryString = QueryString;
var QueryDate = /** @class */ (function (_super) {
    __extends(QueryDate, _super);
    function QueryDate() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return QueryDate;
}(QueryPrimitive));
exports.QueryDate = QueryDate;
var QueryNumber = /** @class */ (function (_super) {
    __extends(QueryNumber, _super);
    function QueryNumber() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return QueryNumber;
}(QueryPrimitive));
exports.QueryNumber = QueryNumber;
var QueryPrimitiveSet = /** @class */ (function () {
    function QueryPrimitiveSet(property, subject, items) {
        this.property = property;
        this.subject = subject;
        this.contents = new CoreSet_js_1.CoreSet(items);
    }
    QueryPrimitiveSet.prototype.add = function (item) {
        this.contents.add(item);
    };
    QueryPrimitiveSet.prototype.values = function () {
        return this.contents.values();
    };
    //this is needed because we extend CoreSet which has a createNew method but does not expect the constructor to have arguments
    QueryPrimitiveSet.prototype.createNew = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return new ((_a = this.constructor).bind.apply(_a, __spreadArray([void 0, this.property,
            this.subject], __read(args), false)))();
    };
    //TODO: see if we can merge these methods of QueryString and QueryPrimitiveSet and soon other things like QueryNumber
    // so that they're only defined once
    QueryPrimitiveSet.prototype.equals = function (other) {
        return new Evaluation(this, WhereMethods.EQUALS, [other]);
    };
    QueryPrimitiveSet.prototype.getPropertyStep = function () {
        if (this.contents.size > 1) {
            throw new Error('This should never happen? Not implemented: get property path for a QueryPrimitiveSet with multiple values');
        }
        return this.contents.first().getPropertyStep();
    };
    QueryPrimitiveSet.prototype.getPropertyPath = function () {
        if (this.contents.size > 1) {
            throw new Error('This should never happen? Not implemented: get property path for a QueryPrimitiveSet with multiple values');
        }
        //here we let the first item in the set return its property path, because all items will be the same
        //however, sometimes the path goes through the subject of this SET rather than the individual items (which have an individual shape as subject)
        //so we pass the subject of this set so it can be used
        var first = this.contents.first();
        first.subject.wherePath =
            first.subject.wherePath || this.subject.wherePath;
        return this.contents.first().getPropertyPath();
    };
    //countable, resultKey?: string
    QueryPrimitiveSet.prototype.size = function () {
        return new SetSize(this);
        //countable, resultKey
    };
    return QueryPrimitiveSet;
}());
exports.QueryPrimitiveSet = QueryPrimitiveSet;
var LinkedQuery = /** @class */ (function () {
    function LinkedQuery(shape, queryBuildFn, subject) {
        this.shape = shape;
        this.queryBuildFn = queryBuildFn;
        this.subject = subject;
        var dummyNode = new TraceShape_js_1.TestNode();
        var queryShape;
        //if the given class already extends QueryValue
        if (shape instanceof QueryBuilderObject) {
            //then we're likely dealing with QueryPrimitives (end values like strings)
            //and we can use the given query value directly for the query evaluation
            queryShape = shape;
        }
        else {
            //else a shape class is given, and we need to create a dummy node to apply and trace the query
            var dummyShape = new shape(dummyNode);
            queryShape = QueryShape.create(dummyShape);
        }
        if (queryBuildFn) {
            var queryResponse = this.queryBuildFn(queryShape, this);
            this.traceResponse = queryResponse;
        }
    }
    LinkedQuery.prototype.setLimit = function (limit) {
        this.limit = limit;
    };
    LinkedQuery.prototype.getLimit = function () {
        return this.limit;
    };
    LinkedQuery.prototype.setOffset = function (offset) {
        this.offset = offset;
    };
    LinkedQuery.prototype.getOffset = function () {
        return this.offset;
    };
    LinkedQuery.prototype.setSubject = function (subject) {
        this.subject = subject;
    };
    // applyTo(subject) {
    //   return new LinkedQuery(this.shape, this.queryBuildFn, subject);
    // }
    LinkedQuery.prototype.where = function (validation) {
        this.wherePath = processWhereClause(validation, this.shape);
        return this;
    };
    LinkedQuery.prototype.exec = function () {
        return Shape_js_1.StorageHelper.query(this);
    };
    LinkedQuery.prototype.getQueryObject = function () {
        var queryPaths = this.getQueryPaths();
        var selectQuery = {
            select: queryPaths,
            subject: this.subject,
            limit: this.limit,
            offset: this.offset,
        };
        if (this.wherePath) {
            selectQuery.where = this.wherePath;
        }
        return selectQuery;
    };
    /**
     * Returns an array of query paths
     * A single query can request multiple things in multiple "query paths" (For example this is using 2 paths: Shape.select(p => [p.name, p.friends.name]))
     * Each query path is returned as array of the property paths requested, with potential where clauses (together called a QueryStep)
     */
    LinkedQuery.prototype.getQueryPaths = function () {
        var _this = this;
        var queryPaths = [];
        var queryObject;
        //if the trace response is an array, then multiple paths were requested
        if (this.traceResponse instanceof QueryBuilderObject ||
            this.traceResponse instanceof QueryPrimitiveSet) {
            //if it's a single value, then only one path was requested, and we can add it directly
            queryPaths.push(this.traceResponse.getPropertyPath());
        }
        else if (Array.isArray(this.traceResponse) ||
            this.traceResponse instanceof Set) {
            this.traceResponse.forEach(function (endValue) {
                queryPaths.push(endValue.getPropertyPath());
            });
        }
        else if (this.traceResponse instanceof Evaluation) {
            queryPaths.push(this.traceResponse.getWherePath());
        }
        else if (this.traceResponse instanceof LinkedQuery) {
            queryPaths.push(this.traceResponse.getQueryPaths());
        }
        else if (!this.traceResponse) {
            //that's totally fine. For example Person.select().where(p => p.name.equals('John'))
            //will return all persons with the name John, but no properties are selected for these persons
        }
        //if it's an object
        else if (typeof this.traceResponse === 'object') {
            queryObject = {};
            //then loop over all the keys
            Object.getOwnPropertyNames(this.traceResponse).forEach(function (key) {
                //and add the property paths for each key
                var value = _this.traceResponse[key];
                //TODO: we could potentially make Evaluation extend QueryValue, and rename getPropertyPath to something more generic,
                //that way we can simplify the code perhaps? Or would we loose type clarity? (QueryStep is the generic one for QueryValue, and Evaluation can just return WherePath right?)
                if (value instanceof QueryBuilderObject ||
                    value instanceof QueryPrimitiveSet) {
                    queryObject[key] = value.getPropertyPath();
                }
                else if (value instanceof Evaluation) {
                    queryObject[key] = value.getWherePath();
                }
                else {
                    throw Error('Unknown trace response type for key ' + key);
                }
            });
        }
        else {
            throw Error('Unknown trace response type');
        }
        if (this.parentQueryPath) {
            queryPaths = this.parentQueryPath.concat([
                queryObject || queryPaths,
            ]);
            //reset the variable so it doesn't get used again below
            queryObject = null;
        }
        return queryObject || queryPaths;
    };
    LinkedQuery.prototype.isValidSetResult = function (qResults) {
        var _this = this;
        return qResults.every(function (qResult) {
            return _this.isValidResult(qResult);
        });
    };
    LinkedQuery.prototype.isValidResult = function (qResult) {
        var select = this.getQueryObject().select;
        if (Array.isArray(select)) {
            return this.isValidQueryPathsResult(qResult, select);
        }
        else if (typeof select === 'object') {
            return this.isValidCustomObjectResult(qResult, select);
        }
    };
    LinkedQuery.prototype.clone = function () {
        return new LinkedQuery(this.shape, this.queryBuildFn, this.subject);
    };
    LinkedQuery.prototype.patchResultPromise = function (p) {
        var _this = this;
        var pAdjusted = p;
        p['where'] = function (validation) {
            // preventExec();
            _this.where(validation);
            return pAdjusted;
        };
        p['limit'] = function (lim) {
            _this.setLimit(lim);
            return pAdjusted;
        };
        return p;
    };
    LinkedQuery.prototype.isValidQueryPathsResult = function (qResult, select) {
        var _this = this;
        return select.every(function (path) {
            return _this.isValidQueryPathResult(qResult, path);
        });
    };
    LinkedQuery.prototype.isValidQueryPathResult = function (qResult, path) {
        if (Array.isArray(path)) {
            return this.isValidQueryStepResult(qResult, path[0], path.splice(1));
        }
        else {
            if (path.firstPath) {
                return this.isValidQueryPathResult(qResult, path.firstPath);
            }
            else if (path.path) {
                return this.isValidQueryPathResult(qResult, path.path);
            }
        }
    };
    LinkedQuery.prototype.isValidQueryStepResult = function (qResult, step, restPath) {
        var _this = this;
        if (restPath === void 0) { restPath = []; }
        if (step.property) {
            if (!qResult.hasOwnProperty(step.property.label)) {
                return false;
            }
            if (restPath.length > 0) {
                return this.isValidQueryStepResult(qResult[step.property.label], restPath[0], restPath.splice(1));
            }
            return true;
        }
        else if (step.count) {
            return this.isValidQueryStepResult(qResult, step.count[0]);
        }
        else if (Array.isArray(step)) {
            return step.every(function (subStep) {
                return _this.isValidQueryPathResult(qResult, subStep);
            });
        }
        else if (typeof step === 'object') {
            return this.isValidCustomObjectResult(qResult, step);
        }
    };
    LinkedQuery.prototype.isValidCustomObjectResult = function (qResult, step) {
        //for custom objects, all keys need to be defined, even if the value is undefined
        for (var key in step) {
            if (!qResult.hasOwnProperty(key)) {
                return false;
            }
            var path = step[key];
            return this.isValidQueryPathResult(qResult[key], path);
        }
    };
    return LinkedQuery;
}());
exports.LinkedQuery = LinkedQuery;
var SetSize = /** @class */ (function (_super) {
    __extends(SetSize, _super);
    function SetSize(subject, countable, label) {
        var _this = _super.call(this) || this;
        _this.subject = subject;
        _this.countable = countable;
        _this.label = label;
        return _this;
    }
    SetSize.prototype.as = function (label) {
        this.label = label;
        return this;
    };
    SetSize.prototype.getPropertyPath = function () {
        //if a countable argument was given
        // if (this.countable) {
        //then creating the count step is straightforward
        // let countablePath = this.countable.getPropertyPath();
        // if (countablePath.some((step) => Array.isArray(step))) {
        //   throw new Error(
        //     'Cannot count a diverging path. Provide one path of properties to count',
        //   );
        // }
        // let self: CountStep = {
        //   count: this.countable?.getPropertyPath(),
        //   label: this.label,
        // };
        // //and we can add the count step to the path of the subject
        // let parent = this.subject.getPropertyPath();
        // parent.push(self);
        // return parent;
        // } else {
        //if nothing to count was given as an argument,
        //then we just count the last property in the path
        //also, we use the label of the last property as the label of the count step
        var countable = this.subject.getPropertyStep();
        var self = {
            count: [countable],
            label: this.label || this.subject.property.label,
        };
        //in that case we request the path of the subject of the subject (the parent of the parent)
        //and add the CountStep to that path
        //since we already used the subject as the thing that's counted.
        if (this.subject.subject) {
            var path = this.subject.subject.getPropertyPath();
            path.push(self);
            return path;
        }
        //if there is no parent of a parent, then we just return the count step as the whole path
        return [self];
        // }
    };
    return SetSize;
}(QueryNumber));
exports.SetSize = SetSize;
/**
 * A sub query that is used to filter results
 * i.e p.friends.where(f => //LinkedWhereQuery here)
 */
var LinkedWhereQuery = /** @class */ (function (_super) {
    __extends(LinkedWhereQuery, _super);
    function LinkedWhereQuery() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LinkedWhereQuery.prototype.getResponse = function () {
        return this.traceResponse;
    };
    LinkedWhereQuery.prototype.getWherePath = function () {
        return this.traceResponse.getWherePath();
    };
    return LinkedWhereQuery;
}(LinkedQuery));
exports.LinkedWhereQuery = LinkedWhereQuery;
//# sourceMappingURL=LinkedQuery.js.map