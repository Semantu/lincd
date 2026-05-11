---
summary: Extract @_linked/react from the LINCD monolith. Covers linkedComponent, linkedSetComponent, LinkedComponentClass, useStyles, and React-specific tests.
packages: [react]
---

# @_linked/react — extraction plan (rewrite)

## Goal

Create a new package at `rebrand/react` named `@_linked/react` that contains the React-specific functionality from legacy `src/`, while keeping behavior as close as possible to 1:1.

Scope for this extraction:
- `linkedComponent` / `linkedSetComponent` and their types/helpers.
- `LinkedComponentClass`.
- React utilities/hooks that belong with component integration.
- React-focused tests from `src/tests/utils/query-tests.tsx` (at minimum the React integration section), plus additional tests for uncovered React behavior.

Hard constraints:
- Runtime dependency target: `@_linked/core` only.
- Tests may use in-memory store package (`@_linked/in-mem-store` requested; current repo package is `@_linked/rdf-mem-store`).
- No intentional functionality changes without explicit user approval.

## Source Inventory (Legacy to Extract)

Primary source files in root `src/`:
- `src/utils/LinkedComponent.ts`
- `src/utils/LinkedComponentClass.tsx`
- `src/utils/Hooks.ts`
- `src/package.ts` (exports for linked decorators/helpers)
- `src/tests/query.test.tsx`
- `src/tests/utils/query-tests.tsx`
- `src/tests/components.test.tsx` (mostly commented; keep as historical reference, not a strong validation source)

Potentially relevant legacy type surface:
- `src/interfaces/Component.ts` (legacy/possibly unused, but exported path compatibility may matter)

## Important Core/Mem-Store Notes (for migration)

From `rebrand/core/README.md` changelog and current code:
- Core has moved to `NodeReferenceValue` (`{id: string}`) APIs.
- Core no longer ships RDF model classes (`NamedNode`, `Literal`, `Quad`, etc.).
- Shape instances no longer implement RDF-backed instance graph methods.
- Query tracing has changed (proxy-based; no `TraceShape`/`TestNode` in core path).
- Core package registration (`linkedPackage`) no longer includes React component factories; React must provide these.
- Core still supports `preloadFor(...)`/`BoundComponent` query linking (via component-like objects exposing `.query`).

From `rebrand/rdf-mem-store/README.md`:
- RDF models and graph mutation APIs live here (`NamedNode`, `Literal`, etc.).
- `InMemoryStore` integrates with core via `LinkedStorage.setDefaultStore(...)`.
- `toNamedNode(...)` bridges `NodeReferenceValue` to RDF model nodes.
- No explicit changelog section found; treat README API docs as current contract.

## Package Structure Target (match existing rebrand package style)

`rebrand/react` will mirror `rebrand/core` + `rebrand/rdf-mem-store` setup:
- `package.json` with dual CJS/ESM exports and aligned scripts.
- `tsconfig.json`, `tsconfig-cjs.json`, `tsconfig-esm.json`, and `tsconfig-test.json`.
- `jest.config.js`.
- `scripts/dual-package.js`.
- `src/**` with React runtime code and `src/tests/**` with TSX tests.

Workspace wiring:
- Add `react` to `rebrand/package.json` workspaces list.

## Risk Register / Potential Problems

1. Dependency-name mismatch:
- Requested test dependency is `@_linked/in-mem-store`, but repo currently contains `rebrand/rdf-mem-store` as `@_linked/rdf-mem-store`.

2. Legacy API mismatch:
- Legacy React code references RDF models and collection classes from monolithic `src/`; core no longer exports them.

3. Hooks compatibility risk:
- Legacy hooks (`useWatchProperty*`) depend on change-listener APIs from legacy model/shape runtime that are not present in core.

4. Test fixture migration risk:
- Legacy `query-tests.tsx` builds data through old shape instance mutators; new extraction should seed test data via mem-store APIs compatible with core.

5. Packaging/global registration drift:
- `linkedPackage('lincd')` naming and module tree expectations may need explicit confirmation for `@_linked/react`.

## Phase Plan

### Phase 1 — Scaffold `@_linked/react` package
Objective:
- Create package skeleton and tooling that matches `rebrand/core`/`rebrand/rdf-mem-store`.

Tasks:
- Create `rebrand/react` directories and config files.
- Configure package name `@_linked/react`.
- Add workspace entry in `rebrand/package.json`.
- Add build/compile/test scripts and dual-package script.
- Set Jest to React-capable test environment (`jsdom`) with `ts-jest`.

