import {xsd as xsdRefs, _ontologyResource as xsdResource} from './xsd.js';
import {toNamedNode, toNamedNodeMap} from '../utils/NodeReference.js';

export const _ontologyResource = toNamedNode(xsdResource);
export const xsd = toNamedNodeMap(xsdRefs);
