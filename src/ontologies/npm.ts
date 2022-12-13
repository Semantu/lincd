import {createNameSpace} from '../utils/NameSpace';
import {NamedNode} from '../models';
import {Prefix} from '../utils/Prefix';

let base = 'http://purl.org/on/npm/';
export var ns = createNameSpace(base);
Prefix.add('npm', base);

var packageName: NamedNode = ns('packageName');
var version: NamedNode = ns('version');

export var npm = {
  version,
  packageName,
};
