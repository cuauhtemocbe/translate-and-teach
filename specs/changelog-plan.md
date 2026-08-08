# Implementation Plan: Add versioned CHANGELOG.md

**Spec**: `specs/changelog.md`
**Created**: 2026-08-07
**Status**: completed

## Components

### 1. `CHANGELOG.md`
- **Purpose**: New file at repo root, Keep a Changelog format, header + one `## [1.0.0] - 2026-08-07` section (or the actual date of the last release-relevant commit — decide during implementation using `git log`) summarizing the app's current feature set, derived from the specs already in `specs/` and `git log --oneline`:
  - **Added**: English Pro Spanish→English translator (Together.ai), dark/light theme, translation timer, markdown rendering of results, configurable model via `VITE_TOGETHER_MODEL`, Railway deployment config
  - **Changed**: landing page redesign (Neo-Editorial → Ocean Blue, input-first layout), ResultCard hover interactions
  - **Fixed**: Railway build (ARG/ENV sealed variables, pnpm PATH), `@vitejs/plugin-react` v6 upgrade for Vite 8 warnings
  - **Removed**: n/a for 1.0.0 (leave the subsection present but empty per Keep a Changelog convention, or omit if genuinely nothing — decide during writing)
  - A `## [Unreleased]` section at the top (Keep a Changelog convention) for the Security Hardening milestone work (Dependabot, Socket Firewall, Biome lint, Docker digest pinning, gitleaks) — these landed after `1.0.0` was set in `package.json` and shouldn't be silently folded into the `1.0.0` entry as if they shipped with it
- **Files**: `CHANGELOG.md` (new)
- **Effort**: S (mostly research/writing, not code)

### 2. `scripts/validate.sh` — version-sync check
- **Purpose**: Add a step (protected-branch path, alongside lint/typecheck/test/build) that extracts `package.json`'s `"version"` field and the top-most `## [x.y.z]` heading from `CHANGELOG.md` (skipping over `## [Unreleased]` if present), fails the script if they don't match.
- **Files**: `scripts/validate.sh`
- **Effort**: XS

## Dependencies

### Build Order
1. Write `CHANGELOG.md` (needs the other two issues' work to reference accurately if landed first — this session's order is #3 → #1 → #5, so by the time this runs, the coverage-gate and CLAUDE.md-rewrite entries can go under `[Unreleased]` too)
2. Add the version-sync `grep`/`sed` check to `scripts/validate.sh`
3. Verify: run `./scripts/validate.sh` on `main` (should pass), then locally bump `package.json`'s version without touching `CHANGELOG.md` and confirm the script now fails, then revert the bump

### External Dependencies
None.

## Risks & Assumptions

### Risks
- **Retroactive changelog accuracy**: reconstructing "what shipped in 1.0.0" from `git log` + `specs/` is inherently approximate for a project that didn't tag releases. Mitigated by keeping the entry high-level (feature names, not commit-by-commit) and being explicit in the entry that it's a retroactive summary.
- **`## [Unreleased]` heading parsing**: the version-sync check must skip `[Unreleased]` and find the first *versioned* heading — a naive "take the first `## [...]` line" would break. Must handle this explicitly in the `grep`/`sed` pattern.

### Assumptions
- No existing release tags in the repo to cross-reference (verify with `git tag` during implementation — if tags exist, prefer them over commit-message archaeology for dating the 1.0.0 entry).

## Milestones

- [x] `CHANGELOG.md` created with `[1.0.0]` matching `package.json`
- [x] Version-sync check added to `scripts/validate.sh`, passes on `main`
- [x] Negative check confirmed (bumped version without changelog entry fails the script), then reverted

## Tasks

- [x] **Check for existing git tags to date the 1.0.0 entry accurately**
  - **Acceptance**: `git tag` output reviewed; date source documented (tag date if present, else last relevant commit date)
  - **Files**: none (investigation)
  - **Effort**: XS

- [x] **Write `CHANGELOG.md`**
  - **Acceptance**: `## [1.0.0]` section with `Added`/`Changed`/`Fixed`/`Removed` subsections, matching `package.json`'s version; `## [Unreleased]` section for work not yet reflected in `package.json`'s version
  - **Files**: `CHANGELOG.md`
  - **Tests**: manual read-through against Keep a Changelog spec
  - **Effort**: S

- [x] **Add version-sync check to `scripts/validate.sh`**
  - **Acceptance**: script extracts both versions, fails with a clear message on mismatch, passes on `main`
  - **Files**: `scripts/validate.sh`
  - **Tests**: run `./scripts/validate.sh`; separately, bump `package.json`'s version locally (uncommitted), confirm failure, then `git checkout -- package.json` to revert
  - **Effort**: XS

## Effort Estimate

**Total**: XS-S (matches issue #5's original estimate).
