# 🔒 Security Audit Checklist

Docker image security audit for verifying that sensitive secrets are NOT exposed in image layers.

---

## Purpose

This checklist ensures that API keys and other secrets are properly handled using Docker BuildKit secrets and do NOT appear in:
- Docker image layers
- `docker history` output
- `docker inspect` metadata
- Container filesystem (beyond runtime env vars)

---

## Automated Audit Script

The quickest way to run all checks:

```bash
./scripts/test-docker-build.sh
```

This script automatically:
1. Builds the Docker image with BuildKit secrets
2. Runs all security checks below
3. Verifies build artifacts
4. Provides pass/fail results

---

## Manual Audit Steps

If you prefer to run checks manually:

### 1. Build Image with Secrets

```bash
# Set environment variables
export VITE_TOGETHER_API_KEY='your-actual-api-key'
export VITE_TOGETHER_MODEL='meta-llama/Llama-3.3-70B-Instruct-Turbo'

# Build with BuildKit secrets
DOCKER_BUILDKIT=1 docker build \
  --secret id=VITE_TOGETHER_API_KEY,env=VITE_TOGETHER_API_KEY \
  --build-arg VITE_TOGETHER_MODEL="$VITE_TOGETHER_MODEL" \
  -t translate-and-teach:audit \
  .
```

**Expected:** Build succeeds with no errors

---

### 2. Check Docker History (Critical)

```bash
docker history translate-and-teach:audit
```

**Expected:** 
- ✅ Should NOT show your API key value
- ✅ May show `VITE_TOGETHER_MODEL` (non-sensitive, acceptable)
- ✅ May show references to "together" or "secrets" (acceptable)
- ❌ Should NEVER show the actual API key string

**Test:**
```bash
# This should return NOTHING (exit code 1)
docker history translate-and-teach:audit --no-trunc | grep -F "$(echo $VITE_TOGETHER_API_KEY | head -c 20)"
```

If the above finds your API key → **FAIL** (secret is exposed)

---

### 3. Check Docker Inspect (Critical)

```bash
docker inspect translate-and-teach:audit
```

**Expected:**
- ✅ Should NOT show your API key in Env, Config, or any metadata
- ✅ May show `VITE_TOGETHER_MODEL` value (non-sensitive, acceptable)

**Test:**
```bash
# This should return NOTHING (exit code 1)
docker inspect translate-and-teach:audit | grep -F "$(echo $VITE_TOGETHER_API_KEY | head -c 20)"
```

If the above finds your API key → **FAIL** (secret is exposed)

---

### 4. Verify Build Artifacts

```bash
docker run --rm translate-and-teach:audit ls -la /app/dist/
```

**Expected:**
- ✅ Should show build artifacts (index.html, assets/, etc.)
- ✅ Files should have reasonable sizes (not empty)

---

### 5. Scan with Trivy (Recommended)

```bash
trivy image translate-and-teach:audit --severity HIGH,CRITICAL
```

**Expected:**
- ✅ No hardcoded secrets detected
- ✅ No critical vulnerabilities
- ⚠️ May show dependency vulnerabilities (fix separately)

**To install Trivy:**
```bash
# See: https://aquasecurity.github.io/trivy/latest/getting-started/installation/
brew install trivy  # macOS
# or
sudo apt-get install trivy  # Ubuntu/Debian
```

---

### 6. Check Image Layers (Deep Dive)

Use `dive` to inspect image layers:

```bash
dive translate-and-teach:audit
```

**Expected:**
- ✅ API key should NOT appear in any layer
- ✅ Wasted space should be minimal
- ✅ Secret mount should show as a single `RUN` layer with no secret data

**To install dive:**
```bash
# See: https://github.com/wagoodman/dive
brew install dive  # macOS
# or
wget https://github.com/wagoodman/dive/releases/download/v0.11.0/dive_0.11.0_linux_amd64.deb
sudo dpkg -i dive_0.11.0_linux_amd64.deb
```

---

## Pass/Fail Criteria

