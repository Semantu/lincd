import {Shape} from '../shapes/Shape.js';
import {objectProperty} from '../shapes/SHACL.js';
import {NamedNode} from '../models.js';
import {describe, expect, test} from '@jest/globals';
import {linkedShape} from '../package.js';

let knows = NamedNode.create();
let person = NamedNode.create();

@linkedShape
class Person extends Shape {
  static targetClass: NamedNode = person;

  @objectProperty({
    path: knows,
    shape: Person,
    required: true,
  })
  get knows() {
    return this.getAllAs(knows, Person);
  }
}

let person1 = new Person();
let person2 = new Person();
let person3 = new Person();
let person4 = new Person();
person1.knows.add(person1);

describe('SHACL nodeshape validation', () => {
  test('can validate reference to same node of same type', () => {
    expect(person1.validate()).toBe(true);
  });
  test('fails when required path is not defined', () => {
    expect(person2.validate()).toBe(false);
  });
  test('still succeeds with circular references', () => {
    person3.knows.add(person4);
    person4.knows.add(person3);
    expect(person3.validate()).toBe(true);
    expect(person4.validate()).toBe(true);
  });
});
