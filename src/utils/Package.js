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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTree = exports.linkedPackage = exports.autoLoadOntologyData = exports.setDefaultPageLimit = exports.DEFAULT_LIMIT = exports.LINCD_DATA_ROOT = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var models_js_1 = require("../models.js");
var SHACL_js_1 = require("../shapes/SHACL.js");
var Shape_js_1 = require("../shapes/Shape.js");
var Prefix_js_1 = require("./Prefix.js");
var CoreSet_js_1 = require("../collections/CoreSet.js");
var lincd_js_1 = require("../ontologies/lincd.js");
var npm_js_1 = require("../ontologies/npm.js");
var rdf_js_1 = require("../ontologies/rdf.js");
var URI_js_1 = require("./URI.js");
var ShapeClass_js_1 = require("./ShapeClass.js");
var LinkedComponent_js_1 = require("../utils/LinkedComponent.js");
var ShapeDecorators_js_1 = require("./ShapeDecorators.js");
var shacl_js_1 = require("../ontologies/shacl.js");
var rdfs_js_1 = require("../ontologies/rdfs.js");
exports.LINCD_DATA_ROOT = 'https://data.lincd.org/';
// var packageParsePromises: Map<string,Promise<any>> = new Map();
// var loadedPackages: Set<NamedNode> = new Set();
var shapeToComponents = new Map();
var ontologies = new Set();
var _autoLoadOntologyData = false;
/**
 *  Convert some node to a prefixed format:
 * - http://some-example.org/prop > ex:prop
 *  */
