"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initModularApp = exports.nextTick = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
//import everything from each file that we want to be bundled in the stand-alone dist/lincd.js file
var Package = __importStar(require("./utils/Package.js"));
var models = __importStar(require("./models.js"));
var LinkedErrorLogging = __importStar(require("./utils/LinkedErrorLogging.js"));
var LinkedFileStorage = __importStar(require("./utils/LinkedFileStorage.js"));
var LinkedStorage = __importStar(require("./utils/LinkedStorage.js"));
var EventEmitter = __importStar(require("./events/EventEmitter.js"));
var NodeURIMappings = __importStar(require("./collections/NodeURIMappings.js"));
var CoreSet = __importStar(require("./collections/CoreSet.js"));
var CoreMap = __importStar(require("./collections/CoreMap.js"));
var SearchMap = __importStar(require("./collections/SearchMap.js"));
var PropertySet = __importStar(require("./collections/NodeValuesSet.js"));
var NodeMap = __importStar(require("./collections/NodeMap.js"));
var NodeSet = __importStar(require("./collections/NodeSet.js"));
var QuadArray = __importStar(require("./collections/QuadArray.js"));
var QuadMap = __importStar(require("./collections/QuadMap.js"));
var QuadSet = __importStar(require("./collections/QuadSet.js"));
var Shape = __importStar(require("./shapes/Shape.js"));
var SHACLShapes = __importStar(require("./shapes/SHACL.js"));
var ShapeSet = __importStar(require("./collections/ShapeSet.js"));
var Prefix = __importStar(require("./utils/Prefix.js"));
var Debug = __importStar(require("./utils/Debug.js"));
var URI = __importStar(require("./utils/URI.js"));
var Find = __importStar(require("./utils/Find.js"));
var Order = __importStar(require("./utils/Order.js"));
var NQuads = __importStar(require("./utils/NQuads.js"));
var LinkedQuery = __importStar(require("./utils/LinkedQuery.js"));
var LinkedComponent = __importStar(require("./utils/LinkedComponent.js"));
var LinkedComponentClass = __importStar(require("./utils/LinkedComponentClass.js"));
var ForwardReasoning = __importStar(require("./utils/ForwardReasoning.js"));
var NameSpace = __importStar(require("./utils/NameSpace.js"));
var Hooks = __importStar(require("./utils/Hooks.js"));
var ShapeClass = __importStar(require("./utils/ShapeClass.js"));
var ShapeDecorators = __importStar(require("./utils/ShapeDecorators.js"));
var ClassNames = __importStar(require("./utils/ClassNames.js"));
var List = __importStar(require("./shapes/List.js"));
var IGraphObject = __importStar(require("./interfaces/IGraphObject.js"));
var IGraphObjectSet = __importStar(require("./interfaces/IGraphObjectSet.js"));
var ICoreIterable = __importStar(require("./interfaces/ICoreIterable.js"));
var IFileStore = __importStar(require("./interfaces/IFileStore.js"));
var IQuadStore = __importStar(require("./interfaces/IQuadStore.js"));
var rdf = __importStar(require("./ontologies/rdf.js"));
var rdfs = __importStar(require("./ontologies/rdfs.js"));
var xsd = __importStar(require("./ontologies/xsd.js"));
var shacl = __importStar(require("./ontologies/shacl.js"));
var DataFactory = __importStar(require("./Datafactory.js"));
var react_1 = __importDefault(require("react"));
exports.nextTick = require('next-tick');
function initModularApp() {
    //we don't want people to import {NamedNode} from 'lincd' for example
    //because this does not work well with tree shaking
    //therefor we do not export all the classes here from the index directly
    //instead we make all components of LINCD available through the global tree for modular apps
    var publicFiles = {
        DataFactory: DataFactory,
        Node: Node,
        EventEmitter: EventEmitter,
        NodeURIMappings: NodeURIMappings,
        CoreSet: CoreSet,
        CoreMap: CoreMap,
        SearchMap: SearchMap,
        PropertySet: PropertySet,
        NodeMap: NodeMap,
        NodeSet: NodeSet,
        QuadArray: QuadArray,
        QuadMap: QuadMap,
        QuadSet: QuadSet,
        models: models,
        LinkedErrorLogging: LinkedErrorLogging,
        LinkedFileStorage: LinkedFileStorage,
        LinkedStorage: LinkedStorage,
        Shape: Shape,
        ShapeSet: ShapeSet,
        Debug: Debug,
        NameSpace: NameSpace,
        List: List,
        ClassNames: ClassNames,
        URI: URI,
        Hooks: Hooks,
        ShapeClass: ShapeClass,
        ForwardReasoning: ForwardReasoning,
        Find: Find,
        Order: Order,
        Prefix: Prefix,
        NQuads: NQuads,
        Boolean: Boolean,
        ShapeDecorators: ShapeDecorators,
        Package: Package,
        IGraphObject: IGraphObject,
        IGraphObjectSet: IGraphObjectSet,
        ICoreIterable: ICoreIterable,
        IFileStore: IFileStore,
        IQuadStore: IQuadStore,
        LinkedComponentClass: LinkedComponentClass,
        LinkedComponent: LinkedComponent,
        LinkedQuery: LinkedQuery,
        SHACLShapes: SHACLShapes,
        rdf: rdf,
        rdfs: rdfs,
        xsd: xsd,
        shacl: shacl,
    };
    //register the library in the global tree and make all classes available directly from it
    var lincdExport = {};
    for (var fileKey in publicFiles) {
        var exportedClasses = publicFiles[fileKey];
        for (var className in exportedClasses) {
            lincdExport[className] = exportedClasses[className];
        }
    }
    //add all the exports to the global LINCD object
    if (typeof window !== 'undefined') {
        Object.assign(window['lincd'], lincdExport);
    }
    else if (typeof global !== 'undefined') {
        Object.assign(global['lincd'], lincdExport);
    }
    //modular apps will expect React to be available as a global variable
    //therefor when enabling modular apps, lincd makes its own React version available through window
    window['React'] = react_1.default;
}
exports.initModularApp = initModularApp;
//# sourceMappingURL=index.js.map