import {describe, test} from '@jest/globals';
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
import {Dog, Person, Pet, queryFactories} from '../test-helpers/query-fixtures';
import {setQueryContext} from '../queries/QueryContext';

class QueryCaptureStore implements IQueryParser {
  async selectQuery<ResultType>(query: SelectQueryFactory<Shape>) {
    query.getQueryObject();
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
    id: string | NodeReferenceValue,
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

// Compile-time checks only; skipped at runtime.
describe.skip('query result type inference (compile only)', () => {
  test('can select a literal property of all instances', () => {
    const promise = queryFactories.selectName();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.name);
    expectType<string | undefined>(first.id);
  });

  test('can select an object property of all instances', () => {
    const promise = queryFactories.selectFriends();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
    expectType<string | undefined>(first.friends[0].id);
  });

  test('can select a date', () => {
    const promise = queryFactories.selectBirthDate();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<Date | null | undefined>(first.birthDate);
    expectType<string | undefined>(first.id);
  });

  test('can select a boolean', () => {
    const promise = queryFactories.selectIsRealPerson();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<boolean | null | undefined>(first.isRealPerson);
    expectType<string | undefined>(first.id);
  });

  test('can select properties of a specific subject', () => {
    const promise = queryFactories.selectById();
    type Result = Awaited<typeof promise>;
    const single = null as unknown as Result;
    expectType<string | undefined>(single.id);
    expectType<string | null | undefined>(single.name);
  });

  test('can select properties of a specific subject by ID reference', () => {
    const promise = queryFactories.selectByIdReference();
    type Result = Awaited<typeof promise>;
    const single = null as unknown as Result;
    expectType<string | undefined>(single.id);
    expectType<string | null | undefined>(single.name);
  });

  test('select with a non existing returns undefined (query object still exists)', () => {
    const promise = queryFactories.selectNonExisting();
    type Result = Awaited<typeof promise>;
    const single = null as unknown as Result;
    expectType<string | undefined>(single.id);
    expectType<string | null | undefined>(single.name);
  });

  test('selecting only undefined properties returns an empty object (query still captures)', () => {
    const promise = queryFactories.selectUndefinedOnly();
    type Result = Awaited<typeof promise>;
    const single = null as unknown as Result;
    expectType<string | null | undefined>(single.hobby);
    expectType<{id?: string} | null | undefined>(single.bestFriend);
  });

  test('can select sub properties of a first property that returns a set', () => {
    const promise = queryFactories.selectFriendsName();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.friends[0].name);
    expectType<string | undefined>(first.friends[0].id);
  });

  test('can select a nested set of shapes', () => {
    const promise = queryFactories.selectNestedFriendsName();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.friends[0].friends[0].name);
  });

