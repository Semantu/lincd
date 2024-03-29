import {QuadSet} from '../collections/QuadSet';
import {Graph, NamedNode, Quad} from '../models';
import {NodeSet} from '../collections/NodeSet';
import {ICoreIterable} from './ICoreIterable';
import {Shape} from '../shapes/Shape';
import {QuadArray} from '../collections/QuadArray';
import {CoreMap} from '../collections/CoreMap';
import {ShapeSet} from '../collections/ShapeSet';
import {LinkedDataRequest} from './Component';

export interface IQuadStore {
  /**
   * Prepares the store to be used.
   */
  init?(): Promise<any>;

  update(toAdd: ICoreIterable<Quad>, toRemove: ICoreIterable<Quad>): Promise<any>;

  add(quad: Quad): Promise<any>;

  addMultiple(quads: QuadSet): Promise<any>;

  delete(quad: Quad): Promise<any>;

  deleteMultiple(quads: QuadSet): Promise<any>;

  /**
   * Determines the right URI for several nodes
   * The URI's are determined by the store, and the store returns a mapping of current URI's to new URI's
   * Stores that implement this method should note that the URI's of the nodes used as keys may not be the same as the URI's
   * of the nodes in the environment that requested the URI change. Hence, a map is provided. The node (the key) can be used to access properties, whilst the currentUri (the value of the map) should be returned in the resulting [currentUri,newUri] array
   * @param nodeToCurrentUriMap
   */
  setURIs(nodeToCurrentUriMap: CoreMap<NamedNode,string>): Promise<[string,string][]>;

  getDefaultGraph?(): Graph;

  removeNodes(nodes: ICoreIterable<NamedNode>): Promise<any>;

  loadShape(shapeInstance: Shape, shape: LinkedDataRequest): Promise<QuadArray>;

  loadShapes(shapeSet: ShapeSet, shape: LinkedDataRequest): Promise<QuadArray>;

  /**
   * Clears all values of specific predicates for specific subjects
   * @param subjectToPredicates a map of subjects as keys and sets of properties (predicates) to clear as the values
   * @return A promise that resolves to true if properties were cleared, or false if no properties were cleared
   */
  clearProperties(subjectToPredicates:CoreMap<NamedNode,NodeSet<NamedNode>>): Promise<boolean>;
}
