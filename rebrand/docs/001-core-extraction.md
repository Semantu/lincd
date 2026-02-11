---
summary: Extract @_linked/core from the LINCD monolith using copy-then-prune. Covers query DSL, SHACL shapes, package registration, and LinkedStorage. Documents prior failed attempts and why copy-then-prune was chosen.
packages: [core]
---

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

Both folders are kept as reference for the approach and design patterns. However, we should not copy large chunks from them wholesale — the goal is to prune the existing code step by step, using the earlier attempts only as inspiration for what the target state looks like.

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

### Shared test fixtures & query factories

The test setup exports query factories — functions or objects that invoke the same queries used by both test files. This is also designed so that `@_linked/memstore` can later import the same query factories to test actual query results against the in-memory store, without duplicating the queries. One source of truth for what is being tested.

The codex branch version of `rebrand/linked-js` introduced a `test-helpers/query-fixtures.ts` that exports reusable `Person`, `Pet`, `Dog` shape classes and property path constants. This pattern should be adopted and extended with the full set of query factories.

### Methodology

1. Start from a fresh copy of root `src/` in a new `rebrand/core/` folder, reusing the root `node_modules`.
2. Incrementally remove pieces that don't belong in `@_linked/core`.
3. After each removal step, verify that build compiles and tests pass — **including type inference tests**.
4. **Commit after each successful step.** A lesson from the linked-js2 attempt: uncommitted work can be lost. Every green state should be committed so we can always recover.
5. **Tests may only be changed with explicit user approval.** If a test fails after a pruning step, ask the user for feedback rather than silently changing what is validated.
6. Use both `rebrand/linked-js` and `rebrand/linked-js2` as reference for inspiration, but don't copy large chunks wholesale — prune the existing files toward the target step by step.
7. **Update this plan after every step.** When a phase or sub-step is completed and committed, mark it as done in this file (with the commit hash) and commit the plan update. This plan is the single source of truth for progress.

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

### Phase 1 setup choices (2026-02-04)

