# Implementation Plan: Respect prefers-reduced-motion across all animated components

**Spec**: `specs/reduced-motion-accessibility.md`
**Created**: 2026-08-08
**Status**: completed

## Components

### 1. ResultCard.css guard
- **Purpose**: Disable hover elevation/icon rotation/border-reveal/glow transitions
- **Files**: `src/components/ResultCard.css`
- **Effort**: XS

### 2. Features.css guard
- **Purpose**: Disable entrance animation + hover elevation/icon rotation/border-reveal/glow transitions
- **Files**: `src/components/Features.css`
- **Effort**: XS

### 3. ThemeToggle.css guard
- **Purpose**: Disable hover lift/scale, icon rotation, active-state transform
- **Files**: `src/components/ThemeToggle.css`
- **Effort**: XS

### 4. Structural test
- **Purpose**: Verify each guard exists and targets the right selectors
- **Files**: `src/test/reduced-motion.test.ts` (new)
- **Effort**: S

## Dependencies

### Build Order
1. CSS guards (independent of each other, can be done in any order)
2. Test file last, once the guards' exact selector/property shape is finalized

## Risks & Assumptions

### Risks
- **Risk**: Removing `transform` entirely (not just `transition`) on hover could look jarring if overdone → mitigated by only targeting the specific translateY/rotate/scale properties identified as motion, leaving color/border/shadow/opacity changes untouched (they're fine instant or animated)

### Assumptions
- Hero.css requires no change (confirmed via git history — never had animation)
- No JS-level `matchMedia` test is feasible/needed; structural CSS-content assertions are the right verification level, consistent with `tests/infra/dockerfile-pinning.test.ts`

## Milestones

- [x] All three CSS guards added, matching TranslationTimer.css's established style
- [x] Structural test passes
- [x] `pnpm run validate` green
- [x] Manual browser check: loaded the app in Chrome, inspected `document.styleSheets` CSSOM directly — confirmed all three `@media (prefers-reduced-motion: reduce)` rules are present in the actually-served CSS with the correct selectors (couldn't force real hover pseudo-state via the automation's synthetic mouse events, so verified via CSSOM instead of a hover screenshot)

## Tasks

### Features
- [ ] **Add reduced-motion guard to ResultCard.css**
  - **Acceptance**: `.result-card`/`::before`/`::after`/`.result-card-icon` transitions disabled; hover transform removed
  - **Files**: `src/components/ResultCard.css`
  - **Tests**: `src/test/reduced-motion.test.ts`
  - **Effort**: XS
- [ ] **Add reduced-motion guard to Features.css**
  - **Acceptance**: `fadeInScale` entrance animation disabled; `.feature-card` hover transitions/transform disabled; `.feature-icon-wrapper` hover transform disabled
  - **Files**: `src/components/Features.css`
  - **Tests**: `src/test/reduced-motion.test.ts`
  - **Effort**: XS
- [ ] **Add reduced-motion guard to ThemeToggle.css**
  - **Acceptance**: hover/active transform disabled; icon rotation disabled
  - **Files**: `src/components/ThemeToggle.css`
  - **Tests**: `src/test/reduced-motion.test.ts`
  - **Effort**: XS

### Integration
- [ ] **Write structural reduced-motion test**
  - **Acceptance**: fails if any guard is missing or removed by a future edit
  - **Files**: `src/test/reduced-motion.test.ts`
  - **Tests**: itself
  - **Effort**: S

## Effort Estimate

**Total Estimated**: XS–S (well under a day)

| Phase | Effort |
|-------|--------|
| CSS guards | XS x3 |
| Test | S |
