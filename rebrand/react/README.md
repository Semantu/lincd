# @_linked/react

React bindings for `@_linked/core`.

`@_linked/react` takes a Linked query from `@_linked/core`'s [Schema-Parameterized Query DSL](../core/README.md#schema-parameterized-query-dsl) and maps the top-level query result keys to props for a React component.

This package provides:
- `linkedComponent(...)`
- `linkedSetComponent(...)`
- `LinkedComponentClass`
- `useStyles(...)`

## Install

```bash
npm install @_linked/react @_linked/core react react-dom
```

`@_linked/react` does not include RDF storage. For local in-memory setup, add `@_linked/rdf-mem-store` and register it as the default store in `LinkedStorage`:

```tsx
import {LinkedStorage} from '@_linked/core';
import {InMemoryStore} from '@_linked/rdf-mem-store';

LinkedStorage.setDefaultStore(new InMemoryStore());
```

## Usage

### Setup package exports

```tsx
import {
  linkedComponent,
  linkedSetComponent,
  linkedShape,
} from '@_linked/react';
```

### `linkedComponent(...)`

```tsx
const PersonCard = linkedComponent(
  Person.query((p) => p.name),
  ({name}) => <div>{name}</div>,
);

<PersonCard of={{id: 'https://example.org/p1'}} />;
```

### `linkedSetComponent(...)` (direct query format)

```tsx
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
```

### `linkedSetComponent(...)` (named data-prop format)

```tsx
const personQuery = Person.query((p) => [p.name, p.hobby]);

const NameList = linkedSetComponent({persons: personQuery}, ({persons}) => (
  <ul>
    {persons.map((person) => (
      <li key={person.id}>{person.name}</li>
    ))}
  </ul>
));
```

Both formats are supported.

## Notes

- This package depends on `@_linked/core` query APIs and `preloadFor(...)` / `BoundComponent` behavior from core.
- `@_linked/react` itself does not provide RDF storage; use a store package and set a default store in `LinkedStorage` (for example `@_linked/rdf-mem-store`).

## Development

```bash
npm run build
npm test
```
