import {NodeReferenceValue} from './NodeReference.js';

export const createNameSpace = (nameSpace: string) => {
  return (term: string): NodeReferenceValue => ({id: nameSpace + term});
};
