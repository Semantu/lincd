---
summary: Extract @_linked/rdf-mem-store from the LINCD monolith. Covers RDF model classes (NamedNode, Literal, Quad, Graph), InMemoryStore, LocalQueryResolver, and all RDF collections.
packages: [rdf-mem-store]
---

# @_linked/rdf-mem-store — extraction plan

## Repository layout

- **`src/`** — the original `lincd` source code (monolithic package). This is the source we copy from.
- **`rebrand/core/`** — the already-extracted `@_linked/core` package (query DSL, Shape, SHACL, LinkedStorage). Already done and working.
- **`rebrand/rdf-mem-store/`** — the package we are creating (this plan).
- **`rebrand/core/README.md`** — documents core's API and changelog from the original `lincd`. Read this for details on what changed.
- **`rebrand/core/src/test-helpers/query-fixtures.ts`** — shared query factories and test Shape definitions (Person, Pet, Dog). These are reused by rdf-mem-store tests.

## Goal

Create `@_linked/rdf-mem-store` by copying the entire `src/` folder into `rebrand/rdf-mem-store/src/`, then pruning and updating it so it becomes a standalone in-memory RDF store package that:

1. Contains all RDF model classes (`NamedNode`, `BlankNode`, `Literal`, `Quad`, `Graph`, etc.)
2. Contains `LocalQueryResolver` and `InMemoryStore` (implementing `IQuadStore` from core)
3. Imports query types, Shape, SHACL decorators, `LinkedStorage`, collections, and ontologies from `@_linked/core`
4. Can execute the exact same queries as `rebrand/core` test fixtures, but actually resolving them against real in-memory data and validating results

## Key constraints

- **`@_linked/core` is the source of truth** for query object shapes, type inference, Shape class, SHACL decorators, `LinkedStorage`, `IQuadStore`, ontologies, and shared collections (`CoreMap`, `CoreSet`, `ShapeSet`).
- **RDF models belong here** — `NamedNode`, `BlankNode`, `Literal`, `Quad`, `Graph`, and RDF-specific collections (`QuadSet`, `QuadArray`, `QuadMap`, `NodeSet`, `NodeMap`, `NodeURIMappings`, `SearchMap`, `NodeValuesSet`).
- **No Shape subclass needed** — the `Shape` class from core is used directly. Test shapes use `@linkedShape`/`@literalProperty`/`@objectProperty` decorators with empty accessor bodies (see core README). `InMemoryStore` extends `Shape` from core.
- **Use shared query fixtures** from `@_linked/core/src/test-helpers/query-fixtures.ts`.
- **Tests are result-validation only** — core already tests query building; this package tests that queries resolve to correct results.
- **Anything in core is not duplicated** — use core's `CoreMap`, `CoreSet`, `ShapeSet`, etc.
- **Keep `rdflib` as-is** — used by `models.ts` for `tf-types` compatibility. No changes needed.
- **Functionality stays 1:1** — changes are limited to import paths and core API adaptations.
- **Prefer local linking** via workspaces or `npm link`.

## Working rules for the implementer

1. **One commit per phase/sub-phase.** Update the plan to mark completion before committing, so the work + plan update are in the same commit. If a commit hash needs to be added later, the plan-only tweak can be bundled into the next phase's commit (no extra immediate commit).
2. **Validate after each phase/sub-phase.** If it's a test-related step, the validation must include at least one passing test relevant to that step.
3. **Report after each run.** Include:
   - What you did
   - Any problems encountered
   - Any changes that were not in the plan
   - How you validated (with explicit pass/fail counts and what was tested)
4. **State the next step.** After each phase/sub-phase, always state what the next step entails and include its exact title from the plan.
5. **Commit and update the plan** after each phase/sub-phase to indicate progress. If you later need to revert changes, either commit on top or reset to a previous commit if more applicable.
6. **Ask before deviating.** If you need to do something differently from the plan, explain why and ask for approval before proceeding.
7. **Read before writing.** Always read the relevant source files before modifying them. Don't guess at contents.
8. **Keep changes minimal.** The goal is to update import paths and adapt to core's API changes — not to refactor, improve, or restructure existing logic.
9. **For branching/parallel work**, create new plans/documents as needed and capture key context for handoff.

