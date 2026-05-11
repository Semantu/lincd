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