  test('can select multiple property paths', () => {
    const promise = queryFactories.selectMultiplePaths();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.name);
    expectType<string | undefined>(first.friends[0].id);
    expectType<string | null | undefined>(first.bestFriend.name);
  });

  test('can select property of single shape value', () => {
    const promise = queryFactories.selectBestFriendName();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.bestFriend.name);
  });

  test('can select 3 level deep nested paths', () => {
    const promise = queryFactories.selectDeepNested();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(
      first.friends[0].bestFriend.bestFriend.name,
    );
  });

  test('can use where() to filter a string in a set of Literals with equals', () => {
    const promise = queryFactories.whereFriendsNameEquals();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
    expectType<string | undefined>(first.friends[0].id);
  });

  test('where object value', () => {
    const promise = queryFactories.whereBestFriendEquals();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
  });

  test('where on literal', () => {
    const promise = queryFactories.whereHobbyEquals();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.hobby);
  });

  test('where and', () => {
    const promise = queryFactories.whereAnd();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.friends[0].id);
  });

  test('where or', () => {
    const promise = queryFactories.whereOr();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.friends[0].id);
  });

  test('select all', () => {
    const promise = queryFactories.selectAll();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
  });

  test('empty select with where', () => {
    const promise = queryFactories.selectWhereNameSemmy();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
  });

  test('where and or and', () => {
    const promise = queryFactories.whereAndOrAnd();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.friends[0].id);
  });

  test('where and or and (nested)', () => {
    const promise = queryFactories.whereAndOrAndNested();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.friends[0].id);
  });

  test('where some implicit', () => {
    const promise = queryFactories.whereSomeImplicit();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
  });

  test('where some explicit', () => {
    const promise = queryFactories.whereSomeExplicit();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
  });

  test('where every', () => {
    const promise = queryFactories.whereEvery();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
  });

  test('where sequences', () => {
    const promise = queryFactories.whereSequences();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
  });

  test('outer where()', () => {
    const promise = queryFactories.outerWhere();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
    expectType<string | undefined>(first.friends[0].id);
  });

  test('where with query context', () => {
    const promise = queryFactories.whereWithContext();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.name);
  });

  test('where with query context as base of property path', () => {
    const promise = queryFactories.whereWithContextPath();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.name);
  });

  test('count a shapeset', () => {
    const promise = queryFactories.countFriends();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<number>(first.friends);
  });

  test('count a nested property', () => {
    const promise = queryFactories.countNestedFriends();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<number>(first.friends[0].friends);
  });

  test('labeling the key of count()', () => {
    const promise = queryFactories.countLabel();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<number>(first.friends[0].numFriends);
  });

  test('nested object property', () => {
    const promise = queryFactories.nestedObjectProperty();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.friends[0].bestFriend.id);
  });

  test('nested object property (single)', () => {
    const promise = queryFactories.nestedObjectPropertySingle();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.friends[0].bestFriend.id);
  });

  test('sub select single prop', () => {
    const promise = queryFactories.subSelectSingleProp();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.bestFriend.name);
  });

  test('sub select plural prop - custom object', () => {
    const promise = queryFactories.subSelectPluralCustom();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.friends[0].name);
    expectType<string | null | undefined>(first.friends[0].hobby);
  });

  test('double nested sub select', () => {
    const promise = queryFactories.doubleNestedSubSelect();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.friends[0].bestFriend.name);
  });

  test('sub select all primitives', () => {
    const promise = queryFactories.subSelectAllPrimitives();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.bestFriend.name);
    expectType<Date | null | undefined>(first.bestFriend.birthDate);
    expectType<boolean | null | undefined>(first.bestFriend.isRealPerson);
  });

  test('custom result object - equals without where returns a boolean', () => {
    const promise = queryFactories.customResultEqualsBoolean();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<boolean>(first.isBestFriend);
  });

  test('custom result object 2', () => {
    const promise = queryFactories.customResultNumFriends();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<number>(first.numFriends);
  });

  test('count equals', () => {
    const promise = queryFactories.countEquals();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | undefined>(first.id);
  });

  test('sub select query returning an array', () => {
    const promise = queryFactories.subSelectArray();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.friends[0].name);
    expectType<string | null | undefined>(first.friends[0].hobby);
  });

  test('select shapeset as', () => {
    const promise = queryFactories.selectShapeSetAs();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<number | null | undefined>(first.pets[0].guardDogLevel);
  });

  test('select non existing returns null or empty array for multiple value properties', () => {
    const promise = queryFactories.selectNonExistingMultiple();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<{id?: string} | null | undefined>(first.bestFriend);
    expectType<string | undefined>(first.friends[0].id);
  });

  test('select shape as', () => {
    const promise = queryFactories.selectShapeAs();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<number | null | undefined>(first.firstPet.guardDogLevel);
  });

  test('select one', () => {
    const promise = queryFactories.selectOne();
    type Result = Awaited<typeof promise>;
    const single = null as unknown as Result;
    expectType<string | null | undefined>(single.name);
  });

  test('nested queries 2', () => {
    const promise = queryFactories.nestedQueries2();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<{id?: string} | null | undefined>(first.friends[0].firstPet);
    expectType<string | null | undefined>(first.friends[0].bestFriend.name);
  });

  test('select duplicate paths', () => {
    const promise = queryFactories.selectDuplicatePaths();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.bestFriend.name);
    expectType<string | null | undefined>(first.bestFriend.hobby);
    expectType<boolean | null | undefined>(first.bestFriend.isRealPerson);
  });

  test('can preload a component query onto a property path', () => {
    const promise = queryFactories.preloadBestFriend();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.bestFriend.name);
  });

  test('outer where with limit', () => {
    const promise = queryFactories.outerWhereLimit();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.name);
  });

  test('sort by 1 property - ASC (default)', () => {
    const promise = queryFactories.sortByAsc();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.name);
  });

  test('sort by 1 property - DESC', () => {
    const promise = queryFactories.sortByDesc();
    type Result = Awaited<typeof promise>;
    const first = (null as unknown as Result)[0];
    expectType<string | null | undefined>(first.name);
  });

  test('update query 1 - with simple object argument', () => {
    const promise = queryFactories.updateSimple();
    type Result = Awaited<typeof promise>;
    const updated = null as unknown as Result;
    expectType<string | undefined>(updated.id);
    expectType<string | undefined>(updated.hobby);
  });

  test('create query 1 - create simple person with literal fields', () => {
    const promise = queryFactories.createSimple();
    type Result = Awaited<typeof promise>;
    const created = null as unknown as Result;
    expectType<string | undefined>(created.id);
    expectType<string | undefined>(created.name);
    expectType<string | undefined>(created.hobby);
  });

  test('create query 2 - create person with new and existing friends', () => {
    const promise = queryFactories.createWithFriends();
    type Result = Awaited<typeof promise>;
    const created = null as unknown as Result;
    expectType<string | undefined>(created.id);
    expectType<{id?: string}[]>(created.friends);
  });

  test('create query 3 - create a new person with a fixed ID', () => {
    const promise = queryFactories.createWithFixedId();
    type Result = Awaited<typeof promise>;
    const created = null as unknown as Result;
    expectType<string | undefined>(created.id);
    expectType<string | undefined>(created.name);
  });

  test('delete query 1 - delete newly created node', () => {
    const promise = queryFactories.deleteSingle();
    type Result = Awaited<typeof promise>;
    const deleted = null as unknown as Result;
    expectType<number>(deleted.count);
  });

  test('delete query 2 - delete newly created node by node reference', () => {
    const promise = queryFactories.deleteSingleRef();
    type Result = Awaited<typeof promise>;
    const deleted = null as unknown as Result;
    expectType<number>(deleted.count);
  });

  test('delete query 3 - delete multiple newly created nodes', () => {
    const promise = queryFactories.deleteMultiple();
    type Result = Awaited<typeof promise>;
    const deleted = null as unknown as Result;
    expectType<number>(deleted.count);
  });

  test('delete query 4 - delete multiple newly created nodes by passing the full result objects', () => {
    const promise = queryFactories.deleteMultipleFull();
    type Result = Awaited<typeof promise>;
    const deleted = null as unknown as Result;
    expectType<number>(deleted.count);
  });

  test('update query 2 - overwrite a set (default)', () => {
    const promise = queryFactories.updateOverwriteSet();
    type Result = Awaited<typeof promise>;
    const updated = null as unknown as Result;
    expectType<string | undefined>(updated.id);
    expectType<
      | {updatedTo: {id?: string}[]}
      | {added: {id?: string}[]; removed: {id?: string}[]}
      | undefined
    >(updated.friends);
  });

  test('update query 3 - unset a single value property', () => {
    const promise = queryFactories.updateUnsetSingleUndefined();
    type Result = Awaited<typeof promise>;
    const updated = null as unknown as Result;
    expectType<string | undefined>(updated.id);
    expectType<string | undefined>(updated.hobby);
  });

  test('update query 3B - unset a single value property with null', () => {
    const promise = queryFactories.updateUnsetSingleNull();
    type Result = Awaited<typeof promise>;
    const updated = null as unknown as Result;
    expectType<string | null | undefined>(updated.hobby);
  });

  test('update query 4 - overwrite a nested object argument', () => {
    const promise = queryFactories.updateOverwriteNested();
    type Result = Awaited<typeof promise>;
    const updated = null as unknown as Result;
    expectType<{id?: string} | undefined>(updated.bestFriend);
  });

  test('update query 5 - pass id references', () => {
    const promise = queryFactories.updatePassIdReferences();
    type Result = Awaited<typeof promise>;
    const updated = null as unknown as Result;
    expectType<{id?: string} | undefined>(updated.bestFriend);
  });

  test('update query 6 - add to and remove from Multi-Value Property (friends)', () => {
    const promise = queryFactories.updateAddRemoveMulti();
    type Result = Awaited<typeof promise>;
    const updated = null as unknown as Result;
    const friends = updated.friends;
    if (friends && 'added' in friends) {
      expectType<{id?: string}[]>(friends.added);
      expectType<{id?: string}[]>(friends.removed);
    }
  });

  test('update query 7 - remove from Multi-Value Property (friends)', () => {
    const promise = queryFactories.updateRemoveMulti();
    type Result = Awaited<typeof promise>;
    const updated = null as unknown as Result;
    const friends = updated.friends;
    if (friends && 'removed' in friends) {
      expectType<{id?: string}[]>(friends.removed);
    }
  });

  test('update query 8 - $add and $remove in same update', () => {
    const promise = queryFactories.updateAddRemoveSame();
    type Result = Awaited<typeof promise>;
    const updated = null as unknown as Result;
    const friends = updated.friends;
    if (friends && 'added' in friends) {
      expectType<{id?: string}[]>(friends.added);
      expectType<{id?: string}[]>(friends.removed);
    }
  });

  test('update query 9 - unset Multi-Value Property with undefined', () => {
    const promise = queryFactories.updateUnsetMultiUndefined();
    type Result = Awaited<typeof promise>;
    const updated = null as unknown as Result;
    expectType<
      | {updatedTo: {id?: string}[]}
      | {added: {id?: string}[]; removed: {id?: string}[]}
      | undefined
    >(updated.friends);
  });

  test('update query 10 - create new nested object with predefined ID', () => {
    const promise = queryFactories.updateNestedWithPredefinedId();
    type Result = Awaited<typeof promise>;
    const updated = null as unknown as Result;
    expectType<{id?: string} | undefined>(updated.bestFriend);
  });

  test('update query 11 - update datatype: Date', () => {
    const promise = queryFactories.updateBirthDate();
    type Result = Awaited<typeof promise>;
    const updated = null as unknown as Result;
    expectType<Date | undefined>(updated.birthDate);
  });
});
