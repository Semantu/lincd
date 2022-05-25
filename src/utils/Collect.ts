import {QuadSet} from '../collections/QuadSet';
import {BlankNode, Quad} from '../models';

export function includeBlankNodes(quads: QuadSet | Quad[]) {
	let add =
		quads instanceof QuadSet ? quads.add.bind(quads) : quads.push.bind(quads);
	for (var quad of quads) {
		if (quad.object instanceof BlankNode) {
			addBlankNodeQuads(quad.object, add);
		}
	}
	return quads;
}
function addBlankNodeQuads(blankNode: BlankNode, add: (n: any) => void) {
	blankNode.getAllQuads().forEach((quad) => {
		if (!(quad instanceof Quad)) {
			throw new Error('Not a quad');
		}
		add(quad);
		//also, iteratively include quads of blank-node values of blank-nodes
		if (quad.object instanceof BlankNode) {
			addBlankNodeQuads(quad.object, add);
		}
	});
}
