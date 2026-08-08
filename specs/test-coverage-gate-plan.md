# Implementation Plan: Enforce minimum test coverage as a real gate

**Spec**: `specs/test-coverage-gate.md`
**Created**: 2026-08-07
**Status**: completed

## Components

### 1. Delete `src/main.ts`
- **Purpose**: This file is leftover "Hello World TypeScript Application" boilerplate from the original project template (console.log demo, `greetUser`, `fetchData`, a DOM "pipeline" animation demo) — verified via `grep` that `index.html` loads `/src/main.tsx` as the sole entry point, and nothing else in the repo imports `src/main.ts`. It's dead code, not app logic, and it's the single largest drag on global coverage (11/43 lines = 23.4%, dragging `src` stmts from ~82% to ~76% with `coverage.all: true`). Deleting it is strictly better than excluding it from coverage config, since it also removes genuine dead weight from the repo.
- **Files**: delete `src/main.ts`
- **Effort**: XS

### 2. `vite.config.ts` — coverage config
- **Purpose**: Add `coverage.all: true` + `coverage.include: ['src/**']` so every source file counts (not just files touched by the current import graph), plus `coverage.exclude` for `src/main.tsx` (1-line DOM bootstrap/`createRoot().render()` call — genuinely the real entry point, but not worth testing for 1 line of framework wiring) and the standard non-logic globs (`**/*.css`, `**/vite-env.d.ts`, `**/types/**` — verified `src/types/index.ts` is interface-only, 0 executable statements). Add `coverage.thresholds`: `src/utils/**` → 90, `src/services/**` → 90, global → 80.
- **Files**: `vite.config.ts`
- **Effort**: XS

### 3. Close any remaining gap
- **Purpose**: After deleting `main.ts` and excluding `main.tsx`, verify the global number actually clears 80%. Baseline investigation (this session, with `all:true` + `include` temporarily applied then reverted): `App.tsx` 96.5%, `togetherApi.ts` 96.9%, `parseResponse.ts` 100%, `useTheme.ts` 100%, `InputSection.tsx` 66.7% (lines 29-30 uncovered — a small conditional branch). With `main.ts`/`main.tsx` out of the denominator, global stmts should land comfortably above 80%, but `InputSection.tsx`'s gap should be closed for headroom rather than left to make the gate brittle on the next unrelated change.
- **Files**: possibly `src/components/InputSection.tsx` test additions (`InputSection.test.tsx` already exists)
- **Effort**: XS

