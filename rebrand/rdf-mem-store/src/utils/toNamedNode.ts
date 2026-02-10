import {NamedNode} from '../models';

/**
 * Converts a NodeReferenceValue ({id: string}) or NamedNode to a NamedNode.
 * If already a NamedNode, returns it directly.
 */
export function toNamedNode(ref: {id: string}): NamedNode {
  if (ref instanceof NamedNode) {
    return ref;
  }
  return NamedNode.getOrCreate(ref.id);
}
