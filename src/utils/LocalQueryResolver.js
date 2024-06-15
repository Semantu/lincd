"use strict";
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
exports.resolveLocalEndResults = exports.resolveLocal = void 0;
var LinkedQuery_js_1 = require("./LinkedQuery.js");
var ShapeSet_js_1 = require("../collections/ShapeSet.js");
var Shape_js_1 = require("../shapes/Shape.js");
var shacl_js_1 = require("../ontologies/shacl.js");
var CoreMap_js_1 = require("../collections/CoreMap.js");
var ShapeValuesSet_js_1 = require("../collections/ShapeValuesSet.js");
var primitiveTypes = ['string', 'number', 'boolean', 'Date'];
/**
 * Resolves the query locally, by searching the graph in local memory, without using stores.
 * Returns the result immediately.
 * The results will be the end point reached by the query
 */
function resolveLocal(query, shape) {
    var subject = query.subject
        ? query.subject
        : shape.getLocalInstances();
    if (query.where) {
        subject = filterResults(subject, query.where);
    }
    if (query.limit && subject instanceof ShapeSet_js_1.ShapeSet) {
        subject = subject.slice(query.offset || 0, (query.offset || 0) + query.limit);
    }
    var resultObjects = query.subject instanceof ShapeSet_js_1.ShapeSet
        ? shapeSetToResultObjects(subject)
        : query.subject instanceof Shape_js_1.Shape
            ? shapeToResultObject(subject)
            : shapeSetToResultObjects(subject);
    if (Array.isArray(query.select)) {
        query.select.forEach(function (queryPath) {
            resolveQueryPath(subject, queryPath, resultObjects);
        });
    }
    else {
        var r = function (singleShape) {
            return resolveCustomObject(singleShape, query.select, resultObjects instanceof Map
                ? resultObjects.get(singleShape.uri)
                : resultObjects);
        };
        query.subject ? r(subject) : subject.map(r);
    }
    return (resultObjects instanceof Map ? __spreadArray([], __read(resultObjects.values()), false) : resultObjects);
}
exports.resolveLocal = resolveLocal;
/**
 * resolves each key of the custom query object
 * and writes the result to the resultObject with the same keys
 * @param subject
 * @param query
 * @param resultObject
 */
