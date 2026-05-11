import {describe, expect, test} from '@jest/globals';
import {linkedPackage} from '../utils/Package';
import {Shape} from '../shapes/Shape';
import {literalProperty, LINCD_DATA_ROOT} from '../shapes/SHACL';
import {URI} from '../utils/URI';
import {lincd} from '../ontologies/lincd';
import {shacl} from '../ontologies/shacl';
import {NodeReferenceValue} from '../utils/NodeReference';

const packageName = 'meta-test';
const {linkedShape, packageMetadata} = linkedPackage(packageName);

const tmpPropBase = 'linked://tmp/props/';
const tmpTypeBase = 'linked://tmp/types/';

const prop = (suffix: string): NodeReferenceValue => ({
  id: `${tmpPropBase}${suffix}`,
});
const type = (suffix: string): NodeReferenceValue => ({
  id: `${tmpTypeBase}${suffix}`,
});

@linkedShape
class MetaPerson extends Shape {
  static targetClass = type('MetaPerson');

  @literalProperty({path: prop('name'), maxCount: 1})
  get name(): string {
    return '';
  }
}

describe('Package & Shape Metadata Registration', () => {
  test('registers package metadata with legacy id format', () => {
    expect(packageMetadata).toEqual({
      id: `${LINCD_DATA_ROOT}module/${packageName}`,
      packageName,
      type: lincd.Module,
    });
    expect(globalThis['lincd']._packages[packageName]).toBe(packageMetadata);
  });

  test('registers node shape metadata with expected id', () => {
    const expectedId = `${LINCD_DATA_ROOT}module/${URI.sanitize(
      packageName,
    )}/shape/${URI.sanitize(MetaPerson.name)}`;

    expect(MetaPerson.shape).toBeDefined();
    expect(MetaPerson.shape.id).toBe(expectedId);
    expect(MetaPerson.shape.label).toBe(MetaPerson.name);
    expect(MetaPerson.shape.targetClass).toEqual(type('MetaPerson'));
  });

  test('registers property shape metadata with expected id', () => {
    const nodeShapeId = MetaPerson.shape.id;
    const propertyShape = MetaPerson.shape.getPropertyShape('name');

    expect(propertyShape).toBeDefined();
    expect(propertyShape.label).toBe('name');
    expect(propertyShape.id).toBe(`${nodeShapeId}/name`);
    expect(propertyShape.path).toEqual(prop('name'));
    expect(propertyShape.nodeKind).toEqual(shacl.Literal);
    expect(propertyShape.parentNodeShape).toBe(MetaPerson.shape);
  });
});