## Key files to read before starting

1. **`rebrand/core/README.md`** — core's API, examples, and changelog (what changed from original lincd)
2. **`rebrand/core/src/interfaces/IQuadStore.ts`** — the interface this store must implement (query-only: selectQuery, updateQuery, createQuery, deleteQuery)
3. **`rebrand/core/src/utils/LinkedStorage.ts`** — the query router (setDefaultStore, selectQuery, etc.)
4. **`rebrand/core/src/test-helpers/query-fixtures.ts`** — shared test shapes (Person, Pet, Dog) and ~60 query factories
5. **`src/utils/LocalQueryResolver.ts`** — the query resolution engine (1,775 lines). This is the most complex file to adapt.
6. **`src/models.ts`** — RDF model classes (3,254 lines). NamedNode, Literal, Quad, Graph. Stays mostly as-is.
7. **`src/tests/storage.test.ts`** — contains `InMemoryStore` class (to extract) and `TestStore`
8. **`src/tests/utils/query-tests.tsx`** — original test data setup and query result validation (reference for expected results)
9. **`src/tests/query.test.tsx`** — original test entry point (shows how store + data + tests are wired together)

## How the in-memory RDF graph works

`NamedNode` maintains a **global static registry** (`NamedNode.namedNodes: NodeMap`). When you call `NamedNode.getOrCreate(uri)`, it returns the existing singleton or creates a new one. Similarly, `Quad.getOrCreate(s, p, o, g)` creates/returns singleton quads.

When you set a property on a NamedNode (`node.set(predicate, object)`), a `Quad` is created and registered globally. Any code can then traverse the graph: `node.getAll(predicate)` returns all objects, `node.getAllInverse(predicate)` returns all subjects that point to this node via that predicate.

This means `LocalQueryResolver` doesn't need access to the store's contents — it reads the global graph directly. The `InMemoryStore.contents` QuadSet is bookkeeping for what the store "owns".

## Core package changes to account for (from core changelog)

1. **NodeReferenceValue everywhere**: Core uses `{id: string}` instead of `NamedNode` for target classes, decorator paths, datatypes, node kinds, query context.
2. **No RDF models in core**: `NamedNode`, `Literal`, `BlankNode`, `Quad`, `Graph` don't exist there.
3. **Shape is lightweight**: Core's Shape has `id?: string`, static query methods, but no RDF model ops (`getOneAs`, `getValue`, `getQuads`, etc.). Decorated accessors register SHACL metadata but have empty bodies.
4. **IQuadStore is query-only**: `selectQuery`, `updateQuery`, `createQuery`, `deleteQuery`. No quad-level `add`/`delete`/`update`/`setURIs`/`removeNodes`/`clearProperties`/`getDefaultGraph`/`loadShape`/`loadShapes`.
5. **LinkedStorage is a pure query router**: No `setQuadsLoaded`, `getGraphForStore`, `promiseUpdated`. Quad loading is done directly on the store.
6. **Ontology namespaces return `NodeReferenceValue`**: `rdf.type` → `{id: '...'}`, not `NamedNode`.
7. **Query tracing is proxy-based**: No `TestNode`/`TraceShape`.
8. **SHACL metadata is plain JS** (`QResult`), not RDF triples.
9. **Package registration** via `linkedPackage` from core.

## Architecture

### Imported from `@_linked/core`
- `Shape` class
- `IQuadStore` interface
- `LinkedStorage`
- Query types: `SelectQuery`, `CreateQuery`, `UpdateQuery`, `DeleteQuery`, `QueryFactory`
- SHACL: `@literalProperty`, `@objectProperty`, `PropertyShape`, `NodeShape`
- `@linkedShape`, `linkedPackage`
- Ontologies: `rdf`, `rdfs`, `xsd`, `shacl`, `owl`
- Collections: `CoreMap`, `CoreSet`, `ShapeSet`
- Query context: `setQueryContext`, `getQueryContext`

