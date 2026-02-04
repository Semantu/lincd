import {linkedShape} from '../package';
import {literalProperty, objectProperty} from '../shapes/SHACL';
import {Shape} from '../shapes/Shape';
import {NamedNode} from '../models';
import {xsd} from '../ontologies/xsd';
import {ShapeSet} from '../collections/ShapeSet';

export const name = NamedNode.getOrCreate('name');
export const hobby = NamedNode.getOrCreate('hobby');
export const nickName = NamedNode.getOrCreate('nickName');
export const bestFriend = NamedNode.getOrCreate('bestFriend');
export const hasFriend = NamedNode.getOrCreate('hasFriend');
export const birthDate = NamedNode.getOrCreate('birthDate');
export const isRealPerson = NamedNode.getOrCreate('isRealPerson');
export const hasPet = NamedNode.getOrCreate('hasPet');
export const guardDogLevel = NamedNode.getOrCreate('guardDogLevel');
export const pluralTestProp = NamedNode.getOrCreate('pluralTestProp');
export const personClass = NamedNode.getOrCreate('http://example.com/Person');
export const petClass = NamedNode.getOrCreate('http://example.com/Pet');
export const dogClass = NamedNode.getOrCreate('http://example.com/Dog');

@linkedShape
export class Pet extends Shape {
  static targetClass = petClass;

  @objectProperty({path: bestFriend, maxCount: 1, shape: Pet})
  get bestFriend(): Pet {
    return null;
  }
}

@linkedShape
export class Dog extends Pet {
  static targetClass = dogClass;

  @literalProperty({path: guardDogLevel, maxCount: 1, datatype: xsd.integer})
  get guardDogLevel(): number {
    return null;
  }
}

@linkedShape
export class Person extends Shape {
  static targetClass = personClass;

  @literalProperty({path: name, maxCount: 1})
  get name(): string {
    return '';
  }

  @literalProperty({path: hobby, maxCount: 1})
  get hobby(): string {
    return '';
  }

  @literalProperty({path: nickName})
  get nickNames(): string[] {
    return [];
  }

  @literalProperty({path: birthDate, datatype: xsd.dateTime, maxCount: 1})
  get birthDate(): Date {
    return null;
  }

  @literalProperty({path: isRealPerson, datatype: xsd.boolean, maxCount: 1})
  get isRealPerson(): boolean {
    return null;
  }

  @objectProperty({path: bestFriend, maxCount: 1, shape: Person})
  get bestFriend(): Person {
    return null;
  }

  @objectProperty({path: hasFriend, shape: Person})
  get friends(): ShapeSet<Person> {
    return null;
  }

  @objectProperty({path: hasPet, shape: Pet})
  get pets(): ShapeSet<Pet> {
    return null;
  }

  @objectProperty({path: hasPet, maxCount: 1, shape: Pet})
  get firstPet(): Pet {
    return null;
  }

  @objectProperty({path: pluralTestProp, shape: Person})
  get pluralTestProp(): ShapeSet<Person> {
    return null;
  }
}

export const queryFactories = {
  selectName: () => Person.select((p) => p.name),
};
