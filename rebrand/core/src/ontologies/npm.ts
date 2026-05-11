import {NodeReferenceValue} from '../utils/NodeReference.js';
import {createNameSpace} from '../utils/NameSpace.js';
import {Prefix} from '../utils/Prefix.js';

const base = 'http://purl.org/on/npm/';
export const ns = createNameSpace(base);
Prefix.add('npm', base);

const packageName: NodeReferenceValue = ns('packageName');
const version: NodeReferenceValue = ns('version');

export const npm = {
  version,
  packageName,
};
