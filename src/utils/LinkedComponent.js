"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
exports.getSourceFromInputProps = exports.createLinkedSetComponentFn = exports.createLinkedComponentFn = void 0;
var LinkedQuery_js_1 = require("../utils/LinkedQuery.js");
var Shape_js_1 = require("../shapes/Shape.js");
var react_1 = __importStar(require("react"));
var LinkedStorage_js_1 = require("../utils/LinkedStorage.js");
var Package_js_1 = require("../utils/Package.js");
var NodeSet_js_1 = require("../collections/NodeSet.js");
var ShapeSet_js_1 = require("../collections/ShapeSet.js");
var models_js_1 = require("../models.js");
var ShapeClass_js_1 = require("../utils/ShapeClass.js");
function createLinkedComponentFn(registerPackageExport, registerComponent) {
    return function linkedComponent(query, functionalComponent) {
        var _a = __read(processQuery(query), 3), shapeClass = _a[0], dataRequest = _a[1], actualQuery = _a[2];
        //create a new functional component which wraps the original
        //also, first of all use React.forwardRef to support OPTIONAL use of forwardRef by the linked component itself
        //Combining HOC (Linked Component) with forwardRef was tricky to understand and get to work. Inspiration came from: https://dev.to/justincy/using-react-forwardref-and-an-hoc-on-the-same-component-455m
        var _wrappedComponent = react_1.default.forwardRef(function (props, ref) {
            var _a, _b;
            var _c = __read((0, react_1.useState)(undefined), 2), queryResult = _c[0], setQueryResult = _c[1];
            //take the given props and add make sure 'of' is converted to 'source' (an instance of the shape)
            var linkedProps = getLinkedComponentProps(props, shapeClass);
            //if a ref was given, we need to manually add it back to the props, React will extract it and provide is as second argument to React.forwardRef in the linked component itself
            if (ref) {
                linkedProps['ref'] = ref;
            }
            //check if the given source is a QResult, and not just that, but also if its structure
            //matches the query of this component. (if not, it could be sent as the source but the parent query did not preload the data of this component)
            var sourceIsValidQResult = ((_a = props.of) === null || _a === void 0 ? void 0 : _a.shape) instanceof Shape_js_1.Shape &&
                typeof ((_b = props.of) === null || _b === void 0 ? void 0 : _b.id) === 'string' &&
                query.isValidResult(props.of);
            //if we have loaded the query or the source is a QResult
            if (queryResult || sourceIsValidQResult) {
                //then merge the query result (or the QResult source) directly into the props
                //NOTE: This means all keys of the object become props of the component
                linkedProps = Object.assign(linkedProps, queryResult || props.of);
            }
            if (!linkedProps.source) {
                console.warn('No source provided to this component: ' +
                    functionalComponent.name);
                return null;
            }
            //if we're not using any storage in this LINCD app, don't do any data loading
            var usingStorage = LinkedStorage_js_1.LinkedStorage.isInitialised();
            (0, react_1.useEffect)(function () {
                //if this property is not bound (if this component is bound we can expect all properties to be loaded by the time it renders)
                if (usingStorage && !sourceIsValidQResult) {
                    var cachedRequest = LinkedStorage_js_1.LinkedStorage.isLoaded(linkedProps.source.node, dataRequest);
                    //if these properties were requested before and have finished loading
                    if (cachedRequest === true) {
                        //then we can set state to loaded straight away
                        setQueryResult(true);
                    }
                    else if (cachedRequest === false) {
                        //if we did not request all these properties before then we continue to
                        // load the required PropertyShapes from storage for this specific source
                        var requestQuery = actualQuery.clone();
                        requestQuery.setSubject(linkedProps.source);
                        LinkedStorage_js_1.LinkedStorage.query(requestQuery).then(function (result) {
                            //store the result to state, this also means we don't need to check cache again.
                            setQueryResult(result);
                        });
                    }
                    else {
                        //if some requiredProperties are still being loaded
                        //cachedResult will be a promise (there is no other return type)
                        //(this may happen when a different component already requested the same properties for the same source just before this sibling component)
                        //wait for that loading to be completed and then update the state
                        cachedRequest.then(function () {
                            setQueryResult(true);
                        });
                    }
                }
            }, [linkedProps.source.node]);
            //we can assume data is loaded if this is a bound component or if the isLoaded state has been set to true
            var dataIsLoaded = queryResult || !usingStorage || sourceIsValidQResult;
            //But for the first render, when the useEffect has not run yet,
            //and no this is not a bound component (so it's a top level linkedComponent),
            //then we still need to manually check cache to avoid a rendering a temporary load icon until useEffect has run (in the case the data is already loaded)
            if (typeof queryResult === 'undefined' &&
                usingStorage &&
                !sourceIsValidQResult) {
                //only continue to render if the result is true (all required data loaded),
                // if it's a promise we already deal with that in useEffect()
                dataIsLoaded =
                    LinkedStorage_js_1.LinkedStorage.isLoaded(linkedProps.source.node, dataRequest) ===
                        true;
            }
            //if the data is loaded
            //TODO: remove check for typeof window, this is temporary solution to fix hydration errors
            // but really we should find a way to send the data to the frontend for initial page loads AND notify storage that that data is loaded
            // then this check can be turned off. We can possibly do this with RDFA (rdf in html), then we can probably parse the data from the html, whilst rendering it on the server in one go.
            if (dataIsLoaded && typeof window !== 'undefined') {
                if (dataRequest) {
                    //TODO: find a way with the new LinkedQuery setup to send the data to the frontend for initial page loads AND then retreive that data here
                    // const dataResult = await resolveLinkedQuery(
                    //   requiredData as LinkedQuery<any>,
                    //   // linkedProps.source,
                    //   // dataRequest,
                    //   // pureDataRequest,
                    // );
                    // linkedProps = {...linkedProps, dataResult};
                }
                // //render the original components with the original + generated properties
                return react_1.default.createElement(functionalComponent, linkedProps);
            }
            else {
                //render loading
                return (0, react_1.createElement)('div', null, '...');
            }
        });
        //keep a copy of the original for strict checking of equality when compared to
        _wrappedComponent.original = functionalComponent;
        _wrappedComponent.query = dataRequest;
        //link the wrapped functional component to its shape
        _wrappedComponent.shape = shapeClass;
        //IF this component is a function that has a name
        if (functionalComponent.name) {
            //then copy the name (have to do it this way, name is protected)
            Object.defineProperty(_wrappedComponent, 'name', {
                value: functionalComponent.name,
            });
            //and add the component class of this module to the global tree
            registerPackageExport(_wrappedComponent);
        }
        //NOTE: if it does NOT have a name, the developer will need to manually use registerPackageExport
        //register the component and its shape
        registerComponent(_wrappedComponent, shapeClass);
        return _wrappedComponent;
    };
}
exports.createLinkedComponentFn = createLinkedComponentFn;
function createLinkedSetComponentFn(registerPackageExport, registerComponent) {
    return function linkedSetComponent(query, functionalComponent) {
        var _a = __read(processQuery(query, true), 3), shapeClass = _a[0], dataRequest = _a[1], actualQuery = _a[2];
        //if we're not using any storage in this LINCD app, don't do any data loading
        var usingStorage = LinkedStorage_js_1.LinkedStorage.isInitialised();
        //create a new functional component which wraps the original
        var _wrappedComponent = react_1.default.forwardRef(function (props, ref) {
            var _a, _b, _c;
            var _d = __read((0, react_1.useState)(undefined), 2), queryResult = _d[0], setQueryResult = _d[1];
            //take the given props and add make sure 'of' is converted to 'source' (an instance of the shape)
            var linkedProps = getLinkedSetComponentProps(props, shapeClass, functionalComponent);
            //get the limit from the query,
            // if none, then if no source was given, use the default limit (because then the query will apply to all instances of the shape)
            var defaultLimit = actualQuery.getLimit() || Package_js_1.DEFAULT_LIMIT;
            var _e = __read((0, react_1.useState)(defaultLimit), 2), limit = _e[0], setLimit = _e[1];
            var _f = __read((0, react_1.useState)(0), 2), offset = _f[0], setOffset = _f[1];
            //if a ref was given, we need to manually add it back to the props, React will extract it and provide is as second argument to React.forwardRef in the linked component itself
            if (ref) {
                linkedProps['ref'] = ref;
            }
            //check if the given source is a QResult, and not just that, but also if its structure
            //matches the query of this component. (if not, it could be sent as the source but the parent query did not preload the data of this component)
            var sourceIsValidQResult = Array.isArray(props.of) &&
                props.of.length > 0 &&
                ((_a = props.of[0]) === null || _a === void 0 ? void 0 : _a.shape) instanceof Shape_js_1.Shape &&
                typeof ((_b = props.of[0]) === null || _b === void 0 ? void 0 : _b.id) === 'string' &&
                actualQuery.isValidSetResult(props.of);
            //if we have loaded the query or the source is a QResult
            if (queryResult || sourceIsValidQResult) {
                var dataResult = void 0;
                if (queryResult) {
                    dataResult = queryResult;
                }
                else {
                    if (limit) {
                        dataResult = props.of.slice(offset || 0, offset + limit);
                    }
                    else {
                        dataResult = props.of;
                    }
                }
                //if the passed query parameter was a LinkedQuery
                if (query instanceof LinkedQuery_js_1.LinkedQuery) {
                    //then the results are passed as `linkedData`
                    linkedProps = Object.assign(linkedProps, {
                        linkedData: dataResult,
                    });
                }
                else {
                    //if not: a custom query object was passed, so we pass the results as the name of the first (and only) key of the query object
                    var key = Object.keys(query)[0];
                    linkedProps[key] = dataResult;
                }
            }
            //if no sources were added, then this query applies to all instances
            //then we add a query control object
            if (limit) {
                linkedProps.query = {
                    nextPage: function () {
                        setOffset(offset + limit);
                    },
                    previousPage: function () {
                        setOffset(Math.max(0, offset - limit));
                    },
                    setLimit: function (limit) {
                        setLimit(limit);
                    },
                    setPage: function (page) {
                        setOffset(page * limit);
                    },
                };
            }
            (0, react_1.useEffect)(function () {
                var _a;
                //if this property is not bound (if this component is bound we can expect all properties to be loaded by the time it renders)
                if (usingStorage && !sourceIsValidQResult) {
                    var cachedRequest = LinkedStorage_js_1.LinkedStorage.nodesAreLoaded((_a = linkedProps.sources) === null || _a === void 0 ? void 0 : _a.getNodes(), dataRequest);
                    //if these properties were requested before and have finished loading
                    if (cachedRequest === true) {
                        //we can set state to reflect that
                        debugger;
                        setQueryResult(true);
                    }
                    else if (cachedRequest === false) {
                        //if we did not request all these properties before then we continue to load them all
                        //load the required PropertyShapes from storage for this specific source
                        //we bypass cache because already checked cache ourselves above
                        var requestQuery = actualQuery.clone();
                        requestQuery.setSubject(linkedProps.sources);
                        if (limit) {
                            requestQuery.setLimit(limit);
                        }
                        if (offset) {
                            requestQuery.setOffset(offset);
                        }
                        LinkedStorage_js_1.LinkedStorage.query(requestQuery).then(function (result) {
                            //store the result to state, this also means we don't need to check cache again.
                            setQueryResult(result);
                        });
                    }
                    else {
                        //if some requiredProperties are still being loaded
                        //cachedResult will be a promise (there is no other return type)
                        //(this may happen when a different component already requested the same properties for the same source just before this sibling component)
                        //wait for that loading to be completed and then update the state
                        cachedRequest.then(function () {
                            setQueryResult(true);
                        });
                    }
                }
                //note: this useEffect function should be re-triggered if a different set of source nodes is given
                //however the actual set could be a new one every time. For now we check the 'of' prop, but if this triggers
                //on every parent update whilst it shouldn't, we could try linkedProps.sources.map(s => s.node.value).join("")
            }, [props.of, limit, offset]);
            //we can assume data is loaded if this is a bound component or if the isLoaded state has been set to true
            var dataIsLoaded = queryResult || !usingStorage || sourceIsValidQResult;
            //But for the first render, when the useEffect has not run yet,
            //and no this is not a bound component (so it's a top level linkedComponent),
            //then we still need to manually check cache to avoid a rendering a temporary load icon until useEffect has run (in the case the data is already loaded)
            if (typeof queryResult === 'undefined' &&
                usingStorage &&
                !sourceIsValidQResult) {
                //only continue to render if the result is true (all required data loaded),
                // if it's a promise we already deal with that in useEffect()
                dataIsLoaded =
                    LinkedStorage_js_1.LinkedStorage.nodesAreLoaded((_c = linkedProps.sources) === null || _c === void 0 ? void 0 : _c.getNodes(), dataRequest) === true;
            }
            //if the data is loaded
            if (dataIsLoaded) {
                //render the original components with the original + generated properties
                return react_1.default.createElement(functionalComponent, linkedProps);
            }
            else {
                //render loading
                return (0, react_1.createElement)('div', null, '...');
            }
        });
        //keep a copy of the original for strict checking of equality when compared to
        _wrappedComponent.original = functionalComponent;
        _wrappedComponent.query = dataRequest;
        //link the wrapped functional component to its shape
        _wrappedComponent.shape = shapeClass;
        //IF this component is a function that has a name
        if (functionalComponent.name) {
            //then copy the name (have to do it this way, name is protected)
            Object.defineProperty(_wrappedComponent, 'name', {
                value: functionalComponent.name,
            });
            //and add the component class of this module to the global tree
            registerPackageExport(_wrappedComponent);
        }
        //NOTE: if it does NOT have a name, the developer will need to manually use registerPackageExport
        //register the component and its shape
        registerComponent(_wrappedComponent, shapeClass);
        return _wrappedComponent;
    };
}
exports.createLinkedSetComponentFn = createLinkedSetComponentFn;
function getLinkedComponentProps(props, shapeClass) {
    var newProps = __assign(__assign({}, props), { 
        //if a node was given, convert it to a shape instance
        source: getSourceFromInputProps(props, shapeClass) });
    delete newProps['of'];
    return newProps;
}
function processQuery(requiredData, setComponent) {
    if (setComponent === void 0) { setComponent = false; }
    var shapeClass;
    var dataRequest;
    var query;
    //if a Shape class was given (the actual class that extends Shape)
    if (requiredData instanceof LinkedQuery_js_1.LinkedQuery) {
        dataRequest = requiredData.getQueryObject();
        query = requiredData;
        shapeClass = requiredData.shape;
    }
    else if (typeof requiredData === 'object' && setComponent) {
        if (Object.keys(requiredData).length > 1) {
            throw new Error('Only one key is allowed to map a query to a property for linkedSetComponents');
        }
        for (var key in requiredData) {
            if (requiredData[key] instanceof LinkedQuery_js_1.LinkedQuery) {
                dataRequest = requiredData[key].getQueryObject();
                shapeClass = requiredData[key].shape;
                query = requiredData[key];
            }
            else {
                throw new Error('Unknown value type for query object. Keep to this format: {propName: Shape.query(s => ...)}');
            }
        }
    }
    else {
        throw new Error('Unknown data query type. Expected a LinkedQuery (from Shape.query()) or an object with 1 key whose value is a LinkedQuery');
    }
    return [shapeClass, dataRequest, query];
}
function getLinkedSetComponentProps(props, shapeClass, functionalComponent) {
    if (props.of &&
        !(props.of instanceof NodeSet_js_1.NodeSet) &&
        !(props.of instanceof ShapeSet_js_1.ShapeSet) &&
        !Array.isArray(props.of) &&
        props.of.every(function (qResult) { return qResult.shape instanceof Shape_js_1.Shape; }) &&
        !props.of['then']) {
        throw Error("Invalid argument 'of' provided to " +
            functionalComponent.name.replace('_implementation', '') +
            ' component: ' +
            props.of +
            '. Make sure to provide a NodeSet, a ShapeSet or a Promise resolving to either of those. Or no argument at all to load all instances.');
    }
    var sources;
    if (props.of instanceof NodeSet_js_1.NodeSet) {
        sources = new ShapeSet_js_1.ShapeSet(shapeClass.getSetOf(props.of));
    }
    else if (props.of instanceof ShapeSet_js_1.ShapeSet) {
        sources = props.of;
    }
    else if (props.of) {
        //QResult[]
        sources = new ShapeSet_js_1.ShapeSet(props.of.map(function (qResult) {
            return qResult.shape;
        }));
    }
    var newProps = __assign(__assign({}, props), { 
        //if a NodeSet was given, convert it to a ShapeSet
        sources: sources });
    delete newProps['of'];
    return newProps;
}
function getSourceFromInputProps(props, shapeClass) {
    var _a;
    //Support for QResult objects as source input (as 'of' prop)
    if (((_a = props.of) === null || _a === void 0 ? void 0 : _a.shape) instanceof Shape_js_1.Shape && typeof props.of.id === 'string') {
        return getSourceFromInputProps({ of: props.of.shape }, shapeClass);
    }
    return props.of instanceof models_js_1.Node
        ? new shapeClass(props.of)
        : //if it's a shape it needs to match the shape of the component, or extend it, if not we recreate the shape
            props.of instanceof Shape_js_1.Shape &&
                props.of.nodeShape !== shapeClass.shape.node &&
                !(0, ShapeClass_js_1.hasSuperClass)((0, ShapeClass_js_1.getShapeClass)(props.of.nodeShape.namedNode), shapeClass)
                ? new shapeClass(props.of.namedNode)
                : props.of;
}
exports.getSourceFromInputProps = getSourceFromInputProps;
// function linkedComponentClass<ShapeType extends Shape, P = {}>(
//   shapeClass: typeof Shape,
// ): ClassDecorator {
//   //this is for Components declared with ES Classes
//   //in this case the function we're in will be used as a decorator: @linkedComponent(SomeShapeClass)
//   //class decorators return a function that receives a constructor and returns a constructor.
//   let decoratorFunction = function <T>(constructor) {
//     //add the component class of this module to the global tree
//     registerPackageExport(constructor);
//
//     //link the shape
//     constructor['shape'] = shapeClass;
//
//     //register the component and its shape
//     registerComponent(constructor as any, shapeClass);
//
//     //return the original class without modifications
//     // return constructor;
//
//     //only here we have shapeClass as a value (not in LinkedComponentClass)
//     //so here we can return a new class that extends the original class,
//     //but it adds linked properties like sourceShape
//     let wrappedClass = class extends constructor {
//       constructor(props) {
//         let linkedProps = getLinkedComponentProps<ShapeType, P>(
//           props,
//           shapeClass,
//         );
//         super(linkedProps);
//       }
//     } as any as T;
//     //copy the name
//     Object.defineProperty(wrappedClass, 'name', {value: constructor.name});
//     Object.defineProperty(wrappedClass, 'original', {value: constructor});
//     return wrappedClass;
//   };
//   return decoratorFunction;
// }
//# sourceMappingURL=LinkedComponent.js.map