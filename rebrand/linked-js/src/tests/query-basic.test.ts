import {describe, expect, test} from '@jest/globals';
import {linkedShape, literalProperty, Shape} from '../package.js';
import {SelectQueryFactory} from '../queries/SelectQuery.js';

const name = 'name';

@linkedShape
class Person extends Shape {
  @literalProperty({path: name, maxCount: 1})
  declare name: string;
}

class QueryCaptureStore {
  lastQuery?: ReturnType<SelectQueryFactory<Shape>['getQueryObject']>;

  async selectQuery<ResultType>(query: SelectQueryFactory<Shape>) {
    this.lastQuery = query.getQueryObject();
    return [] as ResultType;
  }
}

describe('query builder basics', () => {
  test('selecting a literal property builds a query object', async () => {
    const store = new QueryCaptureStore();
    Person.queryParser = store;

    await Person.select((p) => p.name);

    const query = store.lastQuery;
    const propertyShape = Person.shape.getPropertyShapes()[0];

    expect(query?.type).toBe('select');
    expect(query?.shape).toBe(Person);
    expect(query?.subject).toBeUndefined();
    expect(query?.singleResult).toBe(false);
    expect(query?.select).toHaveLength(1);
    expect(query?.select[0]).toHaveLength(1);
    expect(query?.select[0][0].property).toBe(propertyShape);
    expect(query?.select[0][0].property.label).toBe('name');
    expect(query?.select[0][0].property.path).toBe(name);
  });
});
