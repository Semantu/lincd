import {describe, test} from '@jest/globals';
import {Literal, NamedNode} from '../models';
import {Shape} from '../shapes/Shape';
import {literalProperty, objectProperty} from '../utils/ShapeDecorators';
import {linkedShape} from '../package';

let personClass = NamedNode.create();
let name = NamedNode.create();
let hasFriend = NamedNode.create();

@linkedShape
class Person extends Shape {
  static targetClass = personClass;
  @literalProperty({
    path: name,
    maxCount: 1,
  })
  get name() {
    return this.getValue(name);
  }
  set name(val: string) {
    this.overwrite(name, new Literal(val));
  }

  @objectProperty({
    path: hasFriend,
    shape: Person,
  })
  get friends() {
    return this.getAllAs<Person>(hasFriend, Person);
  }
}

let p1 = new Person();
p1.name = 'Semmy';
let p2 = new Person();
p2.name = 'Moa';
let p3 = new Person();
p3.name = 'Jinx';
let p4 = new Person();
p4.name = 'Quinn';

p1.friends.add(p2);
p1.friends.add(p3);
p2.friends.add(p3);
p2.friends.add(p4);

describe('query tests', () => {
  test('can select a property of all instances', () => {
    let names = Person.select((p) => {
      return p.name;
    }).local();

    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBe(4);
    expect(names.includes('Moa')).toBe(true);
    expect(names.includes('Mike')).toBe(false);
  });
  test('can select sub properties of a first property that returns a set', () => {
    let namesOfFriends = Person.select((p) => {
      //TODO: implement this with a proxy for queryshapeset
      return p.friends.name;
    }).local();

    expect(Array.isArray(namesOfFriends)).toBe(true);
    expect(namesOfFriends.length).toBe(3);
    expect(namesOfFriends.includes('Semmy')).toBe(false);
    expect(namesOfFriends.includes('Moa')).toBe(true);
  });

  test('can select multiple property paths', () => {
    let result = Person.select((p) => {
      return [p.name, p.friends.name];
    }).local();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);

    let [names, namesOfFriends] = result;
    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBe(4);
    expect(names.includes('Moa')).toBe(true);
    expect(names.includes('Mike')).toBe(false);
    expect(Array.isArray(namesOfFriends)).toBe(true);
    expect(namesOfFriends.length).toBe(3);
    expect(namesOfFriends.includes('Semmy')).toBe(false);
    expect(namesOfFriends.includes('Moa')).toBe(true);
  });

  // test('can filter a string in a ShapeSet with equals', () => {
  // let friendsCalledMoa = Person.select((p) => {
  //   return p.friends.where((f) => f.name.equals('Moa'));
  // }).local();
  //
  // expect(Array.isArray(friendsCalledMoa)).toBe(true);
  // expect(friendsCalledMoa.length).toBe(1);
  // expect(friendsCalledMoa.includes(p2)).toBe(true);
  // });
});