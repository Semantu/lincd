import {describe, expect, test} from '@jest/globals';
import {linkedShape, literalProperty, Shape} from '../package.js';
import {LinkedStorage} from '../utils/LinkedStorage.js';

const name = 'name';

@linkedShape
class Person extends Shape {
  @literalProperty({path: name, maxCount: 1})
  declare name: string;
}

class DummyStore {
  lastQuery: any;
  lastType: string;

  async selectQuery<ResultType>(query): Promise<ResultType> {
    this.lastQuery = query;
    this.lastType = 'select';
    return [] as ResultType;
  }

  async createQuery<ResultType>(query): Promise<ResultType> {
    this.lastQuery = query;
    this.lastType = 'create';
    return {} as ResultType;
  }

  async updateQuery<ResultType>(query): Promise<ResultType> {
    this.lastQuery = query;
    this.lastType = 'update';
    return {} as ResultType;
  }

  async deleteQuery<ResultType>(query): Promise<ResultType> {
    this.lastQuery = query;
    this.lastType = 'delete';
    return {} as ResultType;
  }
}

describe('LinkedStorage routing', () => {
  test('forwards select to default store', async () => {
    LinkedStorage.reset();
    const store = new DummyStore();
    LinkedStorage.setDefaultStore(store);

    await Person.select((p) => p.name);

    expect(store.lastType).toBe('select');
    expect(store.lastQuery.type).toBe('select');
  });

  test('routes shape-specific queries to assigned store', async () => {
    LinkedStorage.reset();
    const defaultStore = new DummyStore();
    const specialStore = new DummyStore();

    LinkedStorage.setDefaultStore(defaultStore);
    LinkedStorage.setStoreForShapes(specialStore, Person);

    await Person.select((p) => p.name);

    expect(specialStore.lastType).toBe('select');
    expect(defaultStore.lastType).not.toBe('select');
  });

  test('forwards CRUD queries to default store', async () => {
    LinkedStorage.reset();
    const store = new DummyStore();
    LinkedStorage.setDefaultStore(store);

    await Person.create({name: 'New'});
    expect(store.lastType).toBe('create');
    expect(store.lastQuery.type).toBe('create');

    await Person.update('p1', {name: 'Updated'});
    expect(store.lastType).toBe('update');
    expect(store.lastQuery.type).toBe('update');

    await Person.delete('p1');
    expect(store.lastType).toBe('delete');
    expect(store.lastQuery.type).toBe('delete');
  });
});
