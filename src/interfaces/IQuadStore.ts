import {QuadSet} from '../collections/QuadSet';
import {Quad} from '../models';

export interface IQuadStore {
	add(quad: Quad): Promise<any>;

	addMultiple?(quads: QuadSet): Promise<any>;

	delete(quad: Quad): Promise<any>;

	deleteMultiple?(quads: QuadSet): Promise<any>;
}
