import {describe, expect, test, beforeAll, afterEach} from '@jest/globals';
import React from 'react';
import {render, waitFor, cleanup} from '@testing-library/react';
import {linkedComponent, linkedSetComponent} from '../package.js';
import {Shape} from '@_linked/core/shapes/Shape';
import {ShapeSet} from '@_linked/core/collections/ShapeSet';
import {SelectQueryFactory} from '@_linked/core/queries/SelectQuery';
import {IQueryParser} from '@_linked/core/interfaces/IQueryParser';
import {UpdatePartial, NodeReferenceValue} from '@_linked/core/queries/QueryFactory';
import {CreateResponse} from '@_linked/core/queries/CreateQuery';
import {DeleteResponse} from '@_linked/core/queries/DeleteQuery';
import {NodeId} from '@_linked/core/queries/MutationQuery';
import {setDefaultPageLimit} from '@_linked/core/utils/Package';
import {LinkedStorage} from '@_linked/core/utils/LinkedStorage';
import {
  Person,
  Pet,
  Dog,
  tmpEntityBase,
  name,
  hobby,
  bestFriend,
  hasFriend,
  hasPet,
  personClass,
  dogClass,
  guardDogLevel,
} from '@_linked/core/test-helpers/query-fixtures';
import {rdf} from '@_linked/core/ontologies/rdf';
import {xsd} from '@_linked/core/ontologies/xsd';
import {InMemoryStore, Literal, NamedNode, toNamedNode} from '@_linked/rdf-mem-store';

class StoreQueryParser implements IQueryParser {
  constructor(private readonly store: InMemoryStore) {}

  async selectQuery<ShapeType extends Shape, ResponseType, Source, ResultType>(
    query: SelectQueryFactory<ShapeType, ResponseType, Source>,
  ): Promise<ResultType> {
    return this.store.selectQuery(query.getQueryObject() as any) as Promise<ResultType>;
  }

  async updateQuery<ShapeType extends Shape, U extends UpdatePartial<ShapeType>>(
    _id: string | NodeReferenceValue,
    _updateObjectOrFn: U,
    _shapeClass: typeof Shape,
  ) {
    return Promise.reject(
      new Error('updateQuery is not used in this react integration test'),
    ) as any;
  }

  async createQuery<ShapeType extends Shape, U extends UpdatePartial<ShapeType>>(
    _updateObjectOrFn: U,
    _shapeClass: typeof Shape,
  ): Promise<CreateResponse<U>> {
    return Promise.reject(
      new Error('createQuery is not used in this react integration test'),
    ) as any;
  }

  async deleteQuery(
    _id: NodeId | NodeId[] | NodeReferenceValue[],
    _shapeClass: typeof Shape,
  ): Promise<DeleteResponse> {
    return Promise.reject(
      new Error('deleteQuery is not used in this react integration test'),
    ) as any;
  }
}

const p1Uri = `${tmpEntityBase}p1-semmy`;
const p2Uri = `${tmpEntityBase}p2-moa`;
const p3Uri = `${tmpEntityBase}p3-jinx`;
const p4Uri = `${tmpEntityBase}p4-quinn`;
const dog1Uri = `${tmpEntityBase}dog1`;
const dog2Uri = `${tmpEntityBase}dog2`;

