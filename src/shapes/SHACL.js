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
exports.PropertyShape = exports.NodeShape = exports.SHACL_Shape = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var models_js_1 = require("../models.js");
var Shape_js_1 = require("./Shape.js");
var shacl_js_1 = require("../ontologies/shacl.js");
var List_js_1 = require("./List.js");
var xsd_js_1 = require("../ontologies/xsd.js");
var NodeSet_js_1 = require("../collections/NodeSet.js");
var rdf_js_1 = require("../ontologies/rdf.js");
var CoreMap_js_1 = require("../collections/CoreMap.js");
var ForwardReasoning_js_1 = require("../utils/ForwardReasoning.js");
var SHACL_Shape = /** @class */ (function (_super) {
    __extends(SHACL_Shape, _super);
    function SHACL_Shape() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(SHACL_Shape.prototype, "type", {
        get: function () {
            return this.getOne(rdf_js_1.rdf.type);
        },
        set: function (val) {
            this.overwrite(rdf_js_1.rdf.type, val);
        },
        enumerable: false,
        configurable: true
    });
    SHACL_Shape.prototype._validateNode = function (node, validated) {
        if (validated === void 0) { validated = new CoreMap_js_1.CoreMap(); }
        return false;
    };
    SHACL_Shape.targetClass = shacl_js_1.shacl.Shape;
    return SHACL_Shape;
}(Shape_js_1.Shape));
exports.SHACL_Shape = SHACL_Shape;
//Note: this shape is linked in Module.ts to avoid cyclical dependencies
var NodeShape = /** @class */ (function (_super) {
    __extends(NodeShape, _super);
    function NodeShape() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(NodeShape.prototype, "targetNode", {
        get: function () {
            return this.getOne(shacl_js_1.shacl.targetNode);
        },
        set: function (value) {
            this.overwrite(shacl_js_1.shacl.targetNode, value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeShape.prototype, "targetClass", {
        get: function () {
            return this.getOne(shacl_js_1.shacl.targetClass);
        },
        set: function (value) {
            this.overwrite(shacl_js_1.shacl.targetClass, value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeShape.prototype, "in", {
        get: function () {
            return this.getOne(shacl_js_1.shacl.in);
        },
        set: function (value) {
            this.overwrite(shacl_js_1.shacl.in, value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NodeShape.prototype, "inList", {
        get: function () {
            return this.hasProperty(shacl_js_1.shacl.in)
                ? List_js_1.List.getOf(this.getOne(shacl_js_1.shacl.in))
                : null;
        },
        set: function (value) {
            this.overwrite(shacl_js_1.shacl.in, value.node);
        },
        enumerable: false,
        configurable: true
    });
    NodeShape.getShapesOf = function (node) {
        return this.getLocalInstances().filter(function (shape) {
            return shape.validateNode(node);
        });
    };
    NodeShape.prototype.addPropertyShape = function (property) {
        this.set(shacl_js_1.shacl.property, property.namedNode);
    };
    NodeShape.prototype.getPropertyShapes = function () {
        return PropertyShape.getSetOf(this.getAll(shacl_js_1.shacl.property));
    };
    /**
     * Returns all the classes and properties that are references by this shape
     */
    NodeShape.prototype.getOntologyEntities = function () {
        var entities = new NodeSet_js_1.NodeSet();
        if (this.targetClass) {
            entities.add(this.targetClass);
        }
        //add ontology entities of all property shapes
        this.getPropertyShapes().forEach(function (propertyShape) {
            entities = entities.concat(propertyShape.getOntologyEntities());
        });
        return entities;
    };
    NodeShape.prototype.validateNode = function (node) {
        return this._validateNode(node);
    };
    NodeShape.prototype._validateNode = function (node, validated) {
        if (validated === void 0) { validated = new CoreMap_js_1.CoreMap(); }
        if (validated.has(node)) {
            return validated.get(node);
        }
        //whilst validating, if a connected node wants to validate THIS node, we consider this node to be valid until proven otherwise below
        validated.set(node, true);
        if (this.targetClass) {
            //NOTE, we're using Reasoning to check types, so that if this node has a type which is a subClassOf the targetClass, it still matches.
            //this would not be needed if a Forwards reasoning engine was in place
            if (!(node instanceof models_js_1.NamedNode &&
                ForwardReasoning_js_1.ForwardReasoning.hasType(node, this.targetClass))) {
                validated.set(node, false);
                return false;
            }
        }
        var propertyShapes = this.getPropertyShapes();
        if (propertyShapes.size > 0) {
            if (node instanceof models_js_1.Literal) {
                validated.set(node, false);
                return false;
            }
            else if (node instanceof models_js_1.NamedNode) {
                if (!this.getPropertyShapes().every(function (propertyShape) {
                    return propertyShape._validateNode(node, validated);
                })) {
                    validated.set(node, false);
                    return false;
                }
            }
        }
        // validated.set(node,true);
        return true;
    };
    NodeShape.targetClass = shacl_js_1.shacl.NodeShape;
    return NodeShape;
}(SHACL_Shape));
exports.NodeShape = NodeShape;
//Note: this shape is linked in Module.ts to avoid cyclical dependencies
var PropertyShape = /** @class */ (function (_super) {
    __extends(PropertyShape, _super);
    function PropertyShape() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(PropertyShape.prototype, "class", {
        get: function () {
            return this.getOne(shacl_js_1.shacl.class);
        },
        set: function (value) {
            this.overwrite(shacl_js_1.shacl.class, value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PropertyShape.prototype, "valueShape", {
        /**
         * Returns the NodeShape that all value nodes need to conform to
         * On a graph level this accessor returns the value of shacl:node for this PropertyShape (if any)
         * Note: it's named valueShape because node & nodeShape are already used internally in LINCD
         * @see https://www.w3.org/TR/shacl/#NodeConstraintComponent
         *
         */
        //@NOTE: If the name valueShape is an issue we could always rename `get nodeShape` to `get shaclShape` in Shape.ts
        get: function () {
            return this.hasProperty(shacl_js_1.shacl.node)
                ? NodeShape.getOf(this.getOne(shacl_js_1.shacl.node))
                : null;
        },
        set: function (value) {
            this.overwrite(shacl_js_1.shacl.node, value.node);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PropertyShape.prototype, "nodeKind", {
        get: function () {
            return this.getOne(shacl_js_1.shacl.nodeKind);
        },
        set: function (value) {
            this.overwrite(shacl_js_1.shacl.nodeKind, value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PropertyShape.prototype, "datatype", {
        get: function () {
            return this.getOne(shacl_js_1.shacl.datatype);
        },
        set: function (value) {
            this.overwrite(shacl_js_1.shacl.datatype, value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PropertyShape.prototype, "maxCount", {
        get: function () {
            return parseInt(this.getValue(shacl_js_1.shacl.maxCount));
        },
        set: function (value) {
            this.overwrite(shacl_js_1.shacl.maxCount, new models_js_1.Literal(value.toString(), xsd_js_1.xsd.integer));
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PropertyShape.prototype, "minCount", {
        get: function () {
            return parseInt(this.getValue(shacl_js_1.shacl.minCount));
        },
        set: function (value) {
            this.overwrite(shacl_js_1.shacl.minCount, new models_js_1.Literal(value.toString(), xsd_js_1.xsd.integer));
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PropertyShape.prototype, "name", {
        get: function () {
            return this.getValue(shacl_js_1.shacl.name);
        },
        // Setter overloading - would be nice to have one for String and another for Literal:
        // https://github.com/microsoft/TypeScript/issues/2521
        set: function (value) {
            this.overwrite(shacl_js_1.shacl.name, new models_js_1.Literal(value));
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PropertyShape.prototype, "optional", {
        get: function () {
            return this.getValue(shacl_js_1.shacl.optional);
        },
        set: function (value) {
            this.overwrite(shacl_js_1.shacl.optional, new models_js_1.Literal(value, xsd_js_1.xsd.boolean));
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PropertyShape.prototype, "path", {
        get: function () {
            return this.getOne(shacl_js_1.shacl.path);
        },
        set: function (value) {
            this.overwrite(shacl_js_1.shacl.path, value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PropertyShape.prototype, "parentNodeShape", {
        get: function () {
            return this.hasInverseProperty(shacl_js_1.shacl.property)
                ? new NodeShape(this.getOneInverse(shacl_js_1.shacl.property))
                : null;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Returns all the classes and properties that are references by this shape
     */
    PropertyShape.prototype.getOntologyEntities = function () {
        //start with values of those properties that have a NamedNode as value
        var entities = new NodeSet_js_1.NodeSet([this.class, this.path, this.datatype].filter(function (value) { return value && true; }));
        //this caused loops!
        // if (this.nodeShape) {
        //if a node shape is defined, also add all the entities of that node shape
        // entities = entities.concat(this.nodeShape.getOntologyEntities());
        // }
        return entities;
    };
    PropertyShape.prototype.validateNode = function (node) {
        return this._validateNode(node);
    };
    PropertyShape.prototype.resolveFor = function (node) {
        //TODO: support more complex property paths
        return node.getAll(this.path);
    };
    PropertyShape.prototype._validateNode = function (node, validated) {
        var _this = this;
        if (validated === void 0) { validated = new CoreMap_js_1.CoreMap(); }
        //TODO: make property nodes support property paths beyond a single property
        var property = this.path;
        var values = node instanceof models_js_1.NamedNode ? node.getAll(property) : null;
        if (this.class) {
            if (!values.every(function (value) {
                return value instanceof models_js_1.NamedNode && value.has(rdf_js_1.rdf.type, _this.class);
            })) {
                return false;
            }
        }
        if (this.datatype) {
            if (!values.every(function (value) {
                return value instanceof models_js_1.Literal && value.datatype === _this.datatype;
            })) {
                return false;
            }
        }
        if (this.valueShape) {
            //every value should be a valid instance of this nodeShape
            var nodeShape_1 = this.valueShape;
            if (!values.every(function (value) {
                //nodes referring to each other or to themselves may cause loops here
                //this is currently avoided by keeping track of which nodes have already been validated, during the validation of the root most node
                //TODO: perhaps at some point we may want to store validation results in the shape or even the node, and invalidate whenever the node changes any of its properties. (though for complex property paths that would mean more complex invalidation as well. i.e. back tracing property shapes on a change in node 1 to invalidate a distant node 2)
                if (validated.has(value)) {
                    return validated.get(value);
                }
                return ((value === node && _this.parentNodeShape.equals(nodeShape_1)) ||
                    nodeShape_1._validateNode(value, validated));
            })) {
                return false;
            }
        }
        if (this.minCount) {
            if (values.size < this.minCount) {
                return false;
            }
        }
        if (this.maxCount) {
            if (values.size > this.maxCount) {
                return false;
            }
        }
        return true;
    };
    PropertyShape.targetClass = shacl_js_1.shacl.PropertyShape;
    return PropertyShape;
}(SHACL_Shape));
exports.PropertyShape = PropertyShape;
//# sourceMappingURL=SHACL.js.map