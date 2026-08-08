# Implementation Plan: CI actually runs gitleaks

**Spec**: `specs/ci-gitleaks-detect.md`
**Created**: 2026-08-07
**Status**: completed

## Components

### 1. `.gitleaksignore`
- **Purpose**: Suppress 10 confirmed false positives found when first running `gitleaks detect` against full history (test fixtures in `src/test/setup.ts`, doc/script references to the `VITE_TOGETHER_API_KEY` env var *name* in `docs/security-audit.md`, `scripts/build-with-secrets.sh`, `scripts/test-docker-build.sh`, `specs/production-environment-config*.md`, and the `sonar-project.properties` project key). Verified each by inspecting the source line directly — none are real secrets.
- **Files**: `.gitleaksignore` (new)
- **Effort**: XS

### 2. `ci.yml` — `test` job
- **Purpose**: Run `gitleaks detect` after the existing install step, and switch checkout to `fetch-depth: 0` so gitleaks' commit-based fingerprints (used by `.gitleaksignore`) are stable between local full-history scans and CI.
- **Files**: `.github/workflows/ci.yml`
- **Effort**: XS

## Dependencies

### Build Order
1. Run `gitleaks detect` locally against full history to discover any pre-existing findings (must happen before adding the CI step, otherwise the step ships permanently red)
2. `.gitleaksignore` (must exist before the CI step is meaningful)
3. `ci.yml` step + `fetch-depth: 0`

### External Dependencies
None beyond the already-installed `gitleaks` v8.30.1 binary.

## Risks & Assumptions

### Risks
- **Shallow-clone fingerprint mismatch**: `.gitleaksignore` fingerprints include a commit hash. With the default `fetch-depth: 1`, CI would only see one synthetic commit and report a different hash than local full-history scans, silently breaking the ignore list (either re-flagging false positives, or worse, matching the wrong content). Mitigated by setting `fetch-depth: 0` on the `test` job's checkout.
- **`--no-git` mode considered and rejected**: scanning the working tree without git (`gitleaks detect --no-git`) picks up gitignored/untracked local files (`.env`, `.mcp.json`, `.pnpm-store/**`) that were never committed — verified `.mcp.json` and `.env` are not in `git ls-files` and have no commit history. Using `--no-git` would have produced noisy findings on content that was never actually pushed. Standard git-history-aware `gitleaks detect` only scans tracked/committed content, which is the correct scope for a CI backstop.

### Assumptions (validated)
- `sha256sum`-verified gitleaks binary already present in the job — reused as-is, no version bump.
- No `.gitleaks.toml` custom ruleset needed; default ruleset matches what the pre-commit hook already uses.

## Milestones

- [x] Baseline scan run locally, false positives identified and confirmed non-sensitive
- [x] `.gitleaksignore` added, local scan returns clean (exit 0)
- [x] `ci.yml` updated with `fetch-depth: 0` + `Run gitleaks` step
- [x] Detection capability verified against a dummy secret in an isolated scratch repo (exit 1) — proves the exact command used in CI does fail the job on a real finding

## Tasks

- [x] **Discover and vet existing findings**: run `gitleaks detect --redact --no-banner` locally, inspect each flagged line's source content
  - **Acceptance**: every finding classified as real secret or false positive, with evidence
  - **Files**: none (read-only investigation)
  - **Effort**: XS
- [x] **Add `.gitleaksignore`**: fingerprint each confirmed false positive
  - **Acceptance**: `gitleaks detect --redact --no-banner` exits 0 locally
  - **Files**: `.gitleaksignore`
  - **Effort**: XS
- [x] **Wire gitleaks into `ci.yml`**: add the detect step + full-history checkout
  - **Acceptance**: step present immediately after "Install gitleaks", `fetch-depth: 0` on same checkout
  - **Files**: `.github/workflows/ci.yml`
  - **Effort**: XS
- [x] **Verify detection works**: prove the exact command fails on a real secret
  - **Acceptance**: isolated scratch repo with a dummy (non-AWS-example) secret makes `gitleaks detect --redact --no-banner` exit 1
  - **Files**: none (scratch repo, discarded after verification)
  - **Effort**: XS

## Effort Estimate

**Total**: XS (matches issue #25's original estimate) — actual work was dominated by triage of the false positives, not the workflow edit itself.
