import {describe, expect, test} from '@jest/globals';
import {Literal, NamedNode} from '../models';
import {Shape} from '../shapes/Shape';

let name = NamedNode.create();
class Person extends Shape {
  get name() {
    return this.getValue(name);
  }
  set name(val: string) {
    this.overwrite(name, new Literal(val));
  }
}

let p = new Person();
p.name = 'Semmy';
let p2 = new Person();
p.name = 'Moa';

describe('query tests', () => {
  test('can select all instances', () => {
    Person.select((p) => {
      p.name;
    });
    // subject.getAll(predicate).add(value1);
    // expect(subject.hasProperty(predicate)).toBe(true);
    // expect(subject.getAllQuads().length).toBe(1);
  });
  test('can delete a value from a node', () => {
    // subject.getAll(predicate).delete(value1);
    // expect(subject.hasProperty(predicate)).toBe(false);
    // expect(subject.getAllQuads().length).toBe(0);
  });
});
