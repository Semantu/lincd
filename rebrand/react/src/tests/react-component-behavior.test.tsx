import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals';
import React from 'react';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {linkedComponent, linkedSetComponent, linkedShape} from '../package.js';
import {Shape} from '@_linked/core/shapes/Shape';
import {literalProperty} from '@_linked/core/shapes/SHACL';
import {LinkedStorage} from '@_linked/core/utils/LinkedStorage';
import {SelectQueryFactory} from '@_linked/core/queries/SelectQuery';
import {ShapeSet} from '@_linked/core/collections/ShapeSet';
import {getSourceFromInputProps} from '../utils/LinkedComponent.js';
import {useStyles} from '../utils/Hooks.js';
import {LinkedComponentClass} from '../utils/LinkedComponentClass.js';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return {promise, resolve};
}

const personClass = {id: 'urn:test:gap:Person'};
const dogClass = {id: 'urn:test:gap:Dog'};
const catClass = {id: 'urn:test:gap:Cat'};
const nameProp = {id: 'urn:test:gap:name'};

@linkedShape
class Person extends Shape {
  static targetClass = personClass;

  @literalProperty({path: nameProp, maxCount: 1})
  get name(): string {
    return '';
  }
}

@linkedShape
class Dog extends Person {
  static targetClass = dogClass;
}

@linkedShape
class Cat extends Shape {
  static targetClass = catClass;
}

class TestLinkedClass extends LinkedComponentClass<Person> {
  static shape = Person;

  render() {
    return <div>ok</div>;
  }
}

class BrokenLinkedClass extends LinkedComponentClass<Person> {
  render() {
    return <div>broken</div>;
  }
}

class QueryParserStub {
  calls: Array<{offset?: number; limit?: number; singleResult?: boolean}> = [];
  private singleResult = {id: 'urn:test:gap:p1', name: 'Semmy'};
  private setResult = [
    {id: 'urn:test:gap:p1', name: 'Semmy'},
    {id: 'urn:test:gap:p2', name: 'Moa'},
    {id: 'urn:test:gap:p3', name: 'Jinx'},
    {id: 'urn:test:gap:p4', name: 'Quinn'},
    {id: 'urn:test:gap:p5', name: 'Rex'},
  ];
  private queue: Array<Promise<any>> = [];

  setSingleResult(result: {id: string; name: string}) {
    this.singleResult = result;
  }

  queueResult(resultPromise: Promise<any>) {
    this.queue.push(resultPromise);
  }

  async selectQuery<ResultType>(query: SelectQueryFactory<Shape>) {
    const request = query.getQueryObject();
    this.calls.push({
      offset: request.offset,
      limit: request.limit,
      singleResult: request.singleResult,
    });

    if (this.queue.length > 0) {
      return this.queue.shift() as Promise<ResultType>;
    }

    if (request.singleResult) {
      return this.singleResult as ResultType;
    }

    const offset = request.offset || 0;
    const limit = request.limit || this.setResult.length;
    return this.setResult.slice(offset, offset + limit) as ResultType;
  }
}

let parser: QueryParserStub;

