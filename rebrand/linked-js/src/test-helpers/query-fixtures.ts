import {linkedShape, literalProperty, objectProperty} from '../package.js';
import {Shape} from '../shapes/Shape.js';

const tempBase = 'lin://tmp/';
const xsdBase = 'http://www.w3.org/2001/XMLSchema#';

export const name = `${tempBase}name`;
export const bestFriend = `${tempBase}bestFriend`;
export const friends = `${tempBase}friends`;
export const pets = `${tempBase}pets`;
export const firstPet = `${tempBase}firstPet`;
export const hobby = `${tempBase}hobby`;
export const birthDate = `${tempBase}birthDate`;
export const isRealPerson = `${tempBase}isRealPerson`;
export const guardDogLevel = `${tempBase}guardDogLevel`;

export const personClass = `${tempBase}Person`;
export const petClass = `${tempBase}Pet`;
export const dogClass = `${tempBase}Dog`;

export const xsdDateTime = `${xsdBase}dateTime`;
export const xsdBoolean = `${xsdBase}boolean`;
export const xsdInteger = `${xsdBase}integer`;

@linkedShape
class Pet extends Shape {}

Pet.shape.targetClass = {id: petClass};

@linkedShape
class Dog extends Pet {
  @literalProperty({path: guardDogLevel, maxCount: 1, datatype: xsdInteger})
  declare guardDogLevel: number;
}

Dog.shape.targetClass = {id: dogClass};

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

  @literalProperty({path: birthDate, maxCount: 1, datatype: xsdDateTime})
  declare birthDate: Date;

  @literalProperty({path: isRealPerson, maxCount: 1, datatype: xsdBoolean})
  declare isRealPerson: boolean;
}

Person.shape.targetClass = {id: personClass};

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
  personClass,
  petClass,
  dogClass,
  xsdDateTime,
  xsdBoolean,
  xsdInteger,
};
