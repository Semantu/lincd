export type PropertyShapeConfig<ShapeType> = {
  path: string;
  maxCount?: number;
  shape?: ShapeType;
};

export class PropertyShape<ShapeType = unknown> {
  label: string;
  path: string;
  maxCount?: number;
  shape?: ShapeType;

  constructor(label: string, config: PropertyShapeConfig<ShapeType>) {
    this.label = label;
    this.path = config.path;
    this.maxCount = config.maxCount;
    this.shape = config.shape;
  }
}