- **Config approach:** Use the `rebrand/linked-js2` pattern for build/test configs (ts-jest running from `src/tests`, `testMatch` in `jest.config.js`, and tsconfig paths that point to the root `node_modules`). This avoids a separate build step to run tests and keeps the setup minimal.
- **Package name:** Set `package.json` name to `@_linked/core` immediately.
- **Test files:** Use `.ts` (no TSX).
- **Test environment:** Use `testEnvironment: "node"` (no React involved).
- **Sub-step 1.2 QueryCaptureStore:** Implement `select`, `create`, `update`, and `delete` from the start.
- **Copy baseline:** Copy the entire root `src/` into `rebrand/core/src/` first, then prune later.
- **Reporting rule:** After every run, report back with: what was done, any problems encountered, changes made that were not in the plan, and how the work was validated (including explicit test results like # passed/# failed and what was tested).
- **Phase commit rule:** After each phase, commit your changes and update this plan to indicate progress. If you later need to revert changes, either commit on top or reset to a previous commit if more applicable.
- **Single-commit rule:** One commit per phase/sub-step. Update this plan to mark completion *before* committing so the work + plan change are in the same commit. If you add the commit hash afterward, that plan-only tweak can wait and be included with the next phase’s commit (no extra immediate commit needed).
- **Validation rule:** Every phase or sub-step must be validated. For test-related steps, validation requires at least the relevant tests to pass (e.g., Sub-step 1.2 requires the single query test to pass).
- **Next-step rule:** In each report, briefly state what the next step entails and include the exact title of the next sub-step.

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

### Ontology files use a namespace function to create NodeReferenceValue objects

The current `ontologies/rdf.ts`, `ontologies/shacl.ts`, `ontologies/xsd.ts` etc. use a namespace pattern: a base URI string, then `NamedNode.getOrCreate(base + term)` for each term. In `@_linked/core`, the namespace pattern is preserved but produces `NodeReferenceValue` objects instead of `NamedNode` instances:

```typescript
// ontologies/xsd.ts
const base = 'http://www.w3.org/2001/XMLSchema#';
const ns = (term: string): NodeReferenceValue => ({id: base + term});

export const xsd = {
  string: ns('string'),
  boolean: ns('boolean'),
  integer: ns('integer'),
  dateTime: ns('dateTime'),
  // ...
};
```

This keeps the ontology files clean and consistent with the existing code style.

---

## Phase 1 — Setup and green baseline

Create the `rebrand/core/` working folder from scratch with an exact copy of root `src/`, set up build configs that reuse the root `node_modules`, and restructure the tests into two files (query object assertions + type inference assertions) backed by shared query factories. The goal is a fully green baseline before any pruning begins.

**Sub-step 1.1 — Create `rebrand/core/` with copy of root `src/`.** ✅ Done (c92af85)
Create the `rebrand/core/` folder. Copy the entire root `src/` directory into `rebrand/core/src/`. Add build configs (tsconfig, tsconfig-cjs, tsconfig-esm) that reuse the root `node_modules` — follow the same approach used by `rebrand/linked-js` and `rebrand/linked-js2`. Add a `package.json` with scripts for build and test. Add a `jest.config` that works with the folder structure. Verify the package compiles.

**Sub-step 1.2 — Move old tests aside, keep one query test working.** ✅ Done (c92af85)
Move all existing tests into `src/tests/old/`. Create a new `src/tests/query.test.ts` with a single test. Set up the `QueryCaptureStore` pattern (a test spy implementing `IQueryParser` that stores the last query object, assigned to `Shape.queryParser`). Get this one test passing — it should invoke a query like `Person.select(p => p.name)`, capture the query object, and assert the structure of that plain JS query object (type, shape, select paths, property shapes). Reference: the linked-js2 `query.test.tsx` for how this was done.

**Sub-step 1.3 — Create query factories (`test-helpers/query-fixtures.ts`).** ✅ Done (500ee53)
Extract the test shape definitions (Person, Pet, Dog) and property path constants into a shared `src/test-helpers/query-fixtures.ts`. This file exports the shape classes and a structured set of query factory functions — each factory invokes a specific query (e.g. `selectName()`, `selectNestedFriend()`, `filterByName()`, etc.) and returns the promise. The factories don't capture or assert anything themselves — they just invoke the query and return the promise. Each test file decides how to consume the result: `query.test.ts` intercepts the query object via `QueryCaptureStore`, while `@_linked/memstore` will later await real results. This keeps the factories pure and reusable across packages.

**Sub-step 1.4 — Build out `query.test.ts` with all ~70 non-React tests.** ✅ Done (5ae6c71)
Re-enable tests one at a time (or in small batches). For each test: use the corresponding query factory, capture the query object via `QueryCaptureStore`, and assert the structure of the resulting plain JS object in detail (type, select paths, where clauses, sort, limit, CRUD fields, etc.). Cover all 7 describe groups from the original tests: basic property selection, nested/path selection, filtering (where clauses), aggregation/sub-select, type casting/transformations, sorting/limiting, and CRUD operations. All ~70 tests should pass.

**Sub-step 1.5 — Create `query.types.test.ts` with compile-only type assertions.** ✅ Done
Create `src/tests/query.types.test.ts`. For every test in `query.test.ts`, add a corresponding test in this file. Each test is wrapped in `describe.skip` so it never runs at runtime — it only needs to compile. Each test invokes the same query factory and asserts the inferred result types by accessing properties on the result. If the code compiles, TypeScript has verified the types are correct. Use an `expectType<T>()` utility or direct typed variable assignments to make the assertions explicit and thorough. Cover all ~70 select-query tests. For operations that return `Promise<void>` or `DeleteResponse` (not rich inferred types), include at least one type assertion test per operation type — these don't need the same multiplicity as select queries since there's less type inference to verify.

**Sub-step 1.6 — Verify full green baseline.** ✅ Done
Run the full build and test suite. All ~70 tests in `query.test.ts` pass. `query.types.test.ts` compiles without errors. This is the green baseline. Commit.

## Phase 2 — Remove React layer ✅ Done

- Delete React utility files: `LinkedComponent.ts`, `LinkedComponentClass.tsx`, `Hooks.ts`.
- Remove `@linkedComponent`, `@linkedSetComponent`, `@linkedComponentClass` from `Package.ts`.
- Remove React from `package.json` dependencies.
- Delete all React-related tests (in `src/tests/old/`).
- Strip React imports from any remaining files.
- Verify build compiles, tests pass, type inference intact.

**Phase 2 follow-up — Keep `preloadFor` in core via generic component-like interface.** ✅ Done
Reintroduce `preloadFor` without React dependencies by using a generic component-like query interface, and add a minimal preload test + type assertion that mimic component usage.

**Expected difficulty:** Low. React is not imported by any of the query or shape files. The active tests don't use React. This is mostly deleting files and cleaning `Package.ts`.

## Phase 3 — Replace NamedNode with NodeReferenceValue

This is the core transformation. Replace `NamedNode` usage across the codebase with `NodeReferenceValue = {id: string}`. This phase is broken into small sub-steps. After **each** sub-step: verify build compiles, tests pass, and type inference is intact.

**Sub-step 3.1 — Introduce NodeReferenceValue as the canonical type.** ✅ Done
Export `NodeReferenceValue` from a central location (it already exists in `QueryFactory.ts`). Add `toNodeReference()` helper. These coexist with `NamedNode` temporarily.

**Sub-step 3.2 — Convert property paths in decorators/PropertyShape.** ✅ Done
Change `PropertyShape.path` from `NamedNode` to `NodeReferenceValue`. Update `PropertyShapeConfig` to accept `string | NodeReferenceValue`. Update `SHACL.ts` property shape creation to use `toNodeReference()`. Update tests: replace `NamedNode.getOrCreate('name')` with string or `NodeReferenceValue` literals.

**Sub-step 3.3 — Convert ontology files.** ✅ Done
Replace `NamedNode` instantiation in `ontologies/*.ts` with a namespace helper function that creates `NodeReferenceValue` objects. Preserve the existing namespace pattern (`const base = '...'; const ns = (term) => ({id: base + term})`). Update all imports of ontology terms.

**Phase 3 follow-up — Require NodeReferenceValue paths in decorators.** ✅ Done
Restrict `PropertyShapeConfig.path` to `NodeReferenceValue` (no string inputs) since ontology terms already provide NodeReferenceValue. Update fixtures/tests to use NodeReferenceValue paths and assert accordingly.

**Sub-step 3.4 — Strip Shape.ts and replace TraceShape/TestNode with Proxy-based tracing.** ✅ Done
These two changes are tightly coupled and should happen together. Remove the `NamedNode` instance reference from Shape. Remove instance methods that operate on RDF data (`getOne`, `getAll`, `set`, `overwrite`, `hasProperty`, etc.). Keep the static structure: `static shape`, `static queryParser`, static CRUD methods. Keep decorated property accessors as `declare` (or empty getters if needed). Simultaneously, delete `TraceShape.ts` and implement Proxy-based query tracing in `SelectQuery.ts` — the key change: `SelectQueryFactory.getQueryShape()` creates a dummy Shape instance, wraps it in `QueryShape.create()` (Proxy), and invokes the callback. Update `QueryContext.ts` if needed. The codex branch `Shape.ts` and `SelectQuery.ts` are the reference targets.

**Phase 3 follow-up — Strengthen query context tests.** ✅ Done
Expand the two query-context tests to assert the full ShapeReferenceValue structure in the generated query object (both direct context equality and context-based property paths).

**Sub-step 3.5 — Convert SHACL.ts to plain JS metadata.** ✅ Done
Replace the RDF-triple-based `NodeShape` / `PropertyShape` with plain JS classes (reference: codex branch `ShapeDefinition.ts` + `PropertyShape.ts`). Remove `ValidationReport`, `ValidationResult`, and validation logic. Preserve: metadata tracking, `getPropertyShapes()`, `getNodeShapeUri()`, property shape IDs.

**Sub-step 3.6 — Convert Package.ts to plain JS metadata.** ✅ Done
Remove RDF quad creation. Replace with `NodeShape`/`PropertyShape` construction and `registerShapeClass()` calls. Reference: codex branch `decorators.ts`.

**Phase 3 follow-up — Store package metadata in plain JS.** ✅ Done
Keep a `PackageMetadata` registry in the global LINCD tree with the same id as the old package URI, so package info remains accessible without RDF.

**Phase 3 follow-up — Add metadata registration tests.** ✅ Done
Add tests that assert package, node shape, and property shape metadata IDs and structure.

**Phase 3 follow-up — Add store routing tests.** ✅ Done
Add tests that assert LinkedStorage routes queries to the correct store based on the root shape.

**Sub-step 3.7 — Convert remaining utilities.** ✅ Done
Update `ShapeClass.ts`, `LinkedStorage.ts`, and any other files that still import from `models.ts`. Reference: codex branch versions.

**Sub-step 3.8 — Delete RDF model files.** ✅ Done (60a95f6)
Once no file imports from `models.ts`, delete: `models.ts`, `Datafactory.ts`, `LocalQueryResolver.ts`, and RDF-dependent collections (`NodeSet`, `NodeMap`, `NodeURIMappings`, `NodeValuesSet`, `QuadSet`, `QuadMap`, `QuadArray`). Delete CSS files.

## Phase 4 — Clean up remaining utilities & exports ✅ Done (a789604)

- Audit `utils/` — remove any utilities unused after Phase 2–3 pruning (likely: `NQuads`, `ForwardReasoning`, `Find`, `Order`, `ClassNames`, `Debug`, `LinkedFileStorage`, `Prefix`, `NameSpace`, `Module`, `TraceShape`, `cached`).
- Audit `collections/` — keep only what core needs (`CoreSet`, `CoreMap`, `ShapeSet`, `ShapeValuesSet`, `SearchMap` — evaluate each).
- Audit `events/` — keep if the query/shape system uses `EventEmitter`/`EventBatcher`, remove otherwise.
- Audit `interfaces/` — remove interfaces that are no longer needed (e.g. `IFileStore`, `IClass`, `ISingleGraphObject`, `Component`).
- Update `index.ts` to export only the `@_linked/core` public API.
- Rename the package in `package.json` to `@_linked/core`.
- Verify build compiles, tests pass, type inference intact.

## Phase 5 — Final test suite for `@_linked/core` ✅ Done (4a40632)

- Remove old/archived tests from `src/tests/old/`.
- Ensure all tests run and pass against the pruned package.
- Verify type inference tests still validate that inferred result types are correct.

**Phase 5 follow-up — Add unit tests for core utilities.** ✅ Done (69f5ff8)
Add coverage for `ShapeClass`, extra `LinkedStorage` behaviors, `QueryParser` delegation, `QueryContext` edge cases, and `Package.ts` registration helpers.

**Phase 5 follow-up — Add WherePath type guard for safer access.** ✅ Done (commit TBD)
Add a type guard for `WherePath` so callers can read `args` without `any` casts.

## Phase 6 — Integration verification with `@_linked/memstore`

- Confirm `@_linked/memstore` can depend on `@_linked/core` as a peer dependency.
- Import query factories from `@_linked/core` test helpers inside `@_linked/memstore` tests to validate runtime query execution with actual results.
- Validate that type inference flows correctly from core shapes through memstore query resolution.
- Tests must fail if inference breaks (no `unknown` or `any` leaks).
