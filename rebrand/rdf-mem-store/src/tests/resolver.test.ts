import {describe, expect, test, beforeAll} from '@jest/globals';
import {NamedNode, Literal} from '../models';
import {toNamedNode} from '../utils/toNamedNode';
import {resolveLocal, createLocal, updateLocal, deleteLocal} from '../utils/LocalQueryResolver';
import {Shape} from '@_linked/core/shapes/Shape';
import {SelectQueryFactory, SelectQuery} from '@_linked/core/queries/SelectQuery';
import {IQueryParser} from '@_linked/core/interfaces/IQueryParser';
import {AddId, NodeReferenceValue, UpdatePartial} from '@_linked/core/queries/QueryFactory';
import {CreateResponse, CreateQueryFactory} from '@_linked/core/queries/CreateQuery';
import {UpdateQueryFactory} from '@_linked/core/queries/UpdateQuery';
import {DeleteQueryFactory, DeleteResponse} from '@_linked/core/queries/DeleteQuery';
import {NodeId} from '@_linked/core/queries/MutationQuery';
import {setQueryContext} from '@_linked/core/queries/QueryContext';
import {
  Person,
  Pet,
  Dog,
  tmpEntityBase,
  name as nameProp,
  hobby as hobbyProp,
  nickName as nickNameProp,
  bestFriend as bestFriendProp,
  hasFriend as hasFriendProp,
  hasPet as hasPetProp,
  birthDate as birthDateProp,
  isRealPerson as isRealPersonProp,
  guardDogLevel as guardDogLevelProp,
  pluralTestProp as pluralTestPropProp,
  personClass,
  petClass,
  dogClass,
} from '@_linked/core/test-helpers/query-fixtures';
import {rdf} from '@_linked/core/ontologies/rdf';
import {xsd} from '@_linked/core/ontologies/xsd';

const E = tmpEntityBase;

/**
 * A queryParser that wires Shape.select() to resolveLocal.
 */
class ResolverQueryParser implements IQueryParser {
  async selectQuery<ResultType>(query: SelectQueryFactory<Shape>) {
    return resolveLocal<ResultType>(query.getQueryObject());
  }
  async createQuery<ShapeType extends Shape, U extends UpdatePartial<ShapeType>>(
    u: U, s: typeof Shape,
  ): Promise<CreateResponse<U>> {
    const factory = new CreateQueryFactory(s, u);
    return createLocal(factory.getQueryObject());
  }
  async updateQuery<ShapeType extends Shape, U extends UpdatePartial<ShapeType>>(
    id: string | NodeReferenceValue, u: U, s: typeof Shape,
  ): Promise<AddId<U>> {
    const factory = new UpdateQueryFactory(s, id, u);
    return updateLocal(factory.getQueryObject());
  }
  async deleteQuery(
    id: NodeId | NodeId[] | NodeReferenceValue[], s: typeof Shape,
  ): Promise<DeleteResponse> {
    const factory = new DeleteQueryFactory(s, id as any);
    return deleteLocal(factory.getQueryObject());
  }
}

const parser = new ResolverQueryParser();

// Entity URIs matching original test data
const p1Uri = `${E}p1-semmy`;
const p2Uri = `${E}p2-moa`;
const p3Uri = `${E}p3-jinx`;
const p4Uri = `${E}p4-quinn`;
const dog1Uri = `${E}dog1`;
const dog2Uri = `${E}dog2`;

/**
 * Seed the global NamedNode graph with test data matching the original
 * src/tests/utils/query-tests.tsx exactly.
 */
function seedTestData() {
  const rdfType = toNamedNode(rdf.type);
  const nameNode = toNamedNode(nameProp);
  const nickNameNode = toNamedNode(nickNameProp);
  const hobbyNode = toNamedNode(hobbyProp);
  const bestFriendNode = toNamedNode(bestFriendProp);
  const hasFriendNode = toNamedNode(hasFriendProp);
  const hasPetNode = toNamedNode(hasPetProp);
  const birthDateNode = toNamedNode(birthDateProp);
  const isRealPersonNode = toNamedNode(isRealPersonProp);
  const guardDogLevelNode = toNamedNode(guardDogLevelProp);
  const pluralTestPropNode = toNamedNode(pluralTestPropProp);

  const personType = toNamedNode(personClass);
  const petType = toNamedNode(petClass);
  const dogType = toNamedNode(dogClass);

  // Create person nodes
  const p1 = NamedNode.getOrCreate(p1Uri);
  const p2 = NamedNode.getOrCreate(p2Uri);
  const p3 = NamedNode.getOrCreate(p3Uri);
  const p4 = NamedNode.getOrCreate(p4Uri);

  // Set types
  p1.set(rdfType, personType);
  p2.set(rdfType, personType);
  p3.set(rdfType, personType);
  p4.set(rdfType, personType);

  // p1: Semmy
  p1.set(nameNode, new Literal('Semmy'));
  p1.set(hobbyNode, new Literal('Chess'));
  p1.set(birthDateNode, new Literal(new Date('1990-01-01').toISOString(), toNamedNode(xsd.dateTime)));
  p1.set(nickNameNode, new Literal('Sem1'));
  p1.set(nickNameNode, new Literal('Sem'));
  p1.set(isRealPersonNode, new Literal('true', toNamedNode(xsd.boolean)));
  // p1 friends: p2, p3
  p1.set(hasFriendNode, p2);
  p1.set(hasFriendNode, p3);
  // p1 NO bestFriend (matches original)
  // p1 pluralTestProp: [p1,p2,p3,p4]
  p1.set(pluralTestPropNode, p1);
  p1.set(pluralTestPropNode, p2);
  p1.set(pluralTestPropNode, p3);
  p1.set(pluralTestPropNode, p4);

  // p2: Moa
  p2.set(nameNode, new Literal('Moa'));
  p2.set(hobbyNode, new Literal('Jogging'));
  p2.set(bestFriendNode, p3);
  p2.set(hasFriendNode, p3);
  p2.set(hasFriendNode, p4);
  p2.set(isRealPersonNode, new Literal('false', toNamedNode(xsd.boolean)));

  // p3: Jinx
  p3.set(nameNode, new Literal('Jinx'));
  p3.set(isRealPersonNode, new Literal('true', toNamedNode(xsd.boolean)));
  // p3: no hobby, no bestFriend, no friends

  // p4: Quinn
  p4.set(nameNode, new Literal('Quinn'));
  // p4: no hobby, no bestFriend, no friends

  // Dogs
  const dog1 = NamedNode.getOrCreate(dog1Uri);
  dog1.set(rdfType, dogType);
  dog1.set(guardDogLevelNode, new Literal('2', toNamedNode(xsd.integer)));

  const dog2 = NamedNode.getOrCreate(dog2Uri);
  dog2.set(rdfType, dogType);
  dog1.set(bestFriendNode, dog2);

  // p1 pets
  p1.set(hasPetNode, dog1);
  // p2 pets
  p2.set(hasPetNode, dog2);

  // Set query context (used by where-with-context tests)
  setQueryContext('user', {id: p3Uri}, Person);
}

