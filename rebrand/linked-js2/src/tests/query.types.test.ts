import {describe, test} from '@jest/globals';
import {linkedShape} from '../package';
import {literalProperty, objectProperty} from '../shapes/SHACL';
import {Shape} from '../shapes/Shape';
import {SelectQueryFactory} from '../queries/SelectQuery';
import {IQueryParser} from '../interfaces/IQueryParser';
import {DeleteResponse} from '../queries/DeleteQuery';
import {CreateResponse} from '../queries/CreateQuery';
import {AddId, NodeReferenceValue, UpdatePartial} from '../queries/QueryFactory';
import {NamedNode} from '../models';
import {UpdateQueryFactory} from '../queries/UpdateQuery';
import {CreateQueryFactory} from '../queries/CreateQuery';
import {DeleteQueryFactory} from '../queries/DeleteQuery';
import {xsd} from '../ontologies/xsd';
import {ShapeSet} from '../collections/ShapeSet';
import {NodeId} from '../queries/MutationQuery';
import {getQueryContext, setQueryContext} from '../queries/QueryContext';

const name = NamedNode.getOrCreate('name');
const hobby = NamedNode.getOrCreate('hobby');
const bestFriend = NamedNode.getOrCreate('bestFriend');
const hasFriend = NamedNode.getOrCreate('hasFriend');
const birthDate = NamedNode.getOrCreate('birthDate');
const isRealPerson = NamedNode.getOrCreate('isRealPerson');
const hasPet = NamedNode.getOrCreate('hasPet');
const guardDogLevel = NamedNode.getOrCreate('guardDogLevel');
const pluralTestProp = NamedNode.getOrCreate('pluralTestProp');
const personClass = NamedNode.getOrCreate('http://example.com/Person');
const petClass = NamedNode.getOrCreate('http://example.com/Pet');
const dogClass = NamedNode.getOrCreate('http://example.com/Dog');

@linkedShape
class Pet extends Shape {
  static targetClass = petClass;

  @objectProperty({path: bestFriend, maxCount: 1, shape: Pet})
  get bestFriend(): Pet {
    return null;
  }
}

@linkedShape
class Dog extends Pet {
  static targetClass = dogClass;

  @literalProperty({path: guardDogLevel, maxCount: 1, datatype: xsd.integer})
  get guardDogLevel(): number {
    return null;
  }
}

@linkedShape
class Person extends Shape {
  static targetClass = personClass;

  @literalProperty({path: name, maxCount: 1})
  get name(): string {
    return '';
  }

