# 🔒 Security Audit Checklist

Verifies that the Together.ai credential is not exposed in the Docker image or in the site served to browsers.

---

## Purpose

The credential is a **runtime variable of the server** (`TOGETHER_API_KEY`). It must not appear in:

- the built site (`dist/`), which every visitor downloads
- Docker image layers or `docker history` output
- `docker inspect` metadata of the image
- any request the browser makes (it only talks to `/api/translate` on its own origin)

The rule that makes this hold: never give the credential a `VITE_` prefix (Vite inlines `VITE_*` into `dist/`) and never declare it as a Docker `ARG`/`ENV`.

> History: before issue #66 the key was a `VITE_TOGETHER_API_KEY` build arg and was inlined into `dist/` on every build. Any key used that way should be treated as published and rotated.

---

## Automated Checks

### In CI (every push and PR)

The `build` job builds with sentinel values in `TOGETHER_API_KEY` and `VITE_TOGETHER_API_KEY`, then runs:

```bash
pnpm run scan:dist
```

`scripts/scan-dist-for-secrets.mjs` fails the job if `dist/` contains either sentinel or the key prefix `tgp_v1_`. That prefix is **unverified** (Together.ai documents no key format); the sentinel check is the real guard, and the prefix should be replaced with the first characters of a real key. It reports the file and which value matched, never the value itself. `tests/infra/dist-secret-scan.test.ts` tests the scanner and asserts the Dockerfile declares no key `ARG`/`ENV` and CI wires the scan.

### Locally, against the image

```bash
./scripts/test-docker-build.sh
```

The script builds the image, runs it with a sentinel credential as a runtime variable, and checks that the sentinel is absent from `docker history`, `docker inspect` and `/app/dist`, and that the server answers.

---

## Manual Checks

```bash
# 1. Build with a sentinel and scan the output
TOGETHER_API_KEY=sentinel-123 VITE_TOGETHER_API_KEY=sentinel-123 pnpm run build
TOGETHER_API_KEY=sentinel-123 VITE_TOGETHER_API_KEY=sentinel-123 pnpm run scan:dist

# 2. Build the image and search its metadata for a real key prefix
docker build -t translate-and-teach:audit .
docker history translate-and-teach:audit --no-trunc | grep -F "tgp_v1_" || echo "clean"
docker inspect translate-and-teach:audit | grep -F "tgp_v1_" || echo "clean"
```

In the browser, open DevTools → Network, submit a phrase, and confirm the only request is `POST /api/translate` to your own origin, with no `Authorization` header.

---

## Deployment Notes

- Set `TOGETHER_API_KEY` as a **sealed** Railway variable. It reaches the container only at runtime.
- The server returns a generic message for every provider failure and never echoes provider text or the key. Reasons go to the server log, which must stay private.
- The daily limit (25 translations per client per UTC day) bounds what one visitor can spend. It is in memory and per process.
