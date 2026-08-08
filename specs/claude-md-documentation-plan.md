# Implementation Plan: Document project-specific CLAUDE.md instead of generic template

**Spec**: `specs/claude-md-documentation.md`
**Created**: 2026-08-07
**Status**: completed

## Components

### 1. Remove generic-template sections
- **Purpose**: Delete the "Adapting This Template" section (the literal "This CLAUDE.example.md is a starting point" block with its 6-step "how to adapt" instructions) and the placeholder "Architecture and Design Rules (Project-Specific Example)" section (hexagonal architecture / `api`/`domain`/`infrastructure` layering that doesn't exist in this repo — this is a React SPA, not that shape at all).
- **Files**: `CLAUDE.md`
- **Effort**: XS

### 2. New "Architecture" section (replaces the deleted placeholder)
- **Purpose**: Document the real structure: `src/components/`, `src/hooks/`, `src/services/`, `src/utils/`, `src/types/`, `src/styles/`, entry point `src/main.tsx` → `App.tsx`. One line per folder, what lives there — matches the density of the existing Security Hardening section rather than exhaustive per-file docs.
- **Files**: `CLAUDE.md`
- **Effort**: XS

### 3. New "Validation: CI + Local Hooks" section, and correct the stale claim
- **Purpose**: **Correction found during Plan**: issue #1 was filed on the premise of "no hosted CI" — that's false today. `.github/workflows/ci.yml` (added in `0b5f3fa`, before the Security Hardening milestone) runs `lint`, `test` (gitleaks + `test:run`/`test:coverage` once #3 lands), and `build` jobs on every push/PR, and branch protection already requires Socket Security checks per the existing Security Hardening section. The current Security Hardening section's line "this repo has no general hosted CI gate for human PRs" is stale and must be corrected, not preserved. Document **both** real layers: (1) hosted CI in `ci.yml` — the actual enforced gate on GitHub; (2) local husky hooks (`pre-commit`: gitleaks on staged diff; `pre-merge-commit`/`pre-push`: full `scripts/validate.sh` — lint → typecheck → test[:coverage] → build → `pnpm audit` — gated to `main`/`develop`, lighter typecheck-only on feature branches) — fast feedback *before* code reaches CI, not a substitute for it. State the key commands: `pnpm run validate`, `pnpm test`, `pnpm run build`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:coverage`.
- **Files**: `CLAUDE.md`
- **Effort**: XS

### 4. Coverage thresholds line (coordinates with #3)
- **Purpose**: One line in the Quality Standards / Testing area noting the enforced thresholds (90% `utils/**`+`services/**`, 80% global) once issue #3 lands. If #3 hasn't landed yet when this is implemented, phrase it prospectively or land this edit right after #3's `vite.config.ts` change so the two stay in sync (this session's implementation order is #3 → #1 → #5, so #3's thresholds will already exist by the time this runs).
- **Files**: `CLAUDE.md`
- **Effort**: XS (folded into task 3 above)

### 5. Keep as-is (except the one stale sentence fixed in component 3)
- **Purpose**: The Skills list, Recommended Development Workflow, Memory (Engram) protocol, Code Quality Analysis, User Stories/Issue Management sections are all already accurate and project-specific — no changes needed. The Security Hardening section is *mostly* accurate too (verified against `.github/dependabot.yml`, `.github/workflows/dependabot-socket-firewall.yml`, `Dockerfile` digest pinning, `.husky/pre-commit`) — only its one stale "no hosted CI" sentence needs fixing, handled in component 3, not a full rewrite.
- **Files**: none (no-op, verification only)
- **Effort**: —

## Dependencies

### Build Order
1. Confirm #3's `vite.config.ts` thresholds have landed (this session's order: #3 first) so the coverage line in step 4 states real numbers, not placeholders
2. Delete generic-template sections (component 1)
3. Write new Architecture section (component 2)
4. Write new Local Validation section (component 3), including the coverage-thresholds line (component 4)
5. Run the four Gherkin checks as a final verification pass

### External Dependencies
None.

## Risks & Assumptions

### Risks
- **Scope creep**: CLAUDE.md is long; the temptation is to rewrite everything. Mitigated by the spec's explicit "Out of Scope" (don't touch Skills list, Memory protocol) — only touch the two placeholder sections, the one stale sentence in Security Hardening, plus one new section.
- **Drift if #3 lands with different threshold numbers than currently specced (90/90/80)**: mitigated by sequencing this after #3's implementation is actually merged, not just specced.

### Assumptions (validated this session)
- `scripts/validate.sh` and the three husky hooks (`pre-commit`, `pre-merge-commit`, `pre-push`) are the complete local-validation story — confirmed by reading all three hook files and `scripts/validate.sh` directly.

## Milestones

- [x] Generic-template language fully removed (grep for "starting point" returns nothing)
- [x] Architecture section references all five real folders
- [x] "no hosted CI" claim corrected; new section references `ci.yml`, `scripts/validate.sh` and husky hooks by name
- [x] All four Gherkin scenarios verified via ad hoc grep checks

## Tasks

- [x] **Delete "Adapting This Template" and placeholder "Architecture and Design Rules" sections**
  - **Acceptance**: `grep -c "starting point" CLAUDE.md` → 0; hexagonal-architecture example content gone
  - **Files**: `CLAUDE.md`
  - **Tests**: grep check
  - **Effort**: XS

- [x] **Write real Architecture section**
  - **Acceptance**: section mentions `components/`, `hooks/`, `services/`, `utils/`, `types/` by name
  - **Files**: `CLAUDE.md`
  - **Tests**: grep check for all five folder names
  - **Effort**: XS

- [x] **Correct the stale "no hosted CI" claim and write the CI + Local Hooks section**
  - **Acceptance**: no remaining text claims "no general hosted CI gate"; new section references `ci.yml`, `scripts/validate.sh`, `.husky` hooks, and states `pnpm run validate`, `pnpm test`, `pnpm run build` verbatim
  - **Files**: `CLAUDE.md`
  - **Tests**: grep check for the three command strings and for absence of the stale claim
  - **Effort**: XS

- [x] **Run all four Gherkin checks together as a final pass**
  - **Acceptance**: all four scenarios from the spec pass
  - **Files**: none (verification only)
  - **Tests**: manual grep/read-through matching each scenario
  - **Effort**: XS

## Effort Estimate

**Total**: S (matches issue #1's original estimate).
