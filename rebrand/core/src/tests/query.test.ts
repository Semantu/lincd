import {describe, expect, test} from '@jest/globals';
import {Shape} from '../shapes/Shape';
import {SelectQueryFactory} from '../queries/SelectQuery';
import {IQueryParser} from '../interfaces/IQueryParser';
import {DeleteResponse} from '../queries/DeleteQuery';
import {CreateResponse} from '../queries/CreateQuery';
import {AddId, NodeReferenceValue, UpdatePartial} from '../queries/QueryFactory';
import {UpdateQueryFactory} from '../queries/UpdateQuery';
import {CreateQueryFactory} from '../queries/CreateQuery';
import {DeleteQueryFactory} from '../queries/DeleteQuery';
import {NodeId} from '../queries/MutationQuery';
import {Dog, Person, Pet, queryFactories, name as namePath, tmpEntityBase} from '../test-helpers/query-fixtures';
import {setQueryContext} from '../queries/QueryContext';

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
    id: string | NodeReferenceValue,
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
    const query = await captureQuery(() => queryFactories.selectName());

    expectSelectQuery(query);
    expect(query?.select[0][0].property.label).toBe('name');
  });

  test('can select an object property of all instances', async () => {
    const query = await captureQuery(() => queryFactories.selectFriends());

    expectSelectQuery(query);
    expect(query?.select[0][0].property.label).toBe('friends');
  });

  test('can select a date', async () => {
    const query = await captureQuery(() => queryFactories.selectBirthDate());

    expectSelectQuery(query);
    expect(query?.select[0][0].property.label).toBe('birthDate');
  });

  test('can select a boolean', async () => {
    const query = await captureQuery(() => queryFactories.selectIsRealPerson());

    expectSelectQuery(query);
    expect(query?.select[0][0].property.label).toBe('isRealPerson');
  });

  test('can select properties of a specific subject', async () => {
    const query = await captureQuery(() => queryFactories.selectById());

    expectSelectQuery(query);
    expect(query?.subject).toEqual({id: `${tmpEntityBase}p1`});
    expect(query?.singleResult).toBe(true);
  });

  test('can select properties of a specific subject by ID reference', async () => {
    const query = await captureQuery(() => queryFactories.selectByIdReference());

    expectSelectQuery(query);
    expect(query?.subject).toEqual({id: `${tmpEntityBase}p1`});
    expect(query?.singleResult).toBe(true);
  });

  test('select with a non existing returns undefined (query object still exists)', async () => {
    const query = await captureQuery(() => queryFactories.selectNonExisting());

    expectSelectQuery(query);
    expect(query?.subject).toEqual({id: 'https://does.not/exist'});
    expect(query?.singleResult).toBe(true);
  });

  test('selecting only undefined properties returns an empty object (query still captures)', async () => {
    const query = await captureQuery(() => queryFactories.selectUndefinedOnly());

    expectSelectQuery(query);
    expect(query?.select?.[0]?.length).toBeGreaterThan(0);
  });
});

describe('2. Nested & Path Selection', () => {
  test('can select sub properties of a first property that returns a set', async () => {
    const query = await captureQuery(() => queryFactories.selectFriendsName());

    expectSelectQuery(query);
    expect(query?.select[0][0].property.label).toBe('friends');
    expect(query?.select[0][1].property.label).toBe('name');
  });

  test('can select a nested set of shapes', async () => {
    const query = await captureQuery(() =>
      queryFactories.selectNestedFriendsName(),
    );

    expectSelectQuery(query);
    expect(query?.select[0][0].property.label).toBe('friends');
  });

  test('can select multiple property paths', async () => {
    const query = await captureQuery(() => queryFactories.selectMultiplePaths());

    expectSelectQuery(query);
    expect(query?.select).toHaveLength(3);
  });

  test('can select property of single shape value', async () => {
    const query = await captureQuery(() => queryFactories.selectBestFriendName());

    expectSelectQuery(query);
    expect(query?.select[0][0].property.label).toBe('bestFriend');
  });

  test('can select 3 level deep nested paths', async () => {
    const query = await captureQuery(() => queryFactories.selectDeepNested());

    expectSelectQuery(query);
    expect(query?.select[0][0].property.label).toBe('friends');
  });
});

