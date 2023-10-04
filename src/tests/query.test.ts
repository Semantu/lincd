import {describe, test} from '@jest/globals';
import {Literal, NamedNode} from '../models';
import {Shape} from '../shapes/Shape';

let name = NamedNode.create();
let hasFriend = NamedNode.create();

class Person extends Shape {
  get name() {
    return this.getValue(name);
  }

  set name(val: string) {
    this.overwrite(name, new Literal(val));
  }
  get friends() {
    return this.getAllAs<Person>(hasFriend, Person);
  }
}

let p = new Person();
p.name = 'Semmy';
let p2 = new Person();
p.name = 'Moa';

describe('query tests', () => {
  test('can select a property of all instances', () => {
    Person.select((p) => {
      return p.name;
    });
    // subject.getAll(predicate).add(value1);
    // expect(subject.hasProperty(predicate)).toBe(true);
    // expect(subject.getAllQuads().length).toBe(1);
  });
  test('can filter a string in a ShapeSet with equals', () => {
    Person.select((p) => {
      return p.friends.where((f) => f.name.equals('Moa'));
    });
    // subject.getAll(predicate).delete(value1);
    // expect(subject.hasProperty(predicate)).toBe(false);
    // expect(subject.getAllQuads().length).toBe(0);
  });
});
