import {PropertyShape, PropertyShapeConfig} from './PropertyShape.js';
import {Shape} from './Shape.js';
import {NodeShape} from './ShapeDefinition.js';
import {getNodeShapeUri, LINCD_DATA_ROOT, sanitizeUriFragment} from './shacl.js';

type PropertyDecoratorConfig<ShapeType> = PropertyShapeConfig<ShapeType>;

const ensureShape = (shapeClass: typeof Shape) => {
  if (!shapeClass.shape) {
    const packageName = (shapeClass as any).packageName || 'default';
    const shapeName = shapeClass.name;
    const id = getNodeShapeUri(packageName, shapeName);
    shapeClass.shape = new NodeShape({
      id,
      label: shapeName,
    });
  }
};

export const linkedShape = <T extends typeof Shape>(shapeClass: T): T => {
  ensureShape(shapeClass);
  const packageName = (shapeClass as any).packageName || 'default';
  const newId = getNodeShapeUri(packageName, shapeClass.name);
  if (shapeClass.shape.id !== newId) {
    shapeClass.shape.id = newId;
    shapeClass.shape.getPropertyShapes().forEach((propertyShape) => {
      propertyShape.id = `${newId}/${sanitizeUriFragment(propertyShape.label)}`;
      if (propertyShape.valueShapeClass?.shape?.id) {
        propertyShape.shape = {id: propertyShape.valueShapeClass.shape.id};
      }
    });
  }
  return shapeClass;
};

export const literalProperty = <ShapeType = unknown>(
  config: PropertyDecoratorConfig<ShapeType>,
) => {
  return (target: Shape, propertyKey: string) => {
    const shapeClass = target.constructor as typeof Shape;
    ensureShape(shapeClass);
    const propertyShape = new PropertyShape(propertyKey, config);
    propertyShape.id = `${shapeClass.shape.id}/${sanitizeUriFragment(
      propertyKey,
    )}`;
    shapeClass.shape.addPropertyShape(
      propertyShape,
    );
  };
};

export const objectProperty = <ShapeType = unknown>(
  config: PropertyDecoratorConfig<ShapeType>,
) => {
  return (target: Shape, propertyKey: string) => {
    const shapeClass = target.constructor as typeof Shape;
    ensureShape(shapeClass);
    const propertyShape = new PropertyShape(propertyKey, config);
    propertyShape.id = `${shapeClass.shape.id}/${sanitizeUriFragment(
      propertyKey,
    )}`;
    shapeClass.shape.addPropertyShape(
      propertyShape,
    );
  };
};
