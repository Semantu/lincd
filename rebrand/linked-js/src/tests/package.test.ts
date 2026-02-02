import {describe, expect, test} from '@jest/globals';
import {linkedPackage} from '../utils/Package.js';
import {linkedShape, literalProperty, Shape} from '../package.js';

describe('linkedPackage', () => {
  test('registers shapes and utilities', () => {
    const pkg = linkedPackage('lincd-org');

    @pkg.linkedShape
    class Person extends Shape {
      @literalProperty({path: 'name', maxCount: 1})
      declare name: string;
    }

    @pkg.linkedUtil
    class Helper {}

    expect(pkg.packageName).toBe('lincd-org');
    expect(pkg.packageExports.Person).toBe(Person);
    expect(pkg.getPackageShape('Person')).toBe(Person);
    expect(pkg.packageExports.Helper).toBe(Helper);
    expect(pkg.linkedShape).toBeDefined();
    expect(linkedShape).toBeDefined();
  });

  test('registers ontology exports', () => {
    const pkg = linkedPackage('lincd-org-ontology');
    class ExampleOntology {}

    pkg.linkedOntology(ExampleOntology, () => null, 'example');

    expect(pkg.packageExports.ExampleOntology).toBe(ExampleOntology);
  });

  test('linkedComponent is not exposed in linked-js', () => {
    const pkg = linkedPackage('lincd-react') as Record<string, unknown>;
    expect(pkg.linkedComponent).toBeUndefined();
  });
});
