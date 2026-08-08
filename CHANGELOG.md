# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Test coverage enforced as a real gate: 90% for `src/utils/**`/`src/services/**`, 80% globally, wired into `scripts/validate.sh` and CI
- Biome as the project's single linter/formatter, wired into `scripts/validate.sh`
- Dependabot for `npm`, `docker`, and `github-actions`, with minor/patch bumps grouped per ecosystem
- Socket Firewall workflow on Dependabot PRs, and the Socket Security GitHub App as required branch-protection checks
- Pre-commit secret scanning via `gitleaks` (`.husky/pre-commit`), plus full-history `gitleaks detect` in CI
- Hosted CI (`.github/workflows/ci.yml`): `lint`, `test`, and `build` jobs on every push/PR to `main`

### Changed
- Production Docker base image pinned by digest (`node:22-alpine@sha256:...`) for reproducible builds
- `CLAUDE.md` rewritten to document the project's real architecture and validation layers, replacing the generic template it was bootstrapped from

### Fixed
- CI's `test` job now actually invokes `gitleaks detect` instead of installing the binary and never running it

### Removed
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
