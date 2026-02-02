import type {QResult} from '../queries/SelectQuery.js';
import type {Shape} from './Shape.js';

export type NodeRef = {id: string};

export type PropertyShapeConfig<ShapeType> = {
  path: string | NodeRef;
  maxCount?: number;
  minCount?: number;
  datatype?: string | NodeRef;
  nodeKind?: string | NodeRef;
  shape?: ShapeType | string | NodeRef;
  name?: string;
  description?: string;
  required?: boolean;
};

export type PropertyShapeResult = QResult<null, {
  path: NodeRef | NodeRef[];
  minCount?: number;
  maxCount?: number;
  datatype?: NodeRef;
  nodeKind?: NodeRef;
  name?: string;
  description?: string;
  shape?: NodeRef;
}>;

const toNodeRef = (value: string | NodeRef): NodeRef => {
  if (typeof value === 'string') {
    return {id: value};
  }
  return value;
};

export class PropertyShape<ShapeType = unknown> {
  label: string;
  path: NodeRef;
  maxCount?: number;
  minCount?: number;
  datatype?: NodeRef;
  nodeKind?: NodeRef;
  name?: string;
  description?: string;
  shape?: ShapeType | string | NodeRef;
  valueShapeClass?: typeof Shape;
  id: string;

  constructor(label: string, config: PropertyShapeConfig<ShapeType>) {
    this.label = label;
    this.path = toNodeRef(config.path);
    this.maxCount = config.maxCount;
    this.minCount = config.required ? 1 : config.minCount;
    this.datatype = config.datatype ? toNodeRef(config.datatype) : undefined;
    this.nodeKind = config.nodeKind ? toNodeRef(config.nodeKind) : undefined;
    if (config.shape) {
      if (typeof config.shape === 'function') {
        this.valueShapeClass = config.shape as unknown as typeof Shape;
        if (this.valueShapeClass.shape?.id) {
          this.shape = {id: this.valueShapeClass.shape.id};
        } else {
          this.shape = config.shape as ShapeType;
        }
      } else if (typeof config.shape === 'string') {
        this.shape = {id: config.shape} as NodeRef;
      } else {
        this.shape = config.shape;
      }
    }
    this.name = config.name;
    this.description = config.description;
  }

  getResult(): PropertyShapeResult {
    return {
      id: this.id,
      path: this.path,
      minCount: this.minCount,
      maxCount: this.maxCount,
      datatype: this.datatype,
      nodeKind: this.nodeKind,
      name: this.name,
      description: this.description,
      shape:
        this.shape && typeof this.shape === 'object' && 'id' in this.shape
          ? (this.shape as NodeRef)
          : this.shape
            ? toNodeRef(this.shape as string)
            : undefined,
    };
  }
}
