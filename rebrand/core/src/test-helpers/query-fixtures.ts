import {linkedShape} from '../package';
import {literalProperty, objectProperty} from '../shapes/SHACL';
import {Shape} from '../shapes/Shape';
import {xsd} from '../ontologies/xsd';
import {ShapeSet} from '../collections/ShapeSet';
import {getQueryContext} from '../queries/QueryContext';
import {NodeReferenceValue, UpdatePartial} from '../queries/QueryFactory';

const tmpPropBase = 'linked://tmp/props/';
const tmpTypeBase = 'linked://tmp/types/';
export const tmpEntityBase = 'linked://tmp/entities/';

const prop = (suffix: string): NodeReferenceValue => ({
  id: `${tmpPropBase}${suffix}`,
});
const type = (suffix: string): NodeReferenceValue => ({
  id: `${tmpTypeBase}${suffix}`,
});
const entity = (suffix: string): NodeReferenceValue => ({
  id: `${tmpEntityBase}${suffix}`,
});

export const name = prop('name');
export const hobby = prop('hobby');
export const nickName = prop('nickName');
export const bestFriend = prop('bestFriend');
export const hasFriend = prop('hasFriend');
export const birthDate = prop('birthDate');
export const isRealPerson = prop('isRealPerson');
export const hasPet = prop('hasPet');
export const guardDogLevel = prop('guardDogLevel');
export const pluralTestProp = prop('pluralTestProp');
export const personClass = type('Person');
export const petClass = type('Pet');
export const dogClass = type('Dog');

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
const updateOverwriteSet: UpdatePartial<Person> = {friends: [entity('p2')]};
const updateUnsetSingleUndefined: UpdatePartial<Person> = {hobby: undefined};
const updateUnsetSingleNull: UpdatePartial<Person> = {hobby: null};
const updateOverwriteNested: UpdatePartial<Person> = {
  bestFriend: {name: 'Bestie'},
};
const updatePassIdReferences: UpdatePartial<Person> = {
  bestFriend: entity('p2'),
};
const updateAddRemoveMulti: UpdatePartial<Person> = {
  friends: {add: [entity('p2')], remove: [entity('p3')]},
};
const updateRemoveMulti: UpdatePartial<Person> = {
  friends: {remove: [entity('p2')]},
};
const updateAddRemoveSame: UpdatePartial<Person> = {
  friends: {add: [entity('p2')], remove: [entity('p3')]},
};
const updateUnsetMultiUndefined: UpdatePartial<Person> = {friends: undefined};
const updateNestedWithPredefinedId: UpdatePartial<Person> = {
  bestFriend: {id: `${tmpEntityBase}p3-best-friend`, name: 'Bestie'},
};
const updateBirthDate: UpdatePartial<Person> = {
  birthDate: new Date('2020-01-01'),
};

export const queryFactories = {
  selectName: () => Person.select((p) => p.name),
  selectFriends: () => Person.select((p) => p.friends),
  selectBirthDate: () => Person.select((p) => p.birthDate),
  selectIsRealPerson: () => Person.select((p) => p.isRealPerson),
  selectById: () => Person.select(entity('p1'), (p) => p.name),
  selectByIdReference: () => Person.select(entity('p1'), (p) => p.name),
  selectNonExisting: () =>
    Person.select({id: 'https://does.not/exist'}, (p) => p.name),
  selectUndefinedOnly: () =>
    Person.select(entity('p3'), (p) => [p.hobby, p.bestFriend]),
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
    Person.select().where((p) => p.bestFriend.equals(entity('p3'))),
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
    Person.select((p) => ({isBestFriend: p.bestFriend.equals(entity('p3'))})),
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
    Person.select((p) => p.name).where((p) => p.equals(entity('p1'))).one(),
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
  updateSimple: () => Person.update(entity('p1'), updateSimple),
  createSimple: () => Person.create({name: 'Test Create', hobby: 'Chess'}),
  createWithFriends: () =>
    Person.create({
      name: 'Test Create',
      friends: [entity('p2'), {name: 'New Friend'}],
    }),
  createWithFixedId: () =>
    Person.create({
      __id: `${tmpEntityBase}fixed-id`,
      name: 'Fixed',
      bestFriend: entity('fixed-id-2'),
    } as any),
  deleteSingle: () => Person.delete(entity('to-delete')),
  deleteSingleRef: () => Person.delete(entity('to-delete')),
  deleteMultiple: () =>
    Person.delete([entity('to-delete-1'), entity('to-delete-2')]),
  deleteMultipleFull: () =>
    Person.delete([entity('to-delete-1'), entity('to-delete-2')]),
  updateOverwriteSet: () => Person.update(entity('p1'), updateOverwriteSet),
  updateUnsetSingleUndefined: () =>
    Person.update(entity('p1'), updateUnsetSingleUndefined),
  updateUnsetSingleNull: () =>
    Person.update(entity('p1'), updateUnsetSingleNull),
  updateOverwriteNested: () =>
    Person.update(entity('p1'), updateOverwriteNested),
  updatePassIdReferences: () =>
    Person.update(entity('p1'), updatePassIdReferences),
  updateAddRemoveMulti: () =>
    Person.update(entity('p1'), updateAddRemoveMulti),
  updateRemoveMulti: () => Person.update(entity('p1'), updateRemoveMulti),
  updateAddRemoveSame: () => Person.update(entity('p1'), updateAddRemoveSame),
  updateUnsetMultiUndefined: () =>
    Person.update(entity('p1'), updateUnsetMultiUndefined),
  updateNestedWithPredefinedId: () =>
    Person.update(entity('p1'), updateNestedWithPredefinedId),
  updateBirthDate: () => Person.update(entity('p1'), updateBirthDate),
  preloadBestFriend: () =>
    Person.select((p) => p.bestFriend.preloadFor(componentLike)),
};
