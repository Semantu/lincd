import {CoreSet} from '@_linked/core/collections/CoreSet';
import {linkedPackage} from '@_linked/core/utils/Package';
import {Shape} from '@_linked/core/shapes/Shape';
import {
  Component,
  createLinkedComponentFn,
  createLinkedSetComponentFn,
} from './utils/LinkedComponent.js';

let shapeToComponents: Map<typeof Shape, CoreSet<Component>> = new Map();

const {
  linkedUtil,
  linkedOntology,
  linkedShape,
  registerPackageExport,
  registerPackageModule,
  packageExports,
  getPackageShape,
} = linkedPackage('@_linked/react');

function registerComponent(exportedComponent: Component, shape?: typeof Shape) {
  if (!shape) {
    if (!Object.prototype.hasOwnProperty.call(exportedComponent, 'shape')) {
      console.warn(
        `Component ${
          exportedComponent.displayName || exportedComponent.name
        } is not linked to a shape.`,
      );
      return;
    }
    shape = exportedComponent.shape;
  }

  if (!shapeToComponents.has(shape)) {
    shapeToComponents.set(shape, new CoreSet<any>());
  }

  shapeToComponents.get(shape).add(exportedComponent);
}

const linkedComponent = createLinkedComponentFn(
  registerPackageExport,
  registerComponent,
);

const linkedSetComponent = createLinkedSetComponentFn(
  registerPackageExport,
  registerComponent,
);

export {
  linkedComponent,
  linkedSetComponent,
  linkedShape,
  linkedUtil,
  linkedOntology,
  registerPackageExport,
  registerPackageModule,
  packageExports,
  getPackageShape,
};
