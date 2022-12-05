import {NamedNode} from '../models';

export const createNameSpace = (nameSpace: string) => {
  return (term) => NamedNode.getOrCreate(nameSpace + term);
};
