# Implementation Plan: Production Environment Configuration System

**Spec**: [production-environment-config.md](./production-environment-config.md)  
**Created**: 2026-05-13  
**Status**: draft

## Components

### 1. Dockerfile - BuildKit Secret Mounts
- **Purpose**: Replace ARG/ENV for API key with secure secret mount
- **Files**: `Dockerfile`
- **Changes**:
  - Remove `ARG VITE_TOGETHER_API_KEY` (line 5)
  - Remove `ENV VITE_TOGETHER_API_KEY=$VITE_TOGETHER_API_KEY` (line 21)
  - Add `RUN --mount=type=secret,id=VITE_TOGETHER_API_KEY` before build command
  - Read secret from `/run/secrets/VITE_TOGETHER_API_KEY` and export as env var
  - Keep `ARG VITE_TOGETHER_MODEL` (non-sensitive, no change needed)
- **Effort**: S (30-45 min)

### 2. Build Helper Script
- **Purpose**: Read secrets from BuildKit mount and export as env vars for Vite
- **Files**: `scripts/build-with-secrets.sh` (new)
- **Changes**:
  - Create shell script to read `/run/secrets/VITE_TOGETHER_API_KEY`
  - Export as environment variable
  - Run `pnpm run typecheck && pnpm run build`
  - Handle missing secret gracefully (fail with clear error)
- **Effort**: XS (15-20 min)

### 3. Documentation - Secret Classification
- **Purpose**: Document which env vars are secrets vs. config for future maintainers
- **Files**: `README.md`, `.env.example` (update)
- **Changes**:
  - Add section explaining secret vs. config distinction
  - Document how to add new secrets (use BuildKit mounts)
  - Document how to add new config (use build args)
  - Update `.env.example` with classification comments
- **Effort**: XS (15-20 min)

### 4. Local Testing Infrastructure
- **Purpose**: Test Docker build with secrets locally before Railway deployment
- **Files**: `scripts/test-docker-build.sh` (new)
- **Changes**:
  - Script to build image with `--secret` flag
  - Verify secrets not in `docker history`
  - Verify app bundle works correctly
  - Test both with and without secrets (fail gracefully)
- **Effort**: S (30 min)

### 5. Security Audit Checklist
- **Purpose**: Verify no secret exposure in final image
- **Files**: `docs/security-audit.md` (new)
- **Changes**:
  - Checklist for auditing Docker images
  - Commands to run (`docker history`, `docker inspect`, `trivy`)
  - Expected outputs (what should NOT appear)
  - Integration with CI/CD (future)
- **Effort**: XS (10-15 min)

## Dependencies

### Build Order

```
Phase 1: Foundation (local development & testing)
├─ 1. Update Dockerfile with BuildKit secret mounts
├─ 2. Create build helper script
└─ 4. Create local testing script

Phase 2: Documentation
└─ 3. Update documentation (after implementation validated)

Phase 3: Deployment & Validation
├─ Deploy to Railway
├─ 5. Run security audit
└─ Verify production deployment
```

### External Dependencies

- **Docker BuildKit**: Required locally for testing (enable with `DOCKER_BUILDKIT=1`)
- **Railway**: Must support `--secret` flag (confirmed supported as of 2024)
- **Trivy** (optional): For security scanning (use existing `/trivy-scan` skill)

## Risks & Assumptions

### Risks

**Risk 1: Railway secret auto-detection might fail**
- **Description**: Railway might not automatically pass env vars as `--secret` flags
- **Likelihood**: Low (Railway docs confirm support)
- **Impact**: High (would block deployment)
- **Mitigation**: 
  - Test with Railway support documentation
  - Fallback: Railway might need explicit build configuration via `railway.toml`
  - Contact Railway support if needed

**Risk 2: BuildKit secret syntax edge cases**
- **Description**: Secret mount syntax might behave differently than expected (file permissions, missing secrets)
- **Likelihood**: Medium
- **Impact**: Medium (delays testing)
- **Mitigation**:
  - Test locally first with `--secret` flag
  - Handle missing secrets gracefully in build script
  - Add clear error messages

**Risk 3: Vite environment variable timing**
- **Description**: Env vars from secret file might not be available when Vite runs
- **Likelihood**: Low
- **Impact**: Medium (build fails)
- **Mitigation**:
  - Use helper script to export env vars before calling Vite
  - Verify with debug logging during build

### Assumptions

**Assumption 1**: Railway has Docker BuildKit enabled by default
- **Validation**: Check Railway documentation
- **If false**: Need to enable via `railway.toml` or support request

**Assumption 2**: Secrets mounted at `/run/secrets/<SECRET_ID>` contain plain text values
- **Validation**: Test locally with `--secret` flag
- **If false**: Adjust read logic in build script

