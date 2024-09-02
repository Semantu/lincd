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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestNode = exports.createTraceShape = void 0;
var Shape_js_1 = require("../shapes/Shape.js");
var models_js_1 = require("../models.js");
var rdfs_js_1 = require("../ontologies/rdfs.js");
var NodeSet_js_1 = require("../collections/NodeSet.js");
function createTraceShape(shapeClass, shapeInstance, debugName) {
    var detectionClass = /** @class */ (function (_super) {
        __extends(class_1, _super);
        function class_1(p) {
            var _this = _super.call(this, p) || this;
            _this.requested = [];
            // resultOrigins:CoreMap<any,any> = new CoreMap();
            _this.usedAccessors = [];
            _this.responses = [];
            return _this;
        }
        return class_1;
    }(shapeClass));
    var traceShape;
    if (!shapeInstance) {
        //if not provided we create a new detectionClass instance
        var dummyNode = new TestNode();
        traceShape = new detectionClass(dummyNode);
    }
    else {
        //if an instance was provided
        // (this happens if a testnode generates a testnode value on demand
        // and the original shape get-accessor returns an instance of a shape of that testnode)
        //then we turn that shape instance into it's test/detection variant
        traceShape = new detectionClass(shapeInstance.namedNode);
    }
    //here in the constructor (now that we have a 'this')
    //we will overwrite all the methods of the class we extend and the classes that it itself extends
    //we start with the shape class itself
    var finger = shapeClass;
    while (finger) {
        //check that this shape class or one of its superclasses still extends Shape, otherwise break;
        if (!(finger.prototype instanceof Shape_js_1.Shape) || finger === Shape_js_1.Shape) {
            break;
        }
        //get all the property descriptors of the class
        var descriptors = Object.getOwnPropertyDescriptors(finger.prototype);
        var _loop_1 = function () {
            var descriptor = descriptors[key];
            if (descriptor.configurable) {
                //if this is a get method that used a @linkedProperty decorator
                //then it should match with a propertyShape
                var propertyShape = finger['shape']
                    .getPropertyShapes()
                    .find(function (propertyShape) { return propertyShape.label === key; });
                //get the get method (that's the one place that we support @linkedProperty decorators for, for now)
                var g = descriptor.get != null;
                if (g) {
                    var newDescriptor = {};
                    newDescriptor.enumerable = descriptor.enumerable;
                    newDescriptor.configurable = descriptor.configurable;
                    //not sure if we can or want to?..
                    // newDescriptor.value= descriptor.value;
                    // newDescriptor.writable = descriptor.writable;
                    if (propertyShape) {
                        //create a new get function
                        newDescriptor.get = (function (key, propertyShape, descriptor) {
                            // console.log(debugName + ' requested get ' + key + ' - ' + propertyShape.path.value);
                            //use dummyShape as 'this'
                            var returnedValue = descriptor.get.call(traceShape);
                            // console.log('generated result -> ',res['print'] ? res['print']() : res);
                            // console.log('\tresult -> ', returnedValue && returnedValue.print ? returnedValue.print() : returnedValue);
                            //if a shape was returned, make sure we trace that shape too
                            if (returnedValue instanceof Shape_js_1.Shape) {
                                returnedValue = createTraceShape(Object.getPrototypeOf(returnedValue).constructor, returnedValue, Object.getPrototypeOf(returnedValue).constructor.name);
                            }
                            //store which property shapes were requested in the detectionClass defined above
                            traceShape.requested.push(propertyShape);
                            traceShape.usedAccessors.push(descriptor.get);
                            traceShape.responses.push(returnedValue);
                            //also store which result was returned for which property shape (we need this in Component.to().. / bindComponentToData())
                            // traceShape.resultOrigins.set(returnedValue,descriptor.get);
                            // returnedValue['_reqPropShape'] = propertyShape;
                            // returnedValue['_accessor'] = descriptor.get;
                            return returnedValue;
                        }).bind(detectionClass.prototype, key, propertyShape, descriptor);
                    }
                    else {
                        //if no propertyShape was found, then this is a get method that was not decorated with @linkedProperty
                        newDescriptor.get = function () {
                            var _a;
                            var numRequested = traceShape.requested.length;
                            //so we call the method as it was
                            var result = descriptor.get.call(traceShape);
                            //and if no new property shapes have been accessed
                            if (traceShape.requested.length === numRequested) {
                                //then probably someone forgot to add a @linkedProperty decorator!
                                //or at least it won't add any data to the dataRequest of the linked component, so let's warn the developer of that
                                console.warn("\"".concat((_a = traceShape.nodeShape) === null || _a === void 0 ? void 0 : _a.label, ".").concat(descriptor.get.name.replace('get ', ''), "\" was requested by a linked component. However '").concat(descriptor.get.name, "' is not decorated with a linked property decorator (like @linkedProperty), so LINCD can not automatically load this data"));
                            }
                            //(else, the method probably accessed other methods of the shape that DO use linkedProperty decorators, thus adding more traced propertyShapes. This is fine and works as intended)
                            return result;
                        };
                    }
                    //bind this descriptor to the class that defines it
                    //and bind the required arguments (which we know only now, but we need to know them when the descriptor runs, hence we bind them)
                    //overwrite the get method
                    Object.defineProperty(detectionClass.prototype, key, newDescriptor);
                }
            }
        };
        for (var key in descriptors) {
            _loop_1();
        }
        finger = Object.getPrototypeOf(finger);
    }
    //really we return a TraceShape, but it extends the given Shape class, so we need typescript to recognise it as such
    //not sure how to do that dynamically
    return traceShape;
}
exports.createTraceShape = createTraceShape;
var TestNode = /** @class */ (function (_super) {
    __extends(TestNode, _super);
    function TestNode(property) {
        var _this = this;
        var uri = models_js_1.NamedNode.createNewTempUri();
        _this = _super.call(this, uri, true) || this;
        _this.property = property;
        return _this;
    }
    TestNode.prototype.getValue = function () {
        var label = '';
        if (this.property) {
            if (this.property.hasProperty(rdfs_js_1.rdfs.label)) {
                label = this.property.getValue(rdfs_js_1.rdfs.label);
            }
            else {
                label = this.property.uri.split(/[\/#]/).pop();
            }
        }
        return label;
    };
    TestNode.prototype.hasProperty = function (property) {
        return true;
    };
    TestNode.prototype.getAll = function (property) {
        return new NodeSet_js_1.NodeSet([this.getOne(property)]);
    };
    TestNode.prototype.getOne = function (property) {
        if (!_super.prototype.hasProperty.call(this, property)) {
            //test nodes AUTOMATICALLY generate a dummy test-node value when a property is requested
            //however they avoid sending events about this
            new models_js_1.Quad(this, property, new TestNode(property), undefined, false, false);
        }
        return _super.prototype.getOne.call(this, property);
    };
    return TestNode;
}(models_js_1.NamedNode));
exports.TestNode = TestNode;
//# sourceMappingURL=TraceShape.js.map