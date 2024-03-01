import {describe, expect, test} from '@jest/globals';
import {NamedNode} from '../models.js';
import {Shape} from '../shapes/Shape.js';
import {linkedShape} from '../package.js';

let knows = NamedNode.create();
let person = NamedNode.create();
let advancedPerson = NamedNode.create();

@linkedShape
class Person extends Shape {
  static targetClass: NamedNode = person;

  get knows() {
    return this.getAllAs<Person>(knows, Person);
  }
}

@linkedShape
class AdvancedPerson extends Person {
  static targetClass: NamedNode = advancedPerson;
}

let person1 = new Person();
let person2 = new AdvancedPerson();

describe('Shape', () => {
  test('getLocalInstances returns shapes and subshapes', () => {
    expect(Person.getLocalInstances().size).toBe(2);
  });
});