### 4. `CLAUDE.md` — document thresholds
- **Purpose**: Add the coverage thresholds (90% utils/services, 80% global) to the quality-gates guidance. Coordinates with issue #1's full rewrite — land as part of #1's implementation (see that plan), not duplicated here.
- **Files**: `CLAUDE.md` (deferred to claude-md-documentation-plan.md)
- **Effort**: — (tracked under #1)

## Dependencies

### Build Order
1. Delete `src/main.ts` (removes the dead weight first, so the next step's measurement is accurate)
2. Add `coverage.all`, `include`, `exclude` to `vite.config.ts`, re-run `pnpm run test:coverage`, confirm real numbers
3. Close any gap found in step 2 (expected: `InputSection.tsx` only)
4. Add `coverage.thresholds` last, once the suite is known to clear them — never add a threshold before confirming it passes, to avoid landing a broken gate
5. Update `scripts/validate.sh`'s test step to call `test:coverage` instead of `test:run` (protected-branch path)
6. Update `.github/workflows/ci.yml`'s `test` job to call `test:coverage` instead of `test:run` — **correction found during Plan**: this repo does have hosted CI (contrary to issue #1's original premise), and its `test` job already runs `test:run` on every push/PR, so that's the actual enforcement point for PRs, not just local pre-push

### External Dependencies
None — `@vitest/coverage-v8` already installed.

## Risks & Assumptions

### Risks
- **`InputSection.tsx` lines 29-30 uncovered**: need to check what that branch does before writing a test — if it's an edge case not worth testing (e.g. an unreachable defensive check), excluding that one block with an inline coverage comment is acceptable; otherwise add a test case. Decide during implementation, not here.
- **`scripts/validate.sh` currently calls `pnpm test:run`, not `test:coverage`**: switching it changes what "passing validate" means (adds the coverage gate to every protected-branch push). This is the whole point of the issue ("make coverage a hard gate, not decorative"), but worth flagging since it slightly increases pre-push runtime.
- **`main.ts` deletion is unrelated to the issue's literal ask** but is a prerequisite for the 80% global threshold to be meaningful rather than either (a) impossible to hit honestly, or (b) requiring an arbitrary/undocumented exclude. Confirmed dead via grep before deciding to delete rather than exclude.

### Assumptions (to validate during implementation)
- No other file in the repo dynamically imports `src/main.ts` (only checked static `grep`/import statements — reasonably confident given the file's content is unrelated demo code, but worth a final search before deleting)

## Milestones

- [x] `src/main.ts` deleted, `pnpm run build` and `pnpm run typecheck` still pass
- [x] `coverage.all`/`include`/`exclude` added, `pnpm run test:coverage` shows accurate per-file numbers including previously-hidden 100%-covered files
- [x] Global coverage ≥ 80% without thresholds configured yet (verification run)
- [x] `coverage.thresholds` added, `pnpm run test:coverage` exits 0 on `main`
- [x] Negative check: temporarily lower a source file's test coverage, confirm `test:coverage` exits non-zero, then revert (not committed)
- [x] `scripts/validate.sh` calls `test:coverage` on the protected-branch path

## Tasks

- [x] **Verify `src/main.ts` is truly dead code, then delete it**
  - **Acceptance**: `grep -rn "main\.ts[\"'\`]" --include=*.html --include=*.ts --include=*.tsx .` (excluding `main.tsx`) returns nothing outside the deleted file itself; `pnpm run build` and `pnpm run typecheck` pass after deletion
  - **Files**: delete `src/main.ts`
  - **Tests**: `pnpm run build`, `pnpm run typecheck`
  - **Effort**: XS

- [x] **Add `coverage.all`, `include`, `exclude` to `vite.config.ts`**
  - **Acceptance**: `pnpm run test:coverage` output table includes `useTheme.ts`, `parseResponse.ts` (previously hidden at 100%), excludes `main.tsx` and non-logic globs
  - **Files**: `vite.config.ts`
  - **Tests**: manual run of `pnpm run test:coverage`, inspect table
  - **Effort**: XS

- [x] **Close `InputSection.tsx` coverage gap (lines 29-30)**
  - **Acceptance**: either a new test case covers the branch, or it's excluded with a one-line documented reason (`/* v8 ignore next 2 */` or equivalent) if genuinely untestable/defensive
  - **Files**: `src/components/InputSection.test.tsx` (or `InputSection.tsx` if an ignore comment is warranted)
  - **Tests**: `pnpm run test:coverage` shows `InputSection.tsx` at 100% or documents why not
  - **Effort**: XS

- [x] **Add `coverage.thresholds` (90/90/80) to `vite.config.ts`**
  - **Acceptance**: `pnpm run test:coverage` exits 0 on current suite; temporarily lowering a threshold to 99% locally makes it exit non-zero (manual check, reverted before commit)
  - **Files**: `vite.config.ts`
  - **Tests**: `pnpm run test:coverage` (both directions, positive and negative)
  - **Effort**: XS

- [x] **Wire `test:coverage` into `scripts/validate.sh`'s protected-branch gate**
  - **Acceptance**: `scripts/validate.sh` runs `pnpm run test:coverage` instead of (or in addition to) `pnpm test:run`; script still exits 0 end-to-end on `main`
  - **Files**: `scripts/validate.sh`
  - **Tests**: run `./scripts/validate.sh` locally end-to-end
  - **Effort**: XS

- [x] **Wire `test:coverage` into `.github/workflows/ci.yml`'s `test` job**
  - **Acceptance**: the `test` job's `pnpm run test:run` step becomes `pnpm run test:coverage`; job still succeeds on `main`
  - **Files**: `.github/workflows/ci.yml`
  - **Tests**: verify locally that `pnpm run test:coverage` matches what CI would run (same command); confirm on the next push/PR that the job goes green
  - **Effort**: XS

## Effort Estimate

**Total**: XS-S (matches issue #3's original estimate) — the deleted-dead-code discovery adds a small amount of scope but removes the harder problem (writing coverage for the least valuable code in the repo).