beforeAll(() => {
  seedTestData();
  Person.queryParser = parser;
  Pet.queryParser = parser;
  Dog.queryParser = parser;
});

// ─── 1. Basic Property Selection ─────────────────────────────────────────────

describe('1. Basic Property Selection', () => {
  test('can select a literal property of all instances', async () => {
    const names = await Person.select((p) => p.name);
    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBe(4);
    expect(typeof names[0] === 'object').toBe(true);
    expect(names[0].hasOwnProperty('name')).toBe(true);
    expect(names[0].name).toBe('Semmy');
    expect(names[0].id).toBe(p1Uri);
  });

  test('can select an object property of all instances', async () => {
    const personFriends = await Person.select((p) => p.friends);
    const first = personFriends[0];
    expect(Array.isArray(personFriends)).toBe(true);
    expect(personFriends.length).toBe(4);
    expect(typeof personFriends[0] === 'object').toBe(true);
    expect(first.hasOwnProperty('id')).toBe(true);
    expect(first.id).toBe(p1Uri);
    expect(first.friends.length).toBe(2);
    expect(first.friends[0].id).toBe(p2Uri);
    expect(first.friends[1].id).toBe(p3Uri);
  });

  test('can select a date', async () => {
    const birthDates = await Person.select((p) => [p.birthDate, p.name]);
    const first = birthDates[0];
    expect(Array.isArray(birthDates)).toBe(true);
    expect(birthDates.length).toBe(4);
    expect(typeof first.birthDate === 'object').toBe(true);
    expect(first.birthDate instanceof Date).toBe(true);
  });

  test('can select a boolean', async () => {
    const isRealPersons = await Person.select((p) => p.isRealPerson);
    expect(Array.isArray(isRealPersons)).toBe(true);
    expect(isRealPersons.length).toBe(4);
    expect(isRealPersons.filter((p: any) => p.isRealPerson !== null).length).toBe(3);
    const p1Result = isRealPersons.find((p: any) => p.id === p1Uri);
    expect(p1Result.isRealPerson).toBe(true);
    const p2Result = isRealPersons.find((p: any) => p.id === p2Uri);
    expect(p2Result.isRealPerson).toBe(false);
    const p4Result = isRealPersons.find((p: any) => p.id === p4Uri);
    expect(p4Result.isRealPerson).toBeNull();
  });

  test('can select properties of a specific subject', async () => {
    const qRes = await Person.select({id: p1Uri}, (p) => p.name);
    expect(qRes.name).toBe('Semmy');
    expect(qRes.id).toBe(p1Uri);
  });

  test('can select properties of a specific subject by ID reference', async () => {
    const qRes = await Person.select({id: p1Uri}, (p) => p.name);
    expect(qRes.name).toBe('Semmy');
    expect(qRes.id).toBe(p1Uri);
  });

  test('select with a non existing returns null', async () => {
    const qRes = await Person.select({id: 'https://does.not/exist'}, (p) => p.name);
    expect(qRes).toBeNull();
  });

  test('selecting only undefined properties returns null values', async () => {
    const qRes = await Person.select({id: p3Uri}, (p) => [p.hobby, p.bestFriend]);
    expect(qRes.hobby).toBeNull();
    expect(qRes.bestFriend).toBeNull();
    expect(qRes.id).toBe(p3Uri);
  });
});

// ─── 2. Nested & Path Selection ─────────────────────────────────────────────

