import {PropertyShape, PropertyShapeResult} from './PropertyShape.js';
import {sanitizeUriFragment} from './shacl.js';

export type NodeRef = {id: string};

export class NodeShape {
  id: string;
  label?: string;
  targetClass?: NodeRef;
  private propertyShapes: PropertyShape[] = [];

  constructor(options?: {id?: string; label?: string; targetClass?: NodeRef}) {
    this.id = options?.id;
    this.label = options?.label;
    this.targetClass = options?.targetClass;
  }

  addPropertyShape(propertyShape: PropertyShape) {
    if (this.id && !propertyShape.id) {
      propertyShape.id = `${this.id}/${sanitizeUriFragment(propertyShape.label)}`;
    }
    this.propertyShapes.push(propertyShape);
  }

  getPropertyShapes(): PropertyShape[] {
    return this.propertyShapes;
  }

  get properties(): PropertyShapeResult[] {
    return this.propertyShapes.map((shape) => shape.getResult());
  }
}
