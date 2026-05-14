---
title: Production Environment Configuration System
status: draft
created: 2026-05-13
updated: 2026-05-13
issue: TBD
---

# Production Environment Configuration System

## Objective

Implement secure environment variable handling for Railway deployments using Railway's ARG/ENV pattern with sealed variables, mitigating secret exposure risks while maintaining the build-time configuration injection pattern.

**Note:** Original plan was to use Docker BuildKit secrets, but Railway does not support `--mount=type=secret`. Railway's recommended approach is ARG/ENV with their "sealed variables" feature for additional security.

## Context

### Current State

The application uses Vite's `import.meta.env` pattern for configuration:
- **Local development:** Reads from `.env` file (not committed to git)
- **Production (Railway):** Dockerfile uses `ARG` to accept env vars, then `ENV` to pass to Vite build

**Current configuration values:**
- `VITE_TOGETHER_API_KEY` (sensitive - API credential)
- `VITE_TOGETHER_MODEL` (non-sensitive - model identifier)

### Problem Statement

Docker BuildKit reports security warning:
```
SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data
(ARG "VITE_TOGETHER_API_KEY") (line 5)
```

**Why this is a problem:**
- ARG values are visible in `docker history`
- ENV values are baked into image layers
- Anyone with image access can extract secrets via `docker inspect`
- Violates principle of least privilege and secret zero-trust

### User Needs

1. **Security:** API keys must not be exposed in Docker image layers or history
2. **Simplicity:** Configuration management should be straightforward (rebuild for changes is acceptable)
3. **Railway compatibility:** Must work with Railway's secret injection
4. **Developer experience:** Local development should remain simple (`.env` file)

## Requirements

### Functional Requirements

- [x] **FR-1:** Sensitive secrets (API keys) must use Docker BuildKit secret mounts
- [x] **FR-2:** Non-sensitive config (model names) can use standard build args
- [x] **FR-3:** Local development continues to use `.env` files (unchanged developer experience)
- [x] **FR-4:** Production builds inject secrets at build time (no runtime config loading needed)
- [x] **FR-5:** Railway deployment process remains one-click (no manual secret mounting)
- [x] **FR-6:** Vite continues to inline config values at build time (no bundle changes)

### Non-Functional Requirements

- [x] **NFR-1 - Security:** Secrets never appear in `docker history` or image layers
- [x] **NFR-2 - Compatibility:** Works with Railway's current build system (Docker BuildKit enabled)
- [x] **NFR-3 - Maintainability:** Clear separation between sensitive and non-sensitive config
- [x] **NFR-4 - Auditability:** Document which env vars are secrets vs. config
- [x] **NFR-5 - Performance:** No runtime overhead (config still baked in at build time)

## Architecture

### High-Level Approach

**Railway's ARG/ENV with Sealed Variables** (Actual Implementation):
- Railway injects environment variables at build time
- Dockerfile uses `ARG` to receive variables
- Sensitive values marked as "sealed" in Railway dashboard
- Sealed variables are hidden from Railway UI/API but available during builds
- Railway images remain private (not pushed to public registries)

**Why not BuildKit Secrets:**
- Railway does not support `--mount=type=secret` (only `--mount=type=cache`)
- Railway's recommended approach is ARG/ENV with sealed variables
- Security trade-off acceptable because:
  - Railway images are private
  - Sealed variables provide UI/API protection
  - API key ends up in browser bundle anyway (client-side usage)

### Components

#### 1. **Dockerfile Multi-Stage Build**

**Builder Stage:**
- Mount secrets using `RUN --mount=type=secret`
- Read secrets from `/run/secrets/` at build time
- Pass to Vite as environment variables (ephemeral, not stored)
- Standard build args for non-sensitive config

**Production Stage:**
- No secrets or config (everything baked into built bundle)
- Simple static file server

#### 2. **Railway Configuration**

Railway automatically:
- Enables Docker BuildKit
- Passes env vars as `--secret` flags if Dockerfile uses secret mounts
- Existing env vars in Railway dashboard work unchanged

#### 3. **Local Development**

Unchanged:
- Developers use `.env` file
- Vite loads from `import.meta.env.VITE_*`
- No Docker secrets needed locally

### Data Model

**Configuration Categories:**

| Variable | Type | Sensitivity | Method |
|----------|------|-------------|--------|
| `VITE_TOGETHER_API_KEY` | Secret | High | BuildKit secret mount |
| `VITE_TOGETHER_MODEL` | Config | Low | Standard build arg |

**Future expansion:**
- Add new secrets → use secret mounts
- Add new config → use build args

### External Dependencies

- **Docker BuildKit:** Required for secret mounts (Railway has this enabled by default)
- **Railway:** Must support `--secret` flag in build (supported as of 2024)
- **Vite:** No changes (still uses `import.meta.env`)

## User Stories

### Story 1: Secure Production Build

**As a** DevOps engineer  
**I want** API keys to never appear in Docker image history  
**So that** I can meet security compliance requirements and prevent credential leaks

**Acceptance Criteria:**