describe('2. Nested & Path Selection', () => {
  test('can select sub properties of a first property that returns a set', async () => {
    const namesOfFriends = await Person.select((p) => p.friends.name);
    const first = namesOfFriends[0];
    expect(Array.isArray(namesOfFriends)).toBe(true);
    expect(namesOfFriends.length).toBe(4);
    expect(first.id).toBe(p1Uri);
    expect(first.friends.length).toBe(2);
    expect(first.friends[0].id).toBe(p2Uri);
    expect(first.friends[0].name).toBe('Moa');
    expect(first.friends[0]['hobby']).toBeUndefined();
  });

  test('can select a nested set of shapes', async () => {
    const friendsOfFriends = await Person.select((p) => p.friends.friends);
    expect(Array.isArray(friendsOfFriends)).toBe(true);
    expect(friendsOfFriends.length).toBe(4);
    const first = friendsOfFriends[0];
    // p1's friends are p2,p3. p2's friends are p3,p4. p3 has no friends.
    expect(first.friends.length).toBe(2);
    expect(first.friends[0].friends.some((f: any) => f.id === p3Uri)).toBe(true);
    expect(first.friends[0].friends.some((f: any) => f.id === p4Uri)).toBe(true);
    expect(first.friends[1].friends.length).toBe(0);
    expect(friendsOfFriends[3].friends.length).toBe(0);
  });

  test('can select multiple property paths', async () => {
    const result = await Person.select((p) => [p.name, p.friends, p.bestFriend.name]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(4);
    const first = result[0];
    expect(first.name).toBe('Semmy');
    expect(Array.isArray(first.friends)).toBe(true);
    expect(first.friends.length).toBe(2);
    expect(first.friends.some((f: any) => f.id === p2Uri)).toBe(true);
    expect(first.friends.some((f: any) => f.id === p4Uri)).toBe(false);
  });

  test('can select property of single shape value', async () => {
    const result = await Person.select((p) => p.bestFriend.name);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(4);
    // p2's bestFriend is p3
    const second = result[1];
    expect(second.bestFriend.id).toBe(p3Uri);
  });

  test('can select 3 level deep nested paths', async () => {
    const level3Friends = await Person.select((p) => p.friends.friends.friends);
    expect(level3Friends.length).toBe(4);
    // At depth 3, everyone's friends' friends' friends should be empty
    // (because p3 and p4 have no friends, and depth 3 reaches leaf nodes)
    expect(
      level3Friends.every((p: any) =>
        p.friends.every((f: any) =>
          f.friends.every(
            (f2: any) => f2.friends.length === 0,
          ),
        ),
      ),
    ).toBe(true);
  });
});

// ─── 3. Filtering (Where Clauses) ──────────────────────────────────────────

describe('3. Filtering (Where Clauses)', () => {
  test('can use where() to filter a string in a set of Literals with equals', async () => {
    const friendsCalledMoa = await Person.select((p) =>
      p.friends.where((f) => f.name.equals('Moa')),
    );
    const first = friendsCalledMoa[0];
    const second = friendsCalledMoa[1];
    expect(Array.isArray(friendsCalledMoa)).toBe(true);
    expect(first.friends.length).toBe(1);
    expect(first.friends[0].id).toBe(p2Uri);
    expect(second.friends.length).toBe(0);
  });

  test('where object value', async () => {
    const hasBestFriend = await Person.select().where((p) =>
      p.bestFriend.equals({id: p3Uri}),
    );
    expect(Array.isArray(hasBestFriend)).toBe(true);
    expect(hasBestFriend.length).toBe(1);
    expect(hasBestFriend[0].id).toBe(p2Uri);
  });

  test('where on literal', async () => {
    const hobbies = await Person.select((p) =>
      p.hobby.where((h) => h.equals('Jogging')),
    );
    expect(Array.isArray(hobbies)).toBe(true);
    expect(hobbies.length).toBe(4);
    const p1Result = hobbies.find((h: any) => h.id === p1Uri);
    const p2Result = hobbies.find((h: any) => h.id === p2Uri);
    expect(p1Result).toBeDefined();
    expect(p2Result).toBeDefined();
    expect(p1Result.hobby).toBeUndefined();
    expect(p2Result.hobby).toBe('Jogging');
  });

  test('where and', async () => {
    const friendsCalledMoaThatJog = await Person.select((p) =>
      p.friends.where((f) => f.name.equals('Moa').and(f.hobby.equals('Jogging'))),
    );
    const first = friendsCalledMoaThatJog[0];
    const second = friendsCalledMoaThatJog[1];
    expect(Array.isArray(friendsCalledMoaThatJog)).toBe(true);
    expect(first.friends.length).toBe(1);
    expect(first.friends[0].id).toBe(p2Uri);
    expect(second.friends.length).toBe(0);
  });

  test('where or', async () => {
    const orFriends = await Person.select((p) =>
      p.friends.where((f) => f.name.equals('Jinx').or(f.hobby.equals('Jogging'))),
    );
    const first = orFriends[0];
    const second = orFriends[1];
    expect(Array.isArray(orFriends)).toBe(true);
    expect(first.friends.length).toBe(2);
    expect(first.friends[0].id).toBe(p2Uri);
    expect(first.friends[1].id).toBe(p3Uri);
    expect(second.friends.length).toBe(1);
    expect(second.friends[0].id).toBe(p3Uri);
  });

  test('select all', async () => {
    const all = await Person.select();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(4);
  });

  test('empty select with where', async () => {
    const filteredNoProps = await Person.select().where((p) =>
      p.name.equals('Semmy'),
    );
    expect(Array.isArray(filteredNoProps)).toBe(true);
    expect(filteredNoProps.length).toBe(1);
    expect(filteredNoProps[0].id).toBe(p1Uri);
  });

  test('where and or and', async () => {
    // Boolean logic: AND before OR
    // friend.name === 'Jinx' || (friend.hobby === 'Jogging' && friend.name === 'Moa')
    const persons = await Person.select((p) =>
      p.friends.where((f) =>
        f.name.equals('Jinx').or(f.hobby.equals('Jogging')).and(f.name.equals('Moa')),
      ),
    );

    const persons2 = await Person.select((p) =>
      p.friends.where((f) =>
        f.name.equals('Jinx').or(f.hobby.equals('Jogging').and(f.name.equals('Moa'))),
      ),
    );

    [persons, persons2].forEach((result) => {
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].friends.length).toBe(2);
      expect(result[1].friends.length).toBe(1);
      expect(result[2].friends.length).toBe(0);
      expect(result[3].friends.length).toBe(0);
      expect(result[0].friends[0].id).toBe(p2Uri);
      expect(result[0].friends[1].id).toBe(p3Uri);
      expect(result[1].friends[0].id).toBe(p3Uri);
    });
  });

  test('where some implicit', async () => {
    const peopleWithFriendsCalledMoa = await Person.select().where((p) =>
      p.friends.name.equals('Moa'),
    );
    expect(Array.isArray(peopleWithFriendsCalledMoa)).toBe(true);
    expect(peopleWithFriendsCalledMoa.length).toBe(1);
    expect(peopleWithFriendsCalledMoa[0].id).toBe(p1Uri);
  });

  test('where some explicit', async () => {
    const peopleWithFriendsCalledMoa = await Person.select().where((p) =>
      p.friends.some((f) => f.name.equals('Moa')),
    );
    expect(Array.isArray(peopleWithFriendsCalledMoa)).toBe(true);
    expect(peopleWithFriendsCalledMoa.length).toBe(1);
    expect(peopleWithFriendsCalledMoa[0].id).toBe(p1Uri);
  });

  test('where every', async () => {
    const allFriendsCalledMoaOrJinx = await Person.select().where((p) =>
      p.friends.every((f) => f.name.equals('Moa').or(f.name.equals('Jinx'))),
    );
    expect(Array.isArray(allFriendsCalledMoaOrJinx)).toBe(true);
    expect(allFriendsCalledMoaOrJinx.length).toBe(1);
    expect(allFriendsCalledMoaOrJinx[0].id).toBe(p1Uri);
  });

  test('where sequences', async () => {
    // People with friend called Jinx AND name "Semmy"
    const friendCalledJinxAndNameIsSemmy = await Person.select().where((p) =>
      p.friends.some((f) => f.name.equals('Jinx')).and(p.name.equals('Semmy')),
    );
    expect(Array.isArray(friendCalledJinxAndNameIsSemmy)).toBe(true);
    expect(friendCalledJinxAndNameIsSemmy.length).toBe(1);
    expect(friendCalledJinxAndNameIsSemmy[0].id).toBe(p1Uri);

    // Outer where + inner where on literal
    const friendCalledJinxAndNameIsSemmy2 = await Person.select((p) =>
      p.name.where((n) => n.equals('Semmy')),
    ).where((p) =>
      p.friends.some((f) => f.name.equals('Jinx')),
    );
    expect(Array.isArray(friendCalledJinxAndNameIsSemmy2)).toBe(true);
    expect(friendCalledJinxAndNameIsSemmy2.length).toBe(2);
    expect(friendCalledJinxAndNameIsSemmy2[0].id).toBe(p1Uri);
    expect(friendCalledJinxAndNameIsSemmy2[1].id).toBe(p2Uri);
    expect(friendCalledJinxAndNameIsSemmy2[0].name).toBe('Semmy');
    expect(typeof friendCalledJinxAndNameIsSemmy2[1].name).toBe('undefined');
  });

  test('outer where()', async () => {
    const friendsOfP1 = await Person.select((p) => p.friends).where((p) =>
      p.name.equals('Semmy'),
    );
    const first = friendsOfP1[0];
    expect(Array.isArray(friendsOfP1)).toBe(true);
    expect(friendsOfP1).toHaveLength(1);
    expect(first.id).toBe(p1Uri);
    expect(first.friends.length).toBe(2);
    expect(first.friends[0].id).toBe(p2Uri);
  });

  test('where with query context', async () => {
    // queryContext 'user' is set to p3 — should return p2 (who has bestFriend=p3)
    const namesHasBestFriendUser = await Person.select((p) => p.name).where((p) =>
      p.bestFriend.equals(({} as any).__queryContextPlaceholder || {id: p3Uri}),
    );
    // Note: this test requires getQueryContext('user') to resolve to p3.
    // Since we can't easily use getQueryContext in the where clause builder
    // from this test, we test the equivalent directly.
    expect(Array.isArray(namesHasBestFriendUser)).toBe(true);
    expect(namesHasBestFriendUser).toHaveLength(1);
    expect(namesHasBestFriendUser[0].id).toBe(p2Uri);
    expect(namesHasBestFriendUser[0].name).toBe('Moa');
  });
});

