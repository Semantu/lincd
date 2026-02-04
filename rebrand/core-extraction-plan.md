# @_linked/core — package extraction plan (copy-then-prune)

## Context

The original LINCD repository (`src/` at the repo root) is a monolithic codebase that bundles everything together: RDF models, an in-memory quad store, SHACL shape definitions, a query DSL, React component linking, package registration, and more.

We are splitting this monolith into three separate packages under `rebrand/`:

1. **`@_linked/core`** (this plan) — The query DSL, SHACL shape decorators/metadata, and package registration. No React. No RDF models.
2. **`@_linked/memstore`** — RDF node models (NamedNode, Literal, BlankNode, Quad), the in-memory quad store, and LocalQueryResolver. An earlier version exists on branch `origin/codex/implement-additional-query-tests-in-linked-js` as `rebrand/linked-mem-store`.
3. **`@_linked/react`** — React components, hooks, and `linkedComponent`/`linkedSetComponent` linking helpers.

### Prior attempts & lessons learned

Two prior attempts at extracting the core package exist in this repo. Both contain useful reference code but neither produced a shippable result:

- **`rebrand/linked-js`** (local + more developed version on branch `origin/codex/implement-additional-query-tests-in-linked-js`) — a clean-room rewrite. This version solved many of the hard design problems: `NodeReferenceValue = {id: string}` instead of `NamedNode`, Proxy-based query tracing instead of `TestNode`, a plain-JS `NodeShape` class, a `ShapeClass` registry, shared `test-helpers/query-fixtures.ts`, and full CRUD query support with type inference. **What went wrong:** building from scratch meant that the complex type inference chain (`QueryResponseToResultType` and related types) had to be recreated manually, which proved error-prone. Getting the full type inference working again from scratch was too difficult.

- **`rebrand/linked-js2`** — copy-then-prune with a full copy of root `src/`. Had working query-object tests and type inference tests, and was on a good trajectory. **What went wrong:** the agent session got stuck and some of the last work was not committed. When the branch was cloned to continue, the tests no longer passed — defeating the whole point of maintaining a green baseline at all times. The work itself was sound, but the loss of the green state made it unrecoverable.

Both folders are kept as reference for the approach and design patterns. However, we should not copy large chunks from them wholesale — the goal is to prune the existing linked-js2 code step by step, using the earlier attempts only as inspiration for what the target state looks like.

### Why copy-then-prune (done carefully) is the right approach

The most critical aspect of this codebase is the **query result type inference chain**. When a developer writes:

```typescript
const result = await Person.select(p => ({name: p.name, friend: p.bestFriend}));
//    ^-- result type is inferred as QResult<Person, {name: string, friend: Person}>[]
```

TypeScript infers the full result type through a chain of conditional types: `SelectQueryFactory<S, ResponseType>` → `QueryResponseToResultType<ResponseType, ShapeType>` → `GetQueryObjectResultType` → `QResult<Shape, Object>`. This inference chain spans `SelectQuery.ts`, `QueryFactory.ts`, and `Shape.ts`. It is the core value of the library and it is fragile — a single wrong type change can collapse the entire chain to `unknown` or `never`.

Building from scratch (linked-js) made it hard to reproduce this chain. The linked-js2 attempt was on a good trajectory but lost its green baseline when the agent session got stuck and uncommitted work was lost.

**This time we prune one small piece at a time**, committing after each successful step, and verifying after each step that:
1. The build compiles.
2. The tests pass.
3. The type inference tests (`query.types.test.ts`) still validate that inferred types are correct.

### Shared test fixtures

The codex branch version of `rebrand/linked-js` introduced a `test-helpers/query-fixtures.ts` factory that exports reusable `Person`, `Pet`, `Dog` shape classes and property path constants as plain strings. This factory was designed so that the exact same query tests can run in both `@_linked/core` (asserting query objects) and `@_linked/memstore` (asserting query results). This pattern should be adopted in the final version.

### Methodology

1. Start from the full copy of `src/` already in `rebrand/linked-js2/src/`.
2. Incrementally remove pieces that don't belong in `@_linked/core`.
3. After each removal step, verify that build compiles and tests pass — **including type inference tests**.
4. **Commit after each successful step.** A lesson from the linked-js2 attempt: uncommitted work can be lost. Every green state should be committed so we can always recover.
5. **Tests may only be changed with explicit user approval.** If a test fails after a pruning step, ask the user for feedback rather than silently changing what is validated.
6. Use both `rebrand/linked-js` and `rebrand/linked-js2` as reference for inspiration, but don't copy large chunks wholesale — prune the existing files toward the target step by step.

### What belongs in `@_linked/core`