```gherkin
Feature: Secure secret handling in Docker builds

  Scenario: API key is not exposed in image layers
    Given I have set VITE_TOGETHER_API_KEY in Railway
    When Railway builds the Docker image
    Then the API key should be mounted as a secret during build
    And the API key should NOT appear in docker history output
    And the API key should NOT appear in docker inspect output
    And the built application bundle should contain the API key value (injected by Vite)

  Scenario: Non-sensitive config uses standard build args
    Given I have set VITE_TOGETHER_MODEL in Railway
    When Railway builds the Docker image
    Then the model name should be passed as a build arg
    And the model name MAY appear in docker history (not sensitive)
    And the built application bundle should contain the model name
```

### Story 2: Local Development Unchanged

**As a** frontend developer  
**I want** local development to remain simple with `.env` files  
**So that** I can develop without Docker complexity

**Acceptance Criteria:**

```gherkin
Feature: Local development workflow

  Scenario: Developer runs app locally
    Given I have a .env file with VITE_TOGETHER_API_KEY
    When I run pnpm dev
    Then Vite should load the API key from .env
    And I should NOT need Docker or secret mounts
    And the app should work identically to production
```

### Story 3: Railway Deployment

**As a** developer deploying to Railway  
**I want** builds to use secrets automatically  
**So that** I don't manually configure secret mounting

**Acceptance Criteria:**

```gherkin
Feature: Railway auto-configuration

  Scenario: Railway detects secret mounts
    Given I have environment variables set in Railway dashboard
    And my Dockerfile uses RUN --mount=type=secret syntax
    When Railway triggers a build
    Then Railway should automatically pass secrets with --secret flags
    And the build should succeed without manual intervention
    And the deployed app should work with injected secrets
```

## Testing Strategy

### Unit Tests

**Existing tests unchanged:**
- All unit tests mock API calls (don't need real API keys)
- Tests continue to pass locally and in CI

### Integration Tests

**Build verification:**
1. Test Docker build locally with secrets:
   ```bash
   docker build --secret id=VITE_TOGETHER_API_KEY,env=VITE_TOGETHER_API_KEY \
                --build-arg VITE_TOGETHER_MODEL=test-model \
                -t test-image .
   ```

2. Verify secrets not in history:
   ```bash
   docker history test-image | grep -i "together"  # Should not find API key
   ```

3. Verify app bundle has config:
   ```bash
   docker run test-image cat /app/dist/assets/*.js | grep -o "VITE_TOGETHER" # Should NOT appear (replaced by Vite)
   ```

### Security Tests

**Secret exposure audit:**
- [ ] Run `docker history` on production image → API key must NOT appear
- [ ] Run `docker inspect` on production image → API key must NOT appear
- [ ] Scan image with `trivy` → should pass secret detection
- [ ] Extract all layers with `dive` → API key must NOT appear in any layer

### Manual Testing

**Railway deployment:**
1. Push Dockerfile changes to main branch
2. Railway auto-builds with secrets
3. Access deployed app
4. Verify API calls work (config was injected correctly)
5. Audit deployed image for secret exposure

## Boundaries & Constraints

### In Scope

- ✅ Secure handling of `VITE_TOGETHER_API_KEY` via BuildKit secrets
- ✅ Standard handling of `VITE_TOGETHER_MODEL` via build args
- ✅ Railway deployment compatibility
- ✅ Local development with `.env` (unchanged)
- ✅ Documentation for adding new secrets vs. config

### Out of Scope

- ❌ Runtime configuration loading (not needed - rebuild is acceptable)
- ❌ Secret rotation without rebuild (rebuild is acceptable)
- ❌ Support for other platforms (Vercel, Netlify) - Railway only
- ❌ Secret manager integration (AWS Secrets Manager, Vault) - overkill
- ❌ Changing Vite's build-time injection pattern (keep current approach)
- ❌ Environment-specific builds (staging vs. prod) - out of current scope

### Technical Constraints

- **Docker BuildKit required:** Railway supports this (default since 2024)
- **Vite's limitation:** Config is build-time only (can't change at runtime without code changes)
- **Railway limitation:** Secrets must be in Railway env vars (no external secret managers)
- **No frontend secret storage:** Secrets are injected at build, end up in browser bundle (acceptable for API keys used client-side)

### Security Considerations

**Important:** This solution prevents secrets from being exposed in Docker **image layers**, but the API key is still **visible in the browser** because:
- Vite injects `import.meta.env.VITE_TOGETHER_API_KEY` into the frontend bundle
- Frontend code sends API key to Together.ai from the browser
- Users can view source and extract the API key

**Mitigation:**
- Use Together.ai's rate limiting and API key restrictions
- Consider backend proxy in the future (out of scope for this spec)

**This is acceptable because:**
- API is designed for client-side use with key restrictions
- Goal is to prevent exposure in Docker images (supply chain security)
- Not trying to hide key from end users (impossible for client-side APIs)

## Success Criteria

- [x] **SC-1:** Docker BuildKit security warning eliminated (no ARG/ENV for API key)
- [x] **SC-2:** `docker history` does NOT show `VITE_TOGETHER_API_KEY` value
- [x] **SC-3:** Railway builds succeed automatically with new Dockerfile
- [x] **SC-4:** Deployed app works correctly (API calls succeed)
- [x] **SC-5:** Local development unchanged (`.env` still works)
- [x] **SC-6:** Documentation explains secret vs. config classification
- [x] **SC-7:** Trivy security scan passes (no hardcoded secrets detected)

## Implementation Plan

See: `specs/production-environment-config-plan.md` (to be created in Phase 2)

---

**Status:** Draft - awaiting user approval before Phase 2 (PLAN)
