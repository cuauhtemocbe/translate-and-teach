---
title: Translation Timer & Markdown Rendering
status: completed
created: 2026-05-13
updated: 2026-05-13
issue: TBD
---

# Translation Timer & Markdown Rendering

## Objective

Add two UX improvements to English Pro: (1) a translation timer that shows API response time during loading and in results, and (2) proper markdown rendering for bold, italic, and lists in translation results.

## Context

### Current State

**Translation Timer**: Currently, users have no visibility into how long translations take. The app shows only a loading spinner with no time feedback.

**Markdown Rendering**: The LLM returns markdown-formatted responses (bold, italic, lists) via the SYSTEM_PROMPT in `togetherApi.ts`, but `ResultCard.tsx` renders content as plain text by splitting on newlines. This means `**bold**` appears literally as asterisks instead of being rendered as bold text.

### Problem Statement

1. **Lack of performance feedback**: Users don't know if a slow response is normal or if something is wrong. Performance data would help users understand API behavior and help debug issues.

2. **Poor readability**: Translation results lose formatting emphasis (bold for key terms, italic for emphasis, lists for tips). This makes Learning Key tips and Technical Variations harder to scan and less pedagogically effective.

### User Needs

- **Performance transparency**: Users want to see how long translations take, especially for debugging API issues or comparing model performance.
- **Rich formatting**: Users need proper emphasis (bold/italic) and structured lists to quickly scan grammar tips and translation variations.

## Requirements

### Functional Requirements

#### Feature 1: Translation Timer

- [ ] Start timer when API request begins (`translatePhrase` call)
- [ ] Stop timer when API response is received (before parsing)
- [ ] Display live elapsed time during loading with one decimal precision (e.g., "Translating... 2.3s")
- [ ] Display final elapsed time in results area after translation completes (e.g., "Translation completed in 2.3s")
- [ ] Timer should measure only API request time, not parsing or rendering time

#### Feature 2: Markdown Rendering

- [ ] Install and integrate a markdown parser library (react-markdown recommended)
- [ ] Render bold text (`**text**`) in ResultCard content
- [ ] Render italic text (`_text_` or `*text*`) in ResultCard content
- [ ] Render bullet lists (`-` or `*` prefix) in ResultCard content
- [ ] Render numbered lists (`1.` prefix) in ResultCard content
- [ ] Do NOT render inline code or links (keep parser configuration simple)
- [ ] Preserve existing styling from ResultCard.css (markdown should inherit card styles)

### Non-Functional Requirements

- [ ] **Performance**: Markdown parsing should not introduce noticeable lag (target: <10ms per card)
- [ ] **Security**: Markdown parser must sanitize HTML to prevent XSS attacks
- [ ] **Bundle Size**: Markdown library should add <100KB to bundle (react-markdown: ~50KB gzipped)
- [ ] **Accessibility**: Rendered markdown must preserve semantic HTML (e.g., `<strong>`, `<em>`, `<ul>`, `<ol>`)
- [ ] **Timer Precision**: Timer must update at least every 100ms during loading for smooth UX

## Architecture

### Components Affected

#### 1. Timer Component (NEW)
**File**: `src/components/TranslationTimer.tsx`
- Displays elapsed time during loading and final time in results
- Props: `isLoading: boolean`, `elapsedTime: number | null`
- Renders live timer when loading, final time when complete

#### 2. App.tsx (MODIFIED)
- Add timer state and timing logic around `translatePhrase` call
- Pass timer state to new TranslationTimer component
- Measure API request time using `performance.now()`

#### 3. ResultCard.tsx (MODIFIED)
- Replace plain text rendering with markdown parser
- Configure react-markdown to support: bold, italic, lists only
- Ensure markdown inherits existing CSS styles

### Data Flow

```
User clicks Submit
    → App.handleSubmit starts
    → Timer starts (performance.now())
    → translatePhrase(input) called
    ↓
API request (measured time)
    ↓
API response received
    → Timer stops (performance.now())
    → Calculate elapsed time
    → parseResponse(markdown)
    → Set results + elapsed time in state
    ↓
ResultsGrid renders
    → TranslationTimer shows "Translation completed in X.Xs"
    → ResultCard renders markdown with react-markdown
```

### External Dependencies

**New dependency**: `react-markdown` (v9.x recommended)
- **Purpose**: Parse and render markdown in React components
- **Size**: ~50KB gzipped
- **Security**: Built-in XSS protection via rehype-sanitize
- **Alternatives considered**:
  - `marked` + `dangerouslySetInnerHTML`: Security risk, requires manual sanitization
  - Custom parser: Reinventing the wheel, won't handle edge cases
  - `remark`: Lower-level, more complex API

**Installation**:
```bash
npm install react-markdown
```

## User Stories

### Story 1: See Translation Time

**As a** user of English Pro  
**I want** to see how long my translation takes  
**So that** I can understand API performance and debug slow responses

**Acceptance Criteria**:

```gherkin
Feature: Translation Timer

Scenario: Live timer during translation
  Given I enter a Spanish phrase
  When I click "Translate"
  Then I should see a live timer updating every 100ms
  And the timer should show format "Translating... X.Xs"

Scenario: Final time displayed in results
  Given I have submitted a translation
  When the translation completes
  Then I should see "Translation completed in X.Xs" above the results
  And the time should match the final API request time

Scenario: Timer resets on new translation
  Given I have completed one translation
  When I submit a new translation
  Then the timer should reset to 0.0s
  And start counting from the new API request
```

