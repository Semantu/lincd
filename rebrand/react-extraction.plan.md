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
- Commit: `<to be filled after commit>`
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
