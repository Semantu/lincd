# @_linked/react — extraction plan

## Context

This package will contain all React-specific integrations that were removed from core during this extraction. The core package now only ships the query DSL, SHACL metadata, and package registration.

React-related functionality removed from core during this work (must live here):
- `linkedComponent` / `linkedSetComponent` decorators and any React linking helpers.
- `LinkedComponentClass` and related component base classes.
- React hooks and utilities (if present in original LINCD).
- Query preloading helpers that are React-oriented (e.g. component-linked preloads).
- Any JSX/TSX-based tests and React test environment setup.

## Known removals from core (from this thread)

- Core now uses `testEnvironment: "node"` and no TSX tests.
- Proxy-based query tracing replaces `TraceShape`/`TestNode`.
- Shape instances no longer have RDF-backed instance methods (React components must not depend on them).
- `linkedComponent`/`linkedSetComponent` are not in core; they must be reintroduced here.

## Phase 0 — Baseline import

- Start from original `src/` React files (from root `src/`).
- Create new package `rebrand/react` (or `rebrand/react` naming as agreed).
- Update package name to `@_linked/react` and set build/test scripts.

## Phase 1 — Dependency alignment

- Replace `lincd/*` imports with `@_linked/core/*` and `@_linked/rdf-mem-store` where needed.
- Ensure React package depends on core for queries/metadata.

## Phase 2 — React API surface

- Restore `linkedComponent` and `linkedSetComponent`.
- Ensure React components can run queries and preload subqueries.
- Integrate preloading so nested component trees can be fetched in one request.

## Phase 3 — Tests

- Restore React tests (TSX) and run under a React/JSDOM test environment.
- Validate component query binding and preload behavior.

## Phase 4 — Final verification

- Confirm core + react + memstore integration works together.
- Document migration notes (import path updates and required package split).
