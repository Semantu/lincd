import {linkedShape} from '../package';
import {literalProperty, objectProperty} from '../shapes/SHACL';
import {Shape} from '../shapes/Shape';
import {NamedNode} from '../models';
import {xsd} from '../ontologies/xsd';
import {ShapeSet} from '../collections/ShapeSet';
import {getQueryContext} from '../queries/QueryContext';
import {UpdatePartial} from '../queries/QueryFactory';

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

const componentQuery = Person.query((p) => ({name: p.name}));
const componentLike = {query: componentQuery};

const updateSimple: UpdatePartial<Person> = {hobby: 'Chess'};
const updateOverwriteSet: UpdatePartial<Person> = {friends: [{id: 'p2'}]};
const updateUnsetSingleUndefined: UpdatePartial<Person> = {hobby: undefined};
const updateUnsetSingleNull: UpdatePartial<Person> = {hobby: null};
const updateOverwriteNested: UpdatePartial<Person> = {
  bestFriend: {name: 'Bestie'},
};
const updatePassIdReferences: UpdatePartial<Person> = {
  bestFriend: {id: 'p2'},
};
const updateAddRemoveMulti: UpdatePartial<Person> = {
  friends: {add: [{id: 'p2'}], remove: [{id: 'p3'}]},
};
const updateRemoveMulti: UpdatePartial<Person> = {
  friends: {remove: [{id: 'p2'}]},
};
const updateAddRemoveSame: UpdatePartial<Person> = {
  friends: {add: [{id: 'p2'}], remove: [{id: 'p3'}]},
};
const updateUnsetMultiUndefined: UpdatePartial<Person> = {friends: undefined};
const updateNestedWithPredefinedId: UpdatePartial<Person> = {
  bestFriend: {id: 'p3-best-friend', name: 'Bestie'},
};
const updateBirthDate: UpdatePartial<Person> = {
  birthDate: new Date('2020-01-01'),
};

