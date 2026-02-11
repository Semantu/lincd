---
summary: Remove unused packages (linked-js, linked-js2), fix core scripts to use npx, set up AGENTS.md with planning/implementation workflow, docs/ folder with frontmatter, and changelogs in all READMEs.
packages: [core, rdf-mem-store, react]
---

# Workspace cleanup and agent docs setup

## What was done

1. **Removed `linked-js` and `linked-js2`** from `rebrand/`. Earlier extraction attempts no longer needed.

2. **Fixed `core/package.json` scripts** — replaced `node ../../node_modules/.bin/<tool>` with `npx <tool>` in `build`, `compile`, and `test` scripts. The old paths pointed two levels up to the monorepo root, breaking if the workspace were extracted into its own repo. Now matches the pattern used by `rdf-mem-store` and `react`.

3. **Verified all tests pass** after `npm install`:
   - core: 4 suites, 98 passed, 71 skipped
   - rdf-mem-store: 2 suites, 76 passed
   - react: 2 suites, 27 passed

4. **Created `docs/` folder** and moved the 3 extraction plans into it with numbered prefixes and YAML frontmatter (`summary` + `packages`).

5. **Created `AGENTS.md`** at workspace root with:
   - Workspace structure and test commands
   - Docs conventions (numbered files, frontmatter, browse commands)
   - Planning and implementation workflow: when to plan, plan structure (key considerations, potential problems, phases), user review before implementation, one commit per phase with validation, phase reports, wrap-up consolidation
   - Changelog requirements in package READMEs

6. **Added `## Changelog` sections** to `rdf-mem-store/README.md` and `react/README.md` (core already had one).

## Key decisions

- Single `docs/` folder at workspace root rather than per-package folders — extraction docs are cross-cutting.
- YAML frontmatter for machine-readable summaries (survives git, greppable with `head -4`).
- Plan doc and agent doc are the same file — starts as a plan, evolves during implementation, gets consolidated at wrap-up.
- End-of-session consolidation rather than continuous updates — saves tokens, produces more coherent docs.

## Thread continuation (February 11, 2026)

### What changed

1. Split extraction docs out of workspace-level `rebrand/docs/` into package-specific docs folders:
   - `rebrand/core/docs/001-core-extraction.md`
   - `rebrand/rdf-mem-store/docs/001-rdf-mem-store-extraction.md`
   - `rebrand/react/docs/001-react-extraction.md`

2. Copied `rebrand/AGENTS.md` into each package and updated the opening section so each file is repo-specific (not workspace-specific):
   - `rebrand/core/AGENTS.md`
   - `rebrand/rdf-mem-store/AGENTS.md`
   - `rebrand/react/AGENTS.md`

3. Kept `rebrand/docs/004-workspace-cleanup-and-agent-docs-setup.md` at workspace level as requested.

4. Added per-package `.gitignore` files in each package folder:
   - `node_modules/`
   - `lib/`

5. Standalone readiness changes kept in workspace copy:
   - `rebrand/rdf-mem-store/package.json`: `@_linked/core` peer dependency set to `^1.0.0`
   - `rebrand/rdf-mem-store/jest.config.js`: removed workspace path mapper entries
   - `rebrand/react/package.json`: `@_linked/core` peer dependency set to `^1.0.0`; added `@_linked/rdf-mem-store` dev dependency `^1.0.0`
   - `rebrand/react/jest.config.js`: removed workspace path mapper entries for core/rdf-mem-store

### Standalone repo commits and pushes

- `rebrand/core`: `8482c02` pushed to `git@github.com:Semantu/linked.git` (`main`)
- `rebrand/rdf-mem-store`: `bbecbe9` pushed to `git@github.com:Semantu/rdf-mem-store.git` (`main`)
- `rebrand/react`: `06c4130` pushed to `git@github.com:Semantu/linked-react.git` (`main`)
