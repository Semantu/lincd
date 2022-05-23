import {QuadSet} from '../collections/QuadSet';
import {BlankNode, Quad} from '../models';

export function includeBlankNodes(quads: QuadSet | Quad[]) {
	let add =
		quads instanceof QuadSet ? quads.add.bind(quads) : quads.push.bind(quads);
	for (var quad of quads) {
		if (quad.object instanceof BlankNode) {
			quad.object.getAllQuads().forEach((q) => {
				if (!(q instanceof Quad)) {
					throw new Error('Not a quad');
				}
				add(q);
			});
		}
	}
	return quads;
}
