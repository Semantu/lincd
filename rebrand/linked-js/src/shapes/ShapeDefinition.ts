import {PropertyShape} from './PropertyShape.js';

export class ShapeDefinition {
  private propertyShapes: PropertyShape[] = [];

  addPropertyShape(propertyShape: PropertyShape) {
    this.propertyShapes.push(propertyShape);
  }

  getPropertyShapes(): PropertyShape[] {
    return this.propertyShapes;
  }
}
