import {describe, expect, test} from '@jest/globals';
import {NamedNode} from '../models.js';
import {Shape} from '../shapes/Shape.js';

class Person extends Shape {
  get knows() {
    return this.getAllAs<Person>(knows, Person);
  }
}

let personNode1 = NamedNode.create();
let personNode2 = NamedNode.create();
let personNode3 = NamedNode.create();
let person1 = new Person(personNode1);
let person2 = new Person(personNode2);
let person3 = new Person(personNode3);
let knows = NamedNode.create();
personNode1.set(knows, personNode2);

describe('shape value set', () => {
  test('reflects current amount of properties', () => {
    expect(person1.knows.size).toBe(1);
  });
  test('matches shapes of the same node', () => {
    //ShapeValueSets make their own instances of shapes which may not be the same instance
    // as another instance of the same shape for the same node
    //in this case, person2 will not exist in the set by true identity, but an equivalent shape DOES exist in the set
    //so this should return true. See ShapeSet.has tests and implementation
    expect(person1.knows.has(person2)).toBe(true);
  });
  test('adds nodes to the graph when you add a new shape to them', () => {
    //first we add and get the size of THAT set
    expect(person1.knows.add(person3).size).toBe(2);
    //then we get the set again (will be a new one with new shapes) and check the size
    expect(person1.knows.size).toBe(2);
    //then we check the actual graph
    expect(personNode1.getAll(knows).size).toBe(2);
    //the same instance can be expected to be there if you directly added it
    expect(person1.knows.has(person3)).toBe(true);
  });
  test('remove nodes to the graph when you delete a shape from them', () => {
    person1.knows.delete(person3);
    expect(person1.knows.size).toBe(1);
    expect(personNode1.getAll(knows).size).toBe(1);
    //should not occur in the set anymore
    expect(person1.knows.has(person3)).toBe(false);
  });
});
