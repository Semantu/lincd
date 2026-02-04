import {rdfs as rdfsRefs, _ontologyResource as rdfsResource} from './rdfs.js';
import {toNamedNode, toNamedNodeMap} from '../utils/NodeReference.js';

export const _ontologyResource = toNamedNode(rdfsResource);
export const rdfs = toNamedNodeMap(rdfsRefs);