### Story 2: Read Formatted Translation Results

**As a** user of English Pro  
**I want** translation results to display bold, italic, and lists properly  
**So that** I can quickly scan important terms and structured tips

**Acceptance Criteria**:

```gherkin
Feature: Markdown Rendering in Results

Scenario: Bold text is emphasized
  Given the LLM returns "The **subject** comes first"
  When the result is displayed
  Then "subject" should be rendered in bold font-weight

Scenario: Italic text is emphasized
  Given the LLM returns "This is _muy importante_"
  When the result is displayed
  Then "muy importante" should be rendered in italic font-style

Scenario: Bullet lists are structured
  Given the LLM returns:
    """
    Tips:
    - Tip one
    - Tip two
    """
  When the result is displayed
  Then I should see a proper HTML unordered list with bullets

Scenario: Numbered lists are structured
  Given the LLM returns:
    """
    Steps:
    1. First step
    2. Second step
    """
  When the result is displayed
  Then I should see a proper HTML ordered list with numbers

Scenario: Existing styles are preserved
  Given markdown is rendered in ResultCard
  When I view the results
  Then markdown elements should inherit existing card typography and colors
```

## Testing Strategy

### Unit Tests

**Timer Logic** (`App.test.tsx`):
- Timer starts when handleSubmit is called
- Timer stops when translatePhrase resolves
- Elapsed time is calculated correctly (mocked performance.now)
- Timer resets on new submission
- Timer handles errors gracefully (still shows time on error)

**TranslationTimer Component** (`TranslationTimer.test.tsx`):
- Renders live timer when loading=true
- Shows "Translating... X.Xs" format during loading
- Renders final time when loading=false and elapsedTime is set
- Shows "Translation completed in X.Xs" format after completion
- Does not render when elapsedTime is null

**Markdown Rendering** (`ResultCard.test.tsx`):
- Renders bold markdown correctly
- Renders italic markdown correctly
- Renders bullet lists correctly
- Renders numbered lists correctly
- Does NOT render inline code (displays as plain text)
- Does NOT render links (displays as plain text)

### Integration Tests

**E2E Timer Flow** (`App.integration.test.tsx`):
- Submit phrase → see live timer → results appear with final time
- Timer shows realistic values (> 0.5s for API call)
- Timer updates at least 2-3 times during a 2s mock API call

**E2E Markdown Rendering** (`App.integration.test.tsx`):
- Submit phrase → mock API returns markdown → results show formatted content
- Verify bold, italic, and lists appear in actual DOM

### Manual Testing Checklist

- [ ] Timer appears and counts up during real API call
- [ ] Final time matches approximately the network tab duration
- [ ] Timer resets on second translation
- [ ] Bold text is visually distinct in all four result cards
- [ ] Italic text is visually distinct in all four result cards
- [ ] Lists are properly indented with bullets/numbers
- [ ] Markdown inherits existing card colors and spacing
- [ ] No console warnings from react-markdown
- [ ] Lighthouse accessibility score remains >= 95

## Boundaries & Constraints

### In Scope

**Feature 1: Timer**
- API request time measurement only
- Display during loading and in final results
- One decimal precision (e.g., "2.3s")

**Feature 2: Markdown**
- Bold, italic, bullet lists, numbered lists only
- Integration with existing ResultCard styling
- Security (XSS protection via react-markdown)

### Out of Scope

**Timer**
- ❌ Total time (including parsing/rendering) - only API time
- ❌ Historical timing data or averages
- ❌ Comparison with previous translations
- ❌ Millisecond precision (e.g., "2347ms")

**Markdown**
- ❌ Inline code rendering (`` `code` ``)
- ❌ Link rendering (`[text](url)`)
- ❌ Code blocks (` ```code``` `)
- ❌ Tables, blockquotes, or advanced markdown features
- ❌ Changing SYSTEM_PROMPT (keep existing markdown structure)

### Technical Constraints

- Must use React 18 hooks (no class components)
- Must maintain existing TypeScript strict mode
- Must not break existing tests (90+ tests currently passing)
- Must not degrade Lighthouse scores (currently 95+ accessibility, 90+ performance)
- Bundle size increase must be < 100KB (react-markdown: ~50KB OK)

## Success Criteria

- [ ] **Timer Visibility**: Users can see elapsed time during loading and final time in results
- [ ] **Timer Accuracy**: Timer values match network tab durations within ±10%
- [ ] **Markdown Rendering**: Bold, italic, and lists render correctly in all four result cards
- [ ] **No Regressions**: All existing tests pass (run `npm test`)
- [ ] **Performance**: No noticeable lag in rendering markdown (manual testing)
- [ ] **Accessibility**: Lighthouse accessibility score >= 95 (markdown uses semantic HTML)
- [ ] **Bundle Size**: Total bundle increase < 100KB (check `npm run build` output)

## Implementation Plan

See: `specs/timer-and-markdown-rendering-plan.md` (to be created in Phase 2)
