import {QuadSet} from '../collections/QuadSet';
import {Graph, NamedNode, Quad} from '../models';
import {NodeSet} from '../collections/NodeSet';
import {ICoreIterable} from './ICoreIterable';
import {LinkedDataRequest, LinkedDataResponse, Shape} from '../shapes/Shape';
import {QuadArray} from '../collections/QuadArray';

export interface IQuadStore {
  /**
   * Prepares the store to be used.
   */
  init(): Promise<any>;

  update(toAdd: ICoreIterable<Quad>, toRemove: ICoreIterable<Quad>): Promise<any>;

  add(quad: Quad): Promise<any>;

  addMultiple(quads: QuadSet): Promise<any>;

  delete(quad: Quad): Promise<any>;

  deleteMultiple(quads: QuadSet): Promise<any>;

  setURI(...nodes: NamedNode[]): Promise<any>;

  getDefaultGraph(): Graph;

  removeNodes(nodes: ICoreIterable<NamedNode>): Promise<any>;

  loadShape(shapeInstance: Shape, shape: LinkedDataRequest): Promise<QuadArray>;
}
