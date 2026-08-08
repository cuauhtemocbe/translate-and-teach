---
title: Respect prefers-reduced-motion across all animated components
status: completed
created: 2026-08-08
updated: 2026-08-08
issue: #9
---

# Respect prefers-reduced-motion across all animated components

## Objective

Guard every non-trivial CSS animation/transition in the app behind `@media (prefers-reduced-motion: reduce)`, so users with vestibular sensitivity who have "reduce motion" enabled at the OS level can use translate-and-teach without discomfort, regardless of which component the animation lives in.

## Context

Only `TranslationTimer.css` currently has a `@media (prefers-reduced-motion: reduce)` block. The recent hover-interaction work on `ResultCard` (top accent border reveal, icon rotation, elevation, glow) and the transitions in `Features.css` and `ThemeToggle.css` have no such guard. `development-standards.md` §10 treats this as a required accessibility guard for any non-trivial animation, not optional polish.

**Discrepancy found during spec review**: the issue's Gherkin Scenario Outline and Technical Context both list `Hero.css` as having unguarded transitions. Verified via `git log --follow -- src/components/Hero.css`: this file has never had any `animation`/`transition`/`@keyframes` since it was created — it's currently 30 lines of static layout CSS with zero motion. There is nothing to guard. This spec treats the Hero requirement as vacuously satisfied and does not modify `Hero.css`; adding an empty/no-op media query block would have no effect and no test could meaningfully verify it.

No JS component currently calls `window.matchMedia` anywhere in `src/` — reduced-motion handling here is pure CSS (`@media` at-rules), not a JS-driven check. jsdom does not apply real CSS cascade/layout from external stylesheets, so `TranslationTimer`'s existing guard has no direct unit test today; there is no established `matchMedia`-mocking pattern to reuse. Given this, verification uses the same structural/content-assertion approach already established in `tests/infra/dockerfile-pinning.test.ts` (read the raw file, assert on its content) rather than a runtime/computed-style test.

## Requirements

### Functional Requirements

- [ ] `ResultCard.css`: hover elevation (`translateY(-8px)`), icon rotation/scale (`rotate(5deg) scale(1.15)`), border-reveal and glow transitions are disabled under reduced motion
- [ ] `Features.css`: entrance animation (`fadeInScale`), hover elevation (`translateY(-8px)`), icon-wrapper rotation/scale, border-reveal and glow transitions are disabled under reduced motion
- [ ] `ThemeToggle.css`: hover lift/scale (`translateY(-4px) scale(1.05)`), icon rotation (`rotate(180deg)`), and active-state transform are disabled under reduced motion
- [ ] `Hero.css`: no change — file has no animation to guard (see Context)
- [ ] Under reduced motion, the underlying interactive state (hover background/border/color, theme toggle click) still occurs — only the animated transition/transform is removed, per the issue's second Gherkin scenario

### Non-Functional Requirements

- [ ] Follows the existing `TranslationTimer.css` pattern: `animation: none` for keyframe animations, `transition: none` for transitioned properties, and `transform: none` on the specific hover/active states that produce positional/scale motion
- [ ] No visual regression for users without reduced-motion enabled (default behavior unchanged)

## Architecture

### Components

Pure CSS changes, no component logic/markup changes:

1. `src/components/ResultCard.css` — add reduced-motion guard
2. `src/components/Features.css` — add reduced-motion guard
3. `src/components/ThemeToggle.css` — add reduced-motion guard
4. `src/test/reduced-motion.test.ts` (new) — structural test asserting each guard exists and covers the right selectors

### Data Model

N/A.

### External Dependencies

None.

## User Stories

```gherkin
Feature: Reduced motion accessibility across all components

  Scenario Outline: Non-trivial animations are disabled under prefers-reduced-motion
    Given the OS/browser has "prefers-reduced-motion: reduce" enabled
    When <component>'s animated state is triggered (hover/entrance)
    Then the animation/transition is removed or reduced to an instant state change

    Examples:
      | component    |
      | ResultCard   |
      | Features     |
      | ThemeToggle  |

  Scenario: Content remains fully usable with motion reduced
    Given "prefers-reduced-motion: reduce" is enabled
    When a user hovers a ResultCard and toggles the theme
    Then the hover state and theme change still occur visually — only the animated transition is removed
```

(Hero dropped from the Examples table — see Context discrepancy note above.)

## Testing Strategy

### Structural Tests

`src/test/reduced-motion.test.ts` reads each targeted CSS file's raw text and asserts:
- A `@media (prefers-reduced-motion: reduce)` block is present
- The block neutralizes (`animation: none` / `transition: none` / `transform: none`) the specific selectors identified in Requirements above

This mirrors `tests/infra/dockerfile-pinning.test.ts`'s established pattern of asserting on raw file content for concerns jsdom can't meaningfully exercise at runtime.

### Unit / Integration Tests

No changes to existing component `.test.tsx` files — hover/animation CSS isn't exercised by jsdom rendering today, so no existing test coverage is at risk.

## Boundaries & Constraints

### In Scope

- `ResultCard.css`, `Features.css`, `ThemeToggle.css` reduced-motion guards
- New structural test file

### Out of Scope

- `Hero.css` (no animation present)
- Introducing a JS `usePrefersReducedMotion` hook or `matchMedia`-based conditional rendering — not needed since all motion here is pure CSS
- Any visual/animation redesign beyond adding the guard

### Technical Constraints

- Must match the existing `TranslationTimer.css` guard style/pattern for consistency

## Success Criteria

- [x] All three Gherkin scenarios above pass (verified structurally via `src/test/reduced-motion.test.ts`, and confirmed live in Chrome: the served CSS's CSSOM contains exactly the three expected `@media (prefers-reduced-motion: reduce)` rules with the right selectors)
- [x] `pnpm run validate` green locally
- [ ] CI green on the PR (pending push/PR)
- [ ] Issue #9 closed with evidence (pending merge)

## Implementation Plan

See `specs/reduced-motion-accessibility-plan.md`.
