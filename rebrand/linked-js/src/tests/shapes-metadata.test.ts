import {describe, expect, test} from '@jest/globals';
import {linkedPackage} from '../utils/Package.js';
import {linkedShape, literalProperty, objectProperty, Shape} from '../package.js';
import {getNodeShapeUri} from '../shapes/shacl.js';

const name = 'name';
const friend = 'friend';

describe('shape metadata generation', () => {
  test('creates NodeShape and PropertyShape metadata with ids', () => {
    const pkg = linkedPackage('lincd-org');

    @pkg.linkedShape
    class Person extends Shape {
      @literalProperty({path: name, maxCount: 1})
      declare name: string;

      @objectProperty({path: friend, shape: Person})
      declare friend: Person;
    }

    const nodeShape = Person.shape;
    const expectedShapeId = getNodeShapeUri('lincd-org', 'Person');

    expect(nodeShape.id).toBe(expectedShapeId);
    expect(nodeShape.properties).toHaveLength(2);
    expect(nodeShape.properties[0].id).toBe(`${expectedShapeId}/name`);
    expect(nodeShape.properties[0].path).toEqual({id: name});
    expect(nodeShape.properties[1].path).toEqual({id: friend});
    expect(nodeShape.properties[1].shape).toEqual({id: expectedShapeId});
  });

  test('objectProperty accepts explicit shape ids', () => {
    @linkedShape
    class Animal extends Shape {
      @objectProperty({path: friend, shape: 'https://example.com/shape/Animal'})
      declare friend: Shape;
    }

    const prop = Animal.shape.getPropertyShapes()[0].getResult();
    expect(prop.shape).toEqual({id: 'https://example.com/shape/Animal'});
  });
});