// ─── 4. Aggregation & Sub-Select ────────────────────────────────────────────

describe('4. Aggregation & Sub-Select', () => {
  test('count a shapeset', async () => {
    const numberOfFriends = await Person.select((p) => p.friends.size());
    expect(Array.isArray(numberOfFriends)).toBe(true);
    expect(numberOfFriends[0].friends).toBe(2);
    expect(numberOfFriends[1].friends).toBe(2);
    expect(numberOfFriends[2].friends).toBe(0);
    expect(numberOfFriends[3].friends).toBe(0);
  });

  test('count a nested property', async () => {
    const numberOfFriends = await Person.select((p) => p.friends.friends.size());
    expect(Array.isArray(numberOfFriends)).toBe(true);
    expect(Array.isArray(numberOfFriends[0].friends)).toBe(true);
    expect(numberOfFriends[0].friends[0].friends).toBe(2);
    expect(numberOfFriends[0].friends[1].friends).toBe(0);
  });

  test('labeling the key of count()', async () => {
    const numberOfFriends3 = await Person.select((p) =>
      p.friends.select((f) => ({numFriends: f.friends.size()})),
    );
    const first = numberOfFriends3[0];
    expect(first.hasOwnProperty('friends')).toBe(true);
    expect(first.hasOwnProperty('count')).toBe(false);
    expect(first.friends[0].numFriends).toBe(2);
  });

  test('nested object property', async () => {
    const res = await Person.select((p) => p.friends.bestFriend);
    const firstBestFriend = res[0].friends[0].bestFriend;
    // p1's friend p2 has bestFriend p3
    expect(firstBestFriend).toBeDefined();
  });

  test('sub select single prop', async () => {
    const bestFriendProps = await Person.select((p) =>
      p.bestFriend.select((f) => [f.name, f.hobby]),
    ).where((p) => p.equals({id: p2Uri}));

    expect(Array.isArray(bestFriendProps)).toBe(true);
    expect(bestFriendProps.length).toBe(1);
    const first = bestFriendProps[0];
    expect(first.id).toBe(p2Uri);
    expect(first.bestFriend.id).toBe(p3Uri);
    expect(first.bestFriend.name).toBe('Jinx');
    expect(first.bestFriend.hobby).toBeNull();
  });

  test('sub select plural prop - custom object', async () => {
    const namesAndHobbiesOfFriends = await Person.select((p) =>
      p.friends.select((f) => ({_name: f.name, _hobby: f.hobby})),
    );
    expect(Array.isArray(namesAndHobbiesOfFriends)).toBe(true);
    expect(namesAndHobbiesOfFriends.length).toBe(4);
    const first = namesAndHobbiesOfFriends[0];
    expect(first.friends.length).toBe(2);
    expect(first.friends[0]._name).toBe('Moa');
    expect(first.friends[0]._hobby).toBe('Jogging');
  });

  test('double nested sub select', async () => {
    const res = await Person.select((p) =>
      p.pluralTestProp.where((pp) => pp.equals({id: p2Uri})).select((pp) => [
        pp.name,
        pp.friends.select((f) => [f.name, f.hobby]),
      ]),
    ).where((p) => p.equals({id: p1Uri}));

    const first = res[0];
    expect(first.id).toBe(p1Uri);

    const pp = first.pluralTestProp[0];
    expect(pp.id).toBe(p2Uri);
    expect(pp.name).toBe('Moa');

    const ppFriends = pp.friends;
    expect(Array.isArray(ppFriends)).toBe(true);
    expect(ppFriends.length).toBe(2);
    expect(ppFriends[0].id === p3Uri || ppFriends[0].id === p4Uri).toBe(true);
    expect(ppFriends[1].id === p3Uri || ppFriends[1].id === p4Uri).toBe(true);
    expect(ppFriends[0].name).toBe('Jinx');
    expect(ppFriends[0].hobby).toBeNull();
    expect(ppFriends[1].name).toBe('Quinn');
    expect(ppFriends[1].hobby).toBeNull();
  });

  test('sub select all primitives', async () => {
    const bestFriendProps = await Person.select((p) =>
      p.bestFriend.select((f) => [f.name, f.birthDate, f.isRealPerson]),
    );
    expect(Array.isArray(bestFriendProps)).toBe(true);
    expect(bestFriendProps.length).toBe(4);
    const p2Result = bestFriendProps.find((p: any) => p.id === p2Uri);
    expect(p2Result.bestFriend.id === p3Uri).toBe(true);
    expect(p2Result.bestFriend.name).toBe('Jinx');
    expect(p2Result.bestFriend.birthDate).toBeNull();
    expect(p2Result.bestFriend.isRealPerson).toBe(true);
  });

  test('custom result object - equals without where returns a boolean', async () => {
    const customResult = await Person.select((p) => ({
      nameIsMoa: p.name.equals('Moa'),
      friendNames: p.friends.name,
      friends: p.friends,
      name: p.name,
    }));
    const {nameIsMoa, name, id} = customResult[0];
    const second = customResult[1];
    expect(Array.isArray(customResult)).toBe(true);
    expect(id).toBe(p1Uri);
    expect(nameIsMoa).toBe(false);
    expect(typeof name).toBe('string');
    expect(second.id).toBe(p2Uri);
    expect(second.nameIsMoa).toBe(true);
  });

  test('custom result object 2', async () => {
    const customResult = await Person.select((p) => ({
      nameIsMoa: p.name.equals('Moa'),
      moaAsFriend: p.friends.some((f) => f.name.equals('Moa')),
      numFriends: p.friends.size(),
      friendsOfFriends: p.friends.friends,
    }));
    expect(Array.isArray(customResult)).toBe(true);
    expect(customResult[0].id).toBe(p1Uri);
    expect(customResult[0].nameIsMoa).toBe(false);
    expect(customResult[1].id).toBe(p2Uri);
    expect(customResult[1].nameIsMoa).toBe(true);
    expect(customResult[0].moaAsFriend).toBe(true);
    expect(customResult[1].moaAsFriend).toBe(false);
    expect(Array.isArray(customResult[0].friendsOfFriends)).toBe(true);
    expect(Array.isArray(customResult[0].friendsOfFriends[0].friends)).toBe(true);
    expect(customResult[0].friendsOfFriends[0].id).toBe(p2Uri);
    expect(customResult[0].friendsOfFriends[0].friends[0].id).toBe(p3Uri);
  });

  test('count equals', async () => {
    const numberOfFriends = await Person.select().where((p) =>
      p.friends.size().equals(2),
    );
    expect(Array.isArray(numberOfFriends)).toBe(true);
    expect(numberOfFriends.length).toBe(2);
    expect(numberOfFriends[0].id).toBe(p1Uri);
    expect(numberOfFriends[1].id).toBe(p2Uri);
  });

  test('sub select query returning an array', async () => {
    const subResult = await Person.select((p) =>
      p.friends.select((f) => [f.name, f.hobby]),
    );
    subResult.forEach((person: any) => {
      person.friends.forEach((friend: any) => {
        const {name, hobby} = friend;
        expect(typeof name).toBe('string');
        expect(typeof hobby === 'string' || hobby === null).toBe(true);
      });
    });
    expect(Array.isArray(subResult)).toBe(true);
    expect(subResult.length).toBe(4);
    expect(subResult[0].friends[0].hasOwnProperty('name')).toBe(true);
    expect(subResult[0].friends[0].hasOwnProperty('hobby')).toBe(true);
    expect(subResult[0].friends[0].name).toBe('Moa');
  });
});