Validation:
- Package installs and TypeScript config resolves.
- `npm/yarn test` command can run Jest (even if tests are placeholders at this stage).

Deliverable:
- Empty-but-buildable React package scaffold.

### Phase 2 — Migrate runtime React APIs (no behavior changes)
Objective:
- Port runtime React functionality from legacy source to `rebrand/react/src`.

Tasks:
- Port `linkedComponent` / `linkedSetComponent` implementation and types.
- Port `LinkedComponentClass`.
- Port React hooks/utilities (`Hooks.ts`) with minimal required adaptation.
- Port/create package exports (`src/package.ts`, `src/index.ts`) for React API surface.
- Update imports to use `@_linked/core` paths and local react package files.

Guardrail:
- Only adjust imports/types/compatibility adapters required by extracted architecture.
- If behavior changes seem unavoidable, stop and ask user before proceeding.

Validation:
- Type-check passes for migrated files.
- Basic smoke test(s) compile against the new exports.

Deliverable:
- First working runtime API for `@_linked/react`.

### Phase 3 — Migrate and stabilize React tests
Objective:
- Port React tests from legacy suite and make them pass with core + mem-store integration.

Tasks:
- Bring over `query.test.tsx`/`utils/query-tests.tsx` React-focused tests (at minimum section "6. React Component Integration").
- Keep test logic as close as possible to legacy behavior.
- Build fixture/seeding setup using mem-store APIs (`NamedNode`/`Literal`/`toNamedNode`) and core shapes.
- Configure Jest path aliases so tests use local `rebrand/core/src`, `rebrand/react/src`, and mem-store package source.
- Add additional tests where React behavior is not covered (e.g. loading state, named-prop set query mapping, preload integration).

Validation:
- At least one React integration test passes at each sub-step.
- Final phase target: React integration suite passes in the new package.

Deliverable:
- Passing React test suite that preserves legacy behavior expectations.

### Phase 4 — Integration verification and docs
Objective:
- Verify package interoperability and document migration outcomes.

Tasks:
- Run package-level build + tests for `rebrand/react`.
- Run cross-package check(s) proving `@_linked/react` works with `@_linked/core` and mem-store in tests.
- Add/update `README.md` in `rebrand/react` with usage, package split notes, and known constraints.
- Update this plan file with completion state + commit hashes.

Validation:
- Build passes.
- React test suite passes.
- Documented import/migration guidance is present.

Deliverable:
- Ready-to-review `@_linked/react` extraction with evidence.

## Working Rules (must be followed during execution)

- One commit per phase/sub-phase. Update the plan to mark completion before committing so the work + plan update are in the same commit.
- If a commit hash needs to be added later, the plan-only tweak can be bundled into the next phase’s commit (no extra immediate commit).
- After each phase/sub-phase, validate the work. If it’s a test-related step, validation must include at least one passing relevant test.
- After each run, report:
  - What was done.
  - Problems encountered.
  - Changes not originally in the plan.
  - Validation details with explicit pass/fail counts and what was tested.
- After each phase/sub-phase, commit changes and update this plan to indicate progress.
- If a revert is needed later, either commit a follow-up revert/fix or reset to a previous commit if more applicable.
- In every status update, always state what the next step entails and include its exact phase/sub-phase title.

## Progress Tracking Template

For each completed phase/sub-phase, append:
- Status: `completed` / `in progress` / `blocked`
- Commit: `<hash>`
- Summary: `<1-3 bullets>`
- Validation:
  - Tests passed: `<n>`
  - Tests failed: `<n>`
  - Command(s): `<exact command>`
- Deviations from plan: `<none or list>`
- Next step: `<exact next phase/sub-phase title>`

## Progress Log

### Phase 1 — Scaffold `@_linked/react` package
- Status: `completed`
- Commit: `1242c6f`
- Summary:
  - Created `rebrand/react` package scaffold with package metadata, dual-output build scripts, TS/Jest config, and starter source files.
  - Added `react` to `rebrand/package.json` workspaces.
  - Added a Jest smoke test to validate TS-Jest + JSDOM wiring.
- Validation:
  - Tests passed: `1`
  - Tests failed: `0`
  - Command(s):
    - `npm run compile` (in `rebrand/react`) -> pass
    - `npm test` (in `rebrand/react`) -> pass
- Deviations from plan:
  - Added local TypeScript path mapping to `@_linked/core` in `rebrand/react/tsconfig.json` so compile works before core is built.
  - Used local npm cache (`npm install --cache ./.npm-cache`) due permission issue in `~/.npm`.
