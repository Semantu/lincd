import {describe, expect, test} from '@jest/globals';
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
const nickName = NamedNode.getOrCreate('nickName');
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

class QueryCaptureStore implements IQueryParser {
  lastQuery?: any;

  async selectQuery<ResultType>(query: SelectQueryFactory<Shape>) {
    this.lastQuery = query.getQueryObject();
    return [] as ResultType;
  }

  async createQuery<ShapeType extends Shape, U extends UpdatePartial<ShapeType>>(
    updateObjectOrFn: U,
    shapeClass: typeof Shape,
  ): Promise<CreateResponse<U>> {
    const factory = new CreateQueryFactory(shapeClass, updateObjectOrFn);
    this.lastQuery = factory.getQueryObject();
    return {} as CreateResponse<U>;
  }

  async updateQuery<ShapeType extends Shape, U extends UpdatePartial<ShapeType>>(
    id: string | {id: string} | {uri: string},
    updateObjectOrFn: U,
    shapeClass: typeof Shape,
  ): Promise<AddId<U>> {
    const factory = new UpdateQueryFactory(shapeClass, id, updateObjectOrFn);
    this.lastQuery = factory.getQueryObject();
    return {} as AddId<U>;
  }

  async deleteQuery(
    id: NodeId | NodeId[] | NodeReferenceValue[],
    shapeClass: typeof Shape,
  ): Promise<DeleteResponse> {
    const ids = (Array.isArray(id) ? id : [id]) as NodeId[];
    const factory = new DeleteQueryFactory(shapeClass, ids);
    this.lastQuery = factory.getQueryObject();
    return {deleted: [], count: 0};
  }
}

const store = new QueryCaptureStore();
Person.queryParser = store;
Pet.queryParser = store;
Dog.queryParser = store;

const captureQuery = async (runner: () => Promise<unknown>) => {
  store.lastQuery = undefined;
  await runner();
  return store.lastQuery;
};

const expectSelectQuery = (query: any) => {
  expect(query).toBeDefined();
  expect(query?.type).toBe('select');
  expect(query?.select).toBeDefined();
};

const expectWhere = (query: any) => {
  const whereStep = query?.where ?? query?.select?.[0]?.[0]?.where;
  expect(whereStep).toBeDefined();
};

setQueryContext('user', {id: 'user-1'}, Person);

describe('1. Basic Property Selection', () => {
  test('can select a literal property of all instances', async () => {
    const query = await captureQuery(() => Person.select((p) => p.name));

    expectSelectQuery(query);
    expect(query?.select[0][0].property.label).toBe('name');
  });

  test('can select an object property of all instances', async () => {
    const query = await captureQuery(() => Person.select((p) => p.friends));

    expectSelectQuery(query);
    expect(query?.select[0][0].property.label).toBe('friends');
  });

  test('can select a date', async () => {
    const query = await captureQuery(() => Person.select((p) => p.birthDate));

    expectSelectQuery(query);
    expect(query?.select[0][0].property.label).toBe('birthDate');
  });

  test('can select a boolean', async () => {
    const query = await captureQuery(() => Person.select((p) => p.isRealPerson));

    expectSelectQuery(query);
    expect(query?.select[0][0].property.label).toBe('isRealPerson');
  });

  test('can select properties of a specific subject', async () => {
    const query = await captureQuery(() =>
      Person.select({id: 'p1'}, (p) => p.name),
    );

    expectSelectQuery(query);
    expect(query?.subject).toEqual({id: 'p1'});
    expect(query?.singleResult).toBe(true);
  });

  test('can select properties of a specific subject by ID reference', async () => {
    const query = await captureQuery(() =>
      Person.select({id: 'p1'}, (p) => p.name),
    );

    expectSelectQuery(query);
    expect(query?.subject).toEqual({id: 'p1'});
    expect(query?.singleResult).toBe(true);
  });

  test('select with a non existing returns undefined (query object still exists)', async () => {
    const query = await captureQuery(() =>
      Person.select({id: 'https://does.not/exist'}, (p) => p.name),
    );

    expectSelectQuery(query);
    expect(query?.subject).toEqual({id: 'https://does.not/exist'});
    expect(query?.singleResult).toBe(true);
  });

  test('selecting only undefined properties returns an empty object (query still captures)', async () => {
    const query = await captureQuery(() =>
      Person.select({id: 'p3'}, (p) => [p.hobby, p.bestFriend]),
    );

    expectSelectQuery(query);
    expect(query?.select?.[0]?.length).toBeGreaterThan(0);
  });
});

