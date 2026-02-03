import {linkedShape, literalProperty, objectProperty} from '../package.js';
import {Shape} from '../shapes/Shape.js';

export const name = 'name';
export const bestFriend = 'bestFriend';
export const friends = 'friends';
export const pets = 'pets';
export const firstPet = 'firstPet';
export const hobby = 'hobby';
export const birthDate = 'birthDate';
export const isRealPerson = 'isRealPerson';
export const guardDogLevel = 'guardDogLevel';

@linkedShape
class Pet extends Shape {}

@linkedShape
class Dog extends Pet {
  @literalProperty({path: guardDogLevel, maxCount: 1})
  declare guardDogLevel: number;
}

@linkedShape
class Person extends Shape {
  @literalProperty({path: name, maxCount: 1})
  declare name: string;

  @objectProperty({path: bestFriend, maxCount: 1, shape: Person})
  declare bestFriend: Person;

  @objectProperty({path: friends, shape: Person})
  declare friends: Person;

  @objectProperty({path: pets, shape: Pet})
  declare pets: Pet;

  @objectProperty({path: firstPet, shape: Pet, maxCount: 1})
  declare firstPet: Pet;

  @literalProperty({path: hobby, maxCount: 1})
  declare hobby: string;

  @literalProperty({path: birthDate, maxCount: 1})
  declare birthDate: Date;

  @literalProperty({path: isRealPerson, maxCount: 1})
  declare isRealPerson: boolean;
}

export const queryTestFixtures = {
  Pet,
  Dog,
  Person,
  name,
  bestFriend,
  friends,
  pets,
  firstPet,
  hobby,
  birthDate,
  isRealPerson,
  guardDogLevel,
};
