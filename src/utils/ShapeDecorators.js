"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLinkedProperty = exports.linkedProperty = exports.objectProperty = exports.literalProperty = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var models_js_1 = require("../models.js");
var SHACL_js_1 = require("../shapes/SHACL.js");
var shacl_js_1 = require("../ontologies/shacl.js");
var literalProperty = function (config) {
    return _linkedProperty(config, shacl_js_1.shacl.Literal);
};
exports.literalProperty = literalProperty;
var objectProperty = function (config) {
    return _linkedProperty(config);
};
exports.objectProperty = objectProperty;
/**
 * The most general decorator to indicate a get/set method requires & provides a certain linked data property.
 * Using this generator generates a [SHACL Property Shape](https://www.w3.org/TR/shacl/#property-shapes)
 * @param config - configures the property shape with a plain javascript object that follows the [PropertyShapeConfig](/docs/lincd.js/interfaces/utils_ShapeDecorators.PropertyShapeConfig) interface.
 *
 * @example
 * ```
 * \@linkedProperty({
 *   path:foaf.name,
 *   required:true,
 *   nodeKind:Literal,
 *   maxLength:1,
 *   defaultValue:"John"
 * })
 * get name(){
 *   return this.getValue(foaf.name) || "John"
 * }
 * ```
 */
var linkedProperty = function (config) {
    return _linkedProperty(config);
};
exports.linkedProperty = linkedProperty;
var _linkedProperty = function (config, defaultNodeKind) {
    if (defaultNodeKind === void 0) { defaultNodeKind = null; }
    return function (target, propertyKey, descriptor) {
        //if the shape has already been initiated (with linkedShape)
        //Note that the constructor may have shape defined if the class that it extends is already decorated with linkedShape
        //so we need to check hasOwnProperty
        var shape = target.constructor.hasOwnProperty('shape')
            ? target.constructor
            : null;
        //then we pass the shape and it will be used to register the property shape
        var propertyShape = registerLinkedProperty(config, propertyKey, shape, defaultNodeKind);
        if (!shape) {
            //but if it was not yet available, then store property shapes in a temporary array in the constructor
            //this is picked up in Module.ts and put into the Shape when its ready
            if (!target.constructor['propertyShapes']) {
                target.constructor['propertyShapes'] = [];
            }
            target.constructor['propertyShapes'].push(propertyShape);
        }
    };
};
function registerLinkedProperty(config, propertyKey, shape, defaultNodeKind) {
    if (defaultNodeKind === void 0) { defaultNodeKind = null; }
    var propertyShape = new SHACL_js_1.PropertyShape();
    propertyShape.path = config.path;
    propertyShape.label = propertyKey;
    if (config.required) {
        propertyShape.minCount = 1;
    }
    else if (config.minCount) {
        propertyShape.minCount = config.minCount;
    }
    if (config.maxCount) {
        propertyShape.maxCount = config.maxCount;
    }
    if (config['dataType']) {
        propertyShape.datatype = config['dataType'];
    }
    if (config.nodeKind) {
        var nodeKind = config.nodeKind;
        if (nodeKind === models_js_1.Literal) {
            propertyShape.nodeKind = shacl_js_1.shacl.Literal;
        }
        if (nodeKind === models_js_1.NamedNode) {
            propertyShape.nodeKind = shacl_js_1.shacl.IRI;
        }
        if (nodeKind === models_js_1.BlankNode) {
            propertyShape.nodeKind = shacl_js_1.shacl.BlankNode;
        }
        if (Array.isArray(nodeKind)) {
            if (nodeKind.includes(models_js_1.BlankNode) && nodeKind.includes(models_js_1.NamedNode)) {
                propertyShape.nodeKind = shacl_js_1.shacl.BlankNodeOrIRI;
            }
            if (nodeKind.includes(models_js_1.Literal) && nodeKind.includes(models_js_1.NamedNode)) {
                propertyShape.nodeKind = shacl_js_1.shacl.IRIOrLiteral;
            }
            if (nodeKind.includes(models_js_1.Literal) && nodeKind.includes(models_js_1.BlankNode)) {
                propertyShape.nodeKind = shacl_js_1.shacl.BlankNodeOrLiteral;
            }
        }
    }
    else {
        //if no nodeKind was provided, use the default, if given
        if (defaultNodeKind) {
            propertyShape.nodeKind = defaultNodeKind;
        }
    }
    //we accept a shape configuration, which translates to a sh:nodeShape
    if (config.shape) {
        //if this shape class has already got a NodeShape connected to it
        if (config.shape['shape']) {
            //then we can use this NodeShape now as the value of nodeShape for this property shape
            propertyShape.valueShape = config.shape['shape'];
        }
        else {
            //however the shape class may not have run its decorators yet
            //so in that case we temporarily store a reference
            //which gets processed in Module:linkedShape()
            if (!config.shape['nodeShapeOf']) {
                config.shape['nodeShapeOf'] = [];
            }
            config.shape['nodeShapeOf'].push(propertyShape);
        }
    }
    // console.log('Property method ' + config.path.toString() + ' initialised.');
    // if (!target.constructor.shape) {
    // 	console.log('Creating shape from method decorators.');
    // 	target.constructor.shape = new NodeShape();
    // }
    //see above why shape may not be provided
    if (shape) {
        //update the URI (by extending the URI of the shape)
        propertyShape.namedNode.uri = shape.namedNode.uri + "/".concat(propertyKey);
        //then add it directly
        shape.addPropertyShape(propertyShape);
    }
    return propertyShape;
    //
    //sh.property
    //  (NamedNode value must have this type, like range but restrictive)
    //sh.class
    // (Literal value must have this datatype, like range)
    //sh.dataType
    //
    //sh.optional
    //
    //sh.path
    // (values must have this node type. Choose from:  sh:NodeKind: sh:BlankNode,sh:IRI, sh:Literal, sh:BlankNodeOrIRI, sh:BlankNodeOrLiteral or sh:IRIOrLiteral)
    //sh.nodeKind
    // (cardinality, number, required properties would have minCount 1)
    //sh.minCount
    // (if only 1 value possible maxCount =1. Probably common)
    //sh.maxCount
    // (numbers)
    //sh.minExclusive
    //
    //sh.minInclusive
    //
    //sh.maxExclusive
    //
    //sh.maxInclusive
    // (must have exactly this value)
    //sh.hasValue
    // (specify possible values)
    //sh.in
    // (2 props must have different value)
    //sh.disjoin
    // (2 props must have same value)
    //sh.equals
}
exports.registerLinkedProperty = registerLinkedProperty;
//# sourceMappingURL=ShapeDecorators.js.map