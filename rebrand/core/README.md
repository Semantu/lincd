# @_linked/core
Core Linked package for the query DSL, SHACL shape decorators/metadata, and package registration.

Linked core gives you a type-safe, schema-parameterized query language and SHACL-driven Shape classes for linked data. It compiles queries into a plain JS query object that can be executed by a store.

## Linked core offers

- **Schema-Parameterized Query DSL**: TypeScript-embedded queries driven by your Shape definitions.
- **Shape Classes (SHACL)**: TypeScript classes that generate SHACL shape metadata.
- **Object-Oriented Data Operations**: Query, create, update, and delete data using the same Shape-based API.
- **Storage Routing**: `LinkedStorage` routes query objects to your configured store(s) that implement `IQuadStore`.
- **Automatic Data Validation**: SHACL shapes can be synced to your store for schema-level validation, and enforced at runtime by stores that support it.

## Installation

```bash
npm install @_linked/core
```

```typescript
import {Shape, LinkedStorage} from '@_linked/core';
import {linkedPackage} from '@_linked/core/utils/Package';
```

## Related packages

- `@_linked/rdf-mem-store`: in-memory RDF store that implements `IQuadStore`.
- `@_linked/react`: React bindings for Linked queries and shapes.

## Linked Package Setup

Linked packages expose shapes, utilities, and ontologies through a small `package.ts` file. This makes module exports discoverable across Linked modules and enables linked decorators.

**Minimal `package.ts`**
```typescript
import {linkedPackage} from '@_linked/core/utils/Package';

export const {
  linkedShape,
  linkedUtil,
  linkedOntology,
  registerPackageExport,
  registerPackageModule,
  packageExports,
  getPackageShape,
} = linkedPackage('my-package-name');
```

**Decorators and helpers**
- `@linkedShape`: registers a Shape class and generates SHACL shape metadata
- `@linkedUtil`: exposes utilities to other Linked modules
- `linkedOntology(...)`: registers an ontology and (optionally) its data loader
- `registerPackageExport(...)`: manually export something into the Linked package tree
- `registerPackageModule(...)`: lower-level module registration
- `getPackageShape(...)`: resolve a Shape class by name to avoid circular imports

## Shapes

Linked uses Shape classes to generate SHACL metadata. Paths, target classes, and node kinds are expressed as `NodeReferenceValue` objects: `{id: string}`.

```typescript
import {Shape} from '@_linked/core';
import {ShapeSet} from '@_linked/core/collections/ShapeSet';
import {literalProperty, objectProperty} from '@_linked/core/shapes/SHACL';
import {createNameSpace} from '@_linked/core/utils/NameSpace';
import {linkedShape} from './package';

const schema = createNameSpace('https://schema.org/');
const PersonClass = schema('Person');
const name = schema('name');
const knows = schema('knows');

@linkedShape
export class Person extends Shape {
  static targetClass = PersonClass;

  @literalProperty({path: name, required: true, maxCount: 1})
  declare name: string;

  @objectProperty({path: knows, shape: Person})
  declare knows: ShapeSet<Person>;
}
```

## Queries: Create, Select, Update, Delete

Queries are expressed with the same Shape classes and compile to a query object that a store executes.

```typescript
/* Result: Array<{id: string; name: string}> */
const names = await Person.select((p) => p.name);

const myNode = {id: 'https://my.app/node1'};
/* Result: {id: string; name: string} | null */
const person = await Person.select(myNode, (p) => p.name);
const missing = await Person.select({id: 'https://my.app/missing'}, (p) => p.name); // null

/* Result: {id: string} & UpdatePartial<Person> */
const created = await Person.create({
  name: 'Alice',
  knows: [{id: 'https://my.app/node2'}],
});

const updated = await Person.update(myNode, {
  name: 'Alicia',
});

// Overwrite a multi-value property
const overwriteFriends = await Person.update(myNode, {
  knows: [{id: 'https://my.app/node2'}],
});

// Add/remove items in a multi-value property
const addRemoveFriends = await Person.update(myNode, {
  knows: {
    add: [{id: 'https://my.app/node3'}],
    remove: [{id: 'https://my.app/node2'}],
  },
});

/* Result: {deleted: Array<{id: string}>, count: number} */
await Person.delete(myNode);
```

## Storage configuration

`LinkedStorage` is the routing helper (not an interface). It forwards query objects to a store that implements `IQuadStore`.

