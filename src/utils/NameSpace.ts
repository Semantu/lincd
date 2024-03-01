import {NamedNode} from '../models.js';

export const createNameSpace = (nameSpace: string) => {
  return (term) => NamedNode.getOrCreate(nameSpace + term);
};