export const queryFactories = {
  selectName: () => Person.select((p) => p.name),
  selectFriends: () => Person.select((p) => p.friends),
  selectBirthDate: () => Person.select((p) => p.birthDate),
  selectIsRealPerson: () => Person.select((p) => p.isRealPerson),
  selectById: () => Person.select({id: 'p1'}, (p) => p.name),
  selectByIdReference: () => Person.select({id: 'p1'}, (p) => p.name),
  selectNonExisting: () =>
    Person.select({id: 'https://does.not/exist'}, (p) => p.name),
  selectUndefinedOnly: () =>
    Person.select({id: 'p3'}, (p) => [p.hobby, p.bestFriend]),
  selectFriendsName: () => Person.select((p) => p.friends.name),
  selectNestedFriendsName: () => Person.select((p) => p.friends.friends.name),
  selectMultiplePaths: () =>
    Person.select((p) => [p.name, p.friends, p.bestFriend.name]),
  selectBestFriendName: () => Person.select((p) => p.bestFriend.name),
  selectDeepNested: () =>
    Person.select((p) => p.friends.bestFriend.bestFriend.name),
  whereFriendsNameEquals: () =>
    Person.select((p) => p.friends.where((f) => f.name.equals('Moa'))),
  whereBestFriendEquals: () =>
    Person.select().where((p) => p.bestFriend.equals({id: 'p3'})),
  whereHobbyEquals: () =>
    Person.select((p) => p.hobby.where((h) => h.equals('Jogging'))),
  whereAnd: () =>
    Person.select((p) =>
      p.friends.where((f) => f.name.equals('Moa').and(f.hobby.equals('Jogging'))),
    ),
  whereOr: () =>
    Person.select((p) =>
      p.friends.where((f) => f.name.equals('Jinx').or(f.hobby.equals('Jogging'))),
    ),
  selectAll: () => Person.select(),
  selectWhereNameSemmy: () =>
    Person.select().where((p) => p.name.equals('Semmy')),
  whereAndOrAnd: () =>
    Person.select((p) =>
      p.friends.where((f) =>
        f.name.equals('Jinx').or(f.hobby.equals('Jogging')).and(f.name.equals('Moa')),
      ),
    ),
  whereAndOrAndNested: () =>
    Person.select((p) =>
      p.friends.where((f) =>
        f.name.equals('Jinx').or(f.hobby.equals('Jogging').and(f.name.equals('Moa'))),
      ),
    ),
  whereSomeImplicit: () =>
    Person.select().where((p) => p.friends.name.equals('Moa')),
  whereSomeExplicit: () =>
    Person.select().where((p) => p.friends.some((f) => f.name.equals('Moa'))),
  whereEvery: () =>
    Person.select().where((p) =>
      p.friends.every((f) => f.name.equals('Moa').or(f.name.equals('Jinx'))),
    ),
  whereSequences: () =>
    Person.select().where((p) =>
      p.friends
        .some((f) => f.name.equals('Jinx'))
        .and(p.name.equals('Semmy')),
    ),
  outerWhere: () =>
    Person.select((p) => p.friends).where((p) => p.name.equals('Semmy')),
  whereWithContext: () =>
    Person.select((p) => p.name).where((p) =>
      p.bestFriend.equals(getQueryContext('user')),
    ),
  whereWithContextPath: () =>
    Person.select((p) => p.name).where((p) => {
      const userName = getQueryContext<Person>('user').name;
      return p.friends.some((f) => f.name.equals(userName));
    }),
  countFriends: () => Person.select((p) => p.friends.size()),
  countNestedFriends: () => Person.select((p) => p.friends.friends.size()),
  countLabel: () =>
    Person.select((p) =>
      p.friends.select((f) => ({numFriends: f.friends.size()})),
    ),
  nestedObjectProperty: () => Person.select((p) => p.friends.bestFriend),
  nestedObjectPropertySingle: () => Person.select((p) => p.friends.bestFriend),
  subSelectSingleProp: () =>
    Person.select((p) => p.bestFriend.select((f) => ({name: f.name}))),
  subSelectPluralCustom: () =>
    Person.select((p) =>
      p.friends.select((f) => ({name: f.name, hobby: f.hobby})),
    ),
  doubleNestedSubSelect: () =>
    Person.select((p) =>
      p.friends.select((p2) =>
        p2.bestFriend.select((p3) => ({name: p3.name})),
      ),
    ),
  subSelectAllPrimitives: () =>
    Person.select((p) =>
      p.bestFriend.select((f) => [f.name, f.birthDate, f.isRealPerson]),
    ),
  customResultEqualsBoolean: () =>
    Person.select((p) => ({isBestFriend: p.bestFriend.equals({id: 'p3'})})),
  customResultNumFriends: () =>
    Person.select((p) => ({numFriends: p.friends.size()})),
  countEquals: () =>
    Person.select().where((p) => p.friends.size().equals(2)),
  subSelectArray: () =>
    Person.select((p) => p.friends.select((f) => [f.name, f.hobby])),
  selectShapeSetAs: () =>
    Person.select((p) => p.pets.as(Dog).guardDogLevel),
  selectNonExistingMultiple: () =>
    Person.select((p) => [p.bestFriend, p.friends]),
  selectShapeAs: () =>
    Person.select((p) => p.firstPet.as(Dog).guardDogLevel),
  selectOne: () =>
    Person.select((p) => p.name).where((p) => p.equals({id: 'p1'})).one(),
  nestedQueries2: () =>
    Person.select((p) => [
      p.friends.select((p2) => [
        p2.firstPet,
        p2.bestFriend.select((p3) => ({name: p3.name})),
      ]),
    ]),
  selectDuplicatePaths: () =>
    Person.select((p) => [
      p.bestFriend.name,
      p.bestFriend.hobby,
      p.bestFriend.isRealPerson,
    ]),
  outerWhereLimit: () =>
    Person.select((p) => p.name)
      .where((p) => p.name.equals('Semmy').or(p.name.equals('Moa')))
      .limit(1),
  sortByAsc: () => Person.select((p) => p.name).sortBy((p) => p.name),
  sortByDesc: () =>
    Person.select((p) => p.name).sortBy((p) => p.name, 'DESC'),
  updateSimple: () => Person.update({id: 'p1'}, updateSimple),
  createSimple: () => Person.create({name: 'Test Create', hobby: 'Chess'}),
  createWithFriends: () =>
    Person.create({
      name: 'Test Create',
      friends: [{id: 'p2'}, {name: 'New Friend'}],
    }),
  createWithFixedId: () =>
    Person.create({
      __id: 'fixed-id',
      name: 'Fixed',
      bestFriend: {id: 'fixed-id-2'},
    } as any),
  deleteSingle: () => Person.delete({id: 'to-delete'}),
  deleteSingleRef: () => Person.delete({id: 'to-delete'}),
  deleteMultiple: () =>
    Person.delete([{id: 'to-delete-1'}, {id: 'to-delete-2'}]),
  deleteMultipleFull: () =>
    Person.delete([{id: 'to-delete-1'}, {id: 'to-delete-2'}]),
  updateOverwriteSet: () => Person.update({id: 'p1'}, updateOverwriteSet),
  updateUnsetSingleUndefined: () =>
    Person.update({id: 'p1'}, updateUnsetSingleUndefined),
  updateUnsetSingleNull: () =>
    Person.update({id: 'p1'}, updateUnsetSingleNull),
  updateOverwriteNested: () =>
    Person.update({id: 'p1'}, updateOverwriteNested),
  updatePassIdReferences: () =>
    Person.update({id: 'p1'}, updatePassIdReferences),
  updateAddRemoveMulti: () =>
    Person.update({id: 'p1'}, updateAddRemoveMulti),
  updateRemoveMulti: () => Person.update({id: 'p1'}, updateRemoveMulti),
  updateAddRemoveSame: () => Person.update({id: 'p1'}, updateAddRemoveSame),
  updateUnsetMultiUndefined: () =>
    Person.update({id: 'p1'}, updateUnsetMultiUndefined),
  updateNestedWithPredefinedId: () =>
    Person.update({id: 'p1'}, updateNestedWithPredefinedId),
  updateBirthDate: () => Person.update({id: 'p1'}, updateBirthDate),
  preloadBestFriend: () =>
    Person.select((p) => p.bestFriend.preloadFor(componentLike)),
};
