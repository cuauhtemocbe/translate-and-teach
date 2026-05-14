# Implementation Plan: Translation Timer & Markdown Rendering

**Spec**: [timer-and-markdown-rendering.md](./timer-and-markdown-rendering.md)  
**Created**: 2026-05-13  
**Status**: draft

## Components

### 1. Install Dependencies
- **Purpose**: Add react-markdown library to project
- **Files**: `package.json`, `package-lock.json`
- **Effort**: XS (5 minutes)

### 2. TranslationTimer Component (NEW)
- **Purpose**: Display elapsed time during loading and final time in results
- **Files**: 
  - `src/components/TranslationTimer.tsx` (new)
  - `src/components/TranslationTimer.css` (new)
  - `src/components/TranslationTimer.test.tsx` (new)
- **Effort**: S (1-2 hours)

### 3. Timer Logic in App.tsx
- **Purpose**: Measure API request time and manage timer state
- **Files**:
  - `src/App.tsx` (modify)
  - `src/components/App.test.tsx` (modify)
- **Effort**: M (2-3 hours)

### 4. Markdown Rendering in ResultCard
- **Purpose**: Replace plain text rendering with markdown parser
- **Files**:
  - `src/components/ResultCard.tsx` (modify)
  - `src/components/ResultCard.test.tsx` (modify)
  - `src/components/ResultCard.css` (modify - if needed for markdown styling)
- **Effort**: M (2-3 hours)

### 5. Integration Testing
- **Purpose**: Verify timer and markdown work together in full flow
- **Files**:
  - `src/components/App.integration.test.tsx` (new or modify existing)
- **Effort**: S (1 hour)

### 6. Manual Testing & Polish
- **Purpose**: Verify UX, accessibility, and performance
- **Files**: None (manual testing)
- **Effort**: S (1 hour)

## Dependencies

### Build Order

1. **Install Dependencies** (foundation)
   - Must happen first before any code changes
   - No dependencies

2. **TranslationTimer Component** (can work in parallel with ResultCard)
   - Independent component, can be built and tested in isolation
   - Does NOT depend on App.tsx changes (can use mock props)

3. **Markdown Rendering in ResultCard** (can work in parallel with Timer)
   - Independent change, can be built and tested in isolation
   - Only depends on react-markdown being installed

4. **Timer Logic in App.tsx** (integrates Timer component)
   - Depends on: TranslationTimer component exists
   - Integrates timer measurement and TranslationTimer component

5. **Integration Testing** (verifies everything works together)
   - Depends on: All previous components complete
   - Tests full flow: submit → timer → API → markdown rendering

6. **Manual Testing & Polish** (final verification)
   - Depends on: All previous steps complete
   - Final UX verification before considering feature done

### Dependency Graph

```
Install Dependencies
    ↓
┌───────────────────────────────┬─────────────────────────────────┐
│                               │                                 │
TranslationTimer Component      Markdown Rendering (ResultCard)  │
│                               │                                 │
└───────────────┬───────────────┘                                 │
                ↓                                                 │
        Timer Logic (App.tsx) ←──────────────────────────────────┘
                ↓
        Integration Testing
                ↓
        Manual Testing & Polish
```

### External Dependencies

