# @_linked/core
Core LINCD package for the query DSL, SHACL shape decorators/metadata, and package registration.

LINCD core gives you a type-safe, schema-parameterized query language and SHACL-driven Shape classes for linked data. It compiles queries into a plain JS query object that can be executed by a store.

See also
- documentation: https://docs.lincd.org
- registry: https://www.lincd.org

## LINCD core offers

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

## LINCD Package Setup

LINCD packages expose shapes, utilities, and ontologies through a small `package.ts` file. This makes module exports discoverable across LINCD modules and enables linked decorators.

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
- `@linkedUtil`: exposes utilities to other LINCD modules
- `linkedOntology(...)`: registers an ontology and (optionally) its data loader
- `registerPackageExport(...)`: manually export something into the LINCD package tree
- `registerPackageModule(...)`: lower-level module registration
- `getPackageShape(...)`: resolve a Shape class by name to avoid circular imports

## Shapes

LINCD uses Shape classes to generate SHACL metadata. Paths, target classes, and node kinds are expressed as `NodeReferenceValue` objects: `{id: string}`.

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

const person = await Person.select({id: 'linked://tmp/p1'}, (p) => ({
  name: p.name,
  friends: p.knows,
}));

const created = await Person.create({
  name: 'Alice',
  knows: [{id: 'linked://tmp/p2'}],
});

const updated = await Person.update('linked://tmp/p1', {
  name: 'Alicia',
});

await Person.delete('linked://tmp/p1');
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

SHACL shapes are ideal for data validation. LINCD generates SHACL shapes from your TypeScript Shape classes, which you can sync to your store for schema-level validation. When your store enforces those shapes at runtime, you get both schema validation and runtime enforcement for extra safety.

## Schema-Parameterized Query DSL

The query DSL is schema-parameterized: you define your own SHACL shapes, and LINCD exposes a type-safe, object-oriented query API for those shapes.

```typescript
const results = await Person.select((p) => [
  p.name,
  p.knows.select((f) => ({name: f.name})),
]);

const filtered = await Person.select().where((p) =>
  p.name.equals('Semmy'),
);

const sorted = await Person.select((p) => p.name).sortBy((p) => p.name, 'ASC');
```