function seedLegacyReactData() {
  const rdfType = toNamedNode(rdf.type);
  const personType = toNamedNode(personClass);
  const dogType = toNamedNode(dogClass);

  const nameNode = toNamedNode(name);
  const hobbyNode = toNamedNode(hobby);
  const bestFriendNode = toNamedNode(bestFriend);
  const hasFriendNode = toNamedNode(hasFriend);
  const hasPetNode = toNamedNode(hasPet);
  const guardDogLevelNode = toNamedNode(guardDogLevel);

  const p1 = NamedNode.getOrCreate(p1Uri);
  const p2 = NamedNode.getOrCreate(p2Uri);
  const p3 = NamedNode.getOrCreate(p3Uri);
  const p4 = NamedNode.getOrCreate(p4Uri);

  p1.set(rdfType, personType);
  p2.set(rdfType, personType);
  p3.set(rdfType, personType);
  p4.set(rdfType, personType);

  p1.set(nameNode, new Literal('Semmy'));
  p2.set(nameNode, new Literal('Moa'));
  p3.set(nameNode, new Literal('Jinx'));
  p4.set(nameNode, new Literal('Quinn'));

  p2.set(hobbyNode, new Literal('Jogging'));

  p1.set(hasFriendNode, p2);
  p1.set(hasFriendNode, p3);
  p2.set(hasFriendNode, p3);
  p2.set(hasFriendNode, p4);
  p2.set(bestFriendNode, p3);

  const dog1 = NamedNode.getOrCreate(dog1Uri);
  const dog2 = NamedNode.getOrCreate(dog2Uri);
  dog1.set(rdfType, dogType);
  dog2.set(rdfType, dogType);
  dog1.set(guardDogLevelNode, new Literal('2', toNamedNode(xsd.integer)));

  p1.set(hasPetNode, dog1);
  p2.set(hasPetNode, dog2);
}

beforeAll(() => {
  const store = new InMemoryStore();
  const parser = new StoreQueryParser(store);

  LinkedStorage.setDefaultStore(store);
  Person.queryParser = parser;
  Pet.queryParser = parser;
  Dog.queryParser = parser;

  seedLegacyReactData();
});

afterEach(() => {
  cleanup();
  setDefaultPageLimit(12);
});