### Lives in this package
- **RDF models**: `NamedNode`, `BlankNode`, `Literal`, `Quad`, `Graph`, `defaultGraph`
- **RDF collections**: `QuadSet`, `QuadArray`, `QuadMap`, `NodeSet`, `NodeMap`, `NodeURIMappings`, `SearchMap`, `NodeValuesSet`
- **Events**: `EventEmitter`, `EventBatcher` (used by models)
- **LocalQueryResolver**: `resolveLocal`, `createLocal`, `updateLocal`, `deleteLocal`
- **InMemoryStore**: extends `Shape` from core, implements `IQuadStore`, delegates query resolution to `LocalQueryResolver`, plus quad-level public API (`add`, `addMultiple`, `delete`, etc.)
- **Datafactory**
- **rdflib** dependency (for tf-types)

### Not in this package (removed)
- `ShapeValuesSet` — removed entirely (only used by files that moved to core or were removed)
- No React code
- No `TraceShape`/`TestNode`
- No duplicate of anything already in core

## Potential problems / risks

### CRITICAL: LocalQueryResolver depends on NamedNode graph methods

`LocalQueryResolver` is the heart of query resolution. It depends heavily on **NamedNode instance methods** from `models.ts` (not Shape). These are all available since `models.ts` stays in this package:
- `node.getAll(predicate)` — ~12 call sites, traverses quads
- `node.getOne(predicate)` — single value lookup
- `node.set/mset/msetEach/overwrite/moverwrite` — for mutations
- `node.unset/unsetAll` — for removals
- `node.save()` / `node.remove()` — for create/delete
- `node.uri` — ~15 call sites

**However**, it also depends on two things that don't exist in core's Shape:

1. **`query.shape.getLocalInstancesByType()`** (line 684-686) — Called when no specific subject is given to find all instances of a type. This calls `targetClass.getAllInverse(rdf.type)` which walks the in-memory quad graph. Since `targetClass` is now `NodeReferenceValue` (`{id: string}`) in core, not a `NamedNode`, we need to convert it: `NamedNode.getOrCreate(query.shape.targetClass.id).getAllInverse(...)`. This pattern needs to be a utility in this package.

2. **`(query.subject as Shape).namedNode`** (line 681) — Gets the underlying NamedNode from a Shape instance. Core's Shape doesn't have `.namedNode`. Since core's Shape has `.id`, we can use `NamedNode.getOrCreate(query.subject.id)` instead.

3. **`ShapeSet.getNodes()`** (line 679, 686) — Core's `ShapeSet` doesn't have `getNodes()`. This returns a `NodeSet` by collecting `instance.node` from each Shape. We need to either add this to core's ShapeSet or provide a local helper that maps `shape.id → NamedNode.getOrCreate(shape.id)`.

### Other risks

4. **NamedNode ↔ NodeReferenceValue bridge**: Core expects `{id: string}` everywhere. `NamedNode` uses `.uri` as its primary identifier. Need to ensure `NamedNode` has an `.id` getter (aliased to `.uri`) so it satisfies `NodeReferenceValue = {id: string}`. This is critical for SHACL decorators and query context.

5. **Ontology values changed from NamedNode to plain objects**: `rdf.type` now returns `{id: '...'}` not a `NamedNode`. `LocalQueryResolver` passes ontology values like `rdf.type` to `NamedNode.set()` etc. which expect `NamedNode` arguments. All such usages need `NamedNode.getOrCreate(ref.id)` wrapping.

6. **PropertyShape.path is now `NodeReferenceValue`**: `LocalQueryResolver` calls `target.getAll(path)` where `path` comes from `PropertyShape.path`. Since `NamedNode.getAll()` expects a `NamedNode`, we need to convert: `NamedNode.getOrCreate(path.id)`.

7. **Entity URI alignment**: Core fixtures use bare IDs (`'p1'`, `'p3'`). **Decision: update core fixtures to use `linked://tmp/entities/p1` etc., and create test data with those same URIs.**

8. **Quad loading**: NamedNode/Quad instances are global singletons in `models.ts` (static maps). When you create a NamedNode and add quads to it, they exist globally in RAM. The `InMemoryStore.contents` QuadSet tracks which quads "belong" to this store, but `LocalQueryResolver` accesses the global graph directly via `NamedNode.getAll()` etc. So: test data just needs to be created (quads will be global), and the store's `contents` is only needed for the store's own bookkeeping. `store.addMultiple(quads)` adds to the store's contents set.

