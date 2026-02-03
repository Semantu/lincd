import {describe, expect, test} from '@jest/globals';
import {literalProperty, objectProperty, Shape} from '../package.js';
import {CreateQueryFactory} from '../queries/CreateQuery.js';
import {DeleteQueryFactory} from '../queries/DeleteQuery.js';
import {SelectQueryFactory} from '../queries/SelectQuery.js';
import {UpdateQueryFactory} from '../queries/UpdateQuery.js';
import {queryTestFixtures} from '../test-helpers/query-fixtures.js';

const {
  Person,
  Dog,
  name,
  bestFriend,
  friends,
  pets,
  firstPet,
  hobby,
  birthDate,
  isRealPerson,
  guardDogLevel,
} = queryTestFixtures;

class QueryCaptureStore {
  lastQueryFactory?: SelectQueryFactory<Shape>;
  lastCreate?: CreateQueryFactory<Shape>;
  lastUpdate?: UpdateQueryFactory<Shape>;
  lastDelete?: DeleteQueryFactory<Shape>;

  async selectQuery<ResultType>(query: SelectQueryFactory<Shape>) {
    this.lastQueryFactory = query;
    return [] as ResultType;
  }

  async createQuery<ResultType>(query: CreateQueryFactory<Shape>) {
    this.lastCreate = query;
    return {} as ResultType;
  }

  async updateQuery<ResultType>(query: UpdateQueryFactory<Shape>) {
    this.lastUpdate = query;
    return {} as ResultType;
  }

  async deleteQuery<ResultType>(query: DeleteQueryFactory<Shape>) {
    this.lastDelete = query;
    return {} as ResultType;
  }

  getQueryObject() {
    return this.lastQueryFactory?.getQueryObject();
  }

  getCreateQuery() {
    return this.lastCreate?.getQueryObject();
  }

  getUpdateQuery() {
    return this.lastUpdate?.getQueryObject();
  }

  getDeleteQuery() {
    return this.lastDelete?.getQueryObject();
  }
}

