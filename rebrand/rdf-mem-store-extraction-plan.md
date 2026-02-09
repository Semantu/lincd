# @_linked/rdf-mem-store — extraction & alignment plan

## Context (updated)

Work already existed in branch `origin/codex/implement-additional-query-tests-in-linked-js` under `rebrand/linked-mem-store`. I have copied that folder into this branch and **renamed it** to:

- `rebrand/rdf-mem-store`

That package currently:
- contains the full in-memory RDF model layer (`models.ts`, collections, events),
- provides `InMemoryStore` and `LocalQueryResolver`,
- has a small test suite (basic model + basic query + CRUD),
- still depends on **linked-js** and its test fixtures.

The goal is to align it with the **new** `@_linked/core`, use core’s query object shapes, and run query **result** tests using the shared fixtures from core (not just query-object generation tests).

## What exists right now (from the imported folder)

- Package: `rebrand/rdf-mem-store`
- Models/collections/events: copied from monolith (`src/models.ts`, `src/collections/*`, `src/events/*`)
- Store: `src/stores/InMemoryStore.ts`
- Resolver: `src/utils/LocalQueryResolver.ts` (already rewritten to use plain `{id}` in results)
- Tests: `src/tests/models.test.ts`, `src/tests/query-basic.test.ts`, `src/tests/store.test.ts`
- Dependencies: **linked-js** (not core)

## Key constraints

- `@_linked/core` is the single source of truth for query object shapes and mutation types.
- `@_linked/rdf-mem-store` provides the RDF *models + resolver + store*.
- Tests must reuse **core query fixtures** (`@_linked/core/src/test-helpers/query-fixtures.ts`).
- Store must implement **core** `IQuadStore` and be compatible with **core** `LinkedStorage`.

## What should NOT be in this package

- Query DSL & query object construction logic
- Shape decorators / SHACL metadata generation
- React bindings / component helpers
- LinkedStorage routing logic

## Phase 0 — Baseline import (done)

- [x] Copy `rebrand/linked-mem-store` from `origin/codex/implement-additional-query-tests-in-linked-js` → `rebrand/rdf-mem-store`
- [x] Rename package to `@_linked/rdf-mem-store`

## Phase 1 — Package + dependency alignment

1) Update package metadata
- Ensure `package.json` name/version/description match new package intent.
- Adjust test script to **not** build `linked-js` first.

2) Replace `linked-js` with `@_linked/core`
- Replace all imports from `linked-js/*` to `@_linked/core/*`.
- Remove mem-store’s own `IQuadStore` in favor of core’s interface.

3) Update exports
- Keep exporting RDF models/collections/events/utils/store.
- Ensure no exports shadow core types.

## Phase 2 — Query object compatibility (core -> resolver)

Update `src/utils/LocalQueryResolver.ts` to consume core query objects:

- Property path handling
  - Core uses `PropertyShape.path` as `NodeReferenceValue | NodeReferenceValue[]`.
  - Convert to NamedNodes by `id` and handle **path arrays**.

- Node references
  - Accept `NodeReferenceValue` for comparisons (`equals`, `where`, context variables).
  - Avoid `.equals()` (NamedNode); compare via `id`.

- QueryContext / ShapeReferenceValue
  - Core query paths may start with `ShapeReferenceValue` (from `getQueryContext`).
  - If encountered, replace subject with the referenced node.

- Sorting / limit / offset
  - Implement `sortBy`, `limit`, `offset` fields on SelectQuery.

- subselect/custom object
  - Ensure custom object selections map to nested result objects (already partial).

- .as(Shape)
  - Allow `ShapeReferenceValue` in query paths (used by `.as`).

- Mutation results
  - Confirm update/create/delete result shapes match core types:
    - update → `{id, ...}` and set updates with `{updatedTo: []}`
    - create → `{id, ...}` with arrays (no `updatedTo`)

- Missing subject behavior
  - If subject ID does not exist, return `undefined` (not `null`), to match old expectations.

## Phase 3 — Store alignment with core

- Update `InMemoryStore` to implement core `IQuadStore`:
  - `selectQuery` expects `SelectQuery` (core)
  - `updateQuery` / `createQuery` / `deleteQuery` use core mutation query types

- Decide scope for graph lookup:
  - Current resolver uses `NamedNode.getAllNamedNodes()` (global).
  - Evaluate whether to restrict to `InMemoryStore.contents` instead (store-local).

- Preserve deprecated quad-level APIs only if still useful for legacy code.

## Phase 4 — Test migration (execute queries)

1) Replace test fixtures
- Use core query factories:
  - `@_linked/core/src/test-helpers/query-fixtures.ts`

2) Rebuild test dataset
- Seed the exact same graph as the old monolith tests:
  - Persons: p1, p2, p3, p4
  - Pets: dog1, dog2
  - Paths must use fixture URIs (e.g., `linked://tmp/props/name`)

3) Full query execution suite
- Re-implement (or port) old query tests:
  - basic selects, nested paths, subselects
  - `where` / `equals` / `some` / `every`
  - `size()`, `and/or`, context queries
  - `.as()` and nested `.as()`
  - `sortBy`, `limit`, `.one()`
  - `preloadFor` (if needed) — at least ensure it doesn’t break

4) Mutation tests
- Use core query factories for create/update/delete
- Assert results **and** actual graph changes

## Phase 5 — Cleanup & docs

- Update README to reflect core integration and current capabilities.
- Remove unused legacy interfaces or deprecated exports (if safe).
- Document any intentionally unsupported core features.

## Open questions / decisions to confirm

- Should resolver operate on **global NamedNode registry** or **store-local QuadSet**?
- Should updates create nodes if missing, or throw? (core update factory assumes existing id)
- What is the expected behavior when `where` is applied to empty sets (especially for `every`)?