9. **`InMemoryStore.getDefaultGraph()` uses `this.namedNode`**: Needs updating to use `Graph.getOrCreate(this.uri || this.id)` since core's Shape has no `.namedNode`.

10. **`LinkedStorage.getGraphForStore(this)`**: Called in InMemoryStore's `addNewContents` and `_deleteMultiple`. Core's LinkedStorage doesn't have this method. Need to either inline the graph logic or remove it (simplify to always use defaultGraph).

## Running commands

All commands for core should be run from the `rebrand/core` directory. The scripts already use the root node_modules via `../../node_modules/.bin/...`, but since root uses Yarn PnP, install deps locally:

```bash
cd rebrand/core
npm install          # install deps locally (including next-tick)
npx jest --config jest.config.js   # run tests
npm run build        # CJS + ESM builds + dual-package script
```

- `npm test` / `npx jest` validates query/object tests + type inference tests.
- `npm run build` runs both CJS + ESM builds and the dual-package script.

## Phases

### Phase 0 — Prerequisite: verify core & update fixtures

- [x] Run core tests first to confirm green baseline: `cd rebrand/core && npx jest --config jest.config.js`
- [x] Update `@_linked/core/src/test-helpers/query-fixtures.ts`:
  - Added `tmpEntityBase = 'linked://tmp/entities/'` (exported)
  - Added `entity()` helper function for constructing entity refs
  - Updated all bare IDs to use full URIs via `entity('p1')` etc.
  - Updated core tests (`query.test.ts`) to expect full URIs
  - Also removed unused `eventemitter3` from tsconfig types
  - Also installed `next-tick` as a dependency (needed by Shape.ts)
- [x] Re-run core tests to verify still green (4/4 suites pass, build succeeds)

### Phase 1 — Baseline copy & package setup

- [x] Copy entire `src/` folder into `rebrand/rdf-mem-store/src/`
- [x] Create `package.json` with name `@_linked/rdf-mem-store`, peer dep on `@_linked/core`, deps: rdflib, next-tick, eventemitter3
- [x] Copy/adapt `tsconfig.json`, `jest.config.js`, build scripts from `rebrand/core` (tsconfig uses paths for `@_linked/core` → `../core/src/*`; jest uses moduleNameMapper)
- [x] Set up workspace linking to `@_linked/core` (symlink in node_modules/@_linked/core → ../core)

### Phase 2 — Prune: remove what's now in core

Remove files/directories provided by `@_linked/core`:

**Entire directories removed:**
- [x] `queries/` — all query types come from core
- [x] `shapes/` — Shape, SHACL, List come from core
- [x] `ontologies/` — all ontologies come from core
- [x] `css/` — React styling, not needed

**Individual files removed:**
- [x] `utils/LinkedStorage.ts`, `Package.ts`, `ShapeClass.ts`, `Hooks.ts`, `LinkedComponent.ts`, `LinkedComponentClass.tsx`, `TraceShape.ts`
- [x] `interfaces/IQuadStore.ts`, `IQueryParser.ts`, `IFileStore.ts`, `Component.ts`, `IClass.ts`, `ICoreIterable.ts`
- [x] `collections/CoreMap.ts`, `CoreSet.ts`, `ShapeSet.ts`, `ShapeValuesSet.ts`
- [x] `package.ts`, `index.ts`
- [x] `utils/cached.ts`, `Prefix.ts` (use from core), `Find.ts`, `ForwardReasoning.ts`, `LinkedErrorLogging.ts`, `LinkedFileStorage.ts`, `Module.ts`, `NQuads.ts`, `NameSpace.ts`, `Order.ts`, `Types.ts`, `ClassNames.ts`

**Kept:**
- [x] `models.ts`, `Datafactory.ts`
- [x] `collections/`: QuadSet, QuadArray, QuadMap, NodeSet, NodeMap, NodeURIMappings, SearchMap, NodeValuesSet
- [x] `events/`: EventEmitter, EventBatcher
- [x] `utils/`: LocalQueryResolver, URI, Debug
- [x] `interfaces/`: IGraphObject, IGraphObjectSet, ISingleGraphObject, IShape