describe('query builder basics', () => {
  const getQuery = async (
    run: (store: QueryCaptureStore) => Promise<unknown>,
  ) => {
    const store = new QueryCaptureStore();
    Person.queryParser = store;
    await run(store);
    return store.getQueryObject();
  };

  test('selecting a literal property builds a query object', async () => {
    const query = await getQuery(async () => Person.select((p) => p.name));
    const propertyShape = Person.shape.getPropertyShapes()[0];

    expect(query?.type).toBe('select');
    expect(query?.shape).toBe(Person);
    expect(query?.subject).toBeUndefined();
    expect(query?.singleResult).toBe(false);
    expect(query?.select).toHaveLength(1);
    expect(query?.select[0]).toHaveLength(1);
    expect(query?.select[0][0].property).toBe(propertyShape);
    expect(query?.select[0][0].property.label).toBe('name');
    expect(query?.select[0][0].property.path).toEqual({id: name});
  });

  test('selecting an object property builds a query object', async () => {
    const query = await getQuery(async () =>
      Person.select((p) => p.bestFriend),
    );
    const propertyShape = Person.shape
      .getPropertyShapes()
      .find((shape) => shape.label === 'bestFriend');

    expect(query?.select).toHaveLength(1);
    expect(query?.select[0]).toHaveLength(1);
    expect(query?.select[0][0].property).toBe(propertyShape);
    expect(query?.select[0][0].property.path).toEqual({id: bestFriend});
  });

  test('selecting multiple literal properties builds multiple paths', async () => {
    const query = await getQuery(async () =>
      Person.select((p) => [p.birthDate, p.name]),
    );
    const shapes = Person.shape.getPropertyShapes();
    const birthDateShape = shapes.find((shape) => shape.label === 'birthDate');
    const nameShape = shapes.find((shape) => shape.label === 'name');

    expect(query?.select).toHaveLength(2);
    expect(query?.select[0][0].property).toBe(birthDateShape);
    expect(query?.select[1][0].property).toBe(nameShape);
  });

  test('selecting a boolean property builds a query object', async () => {
    const query = await getQuery(async () =>
      Person.select((p) => p.isRealPerson),
    );
    const propertyShape = Person.shape
      .getPropertyShapes()
      .find((shape) => shape.label === 'isRealPerson');

    expect(query?.select).toHaveLength(1);
    expect(query?.select[0][0].property).toBe(propertyShape);
  });

  test('selecting properties of a specific subject uses the subject', async () => {
    const subject = {id: 'p1'};
    const query = await getQuery(async () =>
      Person.select(subject, (p) => p.name),
    );

    expect(query?.subject).toBe(subject);
    expect(query?.singleResult).toBe(true);
  });

  test('selecting by id reference sets the subject', async () => {
    const subject = {id: 'p2'};
    const query = await getQuery(async () =>
      Person.select(subject, (p) => p.name),
    );

    expect(query?.subject).toBe(subject);
    expect(query?.singleResult).toBe(true);
  });

  test('selecting a missing subject still builds a query object', async () => {
    const subject = {id: 'missing'};
    const query = await getQuery(async () =>
      Person.select(subject, (p) => p.name),
    );

    expect(query?.subject).toBe(subject);
    expect(query?.singleResult).toBe(true);
  });

  test('selecting only nullable properties still records the paths', async () => {
    const subject = {id: 'p3'};
    const query = await getQuery(async () =>
      Person.select(subject, (p) => [p.hobby, p.bestFriend]),
    );
    const shapes = Person.shape.getPropertyShapes();
    const hobbyShape = shapes.find((shape) => shape.label === 'hobby');
    const bestFriendShape = shapes.find(
      (shape) => shape.label === 'bestFriend',
    );

    expect(query?.select).toHaveLength(2);
    expect(query?.select[0][0].property).toBe(hobbyShape);
    expect(query?.select[1][0].property).toBe(bestFriendShape);
  });

  test('selecting a nested property builds a multi-step path', async () => {
    const query = await getQuery(async () =>
      Person.select((p) => p.friends.name),
    );
    const shapes = Person.shape.getPropertyShapes();
    const friendsShape = shapes.find((shape) => shape.label === 'friends');
    const nameShape = shapes.find((shape) => shape.label === 'name');

    expect(query?.select).toHaveLength(1);
    expect(query?.select[0]).toHaveLength(2);
    expect(query?.select[0][0].property).toBe(friendsShape);
    expect(query?.select[0][1].property).toBe(nameShape);
  });

  test('selecting a nested set builds multiple steps', async () => {
    const query = await getQuery(async () =>
      Person.select((p) => p.friends.friends),
    );
    const shapes = Person.shape.getPropertyShapes();
    const friendsShape = shapes.find((shape) => shape.label === 'friends');

    expect(query?.select).toHaveLength(1);
    expect(query?.select[0]).toHaveLength(2);
    expect(query?.select[0][0].property).toBe(friendsShape);
    expect(query?.select[0][1].property).toBe(friendsShape);
  });

  test('selecting multiple property paths includes nested paths', async () => {
    const query = await getQuery(async () =>
      Person.select((p) => [p.name, p.friends, p.bestFriend.name]),
    );
    const shapes = Person.shape.getPropertyShapes();
    const nameShape = shapes.find((shape) => shape.label === 'name');
    const friendsShape = shapes.find((shape) => shape.label === 'friends');
    const bestFriendShape = shapes.find((shape) => shape.label === 'bestFriend');

    expect(query?.select).toHaveLength(3);
    expect(query?.select[0][0].property).toBe(nameShape);
    expect(query?.select[1][0].property).toBe(friendsShape);
    expect(query?.select[2][0].property).toBe(bestFriendShape);
    expect(query?.select[2][1].property).toBe(nameShape);
  });

  test('selecting a property of a single shape builds a nested path', async () => {
    const query = await getQuery(async () =>
      Person.select((p) => p.bestFriend.name),
    );
    const shapes = Person.shape.getPropertyShapes();
    const bestFriendShape = shapes.find((shape) => shape.label === 'bestFriend');
    const nameShape = shapes.find((shape) => shape.label === 'name');

    expect(query?.select).toHaveLength(1);
    expect(query?.select[0]).toHaveLength(2);
    expect(query?.select[0][0].property).toBe(bestFriendShape);
    expect(query?.select[0][1].property).toBe(nameShape);
  });

  test('selecting 3-level deep nested paths builds full paths', async () => {
    const query = await getQuery(async () =>
      Person.select((p) => p.friends.friends.friends),
    );
    const shapes = Person.shape.getPropertyShapes();
    const friendsShape = shapes.find((shape) => shape.label === 'friends');

    expect(query?.select).toHaveLength(1);
    expect(query?.select[0]).toHaveLength(3);
    expect(query?.select[0][0].property).toBe(friendsShape);
    expect(query?.select[0][1].property).toBe(friendsShape);
    expect(query?.select[0][2].property).toBe(friendsShape);
  });

  describe('filtering (where clauses)', () => {
    test('selecting a set with where() adds a where path', async () => {
      const query = await getQuery(async () =>
        Person.select((p) =>
          (p.friends as any).where((f: any) => f.name.equals('Moa')),
        ),
      );
      const shapes = Person.shape.getPropertyShapes();
      const friendsShape = shapes.find((shape) => shape.label === 'friends');
      const nameShape = shapes.find((shape) => shape.label === 'name');

      const step = query?.select[0][0];
      expect(step?.property).toBe(friendsShape);
      expect(step?.where?.method).toBe('=');
      expect(step?.where?.path[0].property).toBe(friendsShape);
      expect(step?.where?.path[1].property).toBe(nameShape);
      expect(step?.where?.args[0]).toBe('Moa');
    });

    test('where on literal property adds where to property step', async () => {
      const query = await getQuery(async () =>
        Person.select((p) =>
          (p.hobby as any).where((h: any) => h.equals('Jogging')),
        ),
      );
      const shapes = Person.shape.getPropertyShapes();
      const hobbyShape = shapes.find((shape) => shape.label === 'hobby');

      const step = query?.select[0][0];
      expect(step?.property).toBe(hobbyShape);
      expect(step?.where?.method).toBe('=');
      expect(step?.where?.args[0]).toBe('Jogging');
    });

    test('outer where() sets where on the query object', async () => {
      const query = await getQuery(async () =>
        (Person.select() as any).where((p: any) => p.name.equals('Semmy')),
      );
      const shapes = Person.shape.getPropertyShapes();
      const nameShape = shapes.find((shape) => shape.label === 'name');

      expect(query?.select).toHaveLength(0);
      const where = query?.where as any;
      expect(where?.method).toBe('=');
      expect(where?.path[0].property).toBe(nameShape);
      expect(where?.args[0]).toBe('Semmy');
    });

    test('and/or chains generate combined where paths', async () => {
      const query = await getQuery(async () =>
        Person.select((p) =>
          (p.friends as any).where((f: any) =>
            f.name.equals('Moa').and(f.hobby.equals('Jogging')),
          ),
        ),
      );
      const shapes = Person.shape.getPropertyShapes();
      const friendsShape = shapes.find((shape) => shape.label === 'friends');
      const nameShape = shapes.find((shape) => shape.label === 'name');
      const hobbyShape = shapes.find((shape) => shape.label === 'hobby');

      const step = query?.select[0][0];
      expect(step?.property).toBe(friendsShape);
      expect(step?.where?.firstPath.path[0].property).toBe(friendsShape);
      expect(step?.where?.firstPath.path[1].property).toBe(nameShape);
      expect(step?.where?.andOr[0].and.path[0].property).toBe(friendsShape);
      expect(step?.where?.andOr[0].and.path[1].property).toBe(hobbyShape);
    });

    test('some() produces a some where path', async () => {
      const query = await getQuery(async () =>
        (Person.select() as any).where((p: any) =>
          (p.friends as any).some((f: any) => f.name.equals('Moa')),
        ),
      );
      const shapes = Person.shape.getPropertyShapes();
      const friendsShape = shapes.find((shape) => shape.label === 'friends');
      const nameShape = shapes.find((shape) => shape.label === 'name');

      const where = query?.where as any;
      expect(where?.method).toBe('some');
      expect(where?.path[0].property).toBe(friendsShape);
      const nested = where?.args[0];
      expect(nested.path[0].property).toBe(friendsShape);
      expect(nested.path[1].property).toBe(nameShape);
    });

    test('every() produces an every where path', async () => {
      const query = await getQuery(async () =>
        (Person.select() as any).where((p: any) =>
          (p.friends as any).every((f: any) => f.name.equals('Jinx')),
        ),
      );
      const shapes = Person.shape.getPropertyShapes();
      const friendsShape = shapes.find((shape) => shape.label === 'friends');
      const nameShape = shapes.find((shape) => shape.label === 'name');

      const where = query?.where as any;
      expect(where?.method).toBe('every');
      expect(where?.path[0].property).toBe(friendsShape);
      const nested = where?.args[0];
      expect(nested.path[0].property).toBe(friendsShape);
      expect(nested.path[1].property).toBe(nameShape);
    });
  });

  describe('aggregation & sub-select', () => {
    test('count a shapeset adds a count step', async () => {
      const query = await getQuery(async () =>
        Person.select((p) => (p.friends as any).size()),
      );
      const shapes = Person.shape.getPropertyShapes();
      const friendsShape = shapes.find((shape) => shape.label === 'friends');

      const countStep = query?.select[0][0];
      expect(countStep?.count[0].property).toBe(friendsShape);
    });

    test('count a nested property counts the full path', async () => {
      const query = await getQuery(async () =>
        Person.select((p) => ((p.friends as any).friends as any).size()),
      );
      const shapes = Person.shape.getPropertyShapes();
      const friendsShape = shapes.find((shape) => shape.label === 'friends');

      const countStep = query?.select[0][0];
      expect(countStep?.count[0].property).toBe(friendsShape);
      expect(countStep?.count[1].property).toBe(friendsShape);
    });

    test('sub select with custom object nests query paths', async () => {
      const query = await getQuery(async () =>
        Person.select((p) =>
          (p.friends as any).select((f: any) => ({
            numFriends: (f.friends as any).size(),
          })),
        ),
      );
      const shapes = Person.shape.getPropertyShapes();
      const friendsShape = shapes.find((shape) => shape.label === 'friends');

      const path = query?.select[0];
      expect(path[0].property).toBe(friendsShape);
      const nested = path[1];
      expect(nested.numFriends[0].count[0].property).toBe(friendsShape);
    });
  });

  describe('type casting & sorting', () => {
    test('select shapeset as builds a query path with cast shape', async () => {
      const query = await getQuery(async () =>
        Person.select((p) => (p.pets as any).as(Dog).guardDogLevel),
      );
      const shapes = Person.shape.getPropertyShapes();
      const petsShape = shapes.find((shape) => shape.label === 'pets');
      const dogGuardShape = Dog.shape
        .getPropertyShapes()
        .find((shape) => shape.label === 'guardDogLevel');

      expect(query?.select).toHaveLength(1);
      expect(query?.select[0][0].property).toBe(petsShape);
      expect(query?.select[0][1].property).toBe(dogGuardShape);
    });

    test('select shape as builds a query path with cast shape', async () => {
      const query = await getQuery(async () =>
        Person.select((p) => (p.firstPet as any).as(Dog).guardDogLevel),
      );
      const shapes = Person.shape.getPropertyShapes();
      const firstPetShape = shapes.find((shape) => shape.label === 'firstPet');
      const dogGuardShape = Dog.shape
        .getPropertyShapes()
        .find((shape) => shape.label === 'guardDogLevel');

      expect(query?.select).toHaveLength(1);
      expect(query?.select[0][0].property).toBe(firstPetShape);
      expect(query?.select[0][1].property).toBe(dogGuardShape);
    });

    test('sortBy adds sort path and direction', async () => {
      const query = await getQuery(async () =>
        (Person.select((p) => p.name) as any).sortBy((p: any) => p.name),
      );
      const nameShape = Person.shape
        .getPropertyShapes()
        .find((shape) => shape.label === 'name');

      expect(query?.sortBy?.direction).toBe('ASC');
      expect(query?.sortBy?.paths[0][0].property).toBe(nameShape);
    });

    test('limit sets the limit on the query object', async () => {
      const query = await getQuery(async () =>
        (Person.select((p) => p.name) as any).limit(1),
      );

      expect(query?.limit).toBe(1);
    });
  });

  describe('crud query objects', () => {
    test('create builds a create query object', async () => {
      const store = new QueryCaptureStore();
      Person.queryParser = store;

      await Person.create({name: 'New Person', hobby: 'Hiking'});

      const query = store.getCreateQuery();
      const shapes = Person.shape.getPropertyShapes();
      const nameShape = shapes.find((shape) => shape.label === 'name');
      const hobbyShape = shapes.find((shape) => shape.label === 'hobby');

      expect(query?.type).toBe('create');
      expect(query?.shape).toBe(Person.shape);
      expect(query?.description.fields[0].prop).toBe(nameShape);
      expect(query?.description.fields[0].val).toBe('New Person');
      expect(query?.description.fields[1].prop).toBe(hobbyShape);
      expect(query?.description.fields[1].val).toBe('Hiking');
    });

    test('update builds an update query object', async () => {
      const store = new QueryCaptureStore();
      Person.queryParser = store;

      await Person.update('p1', {hobby: 'Gaming'});

      const query = store.getUpdateQuery();
      const hobbyShape = Person.shape
        .getPropertyShapes()
        .find((shape) => shape.label === 'hobby');

      expect(query?.type).toBe('update');
      expect(query?.id).toBe('p1');
      expect(query?.shape).toBe(Person.shape);
      expect(query?.updates.fields[0].prop).toBe(hobbyShape);
      expect(query?.updates.fields[0].val).toBe('Gaming');
    });

    test('delete builds a delete query object', async () => {
      const store = new QueryCaptureStore();
      Person.queryParser = store;

      await Person.delete(['p1', {id: 'p2'}]);

      const query = store.getDeleteQuery();
      expect(query?.type).toBe('delete');
      expect(query?.shape).toBe(Person.shape);
      expect(query?.ids).toEqual([{id: 'p1'}, {id: 'p2'}]);
    });
  });
});