```typescript
import {LinkedStorage} from '@_linked/core';
import {InMemoryStore} from '@_linked/rdf-mem-store';

LinkedStorage.setDefaultStore(new InMemoryStore());
```

You can also route specific shapes to specific stores:

```typescript
LinkedStorage.setStoreForShapes(new InMemoryStore(), Person);
```

## Automatic data validation

SHACL shapes are ideal for data validation. Linked generates SHACL shapes from your TypeScript Shape classes, which you can sync to your store for schema-level validation. When your store enforces those shapes at runtime, you get both schema validation and runtime enforcement for extra safety.

## Schema-Parameterized Query DSL

The query DSL is schema-parameterized: you define your own SHACL shapes, and Linked exposes a type-safe, object-oriented query API for those shapes.

### Query feature overview (core)

- Basic selection (literals, objects, dates, booleans)
- Target a specific subject by `{id}` or instance
- Multiple paths and mixed results
- Nested paths (deep selection)
- Sub-queries on object/set properties
- Filtering with `where(...)` and `equals(...)`
- `and(...)` / `or(...)` combinations
- Set filtering with `some(...)` / `every(...)` (and implicit `some`)
- Outer `where(...)` chaining
- Counting with `.size()`
- Custom result formats (object mapping)
- Type casting with `.as(Shape)`
- Sorting, limiting, and `.one()`
- Query context variables
- Preloading (`preloadFor`) for component-like queries
- Create / Update / Delete mutations

### Query examples

Result types are inferred from your Shape definitions and the selected paths. Examples below show abbreviated result shapes.

#### Basic selection
```typescript
/* Result: Array<{id: string; name: string}> */
const names = await Person.select((p) => p.name);

/* Result: Array<{id: string; knows: Array<{id: string}>}> */
const friends = await Person.select((p) => p.knows);

const dates = await Person.select((p) => [p.birthDate, p.name]);
const flags = await Person.select((p) => p.isRealPerson);
```

#### Target a specific subject
```typescript
const myNode = {id: 'https://my.app/node1'};
/* Result: {id: string; name: string} | null */
const one = await Person.select(myNode, (p) => p.name);
const missing = await Person.select({id: 'https://my.app/missing'}, (p) => p.name); // null
```

#### Multiple paths + nested paths
```typescript
/* Result: Array<{id: string; name: string; knows: Array<{id: string}>; bestFriend: {id: string; name: string}}> */
const mixed = await Person.select((p) => [p.name, p.knows, p.bestFriend.name]);
const deep = await Person.select((p) => p.knows.bestFriend.name);
```

#### Sub-queries
```typescript
const detailed = await Person.select((p) =>
  p.knows.select((f) => f.name),
);
```

#### Where + equals
```typescript
const filtered = await Person.select().where((p) => p.name.equals('Semmy'));
const byRef = await Person.select().where((p) =>
  p.bestFriend.equals({id: 'https://my.app/node3'}),
);
```

#### And / Or
```typescript
const andQuery = await Person.select((p) =>
  p.knows.where((f) =>
    f.name.equals('Moa').and(f.hobby.equals('Jogging')),
  ),
);
const orQuery = await Person.select((p) =>
  p.knows.where((f) =>
    f.name.equals('Jinx').or(f.hobby.equals('Jogging')),
  ),
);
```

#### Set filtering (some/every)
```typescript
const implicitSome = await Person.select().where((p) =>
  p.knows.name.equals('Moa'),
);
const explicitSome = await Person.select().where((p) =>
  p.knows.some((f) => f.name.equals('Moa')),
);
const every = await Person.select().where((p) =>
  p.knows.every((f) => f.name.equals('Moa').or(f.name.equals('Jinx'))),
);
```

#### Outer where chaining
```typescript
const outer = await Person.select((p) => p.knows).where((p) =>
  p.name.equals('Semmy'),
);
```

#### Counting (size)
```typescript
/* Result: Array<{id: string; knows: number}> */
const count = await Person.select((p) => p.knows.size());
```

#### Custom result formats
```typescript
/* Result: Array<{id: string; nameIsMoa: boolean; numFriends: number}> */
const custom = await Person.select((p) => ({
  nameIsMoa: p.name.equals('Moa'),
  numFriends: p.knows.size(),
}));
```

#### Query As (type casting)
```typescript
const guards = await Person.select((p) => p.pets.as(Dog).guardDogLevel);
```

