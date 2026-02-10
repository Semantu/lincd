import {describe, expect, test, beforeAll} from '@jest/globals';
import {NamedNode, Literal} from '../models';
import {toNamedNode} from '../utils/toNamedNode';
import {resolveLocal} from '../utils/LocalQueryResolver';
import {Shape} from '@_linked/core/shapes/Shape';
import {SelectQueryFactory, SelectQuery} from '@_linked/core/queries/SelectQuery';
import {IQueryParser} from '@_linked/core/interfaces/IQueryParser';
import {AddId, NodeReferenceValue, UpdatePartial} from '@_linked/core/queries/QueryFactory';
import {DeleteResponse} from '@_linked/core/queries/DeleteQuery';
import {NodeId} from '@_linked/core/queries/MutationQuery';
import {
  Person,
  Pet,
  Dog,
  queryFactories,
  tmpEntityBase,
  name as nameProp,
  hobby as hobbyProp,
  bestFriend as bestFriendProp,
  hasFriend as hasFriendProp,
  hasPet as hasPetProp,
  birthDate as birthDateProp,
  isRealPerson as isRealPersonProp,
  guardDogLevel as guardDogLevelProp,
  personClass,
  petClass,
  dogClass,
} from '@_linked/core/test-helpers/query-fixtures';
import {rdf} from '@_linked/core/ontologies/rdf';
import {xsd} from '@_linked/core/ontologies/xsd';

const entityBase = tmpEntityBase;

/**
 * A queryParser that captures the SelectQueryFactory so we can extract
 * the SelectQuery object and pass it to resolveLocal.
 */
class ResolverQueryParser implements IQueryParser {
  lastFactory?: SelectQueryFactory<any>;
  lastQuery?: SelectQuery;

  async selectQuery<ResultType>(query: SelectQueryFactory<Shape>) {
    this.lastFactory = query;
    this.lastQuery = query.getQueryObject();
    // Return the local resolution result
    return resolveLocal<ResultType>(this.lastQuery);
  }

  async createQuery<ShapeType extends Shape, U extends UpdatePartial<ShapeType>>(
    updateObjectOrFn: U,
    shapeClass: typeof Shape,
  ): Promise<any> {
    return {};
  }

  async updateQuery<ShapeType extends Shape, U extends UpdatePartial<ShapeType>>(
    id: string | NodeReferenceValue,
    updateObjectOrFn: U,
    shapeClass: typeof Shape,
  ): Promise<AddId<U>> {
    return {} as AddId<U>;
  }

  async deleteQuery(
    id: NodeId | NodeId[] | NodeReferenceValue[],
    shapeClass: typeof Shape,
  ): Promise<DeleteResponse> {
    return {deleted: [], count: 0};
  }
}

const parser = new ResolverQueryParser();

/**
 * Seed the global NamedNode graph with test data matching the fixtures.
 */
function seedTestData() {
  const rdfType = toNamedNode(rdf.type);
  const nameNode = toNamedNode(nameProp);
  const hobbyNode = toNamedNode(hobbyProp);
  const bestFriendNode = toNamedNode(bestFriendProp);
  const hasFriendNode = toNamedNode(hasFriendProp);
  const hasPetNode = toNamedNode(hasPetProp);
  const birthDateNode = toNamedNode(birthDateProp);
  const isRealPersonNode = toNamedNode(isRealPersonProp);
  const guardDogLevelNode = toNamedNode(guardDogLevelProp);

  const personType = toNamedNode(personClass);
  const petType = toNamedNode(petClass);
  const dogType = toNamedNode(dogClass);

  // Create person nodes
  const p1 = NamedNode.getOrCreate(`${entityBase}p1`);
  const p2 = NamedNode.getOrCreate(`${entityBase}p2`);
  const p3 = NamedNode.getOrCreate(`${entityBase}p3`);

  // Set types
  p1.set(rdfType, personType);
  p2.set(rdfType, personType);
  p3.set(rdfType, personType);

  // p1: Semmy, hobby=Chess, bestFriend=p3, friends=[p2,p3]
  p1.set(nameNode, new Literal('Semmy'));
  p1.set(hobbyNode, new Literal('Chess'));
  p1.set(bestFriendNode, p3);
  p1.set(hasFriendNode, p2);
  p1.set(hasFriendNode, p3);
  p1.set(isRealPersonNode, new Literal('true', toNamedNode(xsd.boolean)));

  // p2: Moa, hobby=Jogging, bestFriend=p1, friends=[p1,p3]
  p2.set(nameNode, new Literal('Moa'));
  p2.set(hobbyNode, new Literal('Jogging'));
  p2.set(bestFriendNode, p1);
  p2.set(hasFriendNode, p1);
  p2.set(hasFriendNode, p3);

  // p3: Jinx, no hobby, bestFriend=p2, friends=[p1]
  p3.set(nameNode, new Literal('Jinx'));
  p3.set(bestFriendNode, p2);
  p3.set(hasFriendNode, p1);

  // Create a pet and a dog
  const pet1 = NamedNode.getOrCreate(`${entityBase}pet1`);
  pet1.set(rdfType, petType);

  const dog1 = NamedNode.getOrCreate(`${entityBase}dog1`);
  dog1.set(rdfType, dogType);
  dog1.set(guardDogLevelNode, new Literal('5', toNamedNode(xsd.integer)));

  // p1 has pets
  p1.set(hasPetNode, pet1);
  p1.set(hasPetNode, dog1);

  // p1 birthDate
  p1.set(
    birthDateNode,
    new Literal('2020-01-01T00:00:00.000Z', toNamedNode(xsd.dateTime)),
  );
}

