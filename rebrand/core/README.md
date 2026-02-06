# @_linked/core
Core Linked package for the query DSL, SHACL shape decorators/metadata, and package registration.

Linked core gives you a type-safe, schema-parameterized query language and SHACL-driven Shape classes for linked data. It compiles queries into a plain JS query object that can be executed by a store.

See also
- documentation: https://docs.lincd.org
- registry: https://www.lincd.org

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
const names = await Person.select((p) => p.name);

const myNode = {id: 'https://my.app/node1'};
const person = await Person.select(myNode, (p) => ({
  name: p.name,
  friends: p.knows,
}));

const created = await Person.create({
  name: 'Alice',
  knows: [{id: 'https://my.app/node2'}],
});

const updated = await Person.update(myNode.id, {
  name: 'Alicia',
});

await Person.delete(myNode.id);
```

## Storage configuration

`LinkedStorage` routes query objects to a store that implements `IQuadStore`.

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

#### Basic selection
```typescript
const names = await Person.select((p) => p.name);
const friends = await Person.select((p) => p.knows);
const dates = await Person.select((p) => [p.birthDate, p.name]);
const flags = await Person.select((p) => p.isRealPerson);
```

#### Target a specific subject
```typescript
const myNode = {id: 'https://my.app/node1'};
const one = await Person.select(myNode, (p) => p.name);
const missing = await Person.select({id: 'https://my.app/missing'}, (p) => p.name);
```

#### Multiple paths + nested paths
```typescript
const mixed = await Person.select((p) => [p.name, p.knows, p.bestFriend.name]);
const deep = await Person.select((p) => p.knows.bestFriend.name);
```

#### Sub-queries
```typescript
const detailed = await Person.select((p) =>
  p.knows.select((f) => ({name: f.name, hobby: f.hobby})),
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
  p.knows.where((f) => f.name.equals('Moa').and(f.hobby.equals('Jogging'))),
);
const orQuery = await Person.select((p) =>
  p.knows.where((f) => f.name.equals('Jinx').or(f.hobby.equals('Jogging'))),
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
const count = await Person.select((p) => p.knows.size());
```

#### Custom result formats
```typescript
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
```typescript
setQueryContext('user', {id: 'https://my.app/user1'}, Person);
const ctx = await Person.select((p) => p.name).where((p) =>
  p.bestFriend.equals(getQueryContext('user')),
);
```

#### Preload
```typescript
const preloaded = await Person.select((p) => [
  p.hobby,
  p.bestFriend.preloadFor(ChildComponent),
]);
```

#### Create / Update / Delete
```typescript
const created = await Person.create({name: 'Alice'});
const updated = await Person.update({id: 'https://my.app/node1'}, {name: 'Alicia'});
await Person.delete({id: 'https://my.app/node1'});
```
