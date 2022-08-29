import {QuadSet} from '../collections/QuadSet';
import {NamedNode,Quad} from '../models';
import {NodeSet} from '../collections/NodeSet';

export interface IQuadStore {
	add(quad: Quad): Promise<any>;

	addMultiple?(quads: QuadSet): Promise<any>;

	delete(quad: Quad): Promise<any>;

	deleteMultiple?(quads: QuadSet): Promise<any>;

  generateURIs(nodes:NodeSet<NamedNode>):void;
}