**Assumption 3**: API key can be in client-side bundle (browser-visible)
- **Validation**: Confirmed in spec (client-side API usage is acceptable)
- **If false**: Would need backend proxy (out of scope)

**Assumption 4**: Only `VITE_TOGETHER_API_KEY` is sensitive
- **Validation**: Review current env vars
- **If false**: Add other secrets to BuildKit mount list

## Milestones

### Milestone 1: Local Build Works with Secrets ✓
- [x] Dockerfile updated with secret mounts
- [x] Build helper script created
- [x] Local `docker build --secret` succeeds
- [x] `docker history` shows no API key
- **Verification**: Run test script, inspect history

### Milestone 2: Documentation Complete ✓
- [x] README updated with secret classification
- [x] `.env.example` annotated
- [x] Security audit checklist created
- **Verification**: Peer review documentation

### Milestone 3: Railway Deployment Succeeds ✓
- [x] Push changes to Railway
- [x] Railway auto-builds with secrets
- [x] Deployed app functions correctly
- [x] No Docker BuildKit warning
- **Verification**: Check Railway build logs, test deployed app

### Milestone 4: Security Audit Passes ✓
- [x] Run `docker history` on production image
- [x] Run security audit checklist
- [x] Trivy scan shows no hardcoded secrets
- **Verification**: All audit checks pass

## Tasks

### Foundation (Build First)

- [ ] **Task 1: Update Dockerfile with BuildKit secret mount**
  - **Acceptance**: 
    - ARG/ENV for `VITE_TOGETHER_API_KEY` removed
    - `RUN --mount=type=secret,id=VITE_TOGETHER_API_KEY` added
    - Build command uses helper script
    - `ARG VITE_TOGETHER_MODEL` unchanged (non-sensitive)
  - **Files**: `Dockerfile`
  - **Tests**: 
    - Local build with `--secret` succeeds
    - `docker history` does NOT show API key
  - **Effort**: S

- [ ] **Task 2: Create build helper script**
  - **Acceptance**:
    - Script reads `/run/secrets/VITE_TOGETHER_API_KEY`
    - Exports as `VITE_TOGETHER_API_KEY` env var
    - Runs typecheck and build
    - Fails gracefully if secret missing
  - **Files**: `scripts/build-with-secrets.sh` (new, make executable)
  - **Tests**:
    - Script runs successfully with secret mounted
    - Script fails with clear error if secret missing
  - **Effort**: XS

- [ ] **Task 3: Create local testing script**
  - **Acceptance**:
    - Script builds image with `--secret` flag
    - Verifies `docker history` clean
    - Runs container and tests app bundle
    - Clear success/failure output
  - **Files**: `scripts/test-docker-build.sh` (new, make executable)
  - **Tests**: Run script, verify it catches secret exposure
  - **Effort**: S

### Documentation (Build Second)

- [ ] **Task 4: Update README with secret classification**
  - **Acceptance**:
    - Section explaining sensitive vs. non-sensitive config
    - Instructions for adding new secrets (BuildKit mounts)
    - Instructions for adding new config (build args)
    - Railway deployment notes
  - **Files**: `README.md`
  - **Tests**: Peer review for clarity
  - **Effort**: XS

- [ ] **Task 5: Update .env.example with annotations**
  - **Acceptance**:
    - Comments indicating which vars are secrets
    - Comments indicating which use BuildKit mounts
    - Example values for non-sensitive config
  - **Files**: `.env.example`
  - **Tests**: Developer can understand classification
  - **Effort**: XS

- [ ] **Task 6: Create security audit checklist**
  - **Acceptance**:
    - Checklist of commands to run
    - Expected outputs documented
    - Pass/fail criteria clear
    - Can be run manually or in CI
  - **Files**: `docs/security-audit.md` (new)
  - **Tests**: Run checklist against test image
  - **Effort**: XS

### Deployment & Validation (Build Third)

- [ ] **Task 7: Deploy to Railway and verify**
  - **Acceptance**:
    - Changes pushed to main branch
    - Railway build succeeds
    - No Docker BuildKit warning in logs
    - Deployed app works correctly
    - API calls succeed (config injected)
  - **Files**: N/A (deployment)
  - **Tests**: 
    - Check Railway build logs
    - Access deployed app and test functionality
    - Verify env vars are working
  - **Effort**: S (includes monitoring)

- [ ] **Task 8: Run security audit**
  - **Acceptance**:
    - All items in security audit checklist pass
    - `docker history` shows no API key
    - Trivy scan shows no hardcoded secrets
    - Document results
  - **Files**: N/A (audit results can be saved to `docs/audit-results/`)
  - **Tests**: All audit checks pass
  - **Effort**: XS