### ✅ PASS if:
- [ ] `docker history` does NOT show API key value
- [ ] `docker inspect` does NOT show API key value
- [ ] Build artifacts exist in `/app/dist/`
- [ ] Trivy scan shows no hardcoded secrets
- [ ] `dive` inspection shows no API key in any layer

### ❌ FAIL if:
- [ ] API key appears in `docker history` output
- [ ] API key appears in `docker inspect` output
- [ ] Build artifacts are missing or empty
- [ ] Trivy detects hardcoded secrets
- [ ] `dive` shows API key in any layer

---

## CI/CD Integration (Future)

To automate this audit in GitHub Actions:

```yaml
name: Security Audit

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build with secrets
        env:
          VITE_TOGETHER_API_KEY: ${{ secrets.VITE_TOGETHER_API_KEY }}
          VITE_TOGETHER_MODEL: ${{ vars.VITE_TOGETHER_MODEL }}
        run: |
          DOCKER_BUILDKIT=1 docker build \
            --secret id=VITE_TOGETHER_API_KEY,env=VITE_TOGETHER_API_KEY \
            --build-arg VITE_TOGETHER_MODEL="$VITE_TOGETHER_MODEL" \
            -t test-image \
            .
      
      - name: Security audit
        run: |
          # Check history
          if docker history test-image --no-trunc | grep -F "${{ secrets.VITE_TOGETHER_API_KEY }}"; then
            echo "FAILED: Secret found in history!"
            exit 1
          fi
          
          # Check inspect
          if docker inspect test-image | grep -F "${{ secrets.VITE_TOGETHER_API_KEY }}"; then
            echo "FAILED: Secret found in inspect!"
            exit 1
          fi
          
          echo "PASSED: No secrets exposed"
      
      - name: Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: test-image
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

---

## Troubleshooting

### Issue: "secret not found" during build

**Cause:** BuildKit secret not mounted correctly

**Fix:**
```bash
# Ensure variable is exported
export VITE_TOGETHER_API_KEY='your-key'

# Use correct syntax
DOCKER_BUILDKIT=1 docker build --secret id=VITE_TOGETHER_API_KEY,env=VITE_TOGETHER_API_KEY .
```

### Issue: API key appears in docker history

**Cause:** Using ARG/ENV instead of secret mount

**Fix:**
- Verify Dockerfile uses `RUN --mount=type=secret,id=VITE_TOGETHER_API_KEY`
- Verify NOT using `ARG VITE_TOGETHER_API_KEY` or `ENV VITE_TOGETHER_API_KEY=$VITE_TOGETHER_API_KEY`

### Issue: Build fails with "permission denied" for build script

**Cause:** Build script not executable

**Fix:**
```bash
chmod +x scripts/build-with-secrets.sh
git add scripts/build-with-secrets.sh
git commit -m "fix: make build script executable"
```

---

## Audit Results Template

Document audit results:

```markdown
# Security Audit Results

**Date:** YYYY-MM-DD  
**Auditor:** Your Name  
**Image:** translate-and-teach:vX.X.X  
**Commit:** abc1234

## Results

| Check | Status | Notes |
|-------|--------|-------|
| docker history | ✅ PASS | No secrets found |
| docker inspect | ✅ PASS | No secrets found |
| Build artifacts | ✅ PASS | All files present |
| Trivy scan | ✅ PASS | No critical issues |
| dive inspection | ✅ PASS | No secrets in layers |

## Recommendation

✅ Image is safe to deploy to production.

## Evidence

```bash
$ docker history translate-and-teach:audit | grep -i together
# (no API key value shown)

$ docker inspect translate-and-teach:audit | grep -F "$VITE_TOGETHER_API_KEY"
# (no output - secret not found)
```
```

---

## References

- **Docker BuildKit Secrets:** https://docs.docker.com/build/building/secrets/
- **Trivy Scanner:** https://aquasecurity.github.io/trivy/
- **Dive Tool:** https://github.com/wagoodman/dive
- **OWASP Top 10 - Secrets Management:** https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/

---

**Last Updated:** 2026-05-13  
**Spec Reference:** `specs/production-environment-config.md`