function resolveCustomObject(subject, query, resultObject) {
    var e_1, _a;
    try {
        // let customResult = shapeToResultObject(subject);
        for (var _b = __values(Object.getOwnPropertyNames(query)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var key = _c.value;
            //wrong... we need to write the result to the resultObject
            //can we find which key was written and take that and use the key?
            var result = resolveQueryPath(subject, query[key]);
            resultObject[key] = result;
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return resultObject;
}
function resolveLocalEndResults(query, subject, queryPaths) {
    queryPaths = queryPaths || query.getQueryPaths();
    subject = subject || query.shape.getLocalInstances();
    var results = [];
    if (Array.isArray(queryPaths)) {
        queryPaths.forEach(function (queryPath) {
            results.push(resolveQueryPathEndResults(subject, queryPath));
        });
    }
    else {
        throw new Error('TODO: implement support for custom query object: ' + queryPaths);
    }
    // convert the result of each instance into the shape that was requested
    if (query.traceResponse instanceof LinkedQuery_js_1.QueryBuilderObject) {
        //even though resolveQueryPaths always returns an array, if a single value was requested
        //we will return the first value of that array to match the request
        return results.shift();
        //map((result) => {
        //return result.shift();
        //});
    }
    else if (Array.isArray(query.traceResponse)) {
        //nothing to convert if an array was requested
        return results;
    }
    else if (
    // query.traceResponse instanceof QueryValueSetOfSets ||
    query.traceResponse instanceof LinkedQuery_js_1.LinkedQuery) {
        return results.shift();
    }
    else if (query.traceResponse instanceof LinkedQuery_js_1.QueryPrimitiveSet ||
        query.traceResponse instanceof LinkedQuery_js_1.Evaluation) {
        //TODO: see how traceResponse is made for QueryValue. Here we need to return an array of the first item in the results?
        //does that also work if there is multiple values?
        //do we need to check the size of the traceresponse
        //why is a CoreSet created? start there
        return results.length > 0 ? __spreadArray([], __read(results[0]), false) : [];
    }
    else if (typeof query.traceResponse === 'object') {
        throw new Error('Objects are not yet supported');
    }
}
exports.resolveLocalEndResults = resolveLocalEndResults;
function resolveQueryPath(subject, queryPath, resultObjects) {
    //start with the local instance as the subject
    if (Array.isArray(queryPath)) {
        //if the queryPath is an array of query steps, then resolve the query steps and let that convert the result
        return resolveQuerySteps(subject, queryPath, resultObjects);
    }
    else {
        if (subject instanceof Shape_js_1.Shape) {
            return evaluate(subject, queryPath);
        }
        return subject.map(function (singleShape) {
            return evaluate(singleShape, queryPath);
        });
    }
}
function resolveQueryPathEndResults(subject, queryPath) {
    //start with the local instance as the subject
    var result = subject;
    if (Array.isArray(queryPath)) {
        queryPath.forEach(function (queryStep) {
            //then resolve each of the query steps and use the result as the new subject for the next step
            result = resolveQueryStepEndResults(result, queryStep);
        });
    }
    else {
        result = subject.map(function (singleShape) {
            return evaluate(singleShape, queryPath);
        });
    }
    //return the final value at the end of the path
    return result;
}
function evaluateWhere(shape, method, args) {
    var filterMethod;
    if (method === LinkedQuery_js_1.WhereMethods.EQUALS) {
        filterMethod = resolveWhereEquals;
    }
    else if (method === LinkedQuery_js_1.WhereMethods.SOME) {
        filterMethod = resolveWhereSome;
    }
    else if (method === LinkedQuery_js_1.WhereMethods.EVERY) {
        filterMethod = resolveWhereEvery;
    }
    else {
        throw new Error('Unimplemented where method: ' + method);
    }
    return filterMethod.apply(null, __spreadArray([shape], __read(args), false));
}
/**
 * Filters down the given subjects to only those what match the where clause
 * @param subject
 * @param where
 * @private
 */
function filterResults(subject, where, resultObjects) {
    // if ((where as WhereEvaluationPath).path) {
    //for nested where clauses the subject will already be a QueryValue
    //TODO: check if subject is ever not a shape, shapeset or string
    //we're about to remove values from the subject set, so we need to clone it first so that we don't alter the graph
    if (subject instanceof ShapeValuesSet_js_1.ShapeValuesSet) {
        subject = subject.clone();
    }
    if (subject instanceof ShapeSet_js_1.ShapeSet) {
        subject.forEach(function (singleShape) {
            if (!evaluate(singleShape, where)) {
                resultObjects === null || resultObjects === void 0 ? void 0 : resultObjects.delete(singleShape.uri);
                subject.delete(singleShape);
            }
        });
        return subject;
    }
    else if (subject instanceof Shape_js_1.Shape) {
        return evaluate(subject, where)
            ? subject
            : undefined;
    }
    else if (typeof subject === 'string') {
        return evaluate(subject, where)
            ? subject
            : undefined;
    }
    else {
        throw Error('Unknown subject type: ' + subject);
    }
}
function evaluate(singleShape, where) {
    if (where.path) {
        var shapeEndValue = resolveQueryPathEndResults(singleShape, where.path);
        //when multiple values are the subject of the evaluation
        //and, we're NOT evaluating some() or every()
        if ((shapeEndValue instanceof ShapeSet_js_1.ShapeSet || Array.isArray(shapeEndValue)) &&
            where.method !== LinkedQuery_js_1.WhereMethods.SOME &&
            where.method !== LinkedQuery_js_1.WhereMethods.EVERY) {
            //then by default we use some()
            //that means, if any of the results matches the where clause, then the subject shape is returned
            return shapeEndValue.some(function (singleEndValue) {
                return evaluateWhere(singleEndValue, where.method, where.args);
            });
        }
        return evaluateWhere(shapeEndValue, where.method, where.args);
    }
    else if (where.andOr) {
        //the first run we simply take the result as the combined result
        var initialResult = evaluate(singleShape, where.firstPath);
        var booleanPaths_1 = [initialResult];
        where.andOr.forEach(function (andOr) {
            if (andOr.and) {
                //if there is an and, we add the result of that and to the array
                booleanPaths_1.push({ and: evaluate(singleShape, andOr.and) });
            }
            else if (andOr.or) {
                //if there is an or, we add the result of that or to the array
                booleanPaths_1.push({ or: evaluate(singleShape, andOr.or) });
            }
        });
        //Say that we have: booleanPaths = [boolean,{and:boolean},{or:boolean},{and:boolean}]
        //We should first process the AND: by combining the results of 0 & 1 and also 2 & 3
        //So that it becomes: booleanPaths = [boolean,{or:boolean}]
        var i = booleanPaths_1.length;
        while (i--) {
            var previous = booleanPaths_1[i - 1];
            var current = booleanPaths_1[i];
            if (typeof previous === 'undefined' || typeof current === 'undefined')
                break;
            //if the previous is a ShapeSet and the current is a ShapeSet, we combine them
            if (current.hasOwnProperty('and')) {
                if (previous.hasOwnProperty('and')) {
                    booleanPaths_1[i - 1].and =
                        previous.and && current.and;
                }
                else if (previous.hasOwnProperty('or')) {
                    booleanPaths_1[i - 1].or =
                        previous.or && current.and;
                }
                else if (typeof previous === 'boolean') {
                    booleanPaths_1[i - 1] = previous && current.and;
                }
                booleanPaths_1.splice(i, 1);
            }
        }
        //next we process the OR clauses
        var i = booleanPaths_1.length;
        while (i--) {
            var previous = booleanPaths_1[i - 1];
            var current = booleanPaths_1[i];
            if (typeof previous === 'undefined' || typeof current === 'undefined')
                break;
            //for all or clauses, keep the results that are in either of the sets, so simply combine them
            if (current.hasOwnProperty('or')) {
                if (previous.hasOwnProperty('and')) {
                    booleanPaths_1[i - 1].and =
                        previous.and || current.or;
                }
                else if (previous.hasOwnProperty('or')) {
                    booleanPaths_1[i - 1].or =
                        previous.or || current.or;
                }
                else if (typeof previous === 'boolean') {
                    booleanPaths_1[i - 1] = previous || current.or;
                }
                //remove the current item from the array now that its processed
                booleanPaths_1.splice(i, 1);
            }
        }
        if (booleanPaths_1.length > 1) {
            throw new Error('booleanPaths should only have one item left: ' + booleanPaths_1.length);
        }
        //there should only be a single boolean left
        return booleanPaths_1[0];
    }
}
function resolveWhereEquals(queryEndValue, otherValue) {
    return queryEndValue === otherValue;
}
function resolveWhereSome(shapes, evaluation) {
    return shapes.some(function (singleShape) {
        return evaluate(singleShape, evaluation);
    });
}
function resolveWhereEvery(shapes, evaluation) {
    //there is an added check to see if there are any shapes
    // because for example for this query where(p => p.friends.every(f => f.name.equals('Semmy')))
    // it would be natural to expect that if there are no friends, the query would return false
    return (shapes.size > 0 &&
        shapes.every(function (singleShape) {
            return evaluate(singleShape, evaluation);
        }));
}
function resolveQuerySteps(subject, queryPath, resultObjects) {
    if (queryPath.length === 0) {
        return subject;
    }
    //queryPath.slice(1,queryPath.length);
    var _a = __read(queryPath), currentStep = _a[0], restPath = _a.slice(1);
    if (subject instanceof Shape_js_1.Shape) {
        if (Array.isArray(currentStep)) {
            return resolveQueryPathsForShape(queryPath, subject, resultObjects);
        }
        //TODO: review differences between shape vs shapes and make it DRY
        return resolveQueryStepForShape(currentStep, subject, restPath, resultObjects);
        // } else if (subject instanceof CoreMap) {
    }
    else if (subject instanceof ShapeSet_js_1.ShapeSet) {
        // let resultObjects = shapeSetToResultObjects(subject);
        if (Array.isArray(currentStep)) {
            // debugger;
            resolveQueryPathsForShapes(currentStep, subject, restPath, resultObjects);
        }
        else {
            resolveQueryStepForShapes(currentStep, subject, resultObjects, restPath);
        }
        //return converted subjects
        return subject;
        //turn the map into an array of results
        // return [...resultObjects.values()];
    }
    else {
        throw new Error('Unknown subject type: ' + typeof subject);
    }
}
function shapeToResultObject(subject) {
    return {
        id: subject.uri,
        shape: subject,
    };
}
function shapeSetToResultObjects(subject) {
    //create the start of the result JS object for each subject node
    var resultObjects = new CoreMap_js_1.CoreMap();
    subject.forEach(function (sub) {
        resultObjects.set(sub.uri, shapeToResultObject(sub));
    });
    return resultObjects;
}
function resolveQueryStepEndResults(subject, queryStep) {
    if (subject instanceof Shape_js_1.Shape) {
        if (Array.isArray(queryStep)) {
            return resolveQueryPathsForShapeEndResults(queryStep, subject);
        }
        //TODO: review differences between shape vs shapes and make it DRY
        return resolveQueryStepForShapeEndResults(queryStep, subject);
    }
    if (subject instanceof ShapeSet_js_1.ShapeSet) {
        if (Array.isArray(queryStep)) {
            return resolveQueryPathsForShapesEndResults(queryStep, subject);
        }
        return resolveQueryStepForShapesEndResults(queryStep, subject);
    }
    else {
        throw new Error('Unknown subject type: ' + typeof subject);
    }
}
function resolveQueryPathsForShapes(queryPaths, subjects, restPath, resultObjects) {
    var results = [];
    subjects.forEach(function (subject) {
        var resultObject = resultObjects.get(subject.uri);
        var subjectResult = resolveQueryPathsForShape(queryPaths, subject, resultObject);
        var subResult = resolveQuerySteps(subjectResult, restPath, resultObject);
        results.push(subResult);
    });
    return results;
}
function resolveQueryPathsForShapesEndResults(queryPaths, subjects) {
    var results = [];
    subjects.forEach(function (subject) {
        results.push(resolveQueryPathsForShapeEndResults(queryPaths, subject));
    });
    return results;
}
function resolveQueryPathsForShape(queryPaths, subject, resultObject) {
    if (Array.isArray(queryPaths)) {
        return queryPaths.map(function (queryPath) {
            return resolveQueryPath(subject, queryPath, resultObject);
        });
    }
    else {
        throw new Error('TODO: implement support for custom query object: ' + queryPaths);
    }
}
function resolveQueryPathsForShapeEndResults(queryPaths, subject) {
    if (Array.isArray(queryPaths)) {
        return queryPaths.map(function (queryPath) {
            return resolveQueryPathEndResults(subject, queryPath);
        });
    }
    else {
        throw new Error('TODO: implement support for custom query object: ' + queryPaths);
    }
}
function resolveQueryStepForShape(queryStep, subject, restPath, resultObject) {
    if (queryStep.property) {
        return resolvePropertyStep(subject, queryStep, restPath, resultObject);
    }
    else if (queryStep.count) {
        return resolveCountStep(subject, queryStep, resultObject);
    }
    else if (queryStep.where) {
        throw new Error('Cannot filter a single shape');
        // } else if ((queryStep as BoundComponentQueryStep).component) {
        //   return (queryStep as BoundComponentQueryStep).component.create(subject);
    }
    else if (typeof queryStep === 'object') {
        return resolveCustomObject(subject, queryStep, resultObject);
    }
    else {
        throw Error('Unknown query step: ' + queryStep);
    }
}
function resolveQueryStepForShapeEndResults(queryStep, subject) {
    if (queryStep.property) {
        var result = subject[queryStep.property.label];
        if (queryStep.where) {
            result = filterResults(result, queryStep.where);
        }
        return result;
    }
    else if (queryStep.count) {
        return resolveCountStep(subject, queryStep);
    }
    else if (queryStep.where) {
        //in some cases there is a query step without property but WITH where
        //this happens when the where clause is on the root of the query
        //like Person.select(p => p.where(...))
        //in that case the where clause is directly applied to the given subject
        debugger;
        // let whereResult = resolveWhere(subject as ShapeSet, queryStep.where);
        // return whereResult;
        // } else if ((queryStep as BoundComponentQueryStep).component) {
        //   return (queryStep as BoundComponentQueryStep).component.create(subject);
        //   debugger;
    }
    else {
        throw Error('Unknown query step: ' + queryStep.toString());
    }
}
function resolvePropertyStep(singleShape, queryStep, restPath, resultObjects) {
    //directly access the get/set method of the shape
    var stepResult = singleShape[queryStep.property.label];
    var subResultObjects;
    if (stepResult instanceof ShapeSet_js_1.ShapeSet) {
        subResultObjects = shapeSetToResultObjects(stepResult);
    }
    if (stepResult instanceof Shape_js_1.Shape) {
        subResultObjects = shapeToResultObject(stepResult);
    }
    if (queryStep.where) {
        stepResult = filterResults(stepResult, queryStep.where, subResultObjects);
        //if the result is empty, then the shape didn't make it through the filter and needs to be removed from the results
        // if (typeof stepResult === 'undefined' || stepResult === null) {
        //   resultObjects.delete(singleShape.uri);
        //   return;
        // }
        //if the filtered result is null or undefined, then we don't need to add it to the result object
        if (typeof stepResult === 'undefined' || stepResult === null) {
            return;
        }
    }
    if (restPath.length > 0 && typeof stepResult !== 'undefined') {
        //if there is more properties left, continue to fill the result object by resolving the next steps
        stepResult = resolveQuerySteps(stepResult, restPath, subResultObjects);
    }
    if (subResultObjects) {
        stepResult =
            subResultObjects instanceof Map
                ? __spreadArray([], __read(subResultObjects.values()), false) : subResultObjects;
    }
    // if (stepResult instanceof ShapeSet) {
    //   stepResult = [...subResultObjects.values()];
    // }
    // if (stepResult instanceof Shape) {
    //   stepResult = subResultObjects;
    // }
    //get the current result object for this shape
    if (resultObjects) {
        var nodeResult = resultObjects instanceof Map
            ? resultObjects.get(singleShape.uri)
            : resultObjects;
        //write the result for this property into the result object
        nodeResult[queryStep.property.label] = stepResult;
        return subResultObjects ? nodeResult : stepResult;
    }
    // nodeResult[(queryStep as PropertyQueryStep).property.label] = subResultObjects
    //   ? subResultObjects instanceof Map
    //     ? [...subResultObjects.values()]
    //     : subResultObjects
    //   : stepResult;
    // return stepResult;
    return stepResult;
    // resultObjects
    //   ? resultObjects instanceof Map
    //     ? [...resultObjects.values()]
    //     : resultObjects
    //   : stepResult;
}
function resolveCountStep(singleShape, queryStep, resultObjects) {
    //We use the flat version of resolveQuerySteps here, because  we don't need QResult objects here
    // we're only interested in the final results
    var countable = resolveQueryPathEndResults(singleShape, queryStep.count);
    var result;
    if (Array.isArray(countable)) {
        result = countable.length;
    }
    else if (countable instanceof Set) {
        result = countable.size;
    }
    else {
        throw Error('Not sure how to count this: ' + countable.toString());
    }
    updateResultObjects(singleShape, queryStep, result, resultObjects, 'count');
    return result;
}
function updateResultObjects(singleShape, queryStep, result, resultObjects, defaultLabel) {
    if (resultObjects) {
        var nodeResult = resultObjects instanceof Map
            ? resultObjects.get(singleShape.uri)
            : resultObjects;
        if (nodeResult) {
            nodeResult[queryStep.label || defaultLabel] = result;
        }
    }
}
function resolveQueryStepForShapes(queryStep, subject, resultObjects, restPath) {
    if (queryStep.property) {
        subject.forEach(function (singleShape) {
            resolvePropertyStep(singleShape, queryStep, restPath, resultObjects);
        });
        // return result;
    }
    else if (queryStep.count) {
        //count the countable
        subject.forEach(function (singleShape) {
            resolveCountStep(singleShape, queryStep, resultObjects);
        });
    }
    else if (queryStep.where) {
        //in some cases there is a query step without property but WITH where
        //this happens when the where clause is on the root of the query
        //like Person.select(p => p.where(...))
        //in that case the where clause is directly applied to the given subject
        subject = filterResults(subject, queryStep.where, resultObjects);
        if (restPath.length > 0) {
            //if there is more properties left, continue to fill the result object by resolving the next steps
            resolveQuerySteps(subject, restPath, resultObjects);
        }
        // return whereResult;
    }
    else if (typeof queryStep === 'object') {
        subject.forEach(function (singleShape) {
            resolveCustomObject(singleShape, queryStep, resultObjects ? resultObjects.get(singleShape.uri) : null);
        });
    }
}
function resolveQueryStepForShapesEndResults(queryStep, subject) {
    if (queryStep.property) {
        //if the propertyshape states that it only accepts literal values in the graph,
        // then the result will be an Array
        var result_1 = queryStep.property.nodeKind === shacl_js_1.shacl.Literal ||
            queryStep.count
            ? []
            : new ShapeSet_js_1.ShapeSet();
        subject.forEach(function (singleShape) {
            //directly access the get/set method of the shape
            var stepResult = singleShape[queryStep.property.label];
            if (queryStep.where) {
                stepResult = filterResults(stepResult, queryStep.where);
            }
            if (queryStep.count) {
                if (Array.isArray(stepResult)) {
                    stepResult = stepResult.length;
                }
                else if (stepResult instanceof Set) {
                    stepResult = stepResult.size;
                }
                else {
                    throw Error('Not sure how to count this: ' + stepResult.toString());
                }
            }
            if (typeof stepResult === 'undefined' || stepResult === null) {
                return;
            }
            if (stepResult instanceof ShapeSet_js_1.ShapeSet) {
                stepResult = __spreadArray([], __read(stepResult), false);
            }
            if (stepResult instanceof ShapeSet_js_1.ShapeSet) {
                result_1 = result_1.concat(stepResult);
            }
            else if (Array.isArray(stepResult)) {
                result_1 = result_1.concat(stepResult);
            }
            else if (stepResult instanceof Shape_js_1.Shape) {
                result_1.add(stepResult);
            }
            else if (primitiveTypes.includes(typeof stepResult)) {
                result_1.push(stepResult);
            }
            else {
                throw Error('Unknown result type: ' +
                    typeof stepResult +
                    ' for property ' +
                    queryStep.property.label +
                    ' on shape ' +
                    singleShape.toString() +
                    ')');
            }
        });
        return result_1;
    }
    else if (queryStep.where) {
        //in some cases there is a query step without property but WITH where
        //this happens when the where clause is on the root of the query
        //like Person.select(p => p.where(...))
        //in that case the where clause is directly applied to the given subject
        var whereResult = filterResults(subject, queryStep.where);
        return whereResult;
    }
}
//# sourceMappingURL=LocalQueryResolver.js.map