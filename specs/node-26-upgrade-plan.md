# Implementation Plan: Upgrade Node.js runtime from 22 to 26

**Spec**: `specs/node-26-upgrade.md`
**Created**: 2026-08-07
**Status**: completed

## Components

### 1. Dockerfile (production)
- **Purpose**: Pin builder + production stages to `node:26-alpine` by digest
- **Files**: `Dockerfile`
- **Effort**: XS

### 2. Dockerfile.dev
- **Purpose**: Bump floating tag to `node:26-alpine`
- **Files**: `Dockerfile.dev`
- **Effort**: XS

### 3. package.json
- **Purpose**: Bump `engines.node` and `@types/node`
- **Files**: `package.json`, `pnpm-lock.yaml`
- **Effort**: XS

### 4. CI workflow
- **Purpose**: Bump `node-version: 26` in `lint`/`test`/`build` jobs; add new `docker-build` job
- **Files**: `.github/workflows/ci.yml`
- **Effort**: S

## Dependencies

### Build Order
1. `package.json` (`engines` + `@types/node`) — no build dependency, do first
2. `Dockerfile` / `Dockerfile.dev` — independent of package.json edit
3. `ci.yml` — depends on nothing else being broken; do last so local verification (typecheck/build) happens before touching CI

### External Dependencies
- `node:26-alpine` digest — already resolved: `sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019`
- `@types/node@^26.2.0` — already confirmed published

## Risks & Assumptions

### Risks
- **Risk**: A dependency in `pnpm-lock.yaml` has an `engines.node` constraint incompatible with 26 → mitigated by running `pnpm install` and `pnpm run validate` locally before touching CI. No incompatibility found.
- **Risk**: New `docker-build` CI job adds runtime to every PR → mitigated by keeping it a plain `docker build` (no push), which is fast
- **Realized risk (found during implementation)**: `node:26-alpine` dropped bundled `corepack` — `RUN corepack enable && corepack prepare pnpm@latest --activate` failed with `corepack: not found`. Fixed in `Dockerfile` by adding `npm install -g corepack@latest` before enabling it.

### Assumptions
- No `.nvmrc` needed (repo doesn't use one today, not required by acceptance criteria)
- `serve` (global npm package used in production stage) is compatible with Node 26 — validated by a successful `docker build` + healthcheck

## Milestones

- [x] Local: `pnpm install && pnpm run validate` green (build artifacts, not local Node version, are what matters for Docker)
- [x] `docker build -f Dockerfile .` succeeds and container passes healthcheck
- [x] `docker build -f Dockerfile.dev .` succeeds
- [ ] CI green on PR (lint, test, build, new docker-build) — pending push/PR

## Tasks

### Foundation
- [x] **Bump package.json engines + @types/node**
  - **Acceptance**: `engines.node` = `>=26.0.0`, `@types/node` = `^26.2.0`, lockfile regenerated
  - **Files**: `package.json`, `pnpm-lock.yaml`
  - **Tests**: `pnpm install` succeeds, `pnpm run typecheck` passes
  - **Effort**: XS

### Features
- [x] **Bump Dockerfile to node:26-alpine by digest**
  - **Acceptance**: both `FROM` lines use `node:26-alpine@sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019`; image builds; healthcheck passes
  - **Files**: `Dockerfile`
  - **Tests**: `docker build -f Dockerfile .`, `docker run` + `docker inspect` health status — both verified: healthcheck reports `healthy`
  - **Effort**: XS (actual: S — required the corepack fix above)
- [x] **Bump Dockerfile.dev to node:26-alpine**
  - **Acceptance**: floating-tag `FROM node:26-alpine`; image builds
  - **Files**: `Dockerfile.dev`
  - **Tests**: `docker build -f Dockerfile.dev .` — verified
  - **Effort**: XS

### Integration
- [x] **Bump CI node-version + add docker-build job**
  - **Acceptance**: all 3 existing `node-version:` occurrences read `26`; new job builds the production image on every PR
  - **Files**: `.github/workflows/ci.yml`
  - **Tests**: CI run green on the PR
  - **Effort**: S

## Effort Estimate

**Total Estimated**: ~S (few hours)

| Phase | Effort |
|-------|--------|
| Foundation | XS |
| Features | XS + XS |
| Integration | S |