- Next step: `Phase 2 — Migrate runtime React APIs (no behavior changes)`

### Phase 2 — Migrate runtime React APIs (no behavior changes)
- Status: `completed`
- Commit: `ce4af64`
- Summary:
  - Added core-compatible React runtime implementation in `rebrand/react/src/utils/LinkedComponent.ts` for `linkedComponent` and `linkedSetComponent`.
  - Added `rebrand/react/src/utils/LinkedComponentClass.tsx` and slimmed hooks to `useStyles` only (`rebrand/react/src/utils/Hooks.ts`), removing legacy watch APIs per direction.
  - Updated package surface (`rebrand/react/src/package.ts`, `rebrand/react/src/index.ts`) to expose React APIs under package tree `@_linked/react`.
- Validation:
  - Tests passed: `3`
  - Tests failed: `0`
  - Command(s):
    - `npm run compile` (in `rebrand/react`) -> pass
    - `npm test` (in `rebrand/react`) -> pass
- Deviations from plan:
  - Added a focused runtime test file `rebrand/react/src/tests/linked-component-runtime.test.tsx` already in Phase 2 to validate migrated runtime behavior before larger Phase 3 test porting.
- Next step: `Phase 3 — Migrate and stabilize React tests`

### Phase 3 — Migrate and stabilize React tests
- Status: `completed`
- Commit: `c27016e`
- Summary:
  - Ported the legacy React integration tests (section `6. React Component Integration`) into `rebrand/react/src/tests/query-react-integration.test.tsx` with structure and assertions kept close to the original.
  - Wired tests to `@_linked/rdf-mem-store` by seeding graph data using `NamedNode`/`Literal` and resolving queries through an `InMemoryStore`-backed query parser.
  - Updated React runtime types to support typed `preloadFor(...)` and object-query `linkedSetComponent({persons: query}, ...)` test cases.
- Validation:
  - Tests passed: `12`
  - Tests failed: `0`
  - Command(s):
    - `npm run compile` (in `rebrand/react`) -> pass
    - `npm test -- --runInBand` (in `rebrand/react`) -> pass
- Deviations from plan:
  - Kept the Phase 2 runtime smoke/integration tests alongside the ported legacy integration file to preserve incremental validation.
- Next step: `Phase 4 — Integration verification and docs`

### Phase 4 — Integration verification and docs
- Status: `completed`
- Commit: `85864f5`
- Summary:
  - Added `rebrand/react/README.md` documenting package usage, dependencies, and both supported linked set component formats.
  - Verified package-level build + test for `@_linked/react`.
  - Re-ran core tests and confirmed no duplicate package-registration warning remains after moving core to a shared package singleton.
- Validation:
  - Tests passed: `129`
  - Tests failed: `0`
  - Suites passed: `7`
  - Suites skipped: `1`
  - Command(s):
    - `npx jest --config jest.config.js --runInBand` (in `rebrand/core`) -> pass (`4 passed`, `1 skipped`, `98 passed tests`)
    - `npx tsc -p tsconfig-cjs.json && npx tsc -p tsconfig-esm.json` (in `rebrand/core`) -> pass
    - `npm run build` (in `rebrand/react`) -> pass
    - `npm test -- --runInBand` (in `rebrand/react`) -> pass (`3 passed suites`, `12 passed tests`)
- Deviations from plan:
  - Included additional core verification in this phase to ensure the package-registration warning was resolved end-to-end.
- Next step: `Done`

### Phase 4a — README clarification follow-up
- Status: `completed`
- Commit: `8c9ed38`
- Summary:
  - Expanded `rebrand/react/README.md` introduction to explain query DSL to React-props mapping and linked to the core DSL section.
  - Documented `@_linked/rdf-mem-store` as the simple starter store and showed `LinkedStorage.setDefaultStore(...)` setup.
  - Removed watch-hook mention from README notes.
- Validation:
  - Tests passed: `12`
  - Tests failed: `0`
  - Command(s):
    - `npm test -- --runInBand` (in `rebrand/react`) -> pass (`3 passed suites`, `12 passed tests`)
- Deviations from plan:
  - Added a post-phase README sub-phase for clarity updates requested after Phase 4 completion.
- Next step: `Done`

### Phase 4b — Runtime behavior docs follow-up
- Status: `completed`
- Commit: `6db3a5e`
- Summary:
  - Documented loading/render lifecycle for both `linkedComponent(...)` and `linkedSetComponent(...)`, including first render loading state and rerender after query resolution.
  - Documented fixed loading fallback element (`<div class="ld-loader" role="status" aria-label="Loading" />`) and clarified that replacement is not currently configurable by API.
  - Added docs for `_refresh(updatedProps?)`, `of` vs internal `source/sources` mapping, and a full pagination example with `nextPage`, `previousPage`, `setPage`, and `setLimit`.