**react-markdown (v9.x)**
- **When**: Install first (Component #1)
- **Why**: Both ResultCard and tests need it
- **Risk**: Version compatibility with React 18 (mitigation: v9.x is React 18 compatible)

**@types/react-markdown (dev dependency)**
- **When**: Install with react-markdown
- **Why**: TypeScript type definitions
- **Risk**: None (standard types package)

## Risks & Assumptions

### Risks

**Risk 1: Timer accuracy on slow devices**
- **Description**: `performance.now()` should be accurate, but on slow devices rendering delays might make the displayed time feel incorrect to users
- **Mitigation**: Only measure API time (not rendering), clearly label it as "API request time"
- **Likelihood**: Low
- **Impact**: Low (minor UX issue)

**Risk 2: react-markdown bundle size**
- **Description**: react-markdown (~50KB) might push bundle over performance budget
- **Mitigation**: Check bundle size after install, consider dynamic import if needed
- **Likelihood**: Low (50KB is reasonable)
- **Impact**: Medium (affects load time)

**Risk 3: Markdown conflicts with existing CSS**
- **Description**: react-markdown generates `<strong>`, `<em>`, `<ul>`, `<ol>` elements that might inherit unwanted global styles
- **Mitigation**: Scope markdown styles within `.result-card-content`, test with existing themes (light/dark)
- **Likelihood**: Medium
- **Impact**: Medium (visual bugs)

**Risk 4: Test updates break existing coverage**
- **Description**: Modifying App.tsx and ResultCard.tsx might break existing tests
- **Mitigation**: Run tests incrementally, update mocks as needed, maintain test coverage > 80%
- **Likelihood**: Medium (expected for changes to core components)
- **Impact**: Low (tests are easy to fix)

### Assumptions

**Assumption 1**: The LLM will continue to return markdown in the current format
- **Validation**: This is controlled by SYSTEM_PROMPT which we're not changing
- **If wrong**: If API returns HTML or plain text, markdown parser will handle gracefully (render as-is)

**Assumption 2**: Users care about API request time specifically (not total time)
- **Validation**: Confirmed with user during specification phase
- **If wrong**: Easy to change timer scope later by moving timer start/stop points

**Assumption 3**: Bold, italic, and lists are sufficient markdown features
- **Validation**: Confirmed with user during specification phase
- **If wrong**: react-markdown makes it easy to enable more features later via props

**Assumption 4**: No breaking changes in React 18 or Vite during implementation
- **Validation**: Use locked package versions (package-lock.json)
- **If wrong**: Unlikely during short implementation window (1-2 days)

## Milestones

### Milestone 1: Foundation Ready
- [ ] react-markdown installed
- [ ] Types available for TypeScript
- [ ] No build errors
- [ ] Verification: `npm run build` succeeds

### Milestone 2: Timer Component Complete
- [ ] TranslationTimer component created
- [ ] Unit tests written and passing
- [ ] Component renders both loading and completed states
- [ ] Verification: `npm test TranslationTimer` passes

### Milestone 3: Features Integrated
- [ ] Timer logic added to App.tsx
- [ ] Markdown rendering added to ResultCard.tsx
- [ ] Existing tests updated and passing
- [ ] Verification: `npm test` passes (all tests)

### Milestone 4: Verified & Polished
- [ ] Integration tests written and passing
- [ ] Manual testing complete (timer accuracy, markdown rendering)
- [ ] Accessibility verified (Lighthouse >= 95)
- [ ] Bundle size acceptable (< 100KB increase)
- [ ] Verification: Ready for commit

## Tasks

### Foundation (Build First)

- [ ] **Task 1: Install react-markdown**
  - **Acceptance**: react-markdown@^9.0.0 installed, types available, no build errors
  - **Files**: `package.json`, `package-lock.json`
  - **Tests**: Run `npm run build` to verify no errors
  - **Effort**: XS (5 min)

### Feature 1: Translation Timer (Build Second)

- [ ] **Task 2: Create TranslationTimer component**
  - **Acceptance**: Component file created with TypeScript types, renders null when elapsedTime is null
  - **Files**: `src/components/TranslationTimer.tsx`
  - **Tests**: None yet (just scaffold)
  - **Effort**: XS (15 min)

- [ ] **Task 3: Implement TranslationTimer rendering logic**
  - **Acceptance**: 
    - Shows "Translating... X.Xs" when `isLoading=true`
    - Shows "Translation completed in X.Xs" when `isLoading=false` and `elapsedTime` is set
    - Renders nothing when `elapsedTime` is null
  - **Files**: `src/components/TranslationTimer.tsx`
  - **Tests**: Write unit tests first (TDD)
  - **Effort**: S (1 hour)

- [ ] **Task 4: Style TranslationTimer component**
  - **Acceptance**: Timer has appropriate styling (color, spacing, typography), looks good in light/dark themes
  - **Files**: `src/components/TranslationTimer.css`, `src/components/TranslationTimer.tsx`
  - **Tests**: Visual verification
  - **Effort**: XS (30 min)

- [ ] **Task 5: Integrate timer logic in App.tsx**
  - **Acceptance**:
    - Timer starts when `translatePhrase` is called (use `performance.now()`)
    - Timer stops when `translatePhrase` resolves or rejects
    - Elapsed time stored in state
    - TranslationTimer component rendered in appropriate location
  - **Files**: `src/App.tsx`
  - **Tests**: Update `App.test.tsx` to verify timer state changes
  - **Effort**: M (2 hours)

### Feature 2: Markdown Rendering (Build Third - can parallel with Task 2-4)

- [ ] **Task 6: Replace plain text rendering with react-markdown**
  - **Acceptance**:
    - ResultCard uses ReactMarkdown component instead of `content.split('\n').map()`
    - Markdown is configured to allow: bold, italic, lists
    - Markdown is configured to disallow: code, links, images
  - **Files**: `src/components/ResultCard.tsx`
  - **Tests**: Write unit tests first to verify markdown rendering
  - **Effort**: M (2 hours)

- [ ] **Task 7: Style markdown elements in ResultCard**
  - **Acceptance**:
    - `<strong>`, `<em>`, `<ul>`, `<ol>` elements inherit existing card typography
    - Lists have appropriate indentation and spacing
    - Bold and italic are visually distinct
    - Works in both light and dark themes
  - **Files**: `src/components/ResultCard.css`
  - **Tests**: Visual verification in both themes
  - **Effort**: S (1 hour)

### Integration & Testing (Build Fourth)

- [ ] **Task 8: Write integration tests**
  - **Acceptance**:
    - Test full flow: submit → timer starts → API call → timer stops → markdown renders
    - Mock API returns markdown with bold, italic, lists
    - Verify timer shows realistic values
    - Verify markdown is rendered in DOM (not plain text)
  - **Files**: `src/components/App.integration.test.tsx` (or create if doesn't exist)
  - **Tests**: Integration tests pass
  - **Effort**: S (1 hour)

- [ ] **Task 9: Manual testing & verification**
  - **Acceptance**:
    - Submit real translation, verify timer accuracy (compare to network tab)
    - Verify bold, italic, lists render correctly in all four cards
    - Test timer reset on second translation
    - Run Lighthouse: accessibility >= 95, performance >= 90
    - Check bundle size: increase < 100KB
  - **Files**: None (manual testing)
  - **Tests**: Manual checklist from spec
  - **Effort**: S (1 hour)

### Polish (Build Fifth)

- [ ] **Task 10: Update documentation**
  - **Acceptance**:
    - Update README if needed (mention markdown rendering)
    - Add JSDoc comments to TranslationTimer component
    - Update spec status to "completed"
  - **Files**: `README.md`, component files, spec file
  - **Tests**: None
  - **Effort**: XS (15 min)

## Effort Estimate

**Total Estimated Time**: 10-12 hours (1.5 days)

| Phase | Tasks | Effort |
|-------|-------|--------|
| Foundation | Task 1 | 5 min |
| Timer Feature | Tasks 2-5 | 3.5-4 hours |
| Markdown Feature | Tasks 6-7 | 3 hours |
| Integration & Testing | Tasks 8-9 | 2 hours |
| Polish | Task 10 | 15 min |

### Breakdown by Developer Experience

**Senior Developer** (familiar with React, TDD): ~8 hours  
**Mid-Level Developer**: ~10-12 hours  
**Junior Developer**: ~14-16 hours (may need guidance on TDD and mocking)

### Critical Path

The critical path (longest sequence of dependent tasks):

```
Task 1 (5m) → Task 2 (15m) → Task 3 (1h) → Task 5 (2h) → Task 8 (1h) → Task 9 (1h)
Total: ~5 hours
```

Tasks 6-7 (markdown) can be done in parallel with Tasks 2-4 (timer component), saving ~2 hours if working with parallel focus.

## Notes

### TDD Approach

Follow red-green-refactor for all tasks:

1. **Task 3 (Timer component)**: Write tests for rendering states first, then implement
2. **Task 5 (Timer logic)**: Write tests for timer state management, then implement
3. **Task 6 (Markdown rendering)**: Write tests for markdown features, then implement

### Code Review Checklist

Before considering each task complete:

- [ ] TypeScript types are correct (no `any` types)
- [ ] Tests written and passing (coverage maintained)
- [ ] No console warnings or errors
- [ ] Accessible (semantic HTML, ARIA labels if needed)
- [ ] Works in both light and dark themes
- [ ] No performance regressions (check React DevTools Profiler)

### Rollback Plan

If either feature causes issues:

**Timer**: Easy to disable by commenting out TranslationTimer component in App.tsx  
**Markdown**: Easy to revert ResultCard.tsx to previous implementation (git revert)

Both features are isolated enough that they can be rolled back independently.
