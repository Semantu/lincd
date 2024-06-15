"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NQuads = void 0;
var models_js_1 = require("../models.js");
var Shape_js_1 = require("../shapes/Shape.js");
var NQuads = /** @class */ (function () {
    function NQuads() {
    }
    NQuads.fromGraphs = function (graphs, includeGraphs) {
        var _this = this;
        if (includeGraphs === void 0) { includeGraphs = true; }
        var res = '';
        graphs.forEach(function (graph) {
            res += _this.fromQuads(graph.getContents(), includeGraphs);
        });
        return res;
    };
    NQuads.fromQuads = function (quadset, includeGraphs, fixedGraph) {
        var _this = this;
        if (includeGraphs === void 0) { includeGraphs = true; }
        if (fixedGraph === void 0) { fixedGraph = null; }
        var resultString = '';
        models_js_1.BlankNode.includeBlankNodes(quadset);
        quadset.forEach(function (quad) {
            //we check for graph.node.uri not to be empty (as it can be for the default graph)
            //so that we always print an actual URI for the graph
            resultString +=
                _this.toString(quad.subject) +
                    ' ' +
                    _this.toString(quad.predicate) +
                    ' ' +
                    _this.toString(quad.object) +
                    (fixedGraph && fixedGraph.node.uri !== ''
                        ? ' ' + _this.toString(fixedGraph)
                        : includeGraphs && quad.graph && quad.graph.node.uri !== ''
                            ? ' ' + _this.toString(quad.graph)
                            : '') +
                    '.\n';
        });
        return resultString;
    };
    NQuads.checkUri = function (uri) {
        if (uri.startsWith(' ') || uri.endsWith(' ')) {
            throw new Error('URIs cannot start or end with a space: ' + uri);
        }
    };
    NQuads.toString = function (element, escapeNewLines) {
        if (escapeNewLines === void 0) { escapeNewLines = true; }
        if (element instanceof Shape_js_1.Shape) {
            return this.toString(element.node);
        }
        else if (element instanceof models_js_1.BlankNode) {
            return element.uri;
        }
        else if (element instanceof models_js_1.Graph) {
            this.checkUri(element.node.uri);
            return '<' + element.node.uri + '>';
        }
        else if (element instanceof models_js_1.NamedNode) {
            this.checkUri(element.uri);
            return '<' + element.uri + '>';
        }
        else if (element instanceof models_js_1.Literal) {
            //TODO: if there are every problems with this (the enters as escaped \\n) then we should check for indexOf \n
            //and if found we use quad quotes (add another 2 on both sides)
            return element.toString();
            // return escapeNewLines ? element.toString().replace(/\n/g, "\\n") : element.toString();
        }
        else if (element instanceof models_js_1.Quad) {
            return (this.toString(element.subject, escapeNewLines) +
                ' ' +
                this.toString(element.predicate, escapeNewLines) +
                ' ' +
                this.toString(element.object, escapeNewLines) +
                '.\n');
        }
        else if (typeof element === 'string') {
            return ('"' + (escapeNewLines ? element.replace(/\n/g, '\\n') : element) + '"');
        }
        throw new Error('Unsupported type given, cannot convert to SPARQL');
    };
    return NQuads;
}());
exports.NQuads = NQuads;
//# sourceMappingURL=NQuads.js.map