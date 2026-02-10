import {
  defaultGraph as _default,
  Graph,
  Literal,
  NamedNode,
  Node,
  Quad,
} from './models.js';
import {Term} from 'rdflib/lib/tf-types';
import {NodeURIMappings} from './collections/NodeURIMappings.js';
import {QuadSet} from './collections/QuadSet.js';
import {CoreMap} from '@_linked/core/collections/CoreMap';
import {CoreSet} from '@_linked/core/collections/CoreSet';

interface DataFactoryConfig {
  preventNewQuads?: boolean;
  emitEvents?: boolean;
  triggerStorage?: boolean;
  nodeMap?: NodeURIMappings;
  targetGraph?: Graph;
  overwriteData?: boolean;
}

export class Datafactory {
  public quads = new QuadSet();
  private nodeMap?: NodeURIMappings;
  private preventNewQuads: boolean;
  private emitEvents: boolean = true;
  private triggerStorage: boolean = false;
  private targetGraph: Graph;
  private clearedProps: CoreMap<NamedNode, CoreSet<NamedNode>>;
  private overwriteData?: boolean;

  constructor(config?: DataFactoryConfig) {
    for (let key in config) {
      this[key] = config[key];
    }
    if (!config?.nodeMap) {
      this.nodeMap = new NodeURIMappings();
    }
    this.quad = this.quad.bind(this);
    this.blankNode = this.blankNode.bind(this);
    this.namedNode = this.namedNode.bind(this);
    this.literal = this.literal.bind(this);
    if (config?.overwriteData) {
      this.clearedProps = new CoreMap<NamedNode, CoreSet<NamedNode>>();
    }
  }

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
    // if (this.nodeMap) {
    return this.nodeMap.getOrCreateBlankNode(value);
    // }
    // return BlankNode.getOrCreate(value);
  }

  defaultGraph() {
    return _default as any;
  }

  quad(subject: Term, predicate: Term, object: Term, graph: Term) {
    //if a target graph is given, we always use that, regardless of whether there was any graph present in the data
    //else if a graph was in the data, use that, or fall back to default graph
    if (this.targetGraph) {
      graph = this.targetGraph;
    } else if (!graph) {
      graph = _default;
    }

    //in LINCD we use Graph objects which extend NamedNode
    //but when parsing with N3 we get NamedNode objects
    if (graph instanceof NamedNode) {
      graph = Graph.getOrCreate(graph.uri);
    }

    //sometimes we want to update the graph with new data coming in from JSONLD
    //so if overwrite data is true, we clear old data for any subj/pred combination we find
    if (
      this.overwriteData &&
      (!this.clearedProps.has(subject as NamedNode) ||
        !this.clearedProps
          .get(subject as NamedNode)
          .has(predicate as NamedNode))
    ) {
      //remove without triggering storage events
      (subject as NamedNode).getQuads(predicate as NamedNode).removeAll(false);
      if (!this.clearedProps.has(subject as NamedNode)) {
        this.clearedProps.set(subject as NamedNode, new CoreSet<NamedNode>());
      }
      this.clearedProps.get(subject as NamedNode).add(predicate as NamedNode);
    }

    let quad;
    if (this.preventNewQuads) {
      quad = Quad.get(
        subject as NamedNode,
        predicate as NamedNode,
        object as Node,
        graph as Graph,
      );
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
