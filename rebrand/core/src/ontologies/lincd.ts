import {NodeReferenceValue} from '../utils/NodeReference.js';
import {createNameSpace} from '../utils/NameSpace.js';
import {Prefix} from '../utils/Prefix.js';

export const ns = createNameSpace('https://purl.org/on/lincd/');
export const _self: NodeReferenceValue = ns('');
Prefix.add('lincd', _self.id);

const Module = ns('Module');
const ShapeClass = ns('ShapeClass');
const definesShape = ns('definesShape');
const moduleProperty = ns('module');
const usesShapeClass = ns('usesShapeClass');
const editInline = ns('editInline');
const isExtending = ns('isExtending');

export const lincd = {
  Module,
  ShapeClass,
  definesShape,
  module: moduleProperty,
  usesShapeClass,
  editInline,
  isExtending,
};
