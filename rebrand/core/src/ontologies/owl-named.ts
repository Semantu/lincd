import {owl as owlRefs, _ontologyResource as owlResource} from './owl.js';
import {toNamedNode, toNamedNodeMap} from '../utils/NodeReference.js';

export const _ontologyResource = toNamedNode(owlResource);
export const owl = toNamedNodeMap(owlRefs);
