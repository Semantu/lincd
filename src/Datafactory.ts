import {BlankNode, defaultGraph as _default, Graph, Literal, NamedNode, Quad, Node} from './models';
import {Term} from 'rdflib/lib/tf-types';
import {NodeURIMappings} from './collections/NodeURIMappings';
import {QuadSet} from './collections/QuadSet';
interface DataFactoryConfig {
  preventNewQuads?: boolean;
  emitEvents?: boolean;
  triggerStorage?: boolean;
}
export class Datafactory {
  private blankNodes;
  public quads = new QuadSet();
  private preventNewQuads: boolean;
  private emitEvents: boolean = true;
  private triggerStorage: boolean = false;
  constructor(config?: DataFactoryConfig) {
    for (let key in config) {
      this[key] = config[key];
    }
    this.blankNodes = new NodeURIMappings();
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

  namedNode(uri: string) {
    return NamedNode.getOrCreate(uri);
  }
  literal(value, languageOrDatatype) {
    if (languageOrDatatype instanceof NamedNode) {
      return new Literal(value, languageOrDatatype);
    } else {
      return new Literal(value, null, languageOrDatatype);
    }
  }
  blankNode(value) {
    //when using start/end blanknode space you can let the factory reuse the same blank nodes
    // if (this.blankNodes) {
    return this.blankNodes.getOrCreateBlankNode(value);
    // }
    // return BlankNode.getOrCreate(value);
  }
  defaultGraph() {
    return _default as any;
  }
  quad(subject: Term, predicate: Term, object: Term, graph: Term) {
    //if a target graph is given, we always use that, regardless of whether there was any graph present in the data
    //else if a graph was in the data, use that, or fall back to default graph
    if (!graph) {
      graph = _default;
    }

    //in LINCD we use Graph objects which extend NamedNode
    //but when parsing with N3 we get NamedNode objects
    if (graph instanceof NamedNode) {
      graph = Graph.getOrCreate(graph.uri);
    }
    let quad;
    if (this.preventNewQuads) {
      quad = Quad.get(subject as NamedNode, predicate as NamedNode, object as Node, graph as Graph);
      if (quad) {
        this.quads.add(quad);
      } else {
        //NOTE: this is not standard, so preventNewQuads will not work with other tools
        //But it is useful for LINCD, where we want to prevent new quads from being created. Like when we share quads to be removed with other threads
        return true;
      }
    } else {
      quad = Quad.getOrCreate(
        subject as NamedNode,
        predicate as NamedNode,
        object as Node,
        graph as Graph,
        false,
        this.triggerStorage,
        this.emitEvents,
      );
      this.quads.add(quad);
    }
    return quad;
  }
}
