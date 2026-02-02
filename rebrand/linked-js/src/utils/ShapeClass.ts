import type {PropertyShape} from '../shapes/PropertyShape.js';
import {Shape} from '../shapes/Shape.js';

export const getPropertyShapeByLabel = (
  shapeClass: typeof Shape,
  label: string,
): PropertyShape | undefined => {
  let current: typeof Shape = shapeClass;

  while (current) {
    const propertyShape = current.shape
      ?.getPropertyShapes()
      .find((shape) => shape.label === label);
    if (propertyShape) {
      return propertyShape;
    }

    const next = Object.getPrototypeOf(current);
    if (!next || next === Shape || !(next.prototype instanceof Shape)) {
      if (next?.shape) {
        const nextProp = next.shape
          .getPropertyShapes()
          .find((shape) => shape.label === label);
        if (nextProp) {
          return nextProp;
        }
      }
      break;
    }
    current = next;
  }
  return undefined;
};

export const getShapeId = (shapeClass: typeof Shape) => {
  return shapeClass.shape?.id;
};
