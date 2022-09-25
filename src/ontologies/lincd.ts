import {NamedNode} from '../models';
import {createNameSpace} from '../utils/NameSpace';
import {Prefix} from '../utils/Prefix';

export var ns = createNameSpace('https://purl.org/on/lincd/');
export var _self: NamedNode = ns('');
Prefix.add('lincd', _self.uri);

var Module: NamedNode = ns('Module');
var ShapeClass: NamedNode = ns('ShapeClass');
var definesShape: NamedNode = ns('definesShape');
var module: NamedNode = ns('module');
var usesShapeClass: NamedNode = ns('usesShapeClass');

export var lincd = {
  Module,
  ShapeClass,
  definesShape,
  module,
  usesShapeClass,
};
