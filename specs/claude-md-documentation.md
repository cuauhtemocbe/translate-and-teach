---
title: Document project-specific CLAUDE.md instead of generic template
status: completed
created: 2026-08-07
updated: 2026-08-07
issue: #1
---

# Document project-specific CLAUDE.md instead of generic template

## Objective

Rewrite `CLAUDE.md` to document this project's actual stack, architecture and its explicit "no hosted CI" decision, replacing the unadapted generic template so contributors and agents get accurate rules instead of placeholder text.

## Context

The current `CLAUDE.md` is verbatim the generic template — it still contains the literal "Adapting This Template" section and the sentence "This CLAUDE.example.md is a starting point." It doesn't document the project's real architecture (a React SPA with `components/`, `hooks/`, `services/`, `utils/`, `types/`).

**Correction to the original issue's premise, found while planning**: issue #1 (filed against an earlier repo state) assumed there's no hosted CI and asked to document that as a deliberate decision. That's no longer true — `git log -- .github/workflows/ci.yml` shows the workflow was added in `0b5f3fa` (before the Security Hardening milestone) and now runs `lint`, `test` (incl. gitleaks + `test:run`), and `build` jobs on every push/PR. The *current* `CLAUDE.md` Security Hardening section still says "this repo has no general hosted CI gate for human PRs" — that line is now stale and needs correcting, not preserving. The real gap isn't "no CI, here's why" — it's two layers that CLAUDE.md doesn't currently explain: hosted CI (`ci.yml`, gates PRs/pushes) plus local husky hooks + `scripts/validate.sh` (fast pre-commit/pre-push feedback before code even reaches GitHub). Both are real and worth documenting; neither substitutes for the other.

Verified during this session: `pnpm run validate` → `./scripts/validate.sh` (lint → typecheck → test → build → security audit) is the local layer, wired into the protected-branch `pre-push` hook — it runs *before* `ci.yml` would, catching issues earlier, but `ci.yml` is the actual enforced gate on GitHub (branch protection already requires the Socket Security checks per the existing Security Hardening section).

## Requirements

### Functional Requirements

- [ ] Remove the literal string "CLAUDE.example.md is a starting point" and the entire "Adapting This Template" section
- [ ] Document the real key commands: `pnpm run validate`, `pnpm test`, `pnpm run build` (and, while rewriting, the other real scripts: `lint`, `typecheck`, `test:coverage`)
- [ ] Correct the stale "this repo has no general hosted CI gate for human PRs" claim in the existing Security Hardening section, and add a section documenting both validation layers: hosted CI (`.github/workflows/ci.yml` — `lint`/`test`/`build` jobs, gates every push/PR) and local husky hooks + `scripts/validate.sh` (fast pre-commit/pre-push feedback ahead of CI)
- [ ] Rewrite the "Architecture and Design Rules" section to describe this project's real folder structure: `components/`, `hooks/`, `services/`, `utils/`, `types/` (React SPA, not the hexagonal-architecture placeholder example)
- [ ] Keep the parts of `CLAUDE.md` that are genuinely accurate today: the Skills list, Memory (Engram) protocol, and the already-project-specific "Security Hardening" section (Dependabot, Socket Firewall, pinned Docker digest, gitleaks pre-commit, Socket Security App)

### Non-Functional Requirements

- [ ] The rewritten file stays skimmable — no ballooning into exhaustive documentation; match the density of the existing Security Hardening section as the bar

## Architecture

### Components

Single component: `CLAUDE.md` at repo root. No code changes.

### Data Model

N/A.

### External Dependencies

None.

## User Stories

```gherkin
Feature: Project-specific CLAUDE.md documentation

  Scenario: CLAUDE.md no longer contains generic template placeholder text
    Given the file CLAUDE.md at the repo root
    When an automated check searches for the literal string "CLAUDE.example.md is a starting point"
    Then the string is not found

  Scenario: CLAUDE.md documents the real key commands
    Given CLAUDE.md
    When the check searches for "pnpm run validate", "pnpm test", "pnpm run build"
    Then all three are present

  Scenario: CLAUDE.md accurately documents both validation layers
    Given this repo has hosted CI (.github/workflows/ci.yml, gating lint/test/build on push/PR) and local husky hooks + scripts/validate.sh (fast pre-commit/pre-push feedback)
    When the check searches CLAUDE.md for a section describing both
    Then that section is present, references ci.yml, scripts/validate.sh and the husky hooks, and does not claim "no hosted CI"

  Scenario: CLAUDE.md documents this project's real architecture
    Given the real folder structure (components/, hooks/, services/, utils/, types/)
    When the check searches the architecture section for these folder names
    Then all are referenced
```

Full story: https://github.com/cuauhtemocbe/translate-and-teach/issues/1

## Testing Strategy

### Verification (documentation change, no app tests apply)

- Small verification script or one-off `grep` checks run during implementation, matching the four Gherkin scenarios exactly (string absence, command presence, CI-substitute section presence, architecture folder names presence) — kept as an ad hoc check, not committed as a permanent test, since this is a one-time content assertion on a doc file
- Manual read-through: does a first-time contributor/agent come away with an accurate picture of the stack and workflow?

## Boundaries & Constraints

### In Scope
- Rewriting `CLAUDE.md` end to end for accuracy
- Adding coverage-threshold documentation as a stub if issue #3 lands first (coordinate order — this repo's convention already threads them together)

### Out of Scope
- Changing `CLAUDE.example.md` itself (stays as the generic template for other projects, per its own stated purpose)
- Adding new skills or changing the skills list
- Changing husky hooks or `scripts/validate.sh` behavior (only documenting what exists)

### Technical Constraints
- Must preserve valid Markdown structure (frontmatter-free plain doc, as today)

## Success Criteria

- [ ] All four Gherkin scenarios pass
- [ ] `CLAUDE.md` accurately reflects `components/`, `hooks/`, `services/`, `utils/`, `types/` structure
- [ ] No leftover generic-template language
- [ ] Code review approved, issue #1 closed with evidence

## Implementation Plan

See `specs/claude-md-documentation-plan.md`.