describe('2. Nested & Path Selection', () => {
  test('can select sub properties of a first property that returns a set', async () => {
    const query = await captureQuery(() => Person.select((p) => p.friends.name));

    expectSelectQuery(query);
    expect(query?.select[0][0].property.label).toBe('friends');
    expect(query?.select[0][1].property.label).toBe('name');
  });

  test('can select a nested set of shapes', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => p.friends.friends.name),
    );

    expectSelectQuery(query);
    expect(query?.select[0][0].property.label).toBe('friends');
  });

  test('can select multiple property paths', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => [p.name, p.friends, p.bestFriend.name]),
    );

    expectSelectQuery(query);
    expect(query?.select).toHaveLength(3);
  });

  test('can select property of single shape value', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => p.bestFriend.name),
    );

    expectSelectQuery(query);
    expect(query?.select[0][0].property.label).toBe('bestFriend');
  });

  test('can select 3 level deep nested paths', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => p.friends.bestFriend.bestFriend.name),
    );

    expectSelectQuery(query);
    expect(query?.select[0][0].property.label).toBe('friends');
  });
});

describe('3. Filtering (Where Clauses)', () => {
  test('can use where() to filter a string in a set of Literals with equals', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => p.friends.where((f) => f.name.equals('Moa'))),
    );

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where object value', async () => {
    const query = await captureQuery(() =>
      Person.select().where((p) => p.bestFriend.equals({id: 'p3'})),
    );

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where on literal', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => p.hobby.where((h) => h.equals('Jogging'))),
    );

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where and', async () => {
    const query = await captureQuery(() =>
      Person.select((p) =>
        p.friends.where((f) => f.name.equals('Moa').and(f.hobby.equals('Jogging'))),
      ),
    );

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where or', async () => {
    const query = await captureQuery(() =>
      Person.select((p) =>
        p.friends.where((f) => f.name.equals('Jinx').or(f.hobby.equals('Jogging'))),
      ),
    );

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('select all', async () => {
    const query = await captureQuery(() => Person.select());

    expectSelectQuery(query);
  });

  test('empty select with where', async () => {
    const query = await captureQuery(() =>
      Person.select().where((p) => p.name.equals('Semmy')),
    );

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where and or and', async () => {
    const query = await captureQuery(() =>
      Person.select((p) =>
        p.friends.where((f) =>
          f.name.equals('Jinx').or(f.hobby.equals('Jogging')).and(f.name.equals('Moa')),
        ),
      ),
    );

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where and or and (nested)', async () => {
    const query = await captureQuery(() =>
      Person.select((p) =>
        p.friends.where((f) =>
          f.name.equals('Jinx').or(f.hobby.equals('Jogging').and(f.name.equals('Moa'))),
        ),
      ),
    );

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where some implicit', async () => {
    const query = await captureQuery(() =>
      Person.select().where((p) => p.friends.name.equals('Moa')),
    );

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where some explicit', async () => {
    const query = await captureQuery(() =>
      Person.select().where((p) =>
        p.friends.some((f) => f.name.equals('Moa')),
      ),
    );

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where every', async () => {
    const query = await captureQuery(() =>
      Person.select().where((p) =>
        p.friends.every((f) => f.name.equals('Moa').or(f.name.equals('Jinx'))),
      ),
    );

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where sequences', async () => {
    const query = await captureQuery(() =>
      Person.select().where((p) =>
        p.friends
          .some((f) => f.name.equals('Jinx'))
          .and(p.name.equals('Semmy')),
      ),
    );

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('outer where()', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => p.friends).where((p) => p.name.equals('Semmy')),
    );

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where with query context', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => p.name).where((p) => p.bestFriend.equals(getQueryContext('user'))),
    );

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where with query context as base of property path', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => p.name).where((p) => {
        const userName = getQueryContext<Person>('user').name;
        return p.friends.some((f) => f.name.equals(userName));
      }),
    );

    expectSelectQuery(query);
    expectWhere(query);
  });
});

