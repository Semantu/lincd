import {_self as lincdSelf, lincd as lincdRefs} from './lincd.js';
import {toNamedNode, toNamedNodeMap} from '../utils/NodeReference.js';

export const _self = toNamedNode(lincdSelf);
export const lincd = toNamedNodeMap(lincdRefs);