beforeEach(() => {
  parser = new QueryParserStub();
  Person.queryParser = parser as any;
  Dog.queryParser = parser as any;
  Cat.queryParser = parser as any;

  LinkedStorage.setDefaultStore({
    init() {},
    async selectQuery() {
      return [];
    },
  } as any);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('React component behavior', () => {
  test('shows loader before linkedComponent query resolves', async () => {
    const deferred = createDeferred<any>();
    parser.queueResult(deferred.promise);

    const Card = linkedComponent(
      Person.query((p) => p.name),
      ({name}) => <div>{name}</div>,
    );

    render(<Card of={{id: 'urn:test:gap:p1'}} />);

    expect(screen.getByRole('status', {name: 'Loading'})).toBeTruthy();

    await act(async () => {
      deferred.resolve({id: 'urn:test:gap:p1', name: 'Semmy'});
      await deferred.promise;
    });

    await waitFor(() => {
      expect(screen.getByText('Semmy')).toBeTruthy();
    });
  });

  test('shows loader before linkedSetComponent query resolves', async () => {
    const deferred = createDeferred<any>();
    parser.queueResult(deferred.promise);

    const NameList = linkedSetComponent(
      Person.query((p) => p.name),
      ({linkedData = []}) => (
        <ul>
          {linkedData.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      ),
    );

    render(<NameList />);

    expect(screen.getByRole('status', {name: 'Loading'})).toBeTruthy();

    await act(async () => {
      deferred.resolve([
        {id: 'urn:test:gap:p1', name: 'Semmy'},
        {id: 'urn:test:gap:p2', name: 'Moa'},
      ]);
      await deferred.promise;
    });

    await waitFor(() => {
      expect(screen.getByText('Semmy')).toBeTruthy();
      expect(screen.getByText('Moa')).toBeTruthy();
    });
  });

  test('_refresh() refetches data and rerenders', async () => {
    let singleValue = 'Semmy';
    parser.setSingleResult({id: 'urn:test:gap:p1', name: singleValue});

    const Card = linkedComponent(
      Person.query((p) => p.name),
      ({name, _refresh}) => (
        <div>
          <span>{name}</span>
          <button
            onClick={() => {
              singleValue = 'Moa';
              parser.setSingleResult({id: 'urn:test:gap:p1', name: singleValue});
              _refresh();
            }}
          >
            refresh
          </button>
        </div>
      ),
    );

    render(<Card of={{id: 'urn:test:gap:p1'}} />);

    await waitFor(() => {
      expect(screen.getByText('Semmy')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('refresh'));

    await waitFor(() => {
      expect(screen.getByText('Moa')).toBeTruthy();
    });

    expect(parser.calls.length).toBeGreaterThanOrEqual(2);
  });

  test('_refresh(updatedProps) patches query-result props without refetch', async () => {
    const singleNameQuery = Person.query((p) => p.name);
    const Card = linkedComponent<typeof singleNameQuery, {title: string}>(
      singleNameQuery,
      ({name, _refresh, title}) => (
        <div>
          <span>{title}</span>
          <span>{name}</span>
          <button onClick={() => _refresh({name: 'Patched'})}>patch</button>
        </div>
      ),
    );

    render(<Card of={{id: 'urn:test:gap:p1'}} title="CustomTitle" />);

    await waitFor(() => {
      expect(screen.getByText('Semmy')).toBeTruthy();
    });

    const callsBeforePatch = parser.calls.length;
    fireEvent.click(screen.getByText('patch'));

    await waitFor(() => {
      expect(screen.getByText('Patched')).toBeTruthy();
      expect(screen.getByText('CustomTitle')).toBeTruthy();
    });

    expect(parser.calls.length).toBe(callsBeforePatch);
  });

  test('warns and renders null when linkedComponent has no source and no bound subject', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const Card = linkedComponent(
      Person.query((p) => p.name),
      ({name}) => <div>{name}</div>,
    );

    const component = render(React.createElement(Card, {} as any));

    expect(component.container.innerHTML).toBe('');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('requires a source to be provided'),
    );
  });

  test('throws on invalid linkedSetComponent input prop type', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const NameList = linkedSetComponent(
      Person.query((p) => p.name),
      ({linkedData = []}) => (
        <ul>
          {linkedData.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      ),
    );

    expect(() =>
      render(React.createElement(NameList, {of: {id: 'urn:test:gap:p1'}} as any)),
    ).toThrow("Invalid argument 'of' provided");
    expect(errorSpy).toHaveBeenCalled();
  });

  test('throws on invalid query-wrapper object formats', () => {
    const query = Person.query((p) => p.name);

    expect(() =>
      linkedSetComponent({a: query, b: query} as any, () => null),
    ).toThrow('Only one key is allowed');

    expect(() =>
      linkedSetComponent({a: 123} as any, () => null),
    ).toThrow('Unknown value type for query object');

    expect(() =>
      linkedSetComponent(123 as any, () => null),
    ).toThrow('Unknown data query type');
  });

  test('throws when _refresh() tries to load data without a configured parser', async () => {
    const previousDefaultParser = Shape.queryParser;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (Shape as any).queryParser = undefined;
    (Person as any).queryParser = undefined;

    const Card = linkedComponent(
      Person.query((p) => p.name),
      ({name, _refresh}) => (
        <div>
          <span>{name}</span>
          <button onClick={() => _refresh()}>refresh</button>
        </div>
      ),
    );

    render(<Card of={{id: 'urn:test:gap:p1', name: 'Semmy'} as any} />);

    await waitFor(() => {
      expect(screen.getByText('Semmy')).toBeTruthy();
    });

    let capturedError: Error | null = null;
    const onWindowError = (event: ErrorEvent) => {
      capturedError = event.error;
      event.preventDefault();
    };
    window.addEventListener('error', onWindowError);

    fireEvent.click(screen.getByText('refresh'));

    expect(capturedError?.message).toContain('No query parser configured');

    window.removeEventListener('error', onWindowError);

    (Shape as any).queryParser = previousDefaultParser;
    (Person as any).queryParser = parser as any;
  });

  test('linkedSetComponent query controller methods update paging', async () => {
    let controller: any;
    const pagedQuery = Person.query((p) => p.name);
    pagedQuery.setLimit(2);
    const NameList = linkedSetComponent(
      pagedQuery,
      ({linkedData = [], query}) => {
        controller = query;
        return (
          <ul>
            {linkedData.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        );
      },
    );

    render(<NameList />);

    await waitFor(() => {
      expect(screen.getByText('Semmy')).toBeTruthy();
      expect(screen.getByText('Moa')).toBeTruthy();
    });

    act(() => {
      controller.nextPage();
    });

    await waitFor(() => {
      expect(screen.getByText('Jinx')).toBeTruthy();
      expect(screen.getByText('Quinn')).toBeTruthy();
    });

    act(() => {
      controller.previousPage();
    });

    await waitFor(() => {
      expect(screen.getByText('Semmy')).toBeTruthy();
      expect(screen.getByText('Moa')).toBeTruthy();
    });

    act(() => {
      controller.setLimit(3);
    });

    await waitFor(() => {
      expect(screen.getByText('Jinx')).toBeTruthy();
    });

    act(() => {
      controller.setPage(1);
    });

    await waitFor(() => {
      expect(screen.getByText('Quinn')).toBeTruthy();
      expect(screen.getByText('Rex')).toBeTruthy();
    });
  });

  test('getSourceFromInputProps handles node references and shape inheritance', () => {
    const fromNodeReference = getSourceFromInputProps(
      {of: {id: 'urn:test:gap:p100'}},
      Person,
    );
    expect(fromNodeReference).toBeInstanceOf(Person);
    expect(fromNodeReference.id).toBe('urn:test:gap:p100');

    const dog = new Dog({id: 'urn:test:gap:dog1'});
    const personFromDog = getSourceFromInputProps({of: dog}, Person);
    expect(personFromDog).toBe(dog);

    const cat = new Cat({id: 'urn:test:gap:cat1'});
    const personFromCat = getSourceFromInputProps({of: cat}, Person);
    expect(personFromCat).toBeInstanceOf(Person);
    expect(personFromCat).not.toBe(cat);
    expect(personFromCat.id).toBe('urn:test:gap:cat1');
  });

  test('linked components expose shape/query metadata for package registration usage', () => {
    const query = Person.query((p) => p.name);
    const Card = linkedComponent(query, ({name}) => <div>{name}</div>);
    const SetList = linkedSetComponent(query, ({linkedData = []}) => (
      <ul>
        {linkedData.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    ));

    expect(Card.shape).toBe(Person);
    expect(Card.query).toBe(query);
    expect(SetList.shape).toBe(Person);
    expect(SetList.query).toBe(query);
  });

  test('linked set query supports array QResult input and applies client-side slicing', async () => {
    const pagedQuery = Person.query((p) => p.name);
    pagedQuery.setLimit(2);
    const NameList = linkedSetComponent(
      pagedQuery,
      ({linkedData = [], query}) => (
        <div>
          <button onClick={() => query?.nextPage()}>next</button>
          <ul>
            {linkedData.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </div>
      ),
    );

    const prefetched = [
      {id: 'urn:test:gap:p1', name: 'Semmy'},
      {id: 'urn:test:gap:p2', name: 'Moa'},
      {id: 'urn:test:gap:p3', name: 'Jinx'},
      {id: 'urn:test:gap:p4', name: 'Quinn'},
    ];

    render(<NameList of={prefetched as any} />);

    await waitFor(() => {
      expect(screen.getByText('Semmy')).toBeTruthy();
      expect(screen.getByText('Moa')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('next'));

    await waitFor(() => {
      expect(screen.getByText('Jinx')).toBeTruthy();
      expect(screen.getByText('Quinn')).toBeTruthy();
    });

    // With valid prefetched results, parser should not execute requests.
    expect(parser.calls.length).toBe(0);
  });

  test('linked set accepts ShapeSet as input', async () => {
    const NameList = linkedSetComponent(
      Person.query((p) => p.name),
      ({linkedData = []}) => (
        <ul>
          {linkedData.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      ),
    );

    const set = new ShapeSet([
      new Person({id: 'urn:test:gap:p1'}),
      new Person({id: 'urn:test:gap:p2'}),
    ]);

    render(<NameList of={set} />);

    await waitFor(() => {
      expect(screen.getByText('Semmy')).toBeTruthy();
      expect(screen.getByText('Moa')).toBeTruthy();
    });
  });
});

describe('React utility helpers', () => {
  test('useStyles merges class names and styles, filtering falsy values', () => {
    const result = useStyles(
      {
        className: ['base', '', null, 'active'],
        style: {color: 'red'},
        other: 'value',
      },
      ['extra', false as any, 'focus'],
      {fontWeight: 'bold'},
    );

    expect(result.className).toBe('base active extra focus');
    expect(result.style).toEqual({color: 'red', fontWeight: 'bold'});
    expect(result.other).toBe('value');
    expect((result as any).className.includes('  ')).toBe(false);
  });

  test('useStyles supports string class input and style object input', () => {
    const withClass = useStyles({className: 'root'}, 'extra-class');
    expect(withClass.className).toBe('root extra-class');

    const withStyles = useStyles({style: {color: 'blue'}}, {marginTop: 4});
    expect(withStyles.style).toEqual({color: 'blue', marginTop: 4});
  });

  test('LinkedComponentClass sourceShape resolves and resets when source changes', () => {
    const ref = React.createRef<TestLinkedClass>();

    const firstSource = new Person({id: 'urn:test:gapclass:p1'});
    const secondSource = new Person({id: 'urn:test:gapclass:p2'});

    const {rerender} = render(
      <TestLinkedClass source={firstSource} _refresh={() => {}} ref={ref} />,
    );

    const firstShape = ref.current.sourceShape;
    expect(firstShape.id).toBe('urn:test:gapclass:p1');

    rerender(
      <TestLinkedClass source={secondSource} _refresh={() => {}} ref={ref} />,
    );

    const secondShape = ref.current.sourceShape;
    expect(secondShape.id).toBe('urn:test:gapclass:p2');
    expect(secondShape).not.toBe(firstShape);
  });

  test('LinkedComponentClass sourceShape throws when class is not linked to a shape', () => {
    const ref = React.createRef<BrokenLinkedClass>();

    render(
      <BrokenLinkedClass
        source={new Person({id: 'urn:test:gapclass:p1'}) as any}
        _refresh={() => {}}
        ref={ref}
      />,
    );

    expect(() => ref.current.sourceShape).toThrow(
      'BrokenLinkedClass is not linked to a shape',
    );
  });

  test('LinkedComponentClass sourceShape returns null when no source is provided', () => {
    const ref = React.createRef<TestLinkedClass>();

    render(<TestLinkedClass source={null as any} _refresh={() => {}} ref={ref} />);

    expect(ref.current.sourceShape).toBeNull();
  });
});