  @literalProperty({path: hobby, maxCount: 1})
  get hobby(): string {
    return '';
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

class QueryCaptureStore implements IQueryParser {
  async selectQuery<ResultType>(query: SelectQueryFactory<Shape>) {
    return [] as ResultType;
  }

  async createQuery<ShapeType extends Shape, U extends UpdatePartial<ShapeType>>(
    updateObjectOrFn: U,
    shapeClass: typeof Shape,
  ): Promise<CreateResponse<U>> {
    const factory = new CreateQueryFactory(shapeClass, updateObjectOrFn);
    factory.getQueryObject();
    return {} as CreateResponse<U>;
  }

  async updateQuery<ShapeType extends Shape, U extends UpdatePartial<ShapeType>>(
    id: string | {id: string} | {uri: string},
    updateObjectOrFn: U,
    shapeClass: typeof Shape,
  ): Promise<AddId<U>> {
    const factory = new UpdateQueryFactory(shapeClass, id, updateObjectOrFn);
    factory.getQueryObject();
    return {} as AddId<U>;
  }

  async deleteQuery(
    id: NodeId | NodeId[] | NodeReferenceValue[],
    shapeClass: typeof Shape,
  ): Promise<DeleteResponse> {
    const ids = (Array.isArray(id) ? id : [id]) as NodeId[];
    const factory = new DeleteQueryFactory(shapeClass, ids);
    factory.getQueryObject();
    return {deleted: [], count: 0};
  }
}

Person.queryParser = new QueryCaptureStore();
Pet.queryParser = Person.queryParser;
Dog.queryParser = Person.queryParser;

const expectType = <T>(_value: T) => _value;

setQueryContext('user', {id: 'user-1'}, Person);

// These tests are compile-time checks only. They are skipped at runtime.
// They ensure that query result types are inferred correctly.
describe.skip('query result type inference (compile only)', () => {
  test('can select a literal property of all instances', () => {
    const promise = Person.select((p) => p.name);
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.name);
    expectType<string | undefined>(first.id);
  });

  test('can select an object property of all instances', () => {
    const promise = Person.select((p) => p.friends);
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
    expectType<string | undefined>(first.friends[0].id);
  });

  test('can select a date', () => {
    const promise = Person.select((p) => p.birthDate);
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<Date | null | undefined>(first.birthDate);
    expectType<string | undefined>(first.id);
  });

  test('can select a boolean', () => {
    const promise = Person.select((p) => p.isRealPerson);
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<boolean | null | undefined>(first.isRealPerson);
    expectType<string | undefined>(first.id);
  });

  test('can select properties of a specific subject', () => {
    const promise = Person.select({id: 'p1'}, (p) => p.name);
    type Result = Awaited<typeof promise>;
    const single = (null as unknown as Result);
    expectType<string | undefined>(single.id);
    expectType<string | null | undefined>(single.name);
  });

  test('can select properties of a specific subject by ID reference', () => {
    const promise = Person.select({id: 'p1'}, (p) => p.name);
    type Result = Awaited<typeof promise>;
    const single = (null as unknown as Result);
    expectType<string | undefined>(single.id);
    expectType<string | null | undefined>(single.name);
  });

  test('select with a non existing returns undefined (query object still exists)', () => {
    const promise = Person.select({id: 'https://does.not/exist'}, (p) => p.name);
    type Result = Awaited<typeof promise>;
    const single = (null as unknown as Result);
    expectType<string | undefined>(single.id);
    expectType<string | null | undefined>(single.name);
  });

  test('selecting only undefined properties returns an empty object (query still captures)', () => {
    const promise = Person.select({id: 'p3'}, (p) => [p.hobby, p.bestFriend]);
    type Result = Awaited<typeof promise>;
    const single = (null as unknown as Result);
    expectType<string | null | undefined>(single.hobby);
    expectType<{id?: string} | null | undefined>(single.bestFriend);
  });

  test('can select sub properties of a first property that returns a set', () => {
    const promise = Person.select((p) => p.friends.name);
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.friends[0].name);
    expectType<string | undefined>(first.friends[0].id);
  });

  test('can select a nested set of shapes', () => {
    const promise = Person.select((p) => p.friends.friends.name);
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.friends[0].friends[0].name);
  });

