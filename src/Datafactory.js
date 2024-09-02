"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Datafactory = void 0;
var models_js_1 = require("./models.js");
var NodeURIMappings_js_1 = require("./collections/NodeURIMappings.js");
var QuadSet_js_1 = require("./collections/QuadSet.js");
var Datafactory = /** @class */ (function () {
    function Datafactory(config) {
        this.quads = new QuadSet_js_1.QuadSet();
        this.emitEvents = true;
        this.triggerStorage = false;
        for (var key in config) {
            this[key] = config[key];
        }
        this.blankNodes = new NodeURIMappings_js_1.NodeURIMappings();
        this.quad = this.quad.bind(this);
        this.blankNode = this.blankNode.bind(this);
        this.namedNode = this.namedNode.bind(this);
        this.literal = this.literal.bind(this);
    }
    // startBlanknodeSpace() {
    //   this.blankNodes = new NodeURIMappings();
    // }
    // endBlanknodeSpace() {
    //   this.blankNodes = null;
    // }
    //TODO:
    //   Variable variable(DOMString value);
    //   Term fromTerm(Term original);
    //   Quad fromQuad(Quad original);
    Datafactory.prototype.namedNode = function (uri) {
        return models_js_1.NamedNode.getOrCreate(uri);
    };
    Datafactory.prototype.literal = function (value, languageOrDatatype) {
        if (languageOrDatatype instanceof models_js_1.NamedNode) {
            return new models_js_1.Literal(value, languageOrDatatype);
        }
        else {
            return new models_js_1.Literal(value, null, languageOrDatatype);
        }
    };
    Datafactory.prototype.blankNode = function (value) {
        //when using start/end blanknode space you can let the factory reuse the same blank nodes
        // if (this.blankNodes) {
        return this.blankNodes.getOrCreateBlankNode(value);
        // }
        // return BlankNode.getOrCreate(value);
    };
    Datafactory.prototype.defaultGraph = function () {
        return models_js_1.defaultGraph;
    };
    Datafactory.prototype.quad = function (subject, predicate, object, graph) {
        //if a target graph is given, we always use that, regardless of whether there was any graph present in the data
        //else if a graph was in the data, use that, or fall back to default graph
        if (!graph) {
            graph = models_js_1.defaultGraph;
        }
        //in LINCD we use Graph objects which extend NamedNode
        //but when parsing with N3 we get NamedNode objects
        if (graph instanceof models_js_1.NamedNode) {
            graph = models_js_1.Graph.getOrCreate(graph.uri);
        }
        var quad;
        if (this.preventNewQuads) {
            quad = models_js_1.Quad.get(subject, predicate, object, graph);
            if (quad) {
                this.quads.add(quad);
            }
            else {
                //NOTE: this is not standard, so preventNewQuads will not work with other tools
                //But it is useful for LINCD, where we want to prevent new quads from being created. Like when we share quads to be removed with other threads
                return true;
            }
        }
        else {
            quad = models_js_1.Quad.getOrCreate(subject, predicate, object, graph, false, this.triggerStorage, this.emitEvents);
            this.quads.add(quad);
        }
        return quad;
    };
    return Datafactory;
}());
exports.Datafactory = Datafactory;
//# sourceMappingURL=Datafactory.js.map