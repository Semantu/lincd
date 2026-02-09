import {describe, expect, test} from '@jest/globals';
import {queryTestFixtures} from 'linked-js';
import {CreateQueryFactory} from 'linked-js/queries/CreateQuery.js';
import {DeleteQueryFactory} from 'linked-js/queries/DeleteQuery.js';
import {SelectQueryFactory} from 'linked-js/queries/SelectQuery.js';
import {UpdateQueryFactory} from 'linked-js/queries/UpdateQuery.js';
import {InMemoryStore} from '../stores/InMemoryStore.js';

const {Person} = queryTestFixtures;

describe('InMemoryStore CRUD', () => {
  test('create, select, update, delete roundtrip', async () => {
    const store = new InMemoryStore();

    const createQuery = new CreateQueryFactory(Person, {name: 'Alice'}).getQueryObject();
    const created = await store.createQuery<{id: string; name: string}>(createQuery);

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Alice');

    const selectQuery = new SelectQueryFactory(
      Person,
      (p) => p.name,
      {id: created.id} as any,
    ).getQueryObject();
    const selected = await store.selectQuery<{id: string; name: string}>(selectQuery);

    expect(selected.id).toBe(created.id);
    expect(selected.name).toBe('Alice');

    const updateQuery = new UpdateQueryFactory(Person, created.id, {name: 'Bob'}).getQueryObject();
    const updated = await store.updateQuery<{id: string; name: string}>(updateQuery);

    expect(updated.id).toBe(created.id);
    expect(updated.name).toBe('Bob');

    const afterUpdate = await store.selectQuery<{id: string; name: string}>(selectQuery);
    expect(afterUpdate.name).toBe('Bob');

    const deleteQuery = new DeleteQueryFactory(Person, created.id).getQueryObject();
    const deleted = await store.deleteQuery(deleteQuery);

    expect(deleted).toMatchObject({count: 1, deleted: [created.id]});
  });
});
