---
title: Enforce minimum test coverage as a real gate
status: completed
created: 2026-08-07
updated: 2026-08-07
issue: #3
---

# Enforce minimum test coverage as a real gate

## Objective

Make `pnpm run test:coverage` fail when coverage drops below an agreed threshold, with a higher bar for pure logic (`src/utils/**`, `src/services/**`) than for the rest of `src/**`, so coverage becomes an enforced gate instead of a number nobody looks at.

## Context

`vite.config.ts`'s `test.coverage` block has no `thresholds` — `pnpm run test:coverage` currently always exits 0 regardless of the percentage. A baseline run today reports:

```
All files      76.13% stmts / 83.96% branch / 82.05% funcs / 77.97% lines
src/services   96.87% (togetherApi.ts)
```

Notably, `src/utils/parseResponse.ts`, `src/hooks/useTheme.ts` and `src/types/index.ts` don't appear as rows in the coverage table at all today, even though they have their own `*.test.ts` files and are imported from `App.tsx`/tests — the v8 provider is only reporting files it saw executed through the specific import graph it hooked, not the full `src/` tree. This needs `coverage.all: true` (plus matching `include`) to get an honest, complete picture before thresholds are trustworthy — otherwise a file with zero tests could silently stay excluded from the denominator.

`src/main.ts` sits at 23.4% and is the main drag on the global number — it's largely bootstrap/wiring code, not business logic.

## Requirements

### Functional Requirements

- [ ] `vite.config.ts` configures `coverage.thresholds` with per-glob overrides: `src/utils/**` and `src/services/**` at 90%, `src/**` (global) at 80%
- [ ] `coverage.all: true` with an explicit `include: ['src/**']` so every source file is counted, not just files touched by the current test suite
- [ ] `pnpm run test:coverage` exits non-zero when any configured threshold is not met
- [ ] `pnpm run test:coverage` exits 0 against the current test suite once thresholds are met (closing any gaps found, e.g. `main.ts`, or excluding pure-bootstrap entry files from the global glob with a documented reason)

### Non-Functional Requirements

- [ ] No change to reporters (`text`, `lcov`, `html`) or `reportsDirectory`
- [ ] Thresholds documented in `CLAUDE.md` (coordinates with issue #1's rewrite — land after or fold into it)

## Architecture

### Components

Single component: `test.coverage` block in `vite.config.ts`. No new files, no app code changes beyond whatever's needed to close coverage gaps once `coverage.all: true` reveals them.

### Data Model

N/A — build/test tooling configuration only.

### External Dependencies

- `@vitest/coverage-v8` (already installed, provider already `v8`) — no version change needed.

## User Stories

```gherkin
Feature: Enforced minimum coverage

  Scenario: Coverage command fails below threshold
    Given coverage thresholds configured in vite.config.ts
    When `pnpm run test:coverage` runs against code with coverage deliberately below threshold
    Then the command exits non-zero

  Scenario: Coverage command passes at or above threshold
    Given the current test suite
    When `pnpm run test:coverage` runs
    Then it exits 0

  Scenario Outline: Differentiated thresholds by risk area
    Given a threshold of <threshold>% for <path>
    When coverage for that path is computed
    Then a value below <threshold>% fails the command

    Examples:
      | path             | threshold |
      | src/utils/**      | 90        |
      | src/services/**   | 90        |
      | src/**            | 80        |
```

Full story: https://github.com/cuauhtemocbe/translate-and-teach/issues/3

## Testing Strategy

### Verification (config change, not app logic)

- Static check: `vite.config.ts` has a `coverage.thresholds` block with the three glob entries above and `all: true`
- Regression check: `pnpm run test:coverage` exits 0 on current `main` once gaps are closed
- Negative check: temporarily drop a threshold to e.g. 99% locally, confirm the command exits non-zero, then revert (not committed — just a manual sanity check during implementation)

## Boundaries & Constraints

### In Scope
- `coverage.thresholds` + `coverage.all` in `vite.config.ts`
- Closing any coverage gap `coverage.all: true` reveals in `src/utils/**` and `src/services/**` (already high, likely no work) and enough of `src/**` to clear 80% globally
- Documenting thresholds in `CLAUDE.md`

### Out of Scope
- Raising coverage in `src/main.ts`/`main.tsx` beyond what's needed to clear the global 80% threshold — bootstrap code is low-value to test exhaustively; excluding it from the glob with a documented rationale is an acceptable alternative to be decided during Plan
- Mutation testing (separate concern, not requested by this issue)

### Correction (found during Plan)
The spec originally assumed "no hosted CI" (per issue #1's premise). That's false — `.github/workflows/ci.yml` exists and its `test` job already runs `pnpm run test:run` on every push/PR. The gate must be wired in **two** places, not one: `scripts/validate.sh` (local, protected-branch pre-push) and `ci.yml`'s `test` job (every push/PR) — both currently call `test:run` and both should call `test:coverage` instead.

## Success Criteria

- [ ] `pnpm run test:coverage` exits non-zero on a deliberate regression below threshold
- [ ] `pnpm run test:coverage` exits 0 on current `main` after gaps are closed
- [ ] `src/utils/**` and `src/services/**` enforced at 90%, `src/**` at 80%
- [ ] Thresholds documented in `CLAUDE.md`
- [ ] Code review approved, issue #3 closed with evidence

## Implementation Plan

See `specs/test-coverage-gate-plan.md`.
