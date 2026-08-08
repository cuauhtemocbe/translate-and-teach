---
title: Add versioned CHANGELOG.md
status: completed
created: 2026-08-07
updated: 2026-08-07
issue: #5
---

# Add versioned CHANGELOG.md

## Objective

Add a `CHANGELOG.md` following Keep a Changelog, synced with `package.json`'s `version` field, plus a version-sync check in `scripts/validate.sh`'s protected-branch gate so a version bump without a matching changelog entry fails validation.

## Context

No `CHANGELOG.md` exists despite `package.json` declaring `"version": "1.0.0"`. The convention to follow is [Keep a Changelog](https://keepachangelog.com) (versioned sections with `Added`/`Changed`/`Fixed`/`Removed` subsections) plus Semantic Versioning.

## Requirements

### Functional Requirements

- [ ] Create `CHANGELOG.md` at repo root following Keep a Changelog structure
- [ ] Retroactively document the current `1.0.0` state as a single summarizing entry (the app's feature set as it exists today: translation, theming, timer, markdown rendering, etc. — derived from `specs/*.md` history, not git-log archaeology)
- [ ] Top-most version section in `CHANGELOG.md` matches `package.json`'s `version` field exactly
- [ ] Add a version-sync check to `scripts/validate.sh`'s protected-branch path: compare `package.json`'s `version` against the top-most `## [x.y.z]` heading in `CHANGELOG.md`, fail the script if they differ

### Non-Functional Requirements

- [ ] Check must run fast (string/regex comparison, no extra dependency)

## Architecture

### Components

1. `CHANGELOG.md` — new file, Keep a Changelog format
2. `scripts/validate.sh` — new version-sync step

### Data Model

N/A — the "schema" is Keep a Changelog's own convention: `## [version] - YYYY-MM-DD` headings with `### Added/Changed/Fixed/Removed` subsections.

### External Dependencies

None — no changelog-generation library needed for a single retroactive entry; the sync check is a plain shell comparison (`grep`/`sed` against both files).

## User Stories

```gherkin
Feature: Versioned changelog

  Scenario: CHANGELOG.md follows Keep a Changelog structure
    Given the repo root
    When an automated check parses CHANGELOG.md
    Then it finds a versioned section with Added/Changed/Fixed/Removed subsections

  Scenario: Latest changelog version matches package.json's version
    Given package.json declares "version": "1.0.0"
    When the check compares it to the top-most section in CHANGELOG.md
    Then they match

  Scenario: A version bump without a changelog entry fails the check
    Given package.json's version is bumped
    And CHANGELOG.md is not updated
    When the check runs
    Then it fails
```

Full story: https://github.com/cuauhtemocbe/translate-and-teach/issues/5

## Testing Strategy

### Verification (config/doc change, no app unit tests apply)

- Static check: `CHANGELOG.md` has a `## [1.0.0]` heading matching `package.json`'s current version, with `Added`/`Changed`/`Fixed`/`Removed` subsections present under it
- Negative check during implementation: bump `package.json`'s version locally without touching `CHANGELOG.md`, confirm `scripts/validate.sh`'s new step fails; revert before committing
- Regression check: `scripts/validate.sh` still passes end-to-end on current `main` once `CHANGELOG.md` is added and versions match

## Boundaries & Constraints

### In Scope
- `CHANGELOG.md` creation with one retroactive `1.0.0` entry
- Version-sync shell check added to `scripts/validate.sh`

### Out of Scope
- Automated changelog generation from commit messages/conventional commits (no tooling like `standard-version`/`changesets` — out of scope per issue effort XS)
- Enforcing the check in the `pre-commit` hook (lives in `validate.sh`'s protected-branch path only, same as lint/test/build)
- Retroactively reconstructing per-commit history beyond a single summarizing `1.0.0` entry

### Technical Constraints
- Must not require new dependencies (plain shell/grep in `validate.sh`)

## Success Criteria

- [ ] `CHANGELOG.md` exists with `[1.0.0]` matching `package.json`
- [ ] Version-sync check added to `scripts/validate.sh`, verified to fail on a deliberate mismatch and pass on `main`
- [ ] Code review approved, issue #5 closed with evidence

## Implementation Plan

See `specs/changelog-plan.md`.
