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

## Working agreements (process)

- One commit per phase/sub-phase. Update this plan to mark completion **before** committing so the work + plan update are in the same commit.
- If a commit hash needs to be added later, the plan-only tweak can be bundled into the next phase’s commit (no extra immediate commit).
- After each phase/sub-phase, **validate** the work. If it’s a test-related step, validation must include at least one passing test relevant to that step.
- If a phase/sub-phase validation fails, keep working until it passes.
- After each run, report: what was done, problems encountered, changes not in the plan, and how validation was done (with explicit pass/fail counts and what was tested).
- After each phase/sub-phase, commit changes and update the plan to indicate progress. If a revert is needed, either commit on top or reset to a previous commit if more applicable.
- In status updates, always state what the next step entails and include its exact title.
- For parallel/branching work, create new plans/documents as needed and capture key context for handoff.

## What should NOT be in this package

- Query DSL & query object construction logic
- Shape decorators / SHACL metadata generation
- React bindings / component helpers
- LinkedStorage routing logic

## Phase 0 — Baseline import (done)

- [x] Copy `rebrand/linked-mem-store` from `origin/codex/implement-additional-query-tests-in-linked-js` → `rebrand/rdf-mem-store`
- [x] Rename package to `@_linked/rdf-mem-store`

## Phase A — Core type plumbing (compile-only)

Goal: point the package at core types without changing runtime behavior.

- Update imports in store/resolver/interfaces to use `@_linked/core` types.
- Add `@_linked/core` path mappings in `tsconfig.json` (keep `linked-js` for now).
- Keep existing runtime logic intact.
- Adjust package metadata/scripts only if needed to compile.

**Validation:** compile succeeds + `models.test.ts` passes.

**Status:** ✅ Completed (tsc compile + models.test: 3 passed, 0 failed).

## Phase B — Minimal query execution (first green query)

Goal: get a *single* core query executing end-to-end ASAP.

- Support a minimal `SelectQuery` with:
  - subject = undefined (all instances)
  - one property path (`NodeReferenceValue`)
  - no where/sort/limit
- Seed a minimal dataset using core fixture URIs.
- Add one execution test (e.g., `Person.select(p => p.name)`).

**Validation:** compile + that one query test passes.

## Phase C — Basic where + single subject

- Add support for `where.equals` and subject `{id}` selection.
- Add 2–3 tests: select-by-id, where equals on literal, non-existing id.

**Validation:** compile + those tests pass.

## Phase D — Mutations & CRUD smoke

- Align create/update/delete with core mutation query shapes.
- Add CRUD roundtrip test (create → select → update → delete).

**Validation:** compile + CRUD test passes.

## Phase E — Coverage expansion

- Add nested paths, some/every, size, subselects, sort/limit/one, context, `.as`, preload.
- Expand the execution test suite gradually.

**Validation:** compile + incremental test additions pass.

## Phase F — Cleanup & docs

- Update README to reflect core integration and current capabilities.
- Remove unused legacy interfaces or deprecated exports (if safe).
- Document any intentionally unsupported core features.

## Open questions / decisions to confirm

- Should resolver operate on **global NamedNode registry** or **store-local QuadSet**?
- Should updates create nodes if missing, or throw? (core update factory assumes existing id)
- What is the expected behavior when `where` is applied to empty sets (especially for `every`)?
