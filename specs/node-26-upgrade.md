---
title: Upgrade Node.js runtime from 22 to 26
status: completed
created: 2026-08-07
updated: 2026-08-07
issue: #10
---

# Upgrade Node.js runtime from 22 to 26

## Objective

Move the project's Node.js runtime from 22 to 26 across the Dockerfile, `package.json` (`engines` + `@types/node`), and CI workflows, so the build/deploy environment stays aligned with a current, supported Node.js release instead of drifting onto an outdated one.

## Context

Node 22 is pinned in four places: `Dockerfile` (builder + production stages, `node:22-alpine`), `Dockerfile.dev` (floating `node:22-alpine`), `package.json` (`engines.node: ">=22.0.0"`, `@types/node: "^22.19.17"`), and `.github/workflows/ci.yml` (three `node-version: 22` occurrences across the `lint`, `test`, and `build` jobs). `ci.yml` has no job that runs `docker build` today, so a Docker-specific regression on the new Node version would only surface at Railway deploy time, not in CI.

`node:26-alpine` is confirmed to exist on Docker Hub (`sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019` as of 2026-08-07) and `@types/node` publishes a matching `26.x` line (latest `26.2.0`). No `.nvmrc` exists in the repo.

This supersedes and absorbs issue #23 (narrower duplicate — same Dockerfile/`engines` scope, no CI coverage, version undecided). #23 was closed in favor of this spec; its health-check acceptance scenario is folded in below. Issue #6 ("pin Docker base image by digest") is already closed and merged — the production Dockerfile is pinned by digest today, so this upgrade only needs to resolve the new digest for `node:26-alpine`, no sequencing concern remains.

**Discovery during implementation**: `node:26-alpine` no longer bundles `corepack` (Node dropped it from the default install starting with this line) — the builder stage's `RUN corepack enable && corepack prepare pnpm@latest --activate` failed with `corepack: not found`. Fixed by installing it explicitly first: `npm install -g corepack@latest && corepack enable && ...`. `Dockerfile.dev` was unaffected since it installs pnpm via `get.pnpm.io/install.sh`, not corepack.

## Requirements

### Functional Requirements

- [x] `Dockerfile` builder and production stages pin `node:26-alpine` by digest
- [x] `Dockerfile.dev` uses `node:26-alpine` (floating tag, per the project's existing dev/prod pinning asymmetry)
- [x] `package.json` `engines.node` requires `>=26.0.0`
- [x] `package.json` `@types/node` is bumped to a `26.x` release
- [x] `.github/workflows/ci.yml`'s `lint`, `test`, and `build` jobs all specify `node-version: 26`
- [x] A new CI job builds the production Docker image (`docker build -f Dockerfile .`) on every PR, so a Docker-level regression is caught in CI instead of only at deploy time

### Non-Functional Requirements

- [x] No change to unrelated Dockerfile behavior (multi-stage structure, healthcheck, non-root user, ARG/ENV handling for Railway sealed variables)
- [x] No change to unrelated CI jobs' logic beyond the `node-version` bump and the new docker-build job

## Architecture

### Components

Four small, independent edits plus one new CI job — no application code changes:

1. `Dockerfile` — digest bump for both `FROM` lines
2. `Dockerfile.dev` — tag bump
3. `package.json` — `engines.node` + `@types/node` bump
4. `.github/workflows/ci.yml` — three `node-version` bumps + new `docker-build` job

### Data Model

N/A — infrastructure/config only, no application data model involved.

### External Dependencies

- `node:26-alpine` (Docker base image) — replaces `node:22-alpine`
- `@types/node@^26.2.0` (npm) — replaces `^22.19.17`

## User Stories

```gherkin
Feature: Upgrade Node.js runtime to version 26

  Scenario: Dockerfile stages pin Node 26
    Given the project Dockerfile
    When the builder and production stage base images are inspected
    Then both are based on node:26-alpine

  Scenario: package.json declares Node 26 as the minimum engine
    Given package.json
    When the engines field is inspected
    Then node is ">=26.0.0"

  Scenario: CI workflow jobs run on Node 26
    Given .github/workflows/ci.yml
    When the lint, test, and build jobs are inspected
    Then each specifies node-version: 26

  Scenario: Docker image builds successfully on Node 26
    Given a new CI job that runs docker build on the updated Dockerfile
    When the workflow executes on a pull request
    Then the image builds without errors

  Scenario: Production container passes its health check
    Given the production image built on node:26-alpine is running
    When the container has been up for at least the configured start-period
    Then "docker inspect" reports the container health status as "healthy"

  Scenario: Test suite passes on Node 26
    Given the CI test job running on Node 26
    When pnpm run test:coverage executes
    Then all tests pass and coverage thresholds are met

  Scenario: Lint and typecheck pass on Node 26
    Given the CI lint job running on Node 26
    When pnpm run lint and pnpm run typecheck execute
    Then both complete without errors
```

## Testing Strategy

### Unit / Integration Tests

No new application tests — existing suite (`pnpm run test:coverage`) must continue to pass unchanged under Node 26, verified locally and in CI.

### Build Verification

- `pnpm run typecheck && pnpm run build` locally under Node 26 (or via the Docker builder stage)
- `docker build -f Dockerfile .` and `docker build -f Dockerfile.dev .` succeed
- New CI `docker-build` job passes on the PR

### E2E / Performance Tests

N/A — out of scope for a runtime version bump.

## Boundaries & Constraints

### In Scope

- Dockerfile, Dockerfile.dev, package.json, ci.yml Node version bumps
- New CI job for `docker build`

### Out of Scope

- Re-pinning the digest policy itself (already decided/closed via #6)
- Any application code changes
- `.nvmrc` introduction (not currently used by this repo; not required by the acceptance criteria)

### Technical Constraints

- Must preserve the existing digest-pinning-for-prod / floating-tag-for-dev asymmetry documented in `CLAUDE.md`'s Security Hardening section
- `node:26-alpine` digest must be verified to exist before merge (done: `sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019`)

## Success Criteria

- [x] All Gherkin scenarios above pass (verified locally: `docker build -f Dockerfile .` + `docker inspect` health status = `healthy`; `docker build -f Dockerfile.dev .`; `pnpm run lint/typecheck/build/test:coverage`)
- [x] `pnpm run validate` (lint → typecheck → test:coverage → build → audit) is green locally
- [ ] CI (`lint`, `test`, `build`, new `docker-build`) is green on the PR (pending push/PR)
- [ ] Issue #10 closed with evidence; #23 already closed as duplicate

## Implementation Plan

See `specs/node-26-upgrade-plan.md`.