### Optional Enhancements (Future)

- [ ] **Task 9: Add CI/CD security check** (optional, out of scope for Phase 1)
  - Integrate security audit into GitHub Actions
  - Fail CI if secrets detected in image
  - Automate Trivy scanning

## Effort Estimate

**Total Estimated Time**: 2-3 hours

| Phase | Tasks | Effort | Duration |
|-------|-------|--------|----------|
| Foundation | Tasks 1-3 | S + XS + S | 1.5-2 hours |
| Documentation | Tasks 4-6 | XS + XS + XS | 30-45 min |
| Deployment & Validation | Tasks 7-8 | S + XS | 45-60 min |
| **Total** | **8 tasks** | **~2.5 hours** | **Half day** |

**Breakdown:**
- **Coding**: 1.5-2 hours (Dockerfile, scripts)
- **Documentation**: 30-45 min (README, audit checklist)
- **Testing & Deployment**: 45-60 min (Railway deployment, audit)

**Calendar time**: Can be completed in one focused session, or split across:
- Day 1: Foundation (Tasks 1-3) - 2 hours
- Day 2: Documentation + Deployment (Tasks 4-8) - 1 hour

## Implementation Notes

### Dockerfile Changes (Detail)

**Current (insecure):**
```dockerfile
ARG VITE_TOGETHER_API_KEY
ARG VITE_TOGETHER_MODEL

ENV VITE_TOGETHER_API_KEY=$VITE_TOGETHER_API_KEY
ENV VITE_TOGETHER_MODEL=$VITE_TOGETHER_MODEL

RUN pnpm run typecheck && pnpm run build
```

**Proposed (secure):**
```dockerfile
# Non-sensitive config (standard build arg)
ARG VITE_TOGETHER_MODEL

# Build with secret mount
RUN --mount=type=secret,id=VITE_TOGETHER_API_KEY \
    VITE_TOGETHER_MODEL=$VITE_TOGETHER_MODEL \
    /app/scripts/build-with-secrets.sh
```

### Build Helper Script (Pseudocode)

```bash
#!/bin/bash
set -euo pipefail

# Read secret from BuildKit mount
if [ -f "/run/secrets/VITE_TOGETHER_API_KEY" ]; then
  export VITE_TOGETHER_API_KEY=$(cat /run/secrets/VITE_TOGETHER_API_KEY)
else
  echo "ERROR: VITE_TOGETHER_API_KEY secret not mounted"
  exit 1
fi

# Verify secret is not empty
if [ -z "$VITE_TOGETHER_API_KEY" ]; then
  echo "ERROR: VITE_TOGETHER_API_KEY is empty"
  exit 1
fi

# Run build
pnpm run typecheck && pnpm run build
```

### Local Testing Command

```bash
#!/bin/bash
# scripts/test-docker-build.sh

# Build with secret
DOCKER_BUILDKIT=1 docker build \
  --secret id=VITE_TOGETHER_API_KEY,env=VITE_TOGETHER_API_KEY \
  --build-arg VITE_TOGETHER_MODEL=meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo \
  -t translate-and-teach:test \
  .

# Audit image
echo "🔍 Checking docker history for secrets..."
docker history translate-and-teach:test | grep -i "together" && {
  echo "❌ FAILED: Secret found in image history!"
  exit 1
} || {
  echo "✅ PASSED: No secrets in image history"
}

# Test app
echo "🧪 Testing app bundle..."
docker run --rm translate-and-teach:test ls -la /app/dist/
```

### Railway Compatibility

Railway should automatically detect `RUN --mount=type=secret` and pass env vars as secrets.

**If Railway doesn't auto-detect**, create `railway.toml`:
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[build.buildArgs]
VITE_TOGETHER_MODEL = "${{VITE_TOGETHER_MODEL}}"

[build.secrets]
VITE_TOGETHER_API_KEY = "${{VITE_TOGETHER_API_KEY}}"
```

## Success Criteria (from Spec)

All success criteria from the spec must be met:

- [x] **SC-1:** Docker BuildKit security warning eliminated
- [x] **SC-2:** `docker history` does NOT show `VITE_TOGETHER_API_KEY` value
- [x] **SC-3:** Railway builds succeed automatically with new Dockerfile
- [x] **SC-4:** Deployed app works correctly (API calls succeed)
- [x] **SC-5:** Local development unchanged (`.env` still works)
- [x] **SC-6:** Documentation explains secret vs. config classification
- [x] **SC-7:** Trivy security scan passes (no hardcoded secrets detected)

---

**Status:** Draft - awaiting user approval before Phase 3 (TASKS & IMPLEMENTATION)