describe('4. Aggregation & Sub-Select', () => {
  test('count a shapeset', async () => {
    const query = await captureQuery(() => Person.select((p) => p.friends.size()));

    expectSelectQuery(query);
    expect(query?.select?.[0]?.some((step: any) => step?.count)).toBe(true);
  });

  test('count a nested property', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => p.friends.friends.size()),
    );

    expectSelectQuery(query);
  });

  test('labeling the key of count()', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => p.friends.select((f) => ({numFriends: f.friends.size()}))),
    );

    expectSelectQuery(query);
    expect(query?.select).toBeDefined();
  });

  test('nested object property', async () => {
    const query = await captureQuery(() => Person.select((p) => p.friends.bestFriend));

    expectSelectQuery(query);
  });

  test('nested object property (single)', async () => {
    const query = await captureQuery(() => Person.select((p) => p.friends.bestFriend));

    expectSelectQuery(query);
  });

  test('sub select single prop', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => p.bestFriend.select((f) => ({name: f.name}))),
    );

    expectSelectQuery(query);
  });

  test('sub select plural prop - custom object', async () => {
    const query = await captureQuery(() =>
      Person.select((p) =>
        p.friends.select((f) => ({name: f.name, hobby: f.hobby})),
      ),
    );

    expectSelectQuery(query);
  });

  test('double nested sub select', async () => {
    const query = await captureQuery(() =>
      Person.select((p) =>
        p.friends.select((p2) =>
          p2.bestFriend.select((p3) => ({name: p3.name})),
        ),
      ),
    );

    expectSelectQuery(query);
  });

  test('sub select all primitives', async () => {
    const query = await captureQuery(() =>
      Person.select((p) =>
        p.bestFriend.select((f) => [f.name, f.birthDate, f.isRealPerson]),
      ),
    );

    expectSelectQuery(query);
  });

  test('custom result object - equals without where returns a boolean', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => ({isBestFriend: p.bestFriend.equals({id: 'p3'})})),
    );

    expectSelectQuery(query);
  });

  test('custom result object 2', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => ({numFriends: p.friends.size()})),
    );

    expectSelectQuery(query);
  });

  test('count equals', async () => {
    const query = await captureQuery(() =>
      Person.select().where((p) => p.friends.size().equals(2)),
    );

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('sub select query returning an array', async () => {
    const query = await captureQuery(() =>
      Person.select((p) =>
        p.friends.select((f) => [f.name, f.hobby]),
      ),
    );

    expectSelectQuery(query);
  });
});

describe('5. Type Casting & Transformations', () => {
  test('select shapeset as', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => p.pets.as(Dog).guardDogLevel),
    );

    expectSelectQuery(query);
  });

  test('select non existing returns null or empty array for multiple value properties', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => [p.bestFriend, p.friends]),
    );

    expectSelectQuery(query);
  });

  test('select shape as', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => p.firstPet.as(Dog).guardDogLevel),
    );

    expectSelectQuery(query);
  });

  test('select one', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => p.name).where((p) => p.equals({id: 'p1'})).one(),
    );

    expectSelectQuery(query);
    expect(query?.singleResult).toBe(true);
  });

  test('nested queries 2', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => [
        p.friends.select((p2) => [
          p2.firstPet,
          p2.bestFriend.select((p3) => ({name: p3.name})),
        ]),
      ]),
    );

    expectSelectQuery(query);
  });

  test('select duplicate paths', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => [
        p.bestFriend.name,
        p.bestFriend.hobby,
        p.bestFriend.isRealPerson,
      ]),
    );

    expectSelectQuery(query);
  });
});

describe('7. Sorting & Limiting', () => {
  test('outer where with limit', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => p.name)
        .where((p) => p.name.equals('Semmy').or(p.name.equals('Moa')))
        .limit(1),
    );

    expectSelectQuery(query);
    expect(query?.limit).toBe(1);
  });

  test('sort by 1 property - ASC (default)', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => p.name).sortBy((p) => p.name),
    );

    expectSelectQuery(query);
    expect(query?.sortBy?.direction).toBe('ASC');
  });

  test('sort by 1 property - DESC', async () => {
    const query = await captureQuery(() =>
      Person.select((p) => p.name).sortBy((p) => p.name, 'DESC'),
    );

    expectSelectQuery(query);
    expect(query?.sortBy?.direction).toBe('DESC');
  });
});

