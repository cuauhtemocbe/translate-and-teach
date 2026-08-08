---
title: CI actually runs gitleaks
status: completed
created: 2026-08-07
updated: 2026-08-07
issue: #25
---

# CI actually runs gitleaks

## Objective

Make the `test` job in `.github/workflows/ci.yml` actually invoke `gitleaks detect` against the checked-out ref, instead of installing the binary and never calling it — closing the gap between the documented "defense in depth" secret-scanning story and what CI really does.

## Context

`ci.yml`'s `test` job downloads, checksum-verifies, and installs `gitleaks` (lines 37-42), then jumps straight to `pnpm run test:run`. No `gitleaks detect`/`protect` command exists anywhere in the workflow — the install is dead weight.

Today the only secret scan that runs is `.husky/pre-commit` (`gitleaks protect --staged --redact --no-banner`), which only covers the staged diff of whoever commits, and only if they've run `pnpm install` (husky's `prepare` script) and don't pass `--no-verify`. A CI-level `gitleaks detect` scanning the full pushed ref is the backstop that catches what slips past that hook — but right now that backstop is scaffolded and inert, which is worse than not mentioning it at all, since `CLAUDE.md`'s Security Hardening section describes pre-commit scanning as if it were the sole line of defense specifically *because* "this repo has no hosted CI as a second line of defense" — untrue, CI exists, it's just not doing the job.

No `.gitleaks.toml` exists in the repo; the pre-commit hook uses gitleaks' default ruleset, so CI should match that for consistency.

## Requirements

### Functional Requirements

- [ ] The `test` job runs `gitleaks detect` against the full checked-out git history/ref after installing the binary
- [ ] The job fails (non-zero exit) if `gitleaks detect` finds a leaked secret
- [ ] No unused/dead tool installation steps remain in `ci.yml`

### Non-Functional Requirements

- [ ] Consistency: CI scan uses the same default ruleset as the pre-commit hook (no bespoke `.gitleaks.toml` introduced)
- [ ] No change to unrelated jobs (`lint`, `build`) or to the existing install/checksum step

## Architecture

### Components

Single component: one new step in the existing `test` job of `.github/workflows/ci.yml`, placed after "Install gitleaks" and before `pnpm run test:run` (ordering doesn't functionally matter between those two, but keeping the security gate early-fails faster on a real leak).

### Data Model

N/A — no application data model involved, this is CI configuration only.

### External Dependencies

- `gitleaks` v8.30.1 (already pinned/checksum-verified by the existing install step) — no version change needed.

## User Stories

```gherkin
Feature: CI actually runs gitleaks

  Scenario: gitleaks binary installed in CI is invoked
    Given the "test" job in .github/workflows/ci.yml
    When the job installs the gitleaks binary
    Then a subsequent step in the same job runs "gitleaks detect" (or equivalent) against the checked-out ref
    And the job fails if gitleaks finds a leaked secret

  Scenario: No unused installation steps remain
    Given the CI workflow file
    When reviewed for dead steps
    Then every installed tool (e.g. gitleaks) is actually invoked in the same job
```

Full story: https://github.com/cuauhtemocbe/translate-and-teach/issues/25

## Testing Strategy

### Verification (no app unit tests apply — this is CI config)

- Static check: `gitleaks detect` step present in `ci.yml` immediately after the install step, referencing the checked-out working directory
- Live verification: push a throwaway commit on a scratch branch containing a dummy secret pattern (e.g. a fake AWS-style key), confirm the `test` job fails on the gitleaks step, then revert/delete the branch
- Regression check: confirm `checkout` step already fetches enough history for `gitleaks detect` to scan (default `actions/checkout` fetch-depth is 1 — sufficient for scanning the working tree at HEAD, which is what `gitleaks detect --no-git` or a working-tree scan needs; decide during Plan whether to scan full history or just HEAD's working tree)

## Boundaries & Constraints

### In Scope
- Adding the missing `gitleaks detect` invocation to the `test` job

### Out of Scope
- Changing the pre-commit hook behavior
- Adding a `.gitleaks.toml` custom ruleset
- Upgrading the gitleaks version
- Adding gitleaks to `lint` or `build` jobs (it belongs once, in `test`, per the issue)

### Technical Constraints
- Must reuse the already-installed binary (no second install mechanism)
- Must not weaken `permissions: read-all` at the workflow level

## Success Criteria

- [ ] `gitleaks detect` (or equivalent) runs in the `test` job against the checked-out ref
- [ ] A dummy secret committed on a scratch branch makes the `test` job fail on that step
- [ ] No dead/unused install steps remain in `ci.yml`
- [ ] Code review approved, issue #25 closed with evidence

## Implementation Plan

See `specs/ci-gitleaks-detect-plan.md`.
