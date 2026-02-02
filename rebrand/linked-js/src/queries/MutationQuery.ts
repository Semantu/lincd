import {PropertyShape} from '../shapes/PropertyShape.js';
import {Shape} from '../shapes/Shape.js';
import type {QResult} from './SelectQuery.js';
import {NodeShape} from '../shapes/ShapeDefinition.js';

export type NodeReferenceValue = {id: string};
export type NodeId = NodeReferenceValue | {uri: string} | string;

export type UpdateNodePropertyValue = {
  prop: PropertyShape;
  val: UpdateValue;
};

export type NodeDescriptionValue = {
  shape: QResult<NodeShape>;
  fields: UpdateNodePropertyValue[];
  __id?: string;
};

export type SetModificationValue = {
  $add?: UpdateValue[];
  $remove?: NodeReferenceValue[];
};

export type UpdateValue =
  | string
  | number
  | boolean
  | Date
  | NodeReferenceValue
  | NodeDescriptionValue
  | UpdateValue[]
  | SetModificationValue
  | undefined;

export class MutationQueryFactory {
  protected convertNodeReference(value: NodeId): NodeReferenceValue {
    if (typeof value === 'string') {
      return {id: value};
    }
    if ('id' in value) {
      return {id: value.id};
    }
    if ('uri' in value) {
      return {id: value.uri};
    }
    throw new Error('Invalid node reference value');
  }

  protected convertNodeReferences(ids: NodeId | NodeId[]): NodeReferenceValue[] {
    if (Array.isArray(ids)) {
      return ids.map((id) => this.convertNodeReference(id));
    }
    return [this.convertNodeReference(ids)];
  }

  protected convertUpdateObject(
    obj: Record<string, unknown>,
    shape: NodeShape,
    allowTopLevelId = false,
  ): NodeDescriptionValue {
    if (!obj || typeof obj !== 'object' || obj instanceof Date) {
      throw new Error('Invalid update object');
    }
    if (!allowTopLevelId && 'id' in obj) {
      throw new Error('You cannot use id in the top level of an update object');
    }
    return this.convertNodeDescription({...obj}, shape);
  }

  protected convertNodeDescription(
    obj: Record<string, unknown>,
    shape: NodeShape,
  ): NodeDescriptionValue {
    const props = shape.getPropertyShapes();
    const fields: UpdateNodePropertyValue[] = [];
    let id: string | undefined;
    if ('__id' in obj) {
      id = obj.__id as string;
      delete obj.__id;
    }
    Object.keys(obj).forEach((key) => {
      const propShape = props.find((p) => p.label === key);
      if (!propShape) {
        throw new Error(`Invalid property key: ${key}`);
      }
      fields.push({
        prop: propShape,
        val: this.convertUpdateValue(obj[key], propShape),
      });
    });
    const description: NodeDescriptionValue = {
      shape,
      fields,
    };
    if (id) {
      description.__id = id;
    }
    return description;
  }

  protected convertSetModification(
    value: Record<string, unknown>,
    propShape: PropertyShape,
  ): SetModificationValue {
    const result: SetModificationValue = {};
    if ('add' in value) {
      const addValue = value.add;
      result.$add = Array.isArray(addValue)
        ? addValue.map((v) => this.convertUpdateValue(v, propShape))
        : [this.convertUpdateValue(addValue, propShape)];
    }
    if ('remove' in value) {
      const removeValue = value.remove;
      const toRemove = Array.isArray(removeValue) ? removeValue : [removeValue];
      result.$remove = toRemove.map((v) => this.convertNodeReference(v as NodeId));
    }
    return result;
  }

  protected isSetModification(value: Record<string, unknown>): boolean {
    const hasAdd = 'add' in value;
    const hasRemove = 'remove' in value;
    const numKeys = Object.keys(value).length;
    return (hasAdd || hasRemove) && numKeys <= 2;
  }

  protected convertUpdateValue(
    value: unknown,
    propShape?: PropertyShape,
  ): UpdateValue {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value instanceof Date
    ) {
      return value;
    }
    if (typeof value === 'undefined') {
      return undefined;
    }
    if (value === null) {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.convertUpdateValue(item, propShape));
    }
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if ('id' in record || 'uri' in record) {
        return this.convertNodeReference(record as NodeId);
      }
      if (this.isSetModification(record)) {
        return this.convertSetModification(record, propShape);
      }
      const shapeClass =
        propShape?.valueShapeClass || (propShape?.shape as unknown as typeof Shape);
      if (!shapeClass?.shape) {
        throw new Error(
          `Cannot update property ${propShape?.label ?? ''} without shape`,
        );
      }
      return this.convertNodeDescription(record, shapeClass.shape);
    }
    throw new Error('Invalid update value');
  }
}