beforeAll(() => {
  seedTestData();
  // Wire up the parser so Shape.select() uses resolveLocal
  Person.queryParser = parser;
  Pet.queryParser = parser;
  Dog.queryParser = parser;
});

describe('resolveLocal - select queries', () => {
  test('selectName: resolves name for all persons', async () => {
    const result = await queryFactories.selectName();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    const names = (result as any[]).map((v: any) => v.name);
    expect(names).toContain('Semmy');
    expect(names).toContain('Moa');
    expect(names).toContain('Jinx');
  });

  test('selectById: resolves a specific person by ID', async () => {
    const result = await queryFactories.selectById();
    expect(result).toBeDefined();
    // selectById selects p1's name
    expect((result as any).name).toBe('Semmy');
  });

  test('selectNonExisting: returns null for non-existing node', async () => {
    const result = await queryFactories.selectNonExisting();
    expect(result).toBeNull();
  });

  test('selectAll: returns all persons', async () => {
    const result = await queryFactories.selectAll();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect((result as any[]).length).toBeGreaterThanOrEqual(3);
  });
});

describe('resolveLocal - where queries', () => {
  test('selectWhereNameSemmy: filters by name', async () => {
    const result = await queryFactories.selectWhereNameSemmy();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect((result as any[]).length).toBe(1);
    expect((result as any[])[0].id).toBe(`${entityBase}p1`);
  });
});

describe('resolveLocal - literal type handling', () => {
  test('selectIsRealPerson: boolean literal resolves to boolean', async () => {
    const result = await queryFactories.selectIsRealPerson();
    expect(result).toBeDefined();
    const values = result as any[];
    const p1Entry = values.find((v: any) => v.id === `${entityBase}p1`);
    expect(p1Entry).toBeDefined();
    expect(p1Entry.isRealPerson).toBe(true);
  });

  test('selectBirthDate: dateTime literal resolves to Date', async () => {
    const result = await queryFactories.selectBirthDate();
    expect(result).toBeDefined();
    const values = result as any[];
    const p1Entry = values.find((v: any) => v.id === `${entityBase}p1`);
    expect(p1Entry).toBeDefined();
    expect(p1Entry.birthDate).toBeInstanceOf(Date);
  });
});

describe('resolveLocal - nested resolution', () => {
  test('selectFriendsName: resolves friend names', async () => {
    const result = await queryFactories.selectFriendsName();
    expect(result).toBeDefined();
    const values = result as any[];
    // p1 has friends p2 (Moa), p3 (Jinx)
    const p1Entry = values.find((v: any) => v.id === `${entityBase}p1`);
    expect(p1Entry).toBeDefined();
    expect(p1Entry.friends).toBeDefined();
    const friendNames = p1Entry.friends.map((f: any) => f.name);
    expect(friendNames).toContain('Moa');
    expect(friendNames).toContain('Jinx');
  });

  test('selectBestFriendName: resolves best friend name', async () => {
    const result = await queryFactories.selectBestFriendName();
    expect(result).toBeDefined();
    const values = result as any[];
    const p1Entry = values.find((v: any) => v.id === `${entityBase}p1`);
    expect(p1Entry).toBeDefined();
    expect(p1Entry.bestFriend).toBeDefined();
    expect(p1Entry.bestFriend.name).toBe('Jinx');
  });
});