describe('React component integration', () => {
  test('component with single property query', async () => {
    const Component = linkedComponent(
      Person.query((p) => p.name),
      ({name}) => {
        return <div>{name}</div>;
      },
    );

    const component = render(<Component of={{id: p1Uri}} />);

    await waitFor(() => expect(component.getByText('Semmy')).toBeTruthy(), {
      timeout: 5000,
      interval: 50,
    });
  });

  test('component with where query', async () => {
    const query = Person.query((p) => p.friends.where((f) => f.name.equals('Jinx')).name);

    const Component2 = linkedComponent(
      query,
      ({friends}) => {
        return <div>{friends[0].name}</div>;
      },
    );

    const component = render(<Component2 of={{id: p1Uri}} />);
    await waitFor(() => expect(component.getByText('Jinx')).toBeTruthy());
  });

  test('component with custom props', async () => {
    const query = Person.query((p) => p.friends.where((f) => f.name.equals('Jinx')).name);

    const ComponentWithCustomProps = linkedComponent<typeof query, {custom1: boolean}>(
      query,
      ({friends, custom1}) => {
        return (
          <div>
            <span>{friends[0].name}</span>
            <span>{custom1.toString()}</span>
          </div>
        );
      },
    );

    const component = render(
      <ComponentWithCustomProps of={{id: p1Uri}} custom1={true} />,
    );
    await waitFor(() => expect(component.getByText('Jinx')).toBeTruthy());
    await waitFor(() => expect(component.getByText('true')).toBeTruthy());
  });

  test('component requesting data from child components', async () => {
    const childQuery = Person.query((p) => p.name);

    const ChildComponent = linkedComponent(childQuery, ({name}) => {
      return <span>{name}</span>;
    });

    const parentQuery = Person.query((p) => {
      return [p.hobby, p.bestFriend.preloadFor(ChildComponent)];
    });

    const ParentComponent = linkedComponent(parentQuery, ({hobby, bestFriend}) => {
      return (
        <>
          <span>{hobby.toString()}</span>
          <ChildComponent of={bestFriend} />
        </>
      );
    });

    const component = render(<ParentComponent of={{id: p2Uri}} />);
    await waitFor(() => expect(component.getByText('Jinx')).toBeTruthy());
    await waitFor(() => expect(component.getByText('Jogging')).toBeTruthy());
  });

  test('linked set components', async () => {
    const NameList = linkedSetComponent(
      Person.query((person) => [person.name, person.hobby]),
      ({linkedData}) => {
        const persons = linkedData;
        return (
          <ul>
            {persons.map((person) => {
              return (
                <li key={person.id}>
                  <span>{person.name}</span>
                  <span>{person.hobby}</span>
                </li>
              );
            })}
          </ul>
        );
      },
    );
    const persons = new ShapeSet([
      new Person({id: p1Uri}),
      new Person({id: p2Uri}),
      new Person({id: p3Uri}),
      new Person({id: p4Uri}),
    ]);

    const component = render(<NameList of={persons} />);
    await waitFor(() => {
      persons.forEach((person) => {
        expect(component.getByText(person.id === p1Uri ? 'Semmy' : person.id === p2Uri ? 'Moa' : person.id === p3Uri ? 'Jinx' : 'Quinn')).toBeTruthy();
      });
      expect(component.getByText('Jogging')).toBeTruthy();
    });
  });

  test('linked set components without source', async () => {
    const NameList = linkedSetComponent(
      Person.query((person) => [person.name, person.hobby]),
      ({linkedData}) => {
        const persons = linkedData;
        return (
          <ul>
            {persons.map((person) => {
              return (
                <li key={person.id}>
                  <span>{person.name}</span>
                  <span>{person.hobby}</span>
                </li>
              );
            })}
          </ul>
        );
      },
    );

    const component = render(<NameList />);
    await waitFor(() => {
      expect(component.getByText('Semmy')).toBeTruthy();
      expect(component.getByText('Moa')).toBeTruthy();
      expect(component.getByText('Jinx')).toBeTruthy();
      expect(component.getByText('Quinn')).toBeTruthy();
      expect(component.getByText('Jogging')).toBeTruthy();
    });
  });

  test('linked set components with named data prop', async () => {
    const query = Person.query((person) => [person.name, person.hobby]);
    const NameList = linkedSetComponent({persons: query}, ({persons}) => {
      return (
        <ul>
          {persons.map((person) => {
            return (
              <li key={person.id}>
                <span>{person.name}</span>
                <span>{person.hobby}</span>
              </li>
            );
          })}
        </ul>
      );
    });

    const component = render(<NameList />);
    await waitFor(() => {
      expect(component.getByText('Semmy')).toBeTruthy();
      expect(component.getByText('Moa')).toBeTruthy();
      expect(component.getByText('Jinx')).toBeTruthy();
      expect(component.getByText('Quinn')).toBeTruthy();
      expect(component.getByText('Jogging')).toBeTruthy();
    });
  });

  test('linked set components rendered by linked component', async () => {
    const query = Person.query((person) => [person.name, person.hobby]);
    const NameList = linkedSetComponent({persons: query}, ({persons}) => {
      return (
        <ul>
          {persons.map((person) => {
            return (
              <li key={person.id}>
                <span>{person.name}</span>
                <span>{person.hobby}</span>
              </li>
            );
          })}
        </ul>
      );
    });

    const PersonFriends = linkedComponent(
      Person.query((p) => {
        return [p.name, p.friends.preloadFor(NameList)];
      }),
      ({name, friends}) => {
        return (
          <div>
            <span>{name}</span>
            <NameList of={friends} />
          </div>
        );
      },
    );

    const component = render(<PersonFriends of={{id: p1Uri}} />);
    await waitFor(() => {
      expect(component.getByText('Semmy')).toBeTruthy();
      expect(component.getByText('Moa')).toBeTruthy();
      expect(component.getByText('Jogging')).toBeTruthy();
      expect(component.getByText('Jinx')).toBeTruthy();
    });
  });

  test('linked set component with default page limit', async () => {
    setDefaultPageLimit(2);

    const NameList = linkedSetComponent(
      Person.query((person) => [person.name, person.hobby]),
      ({linkedData}) => {
        const persons = linkedData;
        return (
          <ul>
            {persons.map((person) => {
              return (
                <li key={person.id}>
                  <span role="name">{person.name}</span>
                </li>
              );
            })}
          </ul>
        );
      },
    );

    const component = render(<NameList />);
    await waitFor(() => {
      expect(component.getAllByRole('name').length).toBe(2);
      expect(component.getByText('Semmy')).toBeTruthy();
      expect(component.getByText('Moa')).toBeTruthy();
    });
  });
});
