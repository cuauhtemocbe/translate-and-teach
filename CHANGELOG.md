# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `server/`: a dependency-free Node server in the production image that serves `dist/` and exposes `POST /api/translate`, so the Together.ai credential stays on the server (runtime `TOGETHER_API_KEY` and `TOGETHER_MODEL`). It rejects empty, whitespace-only and over-500-character phrases with 400, limits each client to 25 requests per UTC day with 429, and answers provider failures with a generic 502
- CI gate `pnpm run scan:dist`: the `build` job builds with sentinel credentials and fails if one, or the provider key prefix, appears in `dist/`
- `pnpm dev:server` and a Vite proxy for `/api` for local development
- Test coverage enforced as a real gate: 90% for `src/utils/**`/`src/services/**`, 80% globally, wired into `scripts/validate.sh` and CI
- Biome as the project's single linter/formatter, wired into `scripts/validate.sh`
- Dependabot for `npm`, `docker`, and `github-actions`, with minor/patch bumps grouped per ecosystem
- Socket Firewall workflow on Dependabot PRs, and the Socket Security GitHub App as required branch-protection checks
- Pre-commit secret scanning via `gitleaks` (`.husky/pre-commit`), plus full-history `gitleaks detect` in CI
- Hosted CI (`.github/workflows/ci.yml`): `lint`, `test`, and `build` jobs on every push/PR to `main`

### Changed
- The browser no longer calls Together.ai: it posts to `/api/translate` on its own origin. Provider failures show "The translation service is unavailable. Try again later." instead of raw `API error` text, and replies are streamed so models that require streaming (e.g. `Qwen/Qwen3.8-Flash`) work
- The footer names the model from `VITE_TOGETHER_MODEL` instead of a hardcoded one, which now only labels the footer
- Node base image pinned by tag and digest (`node:<version>-alpine3.24@sha256:...`), the same string in every `FROM node:` line of `Dockerfile` and `Dockerfile.dev`, for reproducible builds and matching dev/prod runtimes
- `CLAUDE.md` rewritten to document the project's real architecture and validation layers, replacing the generic template it was bootstrapped from

### Fixed
- CI's `test` job now actually invokes `gitleaks detect` instead of installing the binary and never running it

### Removed
- `VITE_TOGETHER_API_KEY` and its Docker `ARG`/`ENV`: Vite inlined it into `dist/`, publishing the credential to every visitor. Rotate any key that was ever built this way
- `serve` and `docker/serve/`: replaced by the app's own server
- `scripts/build-with-secrets.sh`, unused since the image stopped taking the key at build time
- `src/main.ts`, dead "Hello World TypeScript" boilerplate left over from the project's original template — the real entry point is `src/main.tsx`

## [1.0.0] - 2026-05-13

Initial release: English Pro, an AI-powered Spanish-to-English phrase translator and grammar coach.

### Added
- Spanish → English translation with grammatical analysis, learning tips, and technical variations, powered by Together.ai (model configurable via `VITE_TOGETHER_MODEL`)
- React SPA UI: input section, results grid, result cards, header, hero and features sections
- Dark/light theme with persisted preference (`useTheme` hook, default dark)
- Translation timer showing live API request duration, and Markdown rendering (bold, italic, lists) in translation results
- Railway deployment configuration with sealed build-time environment variables

### Changed
- Landing page redesigned to an input-first, Ocean Blue color scheme (from the earlier Neo-Editorial warm aesthetic)

### Fixed
- Railway Docker build failures (pnpm global-bin `PATH`, env vars not available during `vite build`)
- `@vitejs/plugin-react` upgraded to v6.0.1 to resolve Vite 8 warnings