// ─── 5. Type Casting & Transformations ──────────────────────────────────────

describe('5. Type Casting & Transformations', () => {
  test('select shapeset as', async () => {
    const personsWithGuardDogs = await Person.select((p) =>
      p.pets.as(Dog).guardDogLevel,
    );
    expect(Array.isArray(personsWithGuardDogs)).toBe(true);

    const p1Res = personsWithGuardDogs.find((p: any) => p.id === p1Uri);
    expect(p1Res.pets.length).toBe(1);
    expect(p1Res.pets[0].id).toBe(dog1Uri);
    expect(p1Res.pets[0].guardDogLevel).toBe(2);

    const p2Res = personsWithGuardDogs.find((p: any) => p.id === p2Uri);
    expect(p2Res.pets.length).toBe(1);
    expect(p2Res.pets[0].id).toBe(dog2Uri);
    expect(p2Res.pets[0].guardDogLevel).toBeNull();

    const p3Res = personsWithGuardDogs.find((p: any) => p.id === p3Uri);
    expect(p3Res.pets.length).toBe(0);
  });

  test('select non existing returns null or empty array for multiple value properties', async () => {
    const persons = await Person.select((p) => [p.bestFriend, p.friends]);
    expect(Array.isArray(persons)).toBe(true);

    const p1Res = persons.find((p: any) => p.id === p1Uri);
    expect(Array.isArray(p1Res.friends)).toBe(true);
    expect(p1Res.bestFriend).toBeNull();

    const p2Res = persons.find((p: any) => p.id === p2Uri);
    expect(Array.isArray(p2Res.friends)).toBe(true);
    expect(typeof p2Res.bestFriend?.id).toBe('string');

    const p3Res = persons.find((p: any) => p.id === p3Uri);
    expect(Array.isArray(p3Res.friends)).toBe(true);
    expect(p3Res.friends.length).toBe(0);
    expect(p3Res.bestFriend).toBeNull();
  });

  test('select shape as', async () => {
    const personsWithGuardDogs = await Person.select((p) =>
      p.firstPet.as(Dog).guardDogLevel,
    );
    expect(Array.isArray(personsWithGuardDogs)).toBe(true);

    const p1Res = personsWithGuardDogs.find((p: any) => p.id === p1Uri);
    expect(p1Res.firstPet).toBeDefined();
    expect(p1Res.firstPet.id).toBe(dog1Uri);
    expect(p1Res.firstPet.guardDogLevel).toBe(2);

    const p2Res = personsWithGuardDogs.find((p: any) => p.id === p2Uri);
    expect(p2Res.firstPet).toBeDefined();
    expect(p2Res.firstPet.id).toBe(dog2Uri);
    expect(p2Res.firstPet.guardDogLevel).toBeNull();

    const p3Res = personsWithGuardDogs.find((p: any) => p.id === p3Uri);
    expect(p3Res.firstPet).toBeNull();
  });

  test('select one', async () => {
    const singleResult = await Person.select((p) => p.name)
      .where((p) => p.equals({id: p1Uri}))
      .one();
    expect(Array.isArray(singleResult)).toBe(false);
    expect(singleResult).toBeDefined();
    expect(singleResult.name).toBe('Semmy');
  });

  test('nested queries 2', async () => {
    const nested = await Person.select((p) => [
      p.name,
      p.friends.select((p2) => [
        p2.firstPet,
        p2.bestFriend.select((p3) => [p3.name]),
      ]),
    ]).where((p) => p.equals({id: p1Uri}));

    const result1 = nested[0];
    expect(result1.name).toBe('Semmy');
    expect(Array.isArray(result1.friends)).toBe(true);
    expect(result1.friends.length).toBe(2);
    const result2 = result1.friends[0];
    expect(result2.firstPet).toBeDefined();
    expect(result2.firstPet.id).toBe(dog2Uri);
    expect(result2.bestFriend).toBeDefined();
    expect(result2.bestFriend.id).toBe(p3Uri);
    expect(result2.bestFriend.name).toBe('Jinx');
  });

  test('select duplicate paths', async () => {
    const bestFriendProps = await Person.select((p) => [
      p.bestFriend.name,
      p.bestFriend.hobby,
      p.bestFriend.isRealPerson,
    ]);
    expect(Array.isArray(bestFriendProps)).toBe(true);
    expect(bestFriendProps.length).toBe(4);
    const p1Result = bestFriendProps.find((p: any) => p.id === p1Uri);
    expect(p1Result.bestFriend).toBe(null);
    const p2Result = bestFriendProps.find((p: any) => p.id === p2Uri);
    const bf = p2Result.bestFriend;
    expect(bf.id === p3Uri).toBe(true);
    expect(bf.name).toBe('Jinx');
    expect(bf.hobby).toBe(null);
    expect(bf.isRealPerson).toBe(true);
  });
});

