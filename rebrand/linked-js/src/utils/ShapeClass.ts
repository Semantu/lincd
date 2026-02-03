import type {PropertyShape} from '../shapes/PropertyShape.js';
import {Shape} from '../shapes/Shape.js';

const shapeClassById = new Map<string, typeof Shape>();
const idByShapeClass = new Map<typeof Shape, string>();

export const registerShapeClass = (shapeClass: typeof Shape) => {
  const id = shapeClass.shape?.id;
  if (!id) {
    return;
  }
  const previousId = idByShapeClass.get(shapeClass);
  if (previousId && previousId !== id) {
    shapeClassById.delete(previousId);
  }
  idByShapeClass.set(shapeClass, id);
  shapeClassById.set(id, shapeClass);
};

export const getShapeClassById = (id: string): typeof Shape | undefined => {
  return shapeClassById.get(id);
};

export const getRegisteredShapeClasses = (): (typeof Shape)[] => {
  return Array.from(idByShapeClass.keys());
};

export const resetShapeClassRegistry = () => {
  shapeClassById.clear();
  idByShapeClass.clear();
};

export const hasSuperClass = (child: typeof Shape, parent: typeof Shape) => {
  return child.prototype instanceof parent;
};

export const hasSubClass = (parent: typeof Shape, child: typeof Shape) => {
  return child.prototype instanceof parent;
};

export const getSubShapesClasses = (
  shape: typeof Shape | (typeof Shape)[],
): (typeof Shape)[] => {
  const shapes = Array.isArray(shape) ? shape : [shape];
  return getRegisteredShapeClasses()
    .filter((candidate) => shapes.some((base) => hasSubClass(base, candidate)))
    .sort((a, b) => (hasSubClass(a, b) ? 1 : -1));
};

export const getSuperShapesClasses = (
  shape: typeof Shape | (typeof Shape)[],
): (typeof Shape)[] => {
  const shapes = Array.isArray(shape) ? shape : [shape];
  return getRegisteredShapeClasses()
    .filter((candidate) => shapes.some((base) => hasSuperClass(base, candidate)))
    .sort((a, b) => (hasSubClass(a, b) ? 1 : -1));
};

const filterShapesToMostSpecific = (shapeClasses: (typeof Shape)[]) => {
  return shapeClasses.filter((shapeClass) => {
    return !shapeClasses.some(
      (other) => other !== shapeClass && hasSuperClass(other, shapeClass),
    );
  });
};

export const getMostSpecificSubShapes = (
  shape: typeof Shape | (typeof Shape)[],
): (typeof Shape)[] => {
  return filterShapesToMostSpecific(getSubShapesClasses(shape));
};

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