describe('8. CRUD Operations (Create, Update, Delete)', () => {
  test('update query 1 - with simple object argument', async () => {
    const query = await captureQuery(() =>
      Person.update({id: 'p1'}, {hobby: 'Chess'}),
    );

    expect(query?.type).toBe('update');
    expect(query?.id).toBe('p1');
  });

  test('create query 1 - create simple person with literal fields', async () => {
    const query = await captureQuery(() =>
      Person.create({name: 'Test Create', hobby: 'Chess'}),
    );

    expect(query?.type).toBe('create');
  });

  test('create query 2 - create person with new and existing friends', async () => {
    const query = await captureQuery(() =>
      Person.create({
        name: 'Test Create',
        friends: [{id: 'p2'}, {name: 'New Friend'}],
      }),
    );

    expect(query?.type).toBe('create');
  });

  test('create query 3 - create a new person with a fixed ID', async () => {
    const query = await captureQuery(() =>
      Person.create({
        __id: 'fixed-id',
        name: 'Fixed',
        bestFriend: {id: 'fixed-id-2'},
      } as any),
    );

    expect(query?.type).toBe('create');
  });

  test('delete query 1 - delete newly created node', async () => {
    const query = await captureQuery(() => Person.delete({id: 'to-delete'}));

    expect(query?.type).toBe('delete');
    expect(query?.ids?.[0]).toEqual({id: 'to-delete'});
  });

  test('delete query 2 - delete newly created node by node reference', async () => {
    const query = await captureQuery(() => Person.delete({id: 'to-delete'}));

    expect(query?.type).toBe('delete');
  });

  test('delete query 3 - delete multiple newly created nodes', async () => {
    const query = await captureQuery(() =>
      Person.delete([{id: 'to-delete-1'}, {id: 'to-delete-2'}]),
    );

    expect(query?.type).toBe('delete');
    expect(query?.ids).toHaveLength(2);
  });

  test('delete query 4 - delete multiple newly created nodes by passing the full result objects', async () => {
    const query = await captureQuery(() =>
      Person.delete([{id: 'to-delete-1'}, {id: 'to-delete-2'}]),
    );

    expect(query?.type).toBe('delete');
  });

  test('update query 2 - overwrite a set (default)', async () => {
    const query = await captureQuery(() =>
      Person.update({id: 'p1'}, {friends: [{id: 'p2'}]}),
    );

    expect(query?.type).toBe('update');
  });

  test('update query 3 - unset a single value property', async () => {
    const query = await captureQuery(() =>
      Person.update({id: 'p1'}, {hobby: undefined}),
    );

    expect(query?.type).toBe('update');
  });

  test('update query 3B - unset a single value property with null', async () => {
    const query = await captureQuery(() =>
      Person.update({id: 'p1'}, {hobby: null}),
    );

    expect(query?.type).toBe('update');
  });

  test('update query 4 - overwrite a nested object argument', async () => {
    const query = await captureQuery(() =>
      Person.update({id: 'p1'}, {bestFriend: {name: 'Bestie'}}),
    );

    expect(query?.type).toBe('update');
  });

  test('update query 5 - pass id references', async () => {
    const query = await captureQuery(() =>
      Person.update({id: 'p1'}, {bestFriend: {id: 'p2'}}),
    );

    expect(query?.type).toBe('update');
  });

  test('update query 6 - add to and remove from Multi-Value Property (friends)', async () => {
    const query = await captureQuery(() =>
      Person.update(
        {id: 'p1'},
        {friends: {add: [{id: 'p2'}], remove: [{id: 'p3'}]}} as any,
      ),
    );

    expect(query?.type).toBe('update');
  });

  test('update query 7 - remove from Multi-Value Property (friends)', async () => {
    const query = await captureQuery(() =>
      Person.update({id: 'p1'}, {friends: {remove: [{id: 'p2'}]}} as any),
    );

    expect(query?.type).toBe('update');
  });

  test('update query 8 - $add and $remove in same update', async () => {
    const query = await captureQuery(() =>
      Person.update(
        {id: 'p1'},
        {friends: {add: [{id: 'p2'}], remove: [{id: 'p3'}]}} as any,
      ),
    );

    expect(query?.type).toBe('update');
  });

  test('update query 9 - unset Multi-Value Property with undefined', async () => {
    const query = await captureQuery(() =>
      Person.update({id: 'p1'}, {friends: undefined}),
    );

    expect(query?.type).toBe('update');
  });

  test('update query 10 - create new nested object with predefined ID', async () => {
    const query = await captureQuery(() =>
      Person.update({id: 'p1'}, {bestFriend: {id: 'p3-best-friend', name: 'Bestie'}}),
    );

    expect(query?.type).toBe('update');
  });

  test('update query 11 - update datatype: Date', async () => {
    const query = await captureQuery(() =>
      Person.update({id: 'p1'}, {birthDate: new Date('2020-01-01')}),
    );

    expect(query?.type).toBe('update');
  });
});
