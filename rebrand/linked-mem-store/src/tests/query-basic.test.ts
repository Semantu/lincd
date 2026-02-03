import {beforeEach, describe, expect, test} from '@jest/globals';
import {LinkedStorage} from 'linked-js/utils/LinkedStorage.js';
import {queryTestFixtures} from 'linked-js';
import {InMemoryStore} from '../stores/InMemoryStore.js';
import {NamedNode, Literal} from '../models.js';
import {rdf} from '../ontologies/rdf.js';
import {xsd} from '../ontologies/xsd.js';
import {resetLocalStore} from '../utils/LocalQueryResolver.js';

const {
  Person,
  name,
  bestFriend,
  friends,
  hobby,
  birthDate,
  isRealPerson,
  personClass,
} = queryTestFixtures;

const seedPeople = () => {
  const base = NamedNode.TEMP_URI_BASE;
  const p1 = NamedNode.getOrCreate(`${base}p1-semmy`);
  const p2 = NamedNode.getOrCreate(`${base}p2-moa`);
  const p3 = NamedNode.getOrCreate(`${base}p3-jinx`);
  const p4 = NamedNode.getOrCreate(`${base}p4-quinn`);

  const nameNode = NamedNode.getOrCreate(name);
  const bestFriendNode = NamedNode.getOrCreate(bestFriend);
  const friendsNode = NamedNode.getOrCreate(friends);
  const hobbyNode = NamedNode.getOrCreate(hobby);
  const birthDateNode = NamedNode.getOrCreate(birthDate);
  const isRealPersonNode = NamedNode.getOrCreate(isRealPerson);
  const personType = NamedNode.getOrCreate(personClass);

  [p1, p2, p3, p4].forEach((person) => person.set(rdf.type, personType));

  p1.set(nameNode, new Literal('Semmy'));
  p1.set(birthDateNode, new Literal(new Date('1990-01-01').toISOString(), xsd.dateTime));
  p1.set(isRealPersonNode, new Literal('true', xsd.boolean));

  p2.set(nameNode, new Literal('Moa'));
  p2.set(hobbyNode, new Literal('Jogging'));
  p2.set(isRealPersonNode, new Literal('false', xsd.boolean));

  p3.set(nameNode, new Literal('Jinx'));
  p3.set(isRealPersonNode, new Literal('true', xsd.boolean));

  p4.set(nameNode, new Literal('Quinn'));

  p1.set(friendsNode, p2);
  p1.set(friendsNode, p3);
  p2.set(bestFriendNode, p3);
  p2.set(friendsNode, p3);
  p2.set(friendsNode, p4);

  return {p1, p2, p3, p4};
};

describe('query results - basic property selection', () => {
  let people: ReturnType<typeof seedPeople>;

  beforeEach(() => {
    resetLocalStore();
    LinkedStorage.reset();
    LinkedStorage.setDefaultStore(new InMemoryStore());
    people = seedPeople();
  });

  test('can select a literal property of all instances', async () => {
    const names = await Person.select((p) => p.name);
    const p1 = names.find((person) => person.name === 'Semmy');
    const firstName: string = names[0].name;

    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBe(4);
    expect(firstName).toBeDefined();
    expect(p1?.name).toBe('Semmy');
    expect(p1?.id).toBe(people.p1.uri);
  });

  test('can select an object property of all instances', async () => {
    const personFriends = (await Person.select((p) => p.friends)) as Array<{
      id: string;
      friends: Array<{id: string}>;
    }>;
    const firstResult = personFriends.find(
      (person) => person.id === people.p1.uri,
    );
    const firstFriendId: string = personFriends[0].friends[0].id;

    expect(Array.isArray(personFriends)).toBe(true);
    expect(personFriends.length).toBe(4);
    expect(firstFriendId).toBeDefined();
    expect(firstResult?.friends.length).toBe(2);
    expect(firstResult?.friends[0].id).toBe(people.p2.uri);
    expect(firstResult?.friends[1].id).toBe(people.p3.uri);
  });

  test('can select a date', async () => {
    const birthDates = (await Person.select((p) => [
      p.birthDate,
      p.name,
    ])) as Array<{id: string; birthDate: Date; name: string}>;
    const firstResult = birthDates.find(
      (person) => person.id === people.p1.uri,
    );
    const firstDate: Date = birthDates[0].birthDate;

    expect(Array.isArray(birthDates)).toBe(true);
    expect(birthDates.length).toBe(4);
    expect(firstDate).toBeDefined();
    expect(firstResult?.birthDate instanceof Date).toBe(true);
    expect(firstResult?.birthDate.toISOString()).toBe(
      new Date('1990-01-01').toISOString(),
    );
  });

  test('can select a boolean', async () => {
    const isRealPersons = await Person.select((p) => p.isRealPerson);
    const p1 = isRealPersons.find(
      (person) => person.id === people.p1.uri,
    );
    const p2 = isRealPersons.find(
      (person) => person.id === people.p2.uri,
    );
    const p4 = isRealPersons.find(
      (person) => person.id === people.p4.uri,
    );
    const firstFlag: boolean | null = isRealPersons[0].isRealPerson;

    expect(Array.isArray(isRealPersons)).toBe(true);
    expect(isRealPersons.length).toBe(4);
    expect(firstFlag).toBeDefined();
    expect(p1?.isRealPerson).toBe(true);
    expect(p2?.isRealPerson).toBe(false);
    expect(p4?.isRealPerson).toBeNull();
  });

  test('can select properties of a specific subject', async () => {
    const id = people.p1.uri;
    const qRes = await Person.select({id}, (p) => p.name);
    const selectedName: string = qRes.name;
    expect(qRes.name).toBe('Semmy');
    expect(qRes.id).toBe(id);
    expect(selectedName).toBeDefined();
  });

  test('select with a non existing returns undefined', async () => {
    const qRes = await Person.select(
      {id: 'https://does.not/exist'},
      (p) => p.name,
    );
    expect(qRes).toBeUndefined();
    expect(NamedNode.getNamedNode('https://does.not/exist')).toBeUndefined();
  });

  test('selecting only undefined properties returns an empty object', async () => {
    const qRes = (await Person.select(
      {id: people.p3.uri},
      (p) => [p.hobby, p.bestFriend],
    )) as {id: string; hobby: string | null; bestFriend: {id: string} | null};
    const bestFriendId: string | null =
      qRes.bestFriend?.id ?? null;
    expect(qRes.hobby).toBeNull();
    expect(qRes.bestFriend).toBeNull();
    expect(qRes.id).toBe(people.p3.uri);
    expect(bestFriendId).toBeNull();
  });
});
