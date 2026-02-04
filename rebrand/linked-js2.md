# linked-js2 plan (copy-then-prune)

## Phase 0 — Baseline verification & inventory
- Confirm `rebrand/linked-js2` exists and mirrors the current root `src` structure.
- Verify configs are present for builds (tsconfig/tsconfig-cjs/tsconfig-esm).
- Note any immediate blockers (missing files, broken imports).

## Phase 1 — Baseline setup (copy root `src`, build only)
- Copy the current repo root `src` into `rebrand/linked-js2/src`.
- Add build configs that reuse the root `node_modules` (no nested installs).
- Ensure `linked-js2` can compile in isolation (build-only tsconfig).

Requirements / considerations:
- Keep the baseline as close to the original as possible to preserve type inference.
- Do not prune features yet.
- Keep build steps consistent with `rebrand/linked-js` (CJS/ESM + dual-package).

### Phase 1.2 — Move tests to old/ (keep query test)
- Move all tests except `query.test.tsx` into `src/tests/old`.
- Keep query test runnable after the move.
- ✅ Completed.

### Phase 1.3 — Query test rewrite (first test only)
- Remove React-related tests.
- Disable all tests except the first query-object test.
- Assert the query object instead of results using a capture-store approach (linked-js v1 style).
- ✅ Completed.

### Phase 1.4 — Query test expansion (all remaining)
- Re-enable remaining non-React query-object tests.
- Assert only the query object for selection/filter/aggregation/sort/CRUD.
- ✅ Completed.

### Phase 1.5 — Type inference compile checks
- Added compile-only query result type inference checks to mirror the full non-React query test matrix.
- Tests are skipped at runtime but compiled to validate inferred result shapes.
- ✅ Completed.

## Phase 2 — Prune React/component layer
- Remove React components, hooks, and any `linkedComponent`-style helpers.
- Remove React-based tests.
- Keep query-object tests only (no React or runtime assertions).

Requirements / considerations:
- Ensure query-object tests still run and pass after pruning.
- No additional refactors beyond what’s required to remove React.

## Phase 3 — Remove RDF models & store logic
- Remove RDF model types (NamedNode, Quad, Graph, etc.) from linked-js2.
- Remove LocalQueryResolver and in-memory store logic.
- Keep the query DSL, shape decorators, QueryParser, LinkedStorage interface routing.

Requirements / considerations:
- No RDF model imports remain in linked-js2.
- Shape metadata remains as plain JS objects (QResult<NodeShape>).

## Phase 4 — Align LinkedStorage, QueryParser, Package.ts, registry
- Ensure LinkedStorage forwards to the configured store (no concrete store).
- Expose `linkedPackage()` utilities without React.
- Retain registry utilities and inheritance helpers.

Requirements / considerations:
- Maintain the same surface area as linked-js v1 (minus React/RDF).

## Phase 5 — Restore inference (mem-store parity)
- Reuse query fixtures from linked-js2 in linked-mem-store tests.
- Remove all manual casts from mem-store tests.
- Validate that inference works via compile-time usage.

Requirements / considerations:
- Tests must fail if inference breaks (no `unknown`).
- Runtime parity remains in linked-mem-store, query-object tests remain in linked-js2.