Note: `utils/URI.ts` and `utils/Debug.ts` kept — imported by NodeSet.ts. `utils/Prefix.ts` removed — models.ts import will redirect to core in Phase 3.

### Phase 3 — Update imports to use `@_linked/core`

For all kept files, update import paths:
Updated 17 imports across 10 files:
- [x] `CoreMap` (5 imports): models.ts, NodeMap.ts, SearchMap.ts, Datafactory.ts → `@_linked/core/collections/CoreMap`
- [x] `CoreSet` (5 imports): models.ts, QuadSet.ts, NodeSet.ts, Datafactory.ts, EventBatcher.ts → `@_linked/core/collections/CoreSet`
- [x] `ICoreIterable` (6 imports): models.ts, NodeMap.ts, QuadMap.ts, NodeSet.ts, IGraphObjectSet.ts, IShape.ts → `@_linked/core/interfaces/ICoreIterable`
- [x] `Prefix` (1 import): models.ts → `@_linked/core/utils/Prefix`
- [x] LocalQueryResolver.ts: all 10 imports redirected (queries/*, shapes/*, ontologies/*, collections/*)
- [x] Models smoke test added: 6/6 pass (NamedNode singleton, Literal, set/getOne, getAll, Quad singleton, getAllInverse)
- Build: 0 errors outside LocalQueryResolver.ts (31 remaining are Phase 4/5 NodeReferenceValue bridge work)

### Phase 4 — NodeReferenceValue / NamedNode bridge

- [x] Added `get id(): string` getter on NamedNode (aliases `uri`) so it satisfies `NodeReferenceValue = {id: string}`
- [x] Created `utils/toNamedNode.ts` helper: converts `{id: string}` → `NamedNode.getOrCreate(ref.id)`, passes through NamedNode instances
- [x] Tests: 11/11 pass (6 original + 2 id-alias tests + 3 toNamedNode tests)
- [x] LocalQueryResolver fixes deferred to Phase 5 (uses toNamedNode throughout)
- [ ] InMemoryStore fixes deferred to Phase 6

### Phase 5 — Adapt LocalQueryResolver for core types (CRITICAL) ✅

This is the most complex phase. LocalQueryResolver works with NamedNode graph methods (which stay), but receives types from core that are now plain `{id: string}` objects instead of NamedNodes.

- [x] `toNamedNode` helper already created in Phase 4 (`src/utils/toNamedNode.ts`)
- [x] Added `toPropertyPath`, `getInstancesByType`, `shapeSetToNodeSet` helpers in LocalQueryResolver
- [x] Replaced `query.shape.getLocalInstancesByType().getNodes()` → `getInstancesByType(query.shape)`
- [x] Replaced `(query.subject as Shape).namedNode` → `NamedNode.getOrCreate((query.subject as any).id)`
- [x] Replaced `ShapeSet.getNodes()` → `shapeSetToNodeSet()`
- [x] Fixed `PropertyShape.path` usage in `resolveQueryPropertyPath` — convert to NamedNode[] before traversal
- [x] Fixed `PropertyShape.path` usage in `applyFieldUpdates` — convert via `toPropertyPath()`
- [x] Fixed `datatype.equals(xsd.*)` comparisons (both in `convertLiteral` and `literalNodeToResultObject`) — compare `.id` strings
- [x] Fixed `new Literal(value, xsd.*)` calls — wrap with `toNamedNode()`
- [x] Fixed `XSDDate_fromNativeDate` and `Boolean_toLiteral` — wrap datatype with `toNamedNode()`
- [x] Fixed `nodeKind === shacl.*` comparisons — compare via `.id` strings
- [x] Removed `ValidationReport` import and usage in `convertNodeDescription`
- [x] Added `getSubShapesClasses` import from core
- [x] Created end-to-end resolver tests (`src/tests/resolver.test.ts`, 9 tests)
- [x] tsc --noEmit: 0 errors
- [x] jest: 59 tests pass (11 model + 48 resolver — full select query parity with original query-tests.tsx)
- [x] Phase 5b: Expanded resolver tests to cover all non-React select queries from original src/tests/utils/query-tests.tsx
  - 8 Basic Property Selection, 5 Nested & Path Selection, 13 Filtering (Where), 12 Aggregation & Sub-Select, 6 Type Casting, 3 Sorting & Limiting
  - Test data matches original exactly: 4 persons (Semmy, Moa, Jinx, Quinn), 2 dogs, all relationships

### Phase 6 — InMemoryStore cleanup ✅

- [x] Extracted `InMemoryStore` from `tests/storage.test.ts` into `src/InMemoryStore.ts`
- [x] Implements `IQuadStore` from core (does not extend Shape — standalone class, simpler)
- [x] Keeps quad-level public methods (`add`, `addMultiple`, `delete`, `deleteMultiple`)
- [x] Replaced `LinkedStorage.getGraphForStore(this)` with `this.targetGraph || defaultGraph`
- [x] Removed `getDefaultGraph()`, `loadShape`, `loadShapes`, `clearProperties`, `setURIs`, `removeNodes` — these were either LinkedStorage-dependent or unused
- [x] tsc --noEmit: 0 errors

### Phase 7 — CRUD mutation tests ✅

- [x] Wired `ResolverQueryParser` to use real `createLocal`/`updateLocal`/`deleteLocal` via core's QueryFactory classes
- [x] Fixed `node.save()` hang in `convertNodeDescription` — replaced `await node.save()` with `node.isTemporaryNode = false` (data is already in global graph from set/overwrite calls; save() would block waiting for a LinkedStorage listener that doesn't exist in local-only context)
- [x] Ported 17 CRUD tests from original `query-tests.tsx`:
  - 1 simple literal update + verify + restore
  - 3 create tests (simple, with friends, with fixed ID)
  - 4 delete tests (by id, by reference, multiple by ids, multiple by result objects)
  - 3 unset tests (undefined, null, multi-value undefined)
  - 1 overwrite set test
  - 3 add/remove multi-value tests
  - 1 nested object with predefined ID
  - 1 date datatype update
- [x] All cleanups restore original graph state for test isolation
- [x] jest: 76 tests pass (11 model + 48 select + 17 CRUD)

### Phase 8 — Package exports & final verification ✅

- [x] Created `src/index.ts` exporting: InMemoryStore, RDF models (NamedNode, BlankNode, Literal, Quad, Graph, defaultGraph), RDF collections (QuadSet, QuadArray, QuadMap, NodeSet, NodeMap, NodeURIMappings, SearchMap, NodeValuesSet), LocalQueryResolver functions, Datafactory, EventBatcher, toNamedNode
- [x] All 76 tests pass
- [x] No circular dependencies between this package and core
- [x] Package builds (CJS + ESM) with dual-package script
- [x] Type inference flows correctly from core
- [x] Package.json exports updated to match nested output paths

**Remaining gaps / TODOs:**
- Build output is nested under `lib/{cjs,esm}/rdf-mem-store/src/` due to TS path mappings pulling in core source files (preventing `rootDir` from being set). Package.json exports are adjusted accordingly, but this could be cleaned up with TS project references or a post-build copy step.
- Quad-level storage tests from original `storage.test.ts` were NOT ported (they test LinkedStorage integration: save/remove/unset/promiseUpdated). These are integration tests that require LinkedStorage wiring which is out of scope for this standalone package.
- React component tests (9 tests) were intentionally excluded.
- The `loadShape`/`loadShapes` methods from the original InMemoryStore were not ported (depend on `Shape.getQuads()` which doesn't exist in core's Shape).

## File inventory

### Keep (RDF model layer + store)
- `models.ts` — NamedNode, BlankNode, Literal, Quad, Graph
- `Datafactory.ts`
- `collections/QuadSet.ts`, `QuadArray.ts`, `QuadMap.ts`
- `collections/NodeSet.ts`, `NodeMap.ts`, `NodeURIMappings.ts`
- `collections/SearchMap.ts`
- `collections/NodeValuesSet.ts`
- `events/*`
- `utils/LocalQueryResolver.ts`
- `interfaces/IGraphObject.ts`, `IGraphObjectSet.ts`, `ISingleGraphObject.ts`, `IShape.ts` (if needed)
- `utils/URI.ts`, `utils/Debug.ts`, `utils/Prefix.ts`, `utils/cached.ts` (if needed)

### Remove (now in core or not needed)
- `queries/*`, `shapes/*`, `ontologies/*`, `css/*`
- `utils/LinkedStorage.ts`, `utils/Package.ts`, `utils/ShapeClass.ts`
- `utils/Hooks.ts`, `utils/LinkedComponent.ts`, `utils/LinkedComponentClass.tsx`, `utils/TraceShape.ts`
- `interfaces/IQuadStore.ts`, `interfaces/IQueryParser.ts`, `interfaces/IFileStore.ts`, `interfaces/Component.ts`
- `collections/CoreMap.ts`, `collections/CoreSet.ts`, `collections/ShapeSet.ts`, `collections/ShapeValuesSet.ts`
- `package.ts`

### Transform
- `tests/storage.test.ts` → extract `InMemoryStore` to `src/InMemoryStore.ts`, keep tests separate
- `tests/query.test.tsx` + `tests/utils/query-tests.tsx` → new result-validation test using core fixtures

## Test data setup reference

Entity URIs use `linked://tmp/entities/` base (matching updated core fixtures):
```
p1: name="Semmy", birthDate=1990-01-01, nickNames=["Sem1","Sem"], friends=[p2,p3], isRealPerson=true, pets=[dog1], firstPet=dog1, pluralTestProp=[p1,p2,p3,p4]
p2: name="Moa", hobby="Jogging", bestFriend=p3, friends=[p3,p4], isRealPerson=false, pets=[dog2]
p3: name="Jinx", isRealPerson=true
p4: name="Quinn"
dog1: guardDogLevel=2, bestFriend=dog2
dog2: (no extra props)

Property URIs: linked://tmp/props/{name,hobby,nickName,bestFriend,hasFriend,birthDate,isRealPerson,hasPet,guardDogLevel,pluralTestProp}
Type URIs: linked://tmp/types/{Person,Pet,Dog}
Query context: 'user' → {id: 'linked://tmp/entities/p3'} (for Person shape)
```

## Important note on test data creation

Since `Shape` from core has no RDF model methods (no `setValue`, `overwrite`, `set`, etc.), test data must be created using **NamedNode methods directly**:

```ts
import {NamedNode, Literal} from './models';

const entityBase = 'linked://tmp/entities/';
const p1 = NamedNode.getOrCreate(entityBase + 'p1');
const p2 = NamedNode.getOrCreate(entityBase + 'p2');
// etc.

// Set literal property
p1.overwrite(NamedNode.getOrCreate(name.id), new Literal('Semmy'));
// Set object property (friend)
p1.set(NamedNode.getOrCreate(hasFriend.id), p2);
// Set rdf:type
p1.set(NamedNode.getOrCreate(rdf.type.id), NamedNode.getOrCreate(personClass.id));
```

Since quads are **global singletons** in `models.ts`, once you create them via `NamedNode.set()` etc., they exist in the global graph and `LocalQueryResolver` can find them via `NamedNode.getAll()`, `getAllInverse()`, etc.

The `InMemoryStore.contents` QuadSet is for the store's own bookkeeping. For query resolution to work, the important thing is that quads exist in the global graph (which they do automatically). We should still call `store.addMultiple(allQuads)` so the store tracks what it "owns".

## Note on `getSubShapesClasses`

`getLocalInstancesByType` in the original code also queries subclass instances via `getSubShapesClasses()`. This function **exists in core** (`@_linked/core/utils/ShapeClass`). So our `getInstancesByType` helper should import and use it:

```ts
import {getSubShapesClasses} from '@_linked/core/utils/ShapeClass';

function getInstancesByType(shapeClass: ShapeType): NodeSet<NamedNode> {
  const typeNode = toNamedNode(shapeClass.targetClass);
  const rdfType = toNamedNode(rdf.type);
  let nodes = typeNode.getAllInverse(rdfType) || new NodeSet();
  getSubShapesClasses(shapeClass).forEach((sub) => {
    if (sub.targetClass) {
      toNamedNode(sub.targetClass).getAllInverse(rdfType)?.forEach((n) => nodes.add(n));
    }
  });
  return nodes;
}
```
