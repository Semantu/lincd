import {describe, expect, test} from '@jest/globals';
import {NamedNode} from '../models.js';
import {Shape} from '../shapes/Shape.js';
import {ShapeSet} from '../collections/ShapeSet.js';
import {linkedShape} from '../package.js';

let knows = NamedNode.create();
let person = NamedNode.create();

@linkedShape
class Person extends Shape {
  static targetClass: NamedNode = person;

  get knows() {
    return this.getAllAs<Person>(knows, Person);
  }
}

let personNode1 = NamedNode.create();
let personNode2 = NamedNode.create();
let personNode3 = NamedNode.create();
let person1 = new Person(personNode1);
let person1Identical = new Person(personNode1);
let shapeSet = new ShapeSet();

describe('shape set', () => {
  test('you can add values to it', () => {
    shapeSet.add(person1);
    expect(shapeSet.size).toBe(1);
  });
  test('you can remove values from it', () => {
    shapeSet.delete(person1);
    expect(shapeSet.size).toBe(0);
  });
  test('you can remove identical shapes from it', () => {
    shapeSet.add(person1);
    shapeSet.delete(person1Identical);
    expect(shapeSet.size).toBe(0);
  });
  test('has returns true for identical shapes', () => {
    shapeSet.add(person1);
    expect(shapeSet.has(person1Identical)).toBe(true);
  });
  test('has returns false for identical shapes if false given as second param', () => {
    shapeSet.add(person1);
    expect(shapeSet.has(person1Identical, false)).toBe(false);
  });
});
