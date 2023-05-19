/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {ICoreIterable} from '../interfaces/ICoreIterable';
import {BlankNode, Graph, Literal, NamedNode, Node, Quad} from '../models';
import {QuadSet} from '../collections/QuadSet';
import {Shape} from '../shapes/Shape';

export class NQuads {

  static fromGraphs(graphs: ICoreIterable<Graph>,includeGraphs:boolean=true): string {
    let res = '';
    graphs.forEach((graph: Graph) => {
      res += this.fromQuads(graph.getContents(),includeGraphs);
    });
    return res;
  }

  static fromQuads(quadset: QuadSet | Quad[], includeGraphs:boolean=true,fixedGraph: Graph = null): string {
    let resultString: string = '';

    BlankNode.includeBlankNodes(quadset);

    quadset.forEach((quad) => {
      //we check for graph.node.uri not to be empty (as it can be for the default graph)
      //so that we always print an actual URI for the graph
      resultString +=
        this.toString(quad.subject) +
        ' ' +
        this.toString(quad.predicate) +
        ' ' +
        this.toString(quad.object) +
        (fixedGraph && fixedGraph.node.uri !== '' ? ' ' + this.toString(fixedGraph) : (includeGraphs && quad.graph && quad.graph.node.uri !== '' ? ' '+this.toString(quad.graph) : '')) +
        '.\n';
    });
    return resultString;
  }

  private static toString(element: Node | Graph | Quad | string, escapeNewLines: boolean = true) {
    if (element instanceof Shape) {
      return this.toString(element.node);
    } else if (element instanceof BlankNode) {
      return element.uri;
    } else if (element instanceof Graph) {
      return '<' + element.node.uri + '>';
    } else if (element instanceof NamedNode) {
      return '<' + element.uri + '>';
    } else if (element instanceof Literal) {
      //TODO: if there are every problems with this (the enters as escaped \\n) then we should check for indexOf \n
      //and if found we use quad quotes (add another 2 on both sides)
      return element.toString();
      // return escapeNewLines ? element.toString().replace(/\n/g, "\\n") : element.toString();
    } else if (element instanceof Quad) {
      return (
        this.toString(element.subject, escapeNewLines) +
        ' ' +
        this.toString(element.predicate, escapeNewLines) +
        ' ' +
        this.toString(element.object, escapeNewLines) +
        '.\n'
      );
    } else if (typeof element === 'string') {
      return '"' + (escapeNewLines ? element.replace(/\n/g, '\\n') : element) + '"';
    }

    throw new Error('Unsupported type given, cannot convert to SPARQL');
  }
}
