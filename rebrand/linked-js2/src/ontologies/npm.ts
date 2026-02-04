import {createNameSpace} from '../utils/NameSpace.js';
import {NamedNode} from '../models.js';
import {Prefix} from '../utils/Prefix.js';

let base = 'http://purl.org/on/npm/';
export var ns = createNameSpace(base);
Prefix.add('npm', base);

var packageName: NamedNode = ns('packageName');
var version: NamedNode = ns('version');

export var npm = {
  version,
  packageName,
};