var prefix = function (n) { return Prefix_js_1.Prefix.toPrefixed(n.uri); };
exports.DEFAULT_LIMIT = 12;
function setDefaultPageLimit(limit) {
    exports.DEFAULT_LIMIT = limit;
}
exports.setDefaultPageLimit = setDefaultPageLimit;
function autoLoadOntologyData(value) {
    _autoLoadOntologyData = value;
    //this may be set to true after some ontologies have already indexed,
    if (_autoLoadOntologyData) {
        // so in that case we load all data of ontologies that are already indexed
        ontologies.forEach(function (ontologyExport) {
            //see linkedOntology() where we store the data loading method under the _load key
            if (ontologyExport['_load']) {
                ontologyExport['_load']();
            }
        });
    }
}
exports.autoLoadOntologyData = autoLoadOntologyData;
function linkedPackage(packageName) {
    var packageNode = models_js_1.NamedNode.getOrCreate("".concat(exports.LINCD_DATA_ROOT, "module/").concat(packageName), true);
    //set certain values but don't emit change events or alteration events
    new models_js_1.Quad(packageNode, rdf_js_1.rdf.type, lincd_js_1.lincd.Module, models_js_1.defaultGraph, false, false, false);
    new models_js_1.Quad(packageNode, npm_js_1.npm.packageName, new models_js_1.Literal(packageName), models_js_1.defaultGraph, false, false, false);
    var packageTreeObject = registerPackageInTree(packageName);
    //#Create declarators for this module
    var registerPackageExport = function (object) {
        if (object.name in packageTreeObject) {
            console.warn("Key ".concat(object.name, " was already defined for package ").concat(packageName, ". Note that LINCD currently only supports unique names across your entire package. Overwriting ").concat(object.name, " with new value"));
        }
        packageTreeObject[object.name] = object;
    };
    var registerInPackageTree = function (exportName, exportedObject) {
        packageTreeObject[exportName] = exportedObject;
    };
    function registerPackageModule(_module) {
        for (var key in _module.exports) {
            //if the exported object itself (usually FunctionalComponents) is not named or its name is _wrappedComponent (which ends up happening in the linkedComponent method above)
            //then we give it the same name as it's export name.
            if (!_module.exports[key].name ||
                _module.exports[key].name === '_wrappedComponent') {
                Object.defineProperty(_module.exports[key], 'name', { value: key });
                //manual 'hack' to set the name of the original function
                if (_module.exports[key]['original'] &&
                    !_module.exports[key]['original']['name']) {
                    Object.defineProperty(_module.exports[key]['original'], 'name', {
                        value: key + '_implementation',
                    });
                }
            }
            registerInPackageTree(key, _module.exports[key]);
        }
    }
    //create a declarator function which Components of this module can use register themselves and add themselves to the global tree
    var linkedUtil = function (constructor) {
        //add the component class of this module to the global tree
        registerPackageExport(constructor);
        //return the original class without modifications
        return constructor;
    };
    //method to create a linked functional component
    var linkedComponent = (0, LinkedComponent_js_1.createLinkedComponentFn)(registerPackageExport, registerComponent);
    var linkedSetComponent = (0, LinkedComponent_js_1.createLinkedSetComponentFn)(registerPackageExport, registerComponent);
    //create a declarator function which Shapes of this module can use register themselves and add themselves to the global tree
    var linkedShape = function (constructor) {
        //add the component class of this module to the global tree
        registerPackageExport(constructor);
        //register the component and its shape
        Shape_js_1.Shape.registerByType(constructor);
        //if no shape object has been attached to the constructor
        if (!Object.getOwnPropertyNames(constructor).includes('shape')) {
            var packageNameURI = URI_js_1.URI.sanitize(packageName);
            //create a new node shape for this shapeClass
            var shape_1 = SHACL_js_1.NodeShape.getFromURI("".concat(exports.LINCD_DATA_ROOT, "module/").concat(packageNameURI, "/shape/").concat(URI_js_1.URI.sanitize(constructor.name)));
            //connect the typescript class to its NodeShape
            constructor.shape = shape_1;
            //set the name
            shape_1.label = constructor.name;
            //also keep track of the reverse: nodeShape to typescript class (helpful for sending shapes between environments with JSONWriter / JSONParser)
            (0, ShapeClass_js_1.addNodeShapeToShapeClass)(shape_1, constructor);
            //also create a representation in the graph of the shape class itself
            var shapeClass = models_js_1.NamedNode.getOrCreate("".concat(exports.LINCD_DATA_ROOT, "module/").concat(packageNameURI, "/shapeclass/").concat(URI_js_1.URI.sanitize(constructor.name)), true);
            shapeClass.set(lincd_js_1.lincd.definesShape, shape_1.node);
            shapeClass.set(rdf_js_1.rdf.type, lincd_js_1.lincd.ShapeClass);
            //and connect it back to the module
            shapeClass.set(lincd_js_1.lincd.module, packageNode);
            //if linkedProperties have already registered themselves
            if (constructor.propertyShapes) {
                //then add them to this node shape now
                constructor.propertyShapes.forEach(function (propertyShape) {
                    var uri = shape_1.namedNode.uri + "/".concat(URI_js_1.URI.sanitize(propertyShape.label));
                    //with react hot reload, sometimes the same code gets loaded twice
                    //and a node with this URI will already exist,
                    //in that case we can ignore it, since the nodeShape will already have the propertyShape
                    if (!models_js_1.NamedNode.getNamedNode(uri)) {
                        //update the URI (by extending the URI of the shape)
                        propertyShape.namedNode.uri =
                            shape_1.namedNode.uri + "/".concat(URI_js_1.URI.sanitize(propertyShape.label));
                        shape_1.addPropertyShape(propertyShape);
                    }
                });
                //and remove the temporary key
                delete constructor.propertyShapes;
            }
            //if property shapes referred to this node shape as the required shape for their values
            // (note that accessor decorators always evaluate before class decorators, hence we sometimes need to process this here, AFTER the property decorators have run)
            if (constructor.nodeShapeOf) {
                constructor.nodeShapeOf.forEach(function (propertyShape) {
                    //now that we have a NodeShape for this shape class, we can set the nodeShape of the property shape
                    propertyShape.valueShape = shape_1;
                });
            }
        }
        else {
            // (constructor.shape.node as NamedNode).uri = URI;
            console.warn('This ShapeClass already has a shape: ', constructor.shape);
        }
        if (constructor.targetClass) {
            constructor.shape.targetClass = constructor.targetClass;
        }
        //return the original class without modifications
        return constructor;
    };
    /**
     *
     * @param exports all exports of the file, simply provide "this" as value!
     * @param dataSource the path leading to the ontology's data file
     * @param nameSpace the base URI of the ontology
     * @param prefixAndFileName the file name MUST match the prefix for this ontology
     */
    var linkedOntology = function (exports, nameSpace, prefixAndFileName, loadData, dataSource) {
        var exportsCopy = __assign({}, exports);
        //store specifics in exports. And make sure we can detect this as an ontology later
        exportsCopy['_ns'] = nameSpace;
        exportsCopy['_prefix'] = prefixAndFileName;
        exportsCopy['_load'] = loadData;
        exportsCopy['_data'] = dataSource;
        //register the prefix here (so just calling linkedOntology with a prefix will automatically register that prefix)
        if (prefixAndFileName) {
            //run the namespace without any term name, this will give back a named node with just the namespace as URI, then get that URI to provide it as full URI
            Prefix_js_1.Prefix.add(prefixAndFileName, nameSpace('').uri);
        }
        ontologies.add(exportsCopy);
        //register all the exports under the prefix. NOTE: this means the file name HAS to match the prefix
        registerInPackageTree(prefixAndFileName, exportsCopy);
        // });
        if (autoLoadOntologyData) {
            loadData().catch(function (err) {
                console.warn('Could not load ontology data. Do you need to rebuild the module of the ' +
                    prefixAndFileName +
                    ' ontology?', err);
            });
        }
    };
    //return the declarators so the module can use them
    return {
        linkedComponent: linkedComponent,
        linkedSetComponent: linkedSetComponent,
        linkedShape: linkedShape,
        linkedUtil: linkedUtil,
        linkedOntology: linkedOntology,
        registerPackageExport: registerPackageExport,
        registerPackageModule: registerPackageModule,
        packageExports: packageTreeObject,
        packageName: packageName,
    };
}
exports.linkedPackage = linkedPackage;
function registerComponent(exportedComponent, shape) {
    if (!shape) {
        //warn developers against a common mistake: if no static shape is set by the Component it will inherit the one of the class it extends
        if (!exportedComponent.hasOwnProperty('shape')) {
            console.warn("Component ".concat(exportedComponent.displayName || exportedComponent.name, " is not linked to a shape."));
            return;
        }
        shape = exportedComponent.shape;
    }
    if (!shapeToComponents.has(shape)) {
        shapeToComponents.set(shape, new CoreSet_js_1.CoreSet());
    }
    shapeToComponents.get(shape).add(exportedComponent);
}
function registerPackageInTree(packageName, packageExports) {
    //prepare name for global tree reference
    // let packageTreeKey = packageName.replace(/-/g,'_');
    //if something with this name already registered in the global tree
    if (packageName in lincd._modules) {
        //This probably means package.ts is loaded twice, through different paths and could point to a problem
        //So we log about it. But there is one exception. LINCD itself registers itself twice: once in the bottom of this file and once in its package.ts file.
        //But if there are already other packages registered, then probably there is 2 versions of LINCD being loaded, and that IS a problem.
        if (packageName !== 'lincd' || Object.keys(lincd._modules).length !== 1) {
            console.warn('A package with the name ' +
                packageName +
                ' has already been registered. Adding to existing object');
        }
        Object.assign(lincd._modules[packageName], packageExports);
    }
    else {
        //initiate an empty object for this module in the global tree
        lincd._modules[packageName] = packageExports || {};
    }
    return lincd._modules[packageName];
}
function initTree() {
    var globalObject = typeof window !== 'undefined'
        ? window
        : typeof global !== 'undefined'
            ? global
            : undefined;
    if ('lincd' in globalObject) {
        throw new Error('Multiple versions of LINCD are loaded');
    }
    else {
        globalObject['lincd'] = { _modules: {} };
    }
}
exports.initTree = initTree;
//when this file is used, make sure the tree is initialized
initTree();
var lincdPackage = linkedPackage('lincd');
lincdPackage.linkedShape(SHACL_js_1.NodeShape);
lincdPackage.linkedShape(SHACL_js_1.PropertyShape);
//ALL the following is to support Shape having get/set methods with property shapes
//and Shape itself having a nodeShape
//if we dont need Shape to have get/set methods (like label and type) then this can be removed
Shape_js_1.Shape.shape = SHACL_js_1.NodeShape.getFromURI('http://lincd/Shape');
(0, ShapeClass_js_1.addNodeShapeToShapeClass)(Shape_js_1.Shape.shape, Shape_js_1.Shape);
//Here we can register the properties of the Shape class itself
//We can't do that inside of Shape because it would cause circular dependencies
(0, ShapeDecorators_js_1.registerLinkedProperty)({
    path: rdfs_js_1.rdfs.label,
}, 'label', Shape_js_1.Shape.shape, shacl_js_1.shacl.Literal);
(0, ShapeDecorators_js_1.registerLinkedProperty)({
    path: rdf_js_1.rdf.type,
}, 'type', Shape_js_1.Shape.shape);
//# sourceMappingURL=Package.js.map