- **Query DSL** — `SelectQuery`, `CreateQuery`, `UpdateQuery`, `DeleteQuery`, `MutationQuery`, `QueryFactory`, `QueryParser`, `QueryContext`.
- **SHACL shape decorators** — `@linkedShape`, `@literalProperty`, `@objectProperty`, `@linkedProperty` and the underlying `NodeShape`/`PropertyShape` metadata classes that track which SHACL shapes and properties exist in consuming code.
- **Package registration** — `Package.ts` (`linkedPackage()`, `registerPackageExport()`, `getPackageShape()`, `@linkedUtil`, `@linkedOntology`).
- **Shape base class** — `Shape.ts` (static query methods and metadata; no instance RDF behavior).
- **Supporting utilities** — `ShapeClass` (registry: find a shape class from a node shape ID), `LinkedStorage` (interface/routing only, no concrete store), `Types`, and any other utilities required by the above.
- **Interfaces** — `IShape`, `IQueryParser`, `IQuadStore` (interface only), `IGraphObject`, `IGraphObjectSet`, `ICoreIterable`, etc.

### What does NOT belong in `@_linked/core`

- **React** — No `linkedComponent`, `linkedSetComponent`, `LinkedComponentClass`, `Hooks.ts`, or any React imports. These belong in `@_linked/react`.
- **RDF node models** — No `NamedNode`, `Literal`, `BlankNode`, `Quad`, `DefaultGraph`, `Datafactory.ts`, `models.ts`. These belong in `@_linked/memstore`.
- **In-memory store** — No `LocalQueryResolver`, no concrete quad store implementation. These belong in `@_linked/memstore`.
- **Node/Quad collections** — No `NodeSet`, `NodeMap`, `QuadSet`, `QuadMap`, `QuadArray`, `NodeURIMappings`, `NodeValuesSet`. These depend on RDF models and belong in `@_linked/memstore`.
- **CSS** — No styling resources.
- **Ontology data files** — Ontology definitions that instantiate RDF nodes belong in `@_linked/memstore` or a separate ontology package. The core package may retain ontology *interfaces* if needed.

---

## Decisions

These are the resolved design decisions for how `@_linked/core` handles the transition away from RDF models.

### NodeReferenceValue replaces NamedNode

The type `NodeReferenceValue = {id: string}` already exists in `QueryFactory.ts`. Everywhere the current code uses `NamedNode`, we replace it with `NodeReferenceValue` (or import it under a shorter alias if convenient). This is a plain object with an `id` key holding the URI.

Config parameters accept `string | NodeReferenceValue` and internally normalize:

```typescript
const toNodeReference = (value: string | NodeReferenceValue): NodeReferenceValue => {
  return typeof value === 'string' ? {id: value} : value;
};
```

The codex branch already uses this pattern (under the name `NodeRef`). In tests and fixtures, paths can be defined as plain strings since the decorator config accepts `string | NodeReferenceValue`.

In `@_linked/memstore`, `NamedNode` will satisfy `NodeReferenceValue` since NamedNode already has an `id` property (its URI). This means memstore code can pass NamedNode objects wherever `NodeReferenceValue` is expected.

### Shape instances no longer point to a NamedNode

The current `Shape` instances hold a reference to a `NamedNode` (the RDF node they represent). In `@_linked/core`, this is removed. Shape becomes a purely static construct: `static shape: NodeShape`, `static queryParser: IQueryParser`, and static methods (`select()`, `create()`, `update()`, `delete()`).

Instance methods that operate on RDF data (`getOne()`, `getAll()`, `set()`, `overwrite()`, `hasProperty()`) are removed — those belong in `@_linked/memstore` where Shape subclasses will extend the core Shape and add back NamedNode-backed instance behavior.

The decorated property accessors are kept as decorators only — the decorators register PropertyShape metadata, but the accessor implementations (which currently read from the RDF graph) are removed.

### Property accessors: `declare` preferred, empty getter if needed

Shape properties use `declare` syntax:

```typescript
@linkedShape
class Person extends Shape {
  @literalProperty({path: name, maxCount: 1})
  declare name: string;
}
```

This works because query tracing uses Proxy-based interception (see below), not getter overriding. The `declare` keyword has no runtime effect — it only tells TypeScript the property exists for type-checking. The decorator registers the PropertyShape metadata.

If it turns out that some mechanism needs a getter to exist at runtime, we can fall back to `get name(): string { return null; }`, but `declare` is the preferred approach.

### Proxy-based query tracing (no TestNode)

The current `TraceShape.ts` / `TestNode extends NamedNode` mechanism is replaced with Proxy-based tracing. This is already implemented in the codex branch's `SelectQuery.ts`:

1. `Shape.select((p) => p.name)` creates a `SelectQueryFactory`.
2. The factory creates a dummy `new Shape()` instance and wraps it in a `Proxy` via `QueryShape.create()`.
3. When `p.name` is accessed, the Proxy handler intercepts it, looks up the PropertyShape by label using `getPropertyShapeByLabel()`, and returns a `QueryBuilderObject` (either `QueryValue` for literals or `QueryShape`/`QueryShapeSet` for objects).
4. The returned `QueryBuilderObject` captures the property path as a linked list of `PropertyShape` references.
5. After the callback returns, `getQueryPaths()` unwinds these linked lists into `QueryPropertyPath[]`.

No `TestNode`, no `NamedNode`, no `Quad` creation. The entire trace is just PropertyShape metadata references.

`TraceShape.ts` can be deleted entirely.

### SHACL metadata as QResult<NodeShape> (plain JS objects)

The current `SHACL.ts` creates actual RDF triples for metadata. This is replaced with plain JS objects typed as `QResult<NodeShape>` — meaning objects with an `id` key and properties defined by the NodeShape schema.

The codex branch shows the target structure:

- **`NodeShape`** — a class with `id: string`, `label?: string`, `targetClass?: NodeReferenceValue`, `propertyShapes: PropertyShape[]`, and a `properties` getter returning `PropertyShapeResult[]`.
- **`PropertyShape`** — a class with `id: string`, `label: string`, `path: NodeReferenceValue`, `maxCount?`, `minCount?`, `datatype?: NodeReferenceValue`, `nodeKind?: NodeReferenceValue`, `shape?: NodeReferenceValue`, `name?`, `description?`, `valueShapeClass?: typeof Shape`.
- **`PropertyShape.getResult()`** returns a `PropertyShapeResult = QResult<null, {path: NodeReferenceValue, ...}>` — the plain JS representation.

The key utility to preserve: **given a node shape ID, find the shape class that generated it** — implemented via `ShapeClass.ts` with `registerShapeClass()` / `getShapeClassById()` maps.

Validation logic (ValidationReport, ValidationResult, etc.) is removed from core — it operates on RDF triples and belongs in `@_linked/memstore`.

### Package.ts switches to plain JS metadata

The current `Package.ts` creates RDF quads for registration. In `@_linked/core`, it stores metadata as plain JS maps and `NodeReferenceValue` objects. The codex branch shows the target:

- `@linkedShape` calls `ensureShape()` which creates a `NodeShape` with a generated ID (`getNodeShapeUri(packageName, shapeName)`) and registers it via `registerShapeClass()`.
- `@literalProperty` / `@objectProperty` create `PropertyShape` instances with generated IDs and add them to the `NodeShape`.
- `targetClass` is set manually after class definition: `Person.shape.targetClass = {id: personClass}`.
- The React decorators (`@linkedComponent`, `@linkedSetComponent`) are removed.

### Ontology files use NodeReferenceValue objects

The current `ontologies/rdf.ts`, `ontologies/shacl.ts`, `ontologies/xsd.ts` etc. instantiate `NamedNode`. In `@_linked/core`, they export `NodeReferenceValue` objects instead:

```typescript
// ontologies/xsd.ts
export const xsd = {
  integer: {id: 'http://www.w3.org/2001/XMLSchema#integer'} as NodeReferenceValue,
  string: {id: 'http://www.w3.org/2001/XMLSchema#string'} as NodeReferenceValue,
  boolean: {id: 'http://www.w3.org/2001/XMLSchema#boolean'} as NodeReferenceValue,
  dateTime: {id: 'http://www.w3.org/2001/XMLSchema#dateTime'} as NodeReferenceValue,
  // ...
};
```

Or, where only the string URI is needed, plain string constants suffice.

---

## Phase 1 — Baseline verification

- Confirm `rebrand/linked-js2/src` mirrors the current root `src/` structure.
- Verify build configs are present and the package compiles (tsconfig/tsconfig-cjs/tsconfig-esm).
- Run the existing tests (query-object tests, type inference tests) and confirm they pass.
- Establish the green baseline: build passes, tests pass, type inference is correct. Every subsequent phase must maintain this.

## Phase 2 — Remove React layer

- Delete React utility files: `LinkedComponent.ts`, `LinkedComponentClass.tsx`, `Hooks.ts`.
- Remove `@linkedComponent`, `@linkedSetComponent`, `@linkedComponentClass` from `Package.ts`.
- Remove React from `package.json` dependencies.
- Delete all React-related tests (in `src/tests/old/`).
- Strip React imports from any remaining files.
- Verify build compiles, tests pass, type inference intact.

**Expected difficulty:** Low. React is not imported by any of the query or shape files. The active tests don't use React. This is mostly deleting files and cleaning `Package.ts`.

## Phase 3 — Replace NamedNode with NodeReferenceValue

This is the core transformation. Replace `NamedNode` usage across the codebase with `NodeReferenceValue = {id: string}`. This phase is broken into small sub-steps. After **each** sub-step: verify build compiles, tests pass, and type inference is intact.

