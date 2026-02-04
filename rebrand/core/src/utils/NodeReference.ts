import {NamedNode} from '../models.js';

export type NodeReferenceValue = {id: string};

export type NodeReferenceInput = NodeReferenceValue | string;

export function toNodeReference(value: NodeReferenceInput): NodeReferenceValue {
  return typeof value === 'string' ? {id: value} : value;
}

export function isNodeReferenceValue(value: unknown): value is NodeReferenceValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as NodeReferenceValue).id === 'string'
  );
}

export function toNamedNode(
  value: NodeReferenceValue | NamedNode | string,
): NamedNode {
  if (value instanceof NamedNode) {
    return value;
  }
  return NamedNode.getOrCreate(typeof value === 'string' ? value : value.id);
}

export function toNamedNodeMap<
  T extends Record<string, NodeReferenceValue>,
>(entries: T): {[K in keyof T]: NamedNode} {
  const result = {} as {[K in keyof T]: NamedNode};
  for (const key of Object.keys(entries) as Array<keyof T>) {
    result[key] = toNamedNode(entries[key]);
  }
  return result;
}
