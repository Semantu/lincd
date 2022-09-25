import {QuadSet} from '../collections/QuadSet';
import {Graph,NamedNode,Quad} from '../models';
import {NodeSet} from '../collections/NodeSet';
import {ICoreIterable} from './ICoreIterable';

export interface IQuadStore {

  update(toAdd:ICoreIterable<Quad>,toRemove:ICoreIterable<Quad>):Promise<any>;

	add(quad: Quad): Promise<any>;

	addMultiple?(quads: QuadSet): Promise<any>;

	delete(quad: Quad): Promise<any>;

	deleteMultiple?(quads: QuadSet): Promise<any>;

  setURI(...nodes:NamedNode[]):void;

  getDefaultGraph():Graph;
}
