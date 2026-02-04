import {PropertyShape, PropertyShapeConfig} from './PropertyShape.js';
import {Shape} from './Shape.js';
import {ShapeDefinition} from './ShapeDefinition.js';

type PropertyDecoratorConfig<ShapeType> = PropertyShapeConfig<ShapeType>;

const ensureShapeDefinition = (shapeClass: typeof Shape) => {
  if (!shapeClass.shape) {
    shapeClass.shape = new ShapeDefinition();
  }
};

export const linkedShape = <T extends typeof Shape>(shapeClass: T): T => {
  ensureShapeDefinition(shapeClass);
  return shapeClass;
};

export const literalProperty = <ShapeType = unknown>(
  config: PropertyDecoratorConfig<ShapeType>,
) => {
  return (target: Shape, propertyKey: string) => {
    const shapeClass = target.constructor as typeof Shape;
    ensureShapeDefinition(shapeClass);
    shapeClass.shape.addPropertyShape(
      new PropertyShape(propertyKey, config),
    );
  };
};

export const objectProperty = <ShapeType = unknown>(
  config: PropertyDecoratorConfig<ShapeType>,
) => {
  return (target: Shape, propertyKey: string) => {
    const shapeClass = target.constructor as typeof Shape;
    ensureShapeDefinition(shapeClass);
    shapeClass.shape.addPropertyShape(
      new PropertyShape(propertyKey, config),
    );
  };
};