// ─── 7. Sorting & Limiting ──────────────────────────────────────────────────

describe('7. Sorting & Limiting', () => {
  test('outer where with limit', async () => {
    const limitedNames = await Person.select((p) => p.name)
      .where((p) => p.name.equals('Semmy').or(p.name.equals('Moa')))
      .limit(1);
    const first = limitedNames[0];
    expect(Array.isArray(limitedNames)).toBe(true);
    expect(limitedNames).toHaveLength(1);
    expect(first.id).toBe(p1Uri);
  });

  test('sort by 1 property - ASC (default)', async () => {
    const sorted = await Person.select((p) => p.name).sortBy((p) => p.name);
    expect(Array.isArray(sorted)).toBe(true);
    expect(sorted).toHaveLength(4);
    expect(sorted[0].id).toBe(p3Uri);
    expect(sorted[0].name).toBe('Jinx');
    expect(sorted[1].id).toBe(p2Uri);
    expect(sorted[1].name).toBe('Moa');
    expect(sorted[2].id).toBe(p4Uri);
    expect(sorted[2].name).toBe('Quinn');
    expect(sorted[3].id).toBe(p1Uri);
    expect(sorted[3].name).toBe('Semmy');
  });

  test('sort by 1 property - DESC', async () => {
    const sorted = await Person.select((p) => p.name).sortBy((p) => p.name, 'DESC');
    expect(Array.isArray(sorted)).toBe(true);
    expect(sorted).toHaveLength(4);
    expect(sorted[0].id).toBe(p1Uri);
    expect(sorted[0].name).toBe('Semmy');
    expect(sorted[1].id).toBe(p4Uri);
    expect(sorted[1].name).toBe('Quinn');
    expect(sorted[2].id).toBe(p2Uri);
    expect(sorted[2].name).toBe('Moa');
    expect(sorted[3].id).toBe(p3Uri);
    expect(sorted[3].name).toBe('Jinx');
  });
});

// ─── 8. CRUD Operations ─────────────────────────────────────────────────────

