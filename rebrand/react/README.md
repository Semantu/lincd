# @_linked/react

React bindings for `@_linked/core`.

This package provides:
- `linkedComponent(...)`
- `linkedSetComponent(...)`
- `LinkedComponentClass`
- `useStyles(...)`

## Install

```bash
npm install @_linked/react @_linked/core react react-dom
```

For runtime data resolution, also add a store package (for example `@_linked/rdf-mem-store`) and configure `LinkedStorage`.

## Usage

### Setup package exports

```ts
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
- `@_linked/react` itself does not provide RDF storage; use a store package and set a default store in `LinkedStorage`.
- Legacy watch hooks from monolithic LINCD (`useWatchProperty*`) are intentionally not included in this package.

## Development

```bash
npm run build
npm test
```
