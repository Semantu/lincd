# Linked Rebrand Plan (linked-js package extraction)

## Goal
Create a new `linked-js` package under `rebrand/linked-js` that contains the SHACL/shape/query DSL stack (no React and no RDF model classes). The new package should build cleanly and provide test coverage that validates the generated JS query objects from the TypeScript DSL.

## Phased Plan
1. **Create package skeleton**
   - Add `rebrand/linked-js/package.json`, `tsconfig.json`, and a minimal test runner (Jest or equivalent).
   - Add a single trivial test to verify the test harness runs.
2. **Seed with the simplest query test**
   - Identify the simplest existing query test (e.g., `Person.select(p => p.name)` or `Person.create` with one literal).
   - Copy only the minimal shape/query infrastructure required for this test.
   - Implement a way to capture the query object produced by the DSL without needing a backing store.
   - Assert on the captured query object rather than the query results.
3. **Incrementally port remaining tests**
   - Migrate tests one by one, each time copying only the minimum necessary code.
   - Keep tests focused on query-object generation (selection paths, where clauses, sorting, limits, updates/creates) rather than executing queries.
4. **Clean up dependencies**
   - Ensure no React dependencies remain.
   - Remove RDF model class dependencies (e.g., `NamedNode`, `Literal`, `Quad`).
   - Replace any remaining runtime store logic with query-object captures/mocks.
5. **Validate build + tests**
   - Run the new package build and test suites to confirm the package is standalone.

## Milestones
- Skeleton package with a passing trivial test.
- First DSL-to-query-object test passing.
- Full query test suite migrated (with updated assertions).
- Zero React/RDF model dependencies in `linked-js`.