**Sub-step 3.1 — Introduce NodeReferenceValue as the canonical type.**
Export `NodeReferenceValue` from a central location (it already exists in `QueryFactory.ts`). Add `toNodeReference()` helper. These coexist with `NamedNode` temporarily.

**Sub-step 3.2 — Convert property paths in decorators/PropertyShape.**
Change `PropertyShape.path` from `NamedNode` to `NodeReferenceValue`. Update `PropertyShapeConfig` to accept `string | NodeReferenceValue`. Update `SHACL.ts` property shape creation to use `toNodeReference()`. Update tests: replace `NamedNode.getOrCreate('name')` with string or `NodeReferenceValue` literals.

**Sub-step 3.3 — Convert ontology files.**
Replace `NamedNode` instantiation in `ontologies/*.ts` with `NodeReferenceValue` object literals. Update all imports of ontology terms.

**Sub-step 3.4 — Strip Shape.ts and replace TraceShape/TestNode with Proxy-based tracing.**
These two changes are tightly coupled and should happen together. Remove the `NamedNode` instance reference from Shape. Remove instance methods that operate on RDF data (`getOne`, `getAll`, `set`, `overwrite`, `hasProperty`, etc.). Keep the static structure: `static shape`, `static queryParser`, static CRUD methods. Keep decorated property accessors as `declare` (or empty getters if needed). Simultaneously, delete `TraceShape.ts` and implement Proxy-based query tracing in `SelectQuery.ts` — the key change: `SelectQueryFactory.getQueryShape()` creates a dummy Shape instance, wraps it in `QueryShape.create()` (Proxy), and invokes the callback. Update `QueryContext.ts` if needed. The codex branch `Shape.ts` and `SelectQuery.ts` are the reference targets.

**Sub-step 3.5 — Convert SHACL.ts to plain JS metadata.**
Replace the RDF-triple-based `NodeShape` / `PropertyShape` with plain JS classes (reference: codex branch `ShapeDefinition.ts` + `PropertyShape.ts`). Remove `ValidationReport`, `ValidationResult`, and validation logic. Preserve: metadata tracking, `getPropertyShapes()`, `getNodeShapeUri()`, property shape IDs.

**Sub-step 3.6 — Convert Package.ts to plain JS metadata.**
Remove RDF quad creation. Replace with `NodeShape`/`PropertyShape` construction and `registerShapeClass()` calls. Reference: codex branch `decorators.ts`.

**Sub-step 3.7 — Convert remaining utilities.**
Update `ShapeClass.ts`, `LinkedStorage.ts`, and any other files that still import from `models.ts`. Reference: codex branch versions.

**Sub-step 3.8 — Delete RDF model files.**
Once no file imports from `models.ts`, delete: `models.ts`, `Datafactory.ts`, `LocalQueryResolver.ts`, and RDF-dependent collections (`NodeSet`, `NodeMap`, `NodeURIMappings`, `NodeValuesSet`, `QuadSet`, `QuadMap`, `QuadArray`). Delete CSS files.

## Phase 4 — Clean up remaining utilities & exports

- Audit `utils/` — remove any utilities unused after Phase 2–3 pruning (likely: `NQuads`, `ForwardReasoning`, `Find`, `Order`, `ClassNames`, `Debug`, `LinkedFileStorage`, `Prefix`, `NameSpace`, `Module`, `TraceShape`, `cached`).
- Audit `collections/` — keep only what core needs (`CoreSet`, `CoreMap`, `ShapeSet`, `ShapeValuesSet`, `SearchMap` — evaluate each).
- Audit `events/` — keep if the query/shape system uses `EventEmitter`/`EventBatcher`, remove otherwise.
- Audit `interfaces/` — remove interfaces that are no longer needed (e.g. `IFileStore`, `IClass`, `ISingleGraphObject`, `Component`).
- Update `index.ts` to export only the `@_linked/core` public API.
- Rename the package in `package.json` to `@_linked/core`.
- Verify build compiles, tests pass, type inference intact.

## Phase 5 — Final test suite for `@_linked/core`

- Rename `query.test.tsx` to `query.test.ts` (no React).
- Remove old/archived tests from `src/tests/old/`.
- Adopt the `query-fixtures.ts` shared factory pattern from the codex branch so the same shapes/queries can be reused by `@_linked/memstore`.
- Ensure all tests run and pass against the pruned package.
- Verify type inference tests still validate that inferred result types are correct.

## Phase 6 — Integration verification with `@_linked/memstore`

- Confirm `@_linked/memstore` can depend on `@_linked/core` as a peer dependency.
- Reuse query fixtures from `@_linked/core` tests inside `@_linked/memstore` tests to validate runtime query execution.
- Validate that type inference flows correctly from core shapes through memstore query resolution.
- Tests must fail if inference breaks (no `unknown` or `any` leaks).