  test('can select multiple property paths', () => {
    const promise = Person.select((p) => [p.name, p.friends, p.bestFriend.name]);
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.name);
    expectType<string | undefined>(first.friends[0].id);
    expectType<string | null | undefined>(first.bestFriend.name);
  });

  test('can select property of single shape value', () => {
    const promise = Person.select((p) => p.bestFriend.name);
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.bestFriend.name);
  });

  test('can select 3 level deep nested paths', () => {
    const promise = Person.select((p) => p.friends.bestFriend.bestFriend.name);
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.friends[0].bestFriend.bestFriend.name);
  });

  test('can use where() to filter a string in a set of Literals with equals', () => {
    const promise = Person.select((p) => p.friends.where((f) => f.name.equals('Moa')));
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
    expectType<string | undefined>(first.friends[0].id);
  });

  test('where object value', () => {
    const promise = Person.select().where((p) => p.bestFriend.equals({id: 'p3'}));
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
  });

  test('where on literal', () => {
    const promise = Person.select((p) => p.hobby.where((h) => h.equals('Jogging')));
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.hobby);
  });

  test('where and', () => {
    const promise = Person.select((p) =>
      p.friends.where((f) => f.name.equals('Moa').and(f.hobby.equals('Jogging'))),
    );
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.friends[0].id);
  });

  test('where or', () => {
    const promise = Person.select((p) =>
      p.friends.where((f) => f.name.equals('Jinx').or(f.hobby.equals('Jogging'))),
    );
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.friends[0].id);
  });

  test('select all', () => {
    const promise = Person.select();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
  });

  test('empty select with where', () => {
    const promise = Person.select().where((p) => p.name.equals('Semmy'));
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
  });

  test('where and or and', () => {
    const promise = Person.select((p) =>
      p.friends.where((f) =>
        f.name.equals('Jinx').or(f.hobby.equals('Jogging')).and(f.name.equals('Moa')),
      ),
    );
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.friends[0].id);
  });

  test('where and or and (nested)', () => {
    const promise = Person.select((p) =>
      p.friends.where((f) =>
        f.name.equals('Jinx').or(f.hobby.equals('Jogging').and(f.name.equals('Moa'))),
      ),
    );
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.friends[0].id);
  });

  test('where some implicit', () => {
    const promise = Person.select().where((p) => p.friends.name.equals('Moa'));
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
  });

  test('where some explicit', () => {
    const promise = Person.select().where((p) => p.friends.some((f) => f.name.equals('Moa')));
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
  });

  test('where every', () => {
    const promise = Person.select().where((p) =>
      p.friends.every((f) => f.name.equals('Moa').or(f.name.equals('Jinx'))),
    );
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
  });

  test('where sequences', () => {
    const promise = Person.select().where((p) =>
      p.friends.some((f) => f.name.equals('Jinx')).and(p.name.equals('Semmy')),
    );
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
  });

  test('outer where()', () => {
    const promise = Person.select((p) => p.friends).where((p) => p.name.equals('Semmy'));
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
    expectType<string | undefined>(first.friends[0].id);
  });

  test('where with query context', () => {
    const promise = Person.select((p) => p.name).where((p) => p.bestFriend.equals(getQueryContext('user')));
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.name);
  });

  test('where with query context as base of property path', () => {
    const promise = Person.select((p) => p.name).where((p) => {
      const userName = getQueryContext<Person>('user').name;
      return p.friends.some((f) => f.name.equals(userName));
    });
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.name);
  });

  test('count a shapeset', () => {
    const promise = Person.select((p) => p.friends.size());
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<number>(first.friends);
  });

  test('count a nested property', () => {
    const promise = Person.select((p) => p.friends.friends.size());
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<number>(first.friends[0].friends);
  });

  test('labeling the key of count()', () => {
    const promise = Person.select((p) => p.friends.select((f) => ({numFriends: f.friends.size()})));
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<number>(first.friends[0].numFriends);
  });

  test('nested object property', () => {
    const promise = Person.select((p) => p.friends.bestFriend);
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.friends[0].bestFriend.id);
  });

  test('nested object property (single)', () => {
    const promise = Person.select((p) => p.friends.bestFriend);
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.friends[0].bestFriend.id);
  });

  test('sub select single prop', () => {
    const promise = Person.select((p) => p.bestFriend.select((f) => ({name: f.name})));
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.bestFriend.name);
  });

  test('sub select plural prop - custom object', () => {
    const promise = Person.select((p) => p.friends.select((f) => ({name: f.name, hobby: f.hobby})));
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.friends[0].name);
    expectType<string | null | undefined>(first.friends[0].hobby);
  });

  test('double nested sub select', () => {
    const promise = Person.select((p) =>
      p.friends.select((p2) => p2.bestFriend.select((p3) => ({name: p3.name}))),
    );
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.friends[0].bestFriend.name);
  });

  test('sub select all primitives', () => {
    const promise = Person.select((p) =>
      p.bestFriend.select((f) => [f.name, f.birthDate, f.isRealPerson]),
    );
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.bestFriend.name);
    expectType<Date | null | undefined>(first.bestFriend.birthDate);
    expectType<boolean | null | undefined>(first.bestFriend.isRealPerson);
  });

  test('custom result object - equals without where returns a boolean', () => {
    const promise = Person.select((p) => ({isBestFriend: p.bestFriend.equals({id: 'p3'})}));
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<boolean>(first.isBestFriend);
  });

  test('custom result object 2', () => {
    const promise = Person.select((p) => ({numFriends: p.friends.size()}));
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<number>(first.numFriends);
  });

  test('count equals', () => {
    const promise = Person.select().where((p) => p.friends.size().equals(2));
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
  });

  test('sub select query returning an array', () => {
    const promise = Person.select((p) => p.friends.select((f) => [f.name, f.hobby]));
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.friends[0].name);
    expectType<string | null | undefined>(first.friends[0].hobby);
  });

  test('select shapeset as', () => {
    const promise = Person.select((p) => p.pets.as(Dog).guardDogLevel);
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<number | null | undefined>(first.pets[0].guardDogLevel);
  });

  test('select non existing returns null or empty array for multiple value properties', () => {
    const promise = Person.select((p) => [p.bestFriend, p.friends]);
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<{id?: string} | null | undefined>(first.bestFriend);
    expectType<string | undefined>(first.friends[0].id);
  });

  test('select shape as', () => {
    const promise = Person.select((p) => p.firstPet.as(Dog).guardDogLevel);
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<number | null | undefined>(first.firstPet.guardDogLevel);
  });

  test('select one', () => {
    const promise = Person.select((p) => p.name).where((p) => p.equals({id: 'p1'})).one();
    type Result = Awaited<typeof promise>;
    const single = (null as unknown as Result);
    expectType<string | null | undefined>(single.name);
  });

  test('nested queries 2', () => {
    const promise = Person.select((p) => [
      p.friends.select((p2) => [
        p2.firstPet,
        p2.bestFriend.select((p3) => ({name: p3.name})),
      ]),
    ]);
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<{id?: string} | null | undefined>(first.friends[0].firstPet);
    expectType<string | null | undefined>(first.friends[0].bestFriend.name);
  });

  test('select duplicate paths', () => {
    const promise = Person.select((p) => [
      p.bestFriend.name,
      p.bestFriend.hobby,
      p.bestFriend.isRealPerson,
    ]);
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.bestFriend.name);
    expectType<string | null | undefined>(first.bestFriend.hobby);
    expectType<boolean | null | undefined>(first.bestFriend.isRealPerson);
  });

  test('outer where with limit', () => {
    const promise = Person.select((p) => p.name)
      .where((p) => p.name.equals('Semmy').or(p.name.equals('Moa')))
      .limit(1);
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.name);
  });

  test('sort by 1 property - ASC (default)', () => {
    const promise = Person.select((p) => p.name).sortBy((p) => p.name);
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.name);
  });

  test('sort by 1 property - DESC', () => {
    const promise = Person.select((p) => p.name).sortBy((p) => p.name, 'DESC');
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.name);
  });

  test('update query 1 - with simple object argument', () => {
    const promise = Person.update({id: 'p1'}, {hobby: 'Chess'});
    type Result = Awaited<typeof promise>;
    const updated = (null as unknown as Result);
    expectType<string | undefined>(updated.id);
    expectType<string | undefined>(updated.hobby);
  });

  test('create query 1 - create simple person with literal fields', () => {
    const promise = Person.create({name: 'Test Create', hobby: 'Chess'});
    type Result = Awaited<typeof promise>;
    const created = (null as unknown as Result);
    expectType<string | undefined>(created.id);
    expectType<string | undefined>(created.name);
    expectType<string | undefined>(created.hobby);
  });

  test('create query 2 - create person with new and existing friends', () => {
    const promise = Person.create({
      name: 'Test Create',
      friends: [{id: 'p2'}, {name: 'New Friend'}],
    });
    type Result = Awaited<typeof promise>;
    const created = (null as unknown as Result);
    expectType<string | undefined>(created.id);
    expectType<{id?: string}[]>(created.friends);
  });

  test('create query 3 - create a new person with a fixed ID', () => {
    const promise = Person.create({
      __id: 'fixed-id',
      name: 'Fixed',
      bestFriend: {id: 'fixed-id-2'},
    } as any);
    type Result = Awaited<typeof promise>;
    const created = (null as unknown as Result);
    expectType<string | undefined>(created.id);
    expectType<string | undefined>(created.name);
  });

  test('delete query 1 - delete newly created node', () => {
    const promise = Person.delete({id: 'to-delete'});
    type Result = Awaited<typeof promise>;
    const deleted = (null as unknown as Result);
    expectType<number>(deleted.count);
  });

  test('delete query 2 - delete newly created node by node reference', () => {
    const promise = Person.delete({id: 'to-delete'});
    type Result = Awaited<typeof promise>;
    const deleted = (null as unknown as Result);
    expectType<number>(deleted.count);
  });

  test('delete query 3 - delete multiple newly created nodes', () => {
    const promise = Person.delete([{id: 'to-delete-1'}, {id: 'to-delete-2'}]);
    type Result = Awaited<typeof promise>;
    const deleted = (null as unknown as Result);
    expectType<number>(deleted.count);
  });

  test('delete query 4 - delete multiple newly created nodes by passing the full result objects', () => {
    const promise = Person.delete([{id: 'to-delete-1'}, {id: 'to-delete-2'}]);
    type Result = Awaited<typeof promise>;
    const deleted = (null as unknown as Result);
    expectType<number>(deleted.count);
  });

  test('update query 2 - overwrite a set (default)', () => {
    const update: UpdatePartial<Person> = {friends: [{id: 'p2'}]};
    const promise = Person.update({id: 'p1'}, update);
    type Result = Awaited<typeof promise>;
    const updated = (null as unknown as Result);
    expectType<string | undefined>(updated.id);
    expectType<
      | {updatedTo: {id?: string}[]}
      | {added: {id?: string}[]; removed: {id?: string}[]}
      | undefined
    >(updated.friends);
  });

  test('update query 3 - unset a single value property', () => {
    const update: UpdatePartial<Person> = {hobby: undefined};
    const promise = Person.update({id: 'p1'}, update);
    type Result = Awaited<typeof promise>;
    const updated = (null as unknown as Result);
    expectType<string | undefined>(updated.id);
    expectType<string | undefined>(updated.hobby);
  });

  test('update query 3B - unset a single value property with null', () => {
    const update: UpdatePartial<Person> = {hobby: null};
    const promise = Person.update({id: 'p1'}, update);
    type Result = Awaited<typeof promise>;
    const updated = (null as unknown as Result);
    expectType<string | null | undefined>(updated.hobby);
  });

  test('update query 4 - overwrite a nested object argument', () => {
    const promise = Person.update({id: 'p1'}, {bestFriend: {name: 'Bestie'}});
    type Result = Awaited<typeof promise>;
    const updated = (null as unknown as Result);
    expectType<{id?: string} | undefined>(updated.bestFriend);
  });

  test('update query 5 - pass id references', () => {
    const promise = Person.update({id: 'p1'}, {bestFriend: {id: 'p2'}});
    type Result = Awaited<typeof promise>;
    const updated = (null as unknown as Result);
    expectType<{id?: string} | undefined>(updated.bestFriend);
  });

  test('update query 6 - add to and remove from Multi-Value Property (friends)', () => {
    const promise = Person.update(
      {id: 'p1'},
      {friends: {add: [{id: 'p2'}], remove: [{id: 'p3'}]}} as any,
    );
    type Result = Awaited<typeof promise>;
    const updated = (null as unknown as Result);
    expectType<{id?: string}[]>(updated.friends.added);
    expectType<{id?: string}[]>(updated.friends.removed);
  });

  test('update query 7 - remove from Multi-Value Property (friends)', () => {
    const promise = Person.update(
      {id: 'p1'},
      {friends: {remove: [{id: 'p2'}]}} as any,
    );
    type Result = Awaited<typeof promise>;
    const updated = (null as unknown as Result);
    expectType<{id?: string}[]>(updated.friends.removed);
  });

  test('update query 8 - $add and $remove in same update', () => {
    const promise = Person.update(
      {id: 'p1'},
      {friends: {add: [{id: 'p2'}], remove: [{id: 'p3'}]}} as any,
    );
    type Result = Awaited<typeof promise>;
    const updated = (null as unknown as Result);
    expectType<{id?: string}[]>(updated.friends.added);
    expectType<{id?: string}[]>(updated.friends.removed);
  });

  test('update query 9 - unset Multi-Value Property with undefined', () => {
    const update: UpdatePartial<Person> = {friends: undefined};
    const promise = Person.update({id: 'p1'}, update);
    type Result = Awaited<typeof promise>;
    const updated = (null as unknown as Result);
    expectType<
      | {updatedTo: {id?: string}[]}
      | {added: {id?: string}[]; removed: {id?: string}[]}
      | undefined
    >(updated.friends);
  });

  test('update query 10 - create new nested object with predefined ID', () => {
    const promise = Person.update({id: 'p1'}, {bestFriend: {id: 'p3-best-friend', name: 'Bestie'}});
    type Result = Awaited<typeof promise>;
    const updated = (null as unknown as Result);
    expectType<{id?: string} | undefined>(updated.bestFriend);
  });

  test('update query 11 - update datatype: Date', () => {
    const promise = Person.update({id: 'p1'}, {birthDate: new Date('2020-01-01')});
    type Result = Awaited<typeof promise>;
    const updated = (null as unknown as Result);
    expectType<Date | undefined>(updated.birthDate);
  });
});