describe('3. Filtering (Where Clauses)', () => {
  test('can use where() to filter a string in a set of Literals with equals', async () => {
    const query = await captureQuery(() =>
      queryFactories.whereFriendsNameEquals(),
    );

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where object value', async () => {
    const query = await captureQuery(() => queryFactories.whereBestFriendEquals());

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where on literal', async () => {
    const query = await captureQuery(() => queryFactories.whereHobbyEquals());

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where and', async () => {
    const query = await captureQuery(() => queryFactories.whereAnd());

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where or', async () => {
    const query = await captureQuery(() => queryFactories.whereOr());

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('select all', async () => {
    const query = await captureQuery(() => queryFactories.selectAll());

    expectSelectQuery(query);
  });

  test('empty select with where', async () => {
    const query = await captureQuery(() => queryFactories.selectWhereNameSemmy());

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where and or and', async () => {
    const query = await captureQuery(() => queryFactories.whereAndOrAnd());

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where and or and (nested)', async () => {
    const query = await captureQuery(() => queryFactories.whereAndOrAndNested());

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where some implicit', async () => {
    const query = await captureQuery(() => queryFactories.whereSomeImplicit());

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where some explicit', async () => {
    const query = await captureQuery(() => queryFactories.whereSomeExplicit());

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where every', async () => {
    const query = await captureQuery(() => queryFactories.whereEvery());

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where sequences', async () => {
    const query = await captureQuery(() => queryFactories.whereSequences());

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('outer where()', async () => {
    const query = await captureQuery(() => queryFactories.outerWhere());

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('where with query context', async () => {
    const query = await captureQuery(() => queryFactories.whereWithContext());

    expectSelectQuery(query);
    expectWhere(query);
    expect(query?.where?.path?.[0]?.property?.label).toBe('bestFriend');
    expect(query?.where?.args?.[0]).toEqual({
      id: 'user-1',
      shape: {id: Person.shape.id},
    });
  });

  test('where with query context as base of property path', async () => {
    const query = await captureQuery(() => queryFactories.whereWithContextPath());

    expectSelectQuery(query);
    expectWhere(query);
    expect(query?.where?.method).toBe('some');
    const nestedWhere = query?.where?.args?.[0];
    expect(nestedWhere?.method).toBe('=');
    expect(nestedWhere?.path?.[0]?.property?.label).toBe('name');
    expect(nestedWhere?.args?.[0]?.subject).toEqual({
      id: 'user-1',
      shape: {id: Person.shape.id},
    });
    expect(nestedWhere?.args?.[0]?.path?.[0]?.property?.label).toBe('name');
  });
});

describe('4. Aggregation & Sub-Select', () => {
  test('count a shapeset', async () => {
    const query = await captureQuery(() => queryFactories.countFriends());

    expectSelectQuery(query);
    expect(query?.select?.[0]?.some((step: any) => step?.count)).toBe(true);
  });

  test('count a nested property', async () => {
    const query = await captureQuery(() => queryFactories.countNestedFriends());

    expectSelectQuery(query);
  });

  test('labeling the key of count()', async () => {
    const query = await captureQuery(() => queryFactories.countLabel());

    expectSelectQuery(query);
    expect(query?.select).toBeDefined();
  });

  test('nested object property', async () => {
    const query = await captureQuery(() => queryFactories.nestedObjectProperty());

    expectSelectQuery(query);
  });

  test('nested object property (single)', async () => {
    const query = await captureQuery(() =>
      queryFactories.nestedObjectPropertySingle(),
    );

    expectSelectQuery(query);
  });

  test('sub select single prop', async () => {
    const query = await captureQuery(() => queryFactories.subSelectSingleProp());

    expectSelectQuery(query);
  });

  test('sub select plural prop - custom object', async () => {
    const query = await captureQuery(() => queryFactories.subSelectPluralCustom());

    expectSelectQuery(query);
  });

  test('double nested sub select', async () => {
    const query = await captureQuery(() => queryFactories.doubleNestedSubSelect());

    expectSelectQuery(query);
  });

  test('sub select all primitives', async () => {
    const query = await captureQuery(() => queryFactories.subSelectAllPrimitives());

    expectSelectQuery(query);
  });

  test('custom result object - equals without where returns a boolean', async () => {
    const query = await captureQuery(() =>
      queryFactories.customResultEqualsBoolean(),
    );

    expectSelectQuery(query);
  });

  test('custom result object 2', async () => {
    const query = await captureQuery(() => queryFactories.customResultNumFriends());

    expectSelectQuery(query);
  });

  test('count equals', async () => {
    const query = await captureQuery(() => queryFactories.countEquals());

    expectSelectQuery(query);
    expectWhere(query);
  });

  test('sub select query returning an array', async () => {
    const query = await captureQuery(() => queryFactories.subSelectArray());

    expectSelectQuery(query);
  });
});

describe('5. Type Casting & Transformations', () => {
  test('select shapeset as', async () => {
    const query = await captureQuery(() => queryFactories.selectShapeSetAs());

    expectSelectQuery(query);
  });

  test('select non existing returns null or empty array for multiple value properties', async () => {
    const query = await captureQuery(() =>
      queryFactories.selectNonExistingMultiple(),
    );

    expectSelectQuery(query);
  });

  test('select shape as', async () => {
    const query = await captureQuery(() => queryFactories.selectShapeAs());

    expectSelectQuery(query);
  });

  test('select one', async () => {
    const query = await captureQuery(() => queryFactories.selectOne());

    expectSelectQuery(query);
    expect(query?.singleResult).toBe(true);
  });

  test('nested queries 2', async () => {
    const query = await captureQuery(() => queryFactories.nestedQueries2());

    expectSelectQuery(query);
  });

  test('select duplicate paths', async () => {
    const query = await captureQuery(() => queryFactories.selectDuplicatePaths());

    expectSelectQuery(query);
  });
});

describe('6. Preload (Component-like Queries)', () => {
  test('can preload a component query onto a property path', async () => {
    const query = await captureQuery(() => queryFactories.preloadBestFriend());

    expectSelectQuery(query);
    expect(query?.select[0][0].property.label).toBe('bestFriend');
    expect(query?.select[0][1]?.name?.[0]?.property?.label).toBe('name');
  });
});

describe('7. Sorting & Limiting', () => {
  test('outer where with limit', async () => {
    const query = await captureQuery(() => queryFactories.outerWhereLimit());

    expectSelectQuery(query);
    expect(query?.limit).toBe(1);
  });

  test('sort by 1 property - ASC (default)', async () => {
    const query = await captureQuery(() => queryFactories.sortByAsc());

    expectSelectQuery(query);
    expect(query?.sortBy?.direction).toBe('ASC');
  });

  test('sort by 1 property - DESC', async () => {
    const query = await captureQuery(() => queryFactories.sortByDesc());

    expectSelectQuery(query);
    expect(query?.sortBy?.direction).toBe('DESC');
  });
});

describe('8. CRUD Operations (Create, Update, Delete)', () => {
  test('update query 1 - with simple object argument', async () => {
    const query = await captureQuery(() => queryFactories.updateSimple());

    expect(query?.type).toBe('update');
    expect(query?.id).toBe(`${tmpEntityBase}p1`);
  });

  test('create query 1 - create simple person with literal fields', async () => {
    const query = await captureQuery(() => queryFactories.createSimple());

    expect(query?.type).toBe('create');
  });

  test('create query 2 - create person with new and existing friends', async () => {
    const query = await captureQuery(() => queryFactories.createWithFriends());

    expect(query?.type).toBe('create');
  });

  test('create query 3 - create a new person with a fixed ID', async () => {
    const query = await captureQuery(() => queryFactories.createWithFixedId());

    expect(query?.type).toBe('create');
  });

  test('delete query 1 - delete newly created node', async () => {
    const query = await captureQuery(() => queryFactories.deleteSingle());

    expect(query?.type).toBe('delete');
    expect(query?.ids?.[0]).toEqual({id: `${tmpEntityBase}to-delete`});
  });

  test('delete query 2 - delete newly created node by node reference', async () => {
    const query = await captureQuery(() => queryFactories.deleteSingleRef());

    expect(query?.type).toBe('delete');
  });

  test('delete query 3 - delete multiple newly created nodes', async () => {
    const query = await captureQuery(() => queryFactories.deleteMultiple());

    expect(query?.type).toBe('delete');
    expect(query?.ids).toHaveLength(2);
  });

  test('delete query 4 - delete multiple newly created nodes by passing the full result objects', async () => {
    const query = await captureQuery(() => queryFactories.deleteMultipleFull());

    expect(query?.type).toBe('delete');
  });

  test('update query 2 - overwrite a set (default)', async () => {
    const query = await captureQuery(() => queryFactories.updateOverwriteSet());

    expect(query?.type).toBe('update');
  });

  test('update query 3 - unset a single value property', async () => {
    const query = await captureQuery(() =>
      queryFactories.updateUnsetSingleUndefined(),
    );

    expect(query?.type).toBe('update');
  });

  test('update query 3B - unset a single value property with null', async () => {
    const query = await captureQuery(() => queryFactories.updateUnsetSingleNull());

    expect(query?.type).toBe('update');
  });

  test('update query 4 - overwrite a nested object argument', async () => {
    const query = await captureQuery(() => queryFactories.updateOverwriteNested());

    expect(query?.type).toBe('update');
  });

  test('update query 5 - pass id references', async () => {
    const query = await captureQuery(() => queryFactories.updatePassIdReferences());

    expect(query?.type).toBe('update');
  });

  test('update query 6 - add to and remove from Multi-Value Property (friends)', async () => {
    const query = await captureQuery(() => queryFactories.updateAddRemoveMulti());

    expect(query?.type).toBe('update');
  });

  test('update query 7 - remove from Multi-Value Property (friends)', async () => {
    const query = await captureQuery(() => queryFactories.updateRemoveMulti());

    expect(query?.type).toBe('update');
  });

  test('update query 8 - $add and $remove in same update', async () => {
    const query = await captureQuery(() => queryFactories.updateAddRemoveSame());

    expect(query?.type).toBe('update');
  });

  test('update query 9 - unset Multi-Value Property with undefined', async () => {
    const query = await captureQuery(() =>
      queryFactories.updateUnsetMultiUndefined(),
    );

    expect(query?.type).toBe('update');
  });

  test('update query 10 - create new nested object with predefined ID', async () => {
    const query = await captureQuery(() =>
      queryFactories.updateNestedWithPredefinedId(),
    );

    expect(query?.type).toBe('update');
  });

  test('update query 11 - update datatype: Date', async () => {
    const query = await captureQuery(() => queryFactories.updateBirthDate());

    expect(query?.type).toBe('update');
  });
});

describe('8. NodeReferenceValue', () => {
  test('property paths normalize to NodeReferenceValue', () => {
    const property = Person.shape.getPropertyShape('name');
    expect(property).toBeDefined();
    expect(property?.path).toEqual(namePath);
  });
});
