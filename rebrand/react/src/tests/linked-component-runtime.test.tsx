import {describe, expect, beforeEach, test} from '@jest/globals';
import React from 'react';
import {render, waitFor, screen} from '@testing-library/react';
import {linkedComponent, linkedSetComponent, linkedShape} from '../package.js';
import {Shape} from '@_linked/core/shapes/Shape';
import {literalProperty} from '@_linked/core/shapes/SHACL';
import {LinkedStorage} from '@_linked/core/utils/LinkedStorage';
import {SelectQueryFactory} from '@_linked/core/queries/SelectQuery';

const personClass = {id: 'urn:test:Person'};
const nameProp = {id: 'urn:test:name'};

@linkedShape
class Person extends Shape {
  static targetClass = personClass;

  @literalProperty({path: nameProp, maxCount: 1})
  get name(): string {
    return '';
  }
}

class QueryParserStub {
  async selectQuery<ResultType>(query: SelectQueryFactory<Shape>) {
    const queryObject = query.getQueryObject();
    if (queryObject.singleResult) {
      return {id: 'urn:test:p1', name: 'Semmy'} as ResultType;
    }
    return [
      {id: 'urn:test:p1', name: 'Semmy'},
      {id: 'urn:test:p2', name: 'Moa'},
    ] as ResultType;
  }
}

beforeEach(() => {
  Person.queryParser = new QueryParserStub() as any;
  LinkedStorage.setDefaultStore({
    init() {},
    async selectQuery() {
      return [];
    },
  } as any);
});

describe('linked component runtime', () => {
  test('linkedComponent loads query result for a single source', async () => {
    const Card = linkedComponent(
      Person.query((p) => p.name),
      ({name}) => <div>{name}</div>,
    );

    render(<Card of={{id: 'urn:test:p1'}} />);

    await waitFor(() => {
      expect(screen.getByText('Semmy')).toBeTruthy();
    });
  });

  test('linkedSetComponent loads set data and renders linkedData', async () => {
    const NameList = linkedSetComponent(
      Person.query((p) => p.name),
      ({linkedData}) => (
        <ul>
          {(linkedData || []).map((person) => (
            <li key={person.id}>{person.name}</li>
          ))}
        </ul>
      ),
    );

    render(<NameList />);

    await waitFor(() => {
      expect(screen.getByText('Semmy')).toBeTruthy();
      expect(screen.getByText('Moa')).toBeTruthy();
    });
  });
});
