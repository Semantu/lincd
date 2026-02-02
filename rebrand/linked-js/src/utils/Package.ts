import {Shape} from '../shapes/Shape.js';
import {linkedShape as baseLinkedShape} from '../shapes/decorators.js';
import {getNodeShapeUri} from '../shapes/shacl.js';

type PackageExports = Record<string, unknown>;

const packages = new Map<string, PackageExports>();

const getPackageExports = (name: string): PackageExports => {
  if (!packages.has(name)) {
    packages.set(name, {});
  }
  return packages.get(name);
};

const registerExport = (exports: PackageExports, exported: any) => {
  if (!exported?.name) {
    return;
  }
  exports[exported.name] = exported;
};

export type LinkedPackageObject = {
  linkedShape: {
    <T extends typeof Shape>(constructor: T): void;
    <T extends typeof Shape>(config?: Record<string, unknown>): (constructor: T) => void;
  };
  linkedUtil: (constructor: any) => any;
  linkedOntology: (...args: unknown[]) => void;
  registerPackageExport: (exportedObject: any) => void;
  getPackageShape: (name: string) => typeof Shape;
  packageExports: PackageExports;
  packageName: string;
};

export const linkedPackage = (name: string): LinkedPackageObject => {
  const packageExports = getPackageExports(name);

  const linkedShape = ((config?: Record<string, unknown>) => {
    if (typeof config === 'function') {
      const target = config as unknown as typeof Shape;
      (target as any).packageName = name;
      baseLinkedShape(target);
      if (target.shape && !target.shape.id) {
        target.shape.id = getNodeShapeUri(name, target.name);
      }
      registerExport(packageExports, target);
      return;
    }
    return (constructor: typeof Shape) => {
      (constructor as any).packageName = name;
      baseLinkedShape(constructor);
      if (constructor.shape && !constructor.shape.id) {
        constructor.shape.id = getNodeShapeUri(name, constructor.name);
      }
      registerExport(packageExports, constructor);
    };
  }) as LinkedPackageObject['linkedShape'];

  const linkedUtil = (constructor: any) => {
    registerExport(packageExports, constructor);
    return constructor;
  };

  const linkedOntology = (_exports, _ns, _suggestedName, _loader, _source) => {
    registerExport(packageExports, _exports);
  };

  const getPackageShape = (shapeName: string) => {
    return packageExports[shapeName] as typeof Shape;
  };

  return {
    linkedShape,
    linkedUtil,
    linkedOntology,
    registerPackageExport: (exportedObject: any) =>
      registerExport(packageExports, exportedObject),
    getPackageShape,
    packageExports,
    packageName: name,
  };
};
