import {shacl as shaclRefs, _ontologyResource as shaclResource} from './shacl.js';
import {toNamedNode, toNamedNodeMap} from '../utils/NodeReference.js';

export const _ontologyResource = toNamedNode(shaclResource);
export const shacl = toNamedNodeMap(shaclRefs);