- Validation:
  - Tests passed: `12`
  - Tests failed: `0`
  - Command(s):
    - `npm test -- --runInBand` (in `rebrand/react`) -> pass (`3 passed suites`, `12 passed tests`)
- Deviations from plan:
  - Added additional runtime-behavior clarification section requested after initial docs completion.
- Next step: `Done`

### Phase 4c — linkedComponent docs structure follow-up
- Status: `completed`
- Commit: `fe0bdf2`
- Summary:
  - Renamed the section title from "Input props and mapped props" to `linkedComponent(...)`.
  - Rewrote the intro paragraph to clarify `Shape.query(...)` vs `Shape.select(...)`, subject binding through `of`, and top-level query key-to-prop mapping.
  - Added an explicit prop breakdown list after the `linkedComponent(...)` example and moved the `@_linked/rdf-mem-store` setup example to the bottom of the README.
- Validation:
  - Tests passed: `12`
  - Tests failed: `0`
  - Command(s):
    - `npm test -- --runInBand` (in `rebrand/react`) -> pass (`3 passed suites`, `12 passed tests`)
- Deviations from plan:
  - None.
- Next step: `Done`

### Phase 4d — `_refresh` semantics and ordering docs follow-up
- Status: `completed`
- Commit: `eac17b9`
- Summary:
  - Clarified `_refresh(updatedProps)` semantics as patching query-result keys only, not regular/custom props.
  - Moved the `_refresh` section to the bottom of the `linkedComponent(...)` section before `linkedSetComponent(...)` docs.
  - Added explicit linked-set purpose text ("render a list of sources") and appended a README TODO list for `setOffset` and configurable loader/loading state.
- Validation:
  - Tests passed: `12`
  - Tests failed: `0`
  - Command(s):
    - `npm test -- --runInBand` (in `rebrand/react`) -> pass (`3 passed suites`, `12 passed tests`)
- Deviations from plan:
  - None.
- Next step: `Done`

### Phase 5 — Gap-closure test phase
- Status: `completed`
- Commit: `1960921`
- Summary:
  - Added `rebrand/react/src/tests/gap-closure-react-behavior.test.tsx` covering loading state rendering, `_refresh()` refetch flow, `_refresh(updatedProps)` local patch flow, linked-set pagination controller methods, set-input validation, query-wrapper validation, source conversion edge cases, and component metadata exposure.
  - Added `rebrand/react/src/tests/gap-closure-hooks-and-class.test.tsx` covering `useStyles` merge behavior and `LinkedComponentClass` source-shape lifecycle behavior.
  - Exercised parser-missing error path via `_refresh()` and validated emitted runtime error capture in test harness.
- Validation:
  - Tests passed: `30`
  - Tests failed: `0`
  - Suites passed: `5`
  - Suites failed: `0`
  - Command(s):
    - `npm test -- --runInBand` (in `rebrand/react`) -> pass (`5 passed suites`, `30 passed tests`)
- Deviations from plan:
  - For `linkedSetComponent(null, ...)`, runtime currently throws `TypeError: Cannot convert undefined or null to object` before hitting the friendly `'Unknown data query type'` branch; tests assert the friendly branch via a numeric invalid input.
  - Parser-missing validation in React event flow required window error capture in tests because the error is reported as an uncaught event error in JSDOM.
- Next step: `Done`

### Phase 5a — Test-suite reorganization
- Status: `completed`
- Commit: `<to be filled after commit>`
- Summary:
  - Reorganized React package tests into two files: `react-component-integration.test.tsx` and `react-component-behavior.test.tsx`.
  - Merged utility coverage (`useStyles`, `LinkedComponentClass`) into the behavior suite and removed `react-component-utils.test.tsx`.
  - Removed legacy naming (`gap closure`) from describe blocks and dropped redundant smoke/runtime test files from the package test tree.
- Validation:
  - Tests passed: `27`
  - Tests failed: `0`
  - Suites passed: `2`
  - Suites failed: `0`
  - Command(s):
    - `npm test -- --runInBand` (in `rebrand/react`) -> pass (`2 passed suites`, `27 passed tests`)
- Deviations from plan:
  - Test count reduced from prior `30` to `27` after consolidating/removing redundant smoke/runtime coverage; behavior coverage remains represented in the remaining suites.
- Next step: `Done`
