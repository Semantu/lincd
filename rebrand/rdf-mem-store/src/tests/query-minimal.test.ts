import {beforeEach, describe, expect, test} from '@jest/globals';
import {LinkedStorage} from '@_linked/core/utils/LinkedStorage.js';
import '@_linked/core/queries/QueryParser.js';
import {
  Person,
  name,
  personClass,
} from '@_linked/core/test-helpers/query-fixtures.js';
import {InMemoryStore} from '../stores/InMemoryStore.js';
import {NamedNode, Literal} from '../models.js';
import {rdf} from '../ontologies/rdf.js';
import {resetLocalStore} from '../utils/LocalQueryResolver.js';

const seedPeople = () => {
  const p1 = NamedNode.getOrCreate('p1');
  const p2 = NamedNode.getOrCreate('p2');

  const nameNode = NamedNode.getOrCreate(name.id);
  const personType = NamedNode.getOrCreate(personClass.id);

  [p1, p2].forEach((person) => person.set(rdf.type, personType));
  p1.set(nameNode, new Literal('Semmy'));
  p2.set(nameNode, new Literal('Moa'));

  return {p1, p2};
};

describe('query results - minimal execution', () => {
  beforeEach(() => {
    resetLocalStore();
    LinkedStorage.setDefaultStore(new InMemoryStore());
    seedPeople();
  });

  test('can select a literal property of all instances', async () => {
    const names = await Person.select((p) => p.name);

    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBe(2);
    expect(names[0].name).toBeDefined();
  });
});
