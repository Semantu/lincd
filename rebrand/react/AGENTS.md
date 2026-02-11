# AGENTS.md — @_linked/react repository

## Repository structure

Single-package repository for `@_linked/react` (React bindings such as `linkedComponent` and `linkedSetComponent`). Runtime dependency target is `@_linked/core`; tests may also use `@_linked/rdf-mem-store`.

Tests: `npm test`

## Agent docs (`docs/`)

Files are numbered with a 3-digit prefix for ordering. Names should be explicit about contents (lowercase-dash format). Every file starts with YAML frontmatter:

```yaml
---
summary: One-line description of what this document covers
packages: [core, react]
---
```

```bash
ls docs/                # list all docs
head -4 docs/*.md       # get summaries (or replace * with a specific file)
```

Each package also has a `README.md` with API docs and a `## Changelog` at the bottom.

## Planning and implementation workflow

### When to plan

Any task that changes package code requires a plan. Simple checks, info gathering, and discussions do not.

### Creating a plan

1. **Inspect the relevant code thoroughly** before writing anything. Read the source files, tests, and existing docs that relate to the task.
2. Create a new doc in `docs/` with the next 3-digit prefix (e.g. `005-add-filter-support.md`). Start with YAML frontmatter.
3. Write the plan with these sections:
   - **Key considerations and choices** — tradeoffs, open questions, alternatives
   - **Potential problems** — what could go wrong, edge cases
   - **Phases** — ordered list of implementation steps. Each phase has a clear scope and describes how it will be validated. Small tasks: 1-2 phases. Larger tasks: more.
4. **Ask the user to review the plan before implementing.**

### Implementing phases

- **One commit per phase.** Include the plan doc update (marking the phase complete) in the same commit.
- **Every phase must be validated** — at minimum one relevant passing test.
- **After each phase, report to the user:**
  - What was done
  - Any deviations from the plan
  - Problems encountered
  - Validation results (pass/fail counts and what was tested)
  - What you plan to do next

### Wrapping up

Before committing final changes or preparing a PR:

1. **Consolidate the plan doc** — collapse alternatives into the choices that were made, summarize implementation details and breaking changes, keep a brief problems section if relevant, remove anything redundant for future readers.
2. **Update `## Changelog`** in each affected package's `README.md` — user-facing entry covering behavior changes, new APIs, breaking changes, and migration steps.
