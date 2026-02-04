import {rdf as rdfRefs, _ontologyResource as rdfResource} from './rdf.js';
import {toNamedNode, toNamedNodeMap} from '../utils/NodeReference.js';

export const _ontologyResource = toNamedNode(rdfResource);
export const rdf = toNamedNodeMap(rdfRefs);
