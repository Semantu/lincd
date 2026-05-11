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