#### Sorting, limiting, one
```typescript
const sorted = await Person.select((p) => p.name).sortBy((p) => p.name, 'ASC');
const limited = await Person.select((p) => p.name).limit(1);
const single = await Person.select((p) => p.name).one();
```

#### Query context
Query context lets you inject request-scoped values (like the current user) into filters without threading them through every call.

```typescript
setQueryContext('user', {id: 'https://my.app/user1'}, Person);
const ctx = await Person.select((p) => p.name).where((p) =>
  p.bestFriend.equals(getQueryContext('user')),
);
```

#### Preload
Preloading appends another query to the current query so the combined data is loaded in one round-trip. This is helpful when rendering a nested tree of components and loading all data at once.

```typescript
const preloaded = await Person.select((p) => [
  p.hobby,
  p.bestFriend.preloadFor(ChildComponent),
]);
```

#### Create / Update / Delete
```typescript
/* Result: {id: string} & UpdatePartial<Person> */
const created = await Person.create({name: 'Alice'});

const updated = await Person.update({id: 'https://my.app/node1'}, {name: 'Alicia'});

// Overwrite a multi-value property
const overwriteFriends = await Person.update({id: 'https://my.app/node1'}, {
  knows: [{id: 'https://my.app/node2'}],
});

// Add/remove items in a multi-value property
const addRemoveFriends = await Person.update({id: 'https://my.app/node1'}, {
  knows: {
    add: [{id: 'https://my.app/node3'}],
    remove: [{id: 'https://my.app/node2'}],
  },
});

await Person.delete({id: 'https://my.app/node1'});
```

## TODO

- Allow `preloadFor` to accept another query (not just a component).
- Make and expose functions for auto syncing shapes to the graph.

## Changelog

### 1.0.0 (from LINCD.js)

This is a rebranding + extraction release. It moves the core query/shape system into `@_linked/core` and removes RDF models and React-specific code.

Key changes:
- **New package name:** import from `@_linked/core` instead of `lincd`.
- **Node references everywhere:** use `NodeReferenceValue = {id: string}` everywhere. `NamedNode` does not exist in this package.
  - **Before (LINCD.js):**
    ```typescript
    import {NamedNode} from 'lincd/models';
    const name = NamedNode.getOrCreate('https://schema.org/name');
    ```
  - **After (`@_linked/core`):**
    ```typescript
    import {createNameSpace} from '@_linked/core/utils/NameSpace';
    const schema = createNameSpace('https://schema.org/');
    const name = schema('name'); // {id: 'https://schema.org/name'}
    ```
- **Decorator paths:** property decorators now require `NodeReferenceValue` paths (no strings, no `NamedNode`).
  - **Before:**
    ```typescript
    @literalProperty({path: foaf.name})
    ```
  - **After:**
    ```typescript
    const name = schema('name');
    @literalProperty({path: name})
    ```
- **Target class and node kinds:** `targetClass`, `datatype`, `nodeKind`, etc. now take `NodeReferenceValue`.
  - **Before:**
    ```typescript
    static targetClass = foaf.Person; // NamedNode
    ```
  - **After:**
    ```typescript
    static targetClass = schema('Person'); // {id: string}
    ```
- **Query context:** context values are `NodeReferenceValue` (or QResults) instead of RDF nodes.
  - **Before:**
    ```typescript
    setQueryContext('user', NamedNode.getOrCreate(userId), Person);
    ```
  - **After:**
    ```typescript
    setQueryContext('user', {id: userId}, Person);
    ```
- **No RDF models in core:** `NamedNode`, `Literal`, `BlankNode`, `Quad`, `Graph`, and all RDF collections are not available in `@_linked/core`. Use a store package (e.g. `@_linked/rdf-mem-store`) if you need RDF models or quad-level access.
- **Shape instances:** shape classes no longer carry RDF nodes or instance graph APIs. Decorated accessors register SHACL metadata but do not implement runtime get/set behavior.
- **Query tracing:** query tracing is proxy-based (no `TestNode`/`TraceShape`).
- **SHACL metadata:** node/property shapes are plain JS objects (`QResult`), not RDF triples.
- **Package registration:** `linkedPackage` now stores package metadata as plain JS (`PackageMetadata`) and keeps legacy URI ids for compatibility.
- **Storage routing:** `LinkedStorage` routes queries to an `IQuadStore` implementation (e.g. `@_linked/rdf-mem-store`).
- **Imports updated:** ontology namespaces now return `NodeReferenceValue` objects, and decorators require `NodeReferenceValue` paths.