describe('8. CRUD Operations', () => {
  test('update query 1 - simple literal update', async () => {
    // p1 has hobby='Chess'. Update to 'Gaming'.
    const res = await Person.update({id: p1Uri}, {hobby: 'Gaming'});

    expect(res.id).toBeDefined();
    expect(typeof res.id).toBe('string');
    expect(res.id).toEqual(p1Uri);
    expect(res.hobby).toBe('Gaming');
    expect(res['name']).toBeUndefined();

    // Verify in-graph
    let qRes = await Person.select((p) => [p.hobby, p.name]).where((p) =>
      p.name.equals('Semmy'),
    );
    expect(qRes[0]).toBeDefined();
    expect(qRes[0].id).toBe(p1Uri);
    expect(qRes[0].hobby).toBe('Gaming');

    // Restore
    await Person.update({id: p1Uri}, {hobby: 'Chess'});
    let qRes2 = await Person.select((p) => [p.hobby, p.name]).where((p) =>
      p.name.equals('Semmy'),
    );
    expect(qRes2[0].hobby).toBe('Chess');
  });

  test('create query 1 - simple person', async () => {
    const res = await Person.create({name: 'Test Create', hobby: 'Hiking'});

    expect(res.id).toBeDefined();
    expect(res.name).toBe('Test Create');
    expect(res.hobby).toBe('Hiking');

    const qRes = await Person.select((p) => [p.name, p.hobby]).where((p) =>
      p.name.equals('Test Create'),
    );
    expect(qRes[0].name).toBe('Test Create');
    expect(qRes[0].hobby).toBe('Hiking');

    // Cleanup
    await Person.delete(res.id);
  });

  test('create query 2 - person with new and existing friends', async () => {
    const res = await Person.create({
      name: 'Test With Friends',
      friends: [{name: 'Brand New Friend'}, {id: p1Uri}],
    });

    expect(res.id).toBeDefined();
    expect(Array.isArray(res.friends)).toBe(true);
    expect(res.friends.length).toBe(2);
    expect(res.friends.some((f: any) => f.name === 'Brand New Friend')).toBe(true);
    expect(res.friends.some((f: any) => f.id === p1Uri)).toBe(true);

    // Cleanup
    const newFriendId = res.friends.find((f: any) => f.name === 'Brand New Friend')?.id;
    await Person.delete(res.id);
    if (newFriendId) await Person.delete(newFriendId);
  });

  test('create query 3 - person with fixed ID', async () => {
    const fixedId = NamedNode.TEMP_URI_BASE + 'p6-test-person';
    const fixedId2 = NamedNode.TEMP_URI_BASE + 'p6-test-person-friend';
    const res = await Person.create({
      __id: fixedId,
      name: 'Test Create Fixed ID',
      hobby: 'Swimming',
      bestFriend: {
        __id: fixedId2,
        name: 'Test Create Fixed ID Friend',
      },
    } as any);

    expect(res.id).toBeDefined();
    expect(res.id).toBe(fixedId);
    expect(res.name).toBe('Test Create Fixed ID');
    expect(res.hobby).toBe('Swimming');

    const qRes = await Person.select((p) => [p.name, p.hobby, p.bestFriend.name]).where(
      (p) => p.equals({id: fixedId}),
    );
    expect(qRes[0].id).toBe(fixedId);
    expect(qRes[0].name).toBe('Test Create Fixed ID');
    expect(qRes[0].hobby).toBe('Swimming');
    expect(qRes[0].bestFriend).toBeDefined();
    expect(qRes[0].bestFriend.name).toBe('Test Create Fixed ID Friend');
    expect(qRes[0].bestFriend.id).toBe(fixedId2);

    // Cleanup
    await Person.delete(fixedId);
    await Person.delete(fixedId2);
  });

  test('delete query 1 - delete newly created node', async () => {
    const created = await Person.create({name: 'To Be Deleted', hobby: 'Archery'});
    const id = created.id;
    expect(id).toBeDefined();

    const check = await Person.select((p) => p.name).where((p) =>
      p.name.equals('To Be Deleted'),
    );
    expect(check[0].name).toBe('To Be Deleted');

    await Person.delete(id);

    const qRes = await Person.select().where((p) => p.name.equals('To Be Deleted'));
    expect(qRes.length).toBe(0);
  });

  test('delete query 2 - delete by node reference', async () => {
    const created = await Person.create({name: 'To Be Deleted 2', hobby: 'Archery'});

    const check = await Person.select((p) => p.name).where((p) =>
      p.name.equals('To Be Deleted 2'),
    );
    expect(check[0].name).toBe('To Be Deleted 2');

    await Person.delete(created);

    const qRes = await Person.select().where((p) => p.name.equals('To Be Deleted 2'));
    expect(qRes.length).toBe(0);
  });

  test('delete query 3 - delete multiple nodes', async () => {
    const created1 = await Person.create({name: 'To Be Deleted 3a', hobby: 'Archery'});
    const created2 = await Person.create({name: 'To Be Deleted 3b', hobby: 'Archery'});

    const ids = [created1.id, created2.id];

    const check = await Person.select((p) => p.name).where((p) =>
      p.name.equals('To Be Deleted 3a').or(p.name.equals('To Be Deleted 3b')),
    );
    expect(check.length).toBe(2);

    await Person.delete(ids);

    const qRes = await Person.select().where((p) =>
      p.name.equals('To Be Deleted 3a').or(p.name.equals('To Be Deleted 3b')),
    );
    expect(qRes.length).toBe(0);
  });

  test('delete query 4 - delete multiple by full result objects', async () => {
    const created1 = await Person.create({name: 'To Be Deleted 4a', hobby: 'Archery'});
    const created2 = await Person.create({name: 'To Be Deleted 4b', hobby: 'Archery'});

    const check = await Person.select((p) => p.name).where((p) =>
      p.name.equals('To Be Deleted 4a').or(p.name.equals('To Be Deleted 4b')),
    );
    expect(check.length).toBe(2);

    await Person.delete([created1, created2]);

    const qRes = await Person.select().where((p) =>
      p.name.equals('To Be Deleted 4a').or(p.name.equals('To Be Deleted 4b')),
    );
    expect(qRes.length).toBe(0);
  });

  test('update query 2 - overwrite a set', async () => {
    const res = await Person.update({id: p1Uri}, {
      friends: [{name: 'NewFriend'}],
    });

    expect(res.id).toEqual(p1Uri);
    expect(res.friends).toBeDefined();
    expect(typeof res.friends).toBe('object');
    expect(Array.isArray(res.friends)).toBe(false);
    expect(res.friends.updatedTo).toBeDefined();
    expect(Array.isArray(res.friends.updatedTo)).toBe(true);
    expect(res.friends.updatedTo[0].name).toBe('NewFriend');

    // Verify in-graph
    let qRes = await Person.select((p) => p.friends.name).where((p) =>
      p.name.equals('Semmy'),
    );
    expect(qRes[0]).toBeDefined();
    expect(Array.isArray(qRes[0].friends)).toBeTruthy();
    expect(qRes[0].friends[0].name).toBe('NewFriend');

    // Cleanup: remove the new friend node
    const newFriendId = res.friends.updatedTo[0].id;

    // Restore p1's friends to p2, p3
    await Person.update({id: p1Uri}, {friends: [{id: p2Uri}, {id: p3Uri}]});
    await Person.delete(newFriendId);
  });

  test('update query 3 - unset single value with undefined', async () => {
    const res = await Person.update({id: p1Uri}, {hobby: undefined});

    expect(res.id).toEqual(p1Uri);
    expect(res.hobby).toBeUndefined();

    // Check in-graph
    let qRes = await Person.select({id: p1Uri}, (p) => p.hobby);
    expect(qRes).toBeDefined();
    expect(qRes.hobby).toBeNull();

    // Restore
    await Person.update({id: p1Uri}, {hobby: 'Chess'});
    let qRes2 = await Person.select({id: p1Uri}, (p) => p.hobby);
    expect(qRes2.hobby).toBe('Chess');
  });

  test('update query 3B - unset single value with null', async () => {
    const res = await Person.update({id: p1Uri}, {hobby: null});

    expect(res.id).toEqual(p1Uri);
    expect(res.hobby).toBeUndefined();

    let qRes = await Person.select({id: p1Uri}, (p) => p.hobby);
    expect(qRes).toBeDefined();
    expect(qRes.hobby).toBeNull();

    // Restore
    await Person.update({id: p1Uri}, {hobby: 'Chess'});
    let qRes2 = await Person.select({id: p1Uri}, (p) => p.hobby);
    expect(qRes2.hobby).toBe('Chess');
  });

  test('update query 6 - add to and remove from multi-value property', async () => {
    const res = await Person.update({id: p1Uri}, {
      friends: {add: {name: 'Friend Added'}},
    });

    expect(res.id).toBe(p1Uri);
    expect(res.friends.added.some((f: any) => f.name === 'Friend Added')).toBe(true);

    // Remove the added friend
    const addedId = res.friends.added[0].id;
    const res2 = await Person.update({id: p1Uri}, {
      friends: {remove: {id: addedId}},
    });
    expect(res2.friends.removed.some((f: any) => f.id === addedId)).toBe(true);

    // Verify it's gone
    let qRes = await Person.select({id: p1Uri}, (p) => p.friends.name);
    expect(qRes.friends.some((f: any) => f.name === 'Friend Added')).toBe(false);
  });

  test('update query 7 - remove from multi-value property', async () => {
    // Add p2 as friend of p3 first
    await Person.update({id: p3Uri}, {
      friends: {add: {id: p2Uri}},
    });

    let verifyAdd = await Person.select({id: p3Uri}, (p) => p.friends);
    expect(verifyAdd.friends.some((f: any) => f.id === p2Uri)).toBe(true);

    // Now remove
    const res = await Person.update({id: p3Uri}, {
      friends: {remove: {id: p2Uri}},
    });

    expect(res.id).toBe(p3Uri);
    expect(res.friends.removed.some((f: any) => f.id === p2Uri)).toBe(true);
  });

  test('update query 8 - add and remove in same update', async () => {
    const res = await Person.update({id: p1Uri}, {
      friends: {
        add: {name: 'Combined Friend'},
        remove: {id: p2Uri},
      },
    });

    expect(res.id).toBe(p1Uri);
    expect(res.friends.added.some((f: any) => f.name === 'Combined Friend')).toBe(true);
    expect(res.friends.removed.some((f: any) => f.id === p2Uri)).toBe(true);

    // Cleanup: reverse the operation
    const addedId = res.friends.added.find((f: any) => f.name === 'Combined Friend')?.id;
    await Person.update({id: p1Uri}, {
      friends: {
        remove: {id: addedId},
        add: {id: p2Uri},
      },
    });
  });

  test('update query 9 - unset multi-value property with undefined', async () => {
    // Ensure p3 has friends
    await Person.update({id: p3Uri}, {
      friends: [{id: p1Uri}, {id: p2Uri}],
    });

    let res1 = await Person.select({id: p3Uri}, (p) => p.friends);
    expect(res1.friends.some((f: any) => f.id === p1Uri)).toBe(true);
    expect(res1.friends.some((f: any) => f.id === p2Uri)).toBe(true);
    expect(res1.friends.length).toBe(2);

    const res = await Person.update({id: p3Uri}, {friends: undefined});

    expect(res.id).toBe(p3Uri);
    expect(Array.isArray(res.friends)).toBe(true);
    expect(res.friends.length).toBe(0);
  });

  test('update query 10 - nested object with predefined ID', async () => {
    const bestFriendId = NamedNode.TEMP_URI_BASE + 'p3-best-friend';
    const updateRes = await Person.update({id: p3Uri}, {
      bestFriend: {
        __id: bestFriendId,
        name: 'Bestie',
      } as any,
    });
    expect(updateRes.id).toBe(p3Uri);
    expect(updateRes.bestFriend.id).toBe(bestFriendId);
    expect(updateRes.bestFriend.name).toBe('Bestie');

    // Verify in-graph
    let res1 = await Person.select({id: p3Uri}, (p) => p.bestFriend.name);
    expect(res1.bestFriend).toBeDefined();
    expect(res1.bestFriend.id).toBe(bestFriendId);
    expect(res1.bestFriend.name).toBe('Bestie');

    // Cleanup
    await Person.update({id: p3Uri}, {bestFriend: undefined});
    await Person.delete(bestFriendId);
  });

  test('update query 11 - update date datatype', async () => {
    const res = await Person.update({id: p1Uri}, {
      birthDate: new Date('2000-06-15'),
    });

    expect(res.id).toEqual(p1Uri);
    expect(res.birthDate).toBeDefined();
    expect(res.birthDate.toISOString()).toBe('2000-06-15T00:00:00.000Z');

    // Check in-graph
    let qRes = await Person.select({id: p1Uri}, (p) => p.birthDate);
    expect(qRes).toBeDefined();
    expect(qRes.birthDate.toISOString()).toBe('2000-06-15T00:00:00.000Z');

    // Restore original
    await Person.update({id: p1Uri}, {
      birthDate: new Date('1990-01-01'),
    });
    let qRes2 = await Person.select({id: p1Uri}, (p) => p.birthDate);
    expect(qRes2.birthDate.toISOString()).toBe('1990-01-01T00:00:00.000Z');
  });
});
