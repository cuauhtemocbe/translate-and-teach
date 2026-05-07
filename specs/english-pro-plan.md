# Implementation Plan: English Pro — Spanish Phrase Analyzer

**Spec**: [specs/english-pro.md](./english-pro.md)  
**Created**: 2026-05-06  
**Updated**: 2026-05-06  
**Status**: draft

---

## Overview

Transform the vanilla TypeScript boilerplate into a React 18 application with Together.ai integration. The implementation follows a bottom-up approach: infrastructure first, core logic second, UI components third, integration last.

---

## Components

### 1. Project Infrastructure Setup

**Purpose**: Migrate from vanilla TypeScript to React 18 with proper configuration

**Files**:
- `package.json` - Add React dependencies
- `vite.config.ts` - Add @vitejs/plugin-react
- `tsconfig.json` - Enable JSX support
- `.env` - Add VITE_TOGETHER_API_KEY
- `index.html` - Update for English Pro branding

**Effort**: M (Medium - config changes + dependency installation)

**Dependencies**: None (foundation)

---

### 2. Type Definitions

**Purpose**: Define TypeScript interfaces for type safety

**Files**:
- `src/types/index.ts` - TranslationRequest, TranslationResponse, TogetherAIResponse, CardType

**Effort**: XS (Extra Small - straightforward types)

**Dependencies**: None (can be done in parallel with infrastructure)

---

### 3. API Integration Layer

**Purpose**: Create service to communicate with Together.ai API

**Files**:
- `src/services/togetherApi.ts` - API client with prompt engineering
- `src/services/togetherApi.test.ts` - Unit tests for API client

**Effort**: M (Medium - API client + error handling + tests)

**Dependencies**: Infrastructure setup (#1), Type definitions (#2)

---

### 4. Response Parser Utility

**Purpose**: Parse Markdown-formatted AI response into structured sections

**Files**:
- `src/utils/parseResponse.ts` - Markdown section parser
- `src/utils/parseResponse.test.ts` - Unit tests for parser

**Effort**: S (Small - parsing logic + edge cases + tests)

**Dependencies**: Type definitions (#2)

---

### 5. UI Components - Base Structure

**Purpose**: Build reusable UI components

**Files**:
- `src/components/Header.tsx` - App header with title
- `src/components/ResultCard.tsx` - Reusable card for displaying sections
- `src/components/Header.test.tsx` - Unit tests
- `src/components/ResultCard.test.tsx` - Unit tests

**Effort**: S (Small - presentational components)

**Dependencies**: Infrastructure setup (#1)

---

### 6. UI Components - Interactive Elements

**Purpose**: Build interactive form components

**Files**:
- `src/components/InputSection.tsx` - Input field + submit button with loading state
- `src/components/ResultsGrid.tsx` - Grid layout for result cards
- `src/components/InputSection.test.tsx` - Unit tests
- `src/components/ResultsGrid.test.tsx` - Unit tests

**Effort**: M (Medium - state management + event handling)

**Dependencies**: UI Components - Base Structure (#5)

---

### 7. Main Application Component

**Purpose**: Integrate all components with state management

**Files**:
- `src/App.tsx` - Main app container with state and API orchestration
- `src/App.test.tsx` - Integration tests
- `src/main.tsx` - React entry point (rewrite from vanilla)

**Effort**: M (Medium - state management + API integration + error handling)

**Dependencies**: API Integration Layer (#3), Response Parser (#4), UI Components (#5, #6)

---

### 8. Styling & Theming

**Purpose**: Apply design system with responsive layout

**Files**:
- `src/styles/globals.css` or inline styles in components
- `src/styles/variables.css` - Color palette and typography

**Effort**: S (Small - CSS with mobile-first approach)

**Dependencies**: UI Components (#5, #6)

**Notes**: Can use plain CSS, CSS modules, or Tailwind (if added). Spec recommends plain CSS for simplicity.

---

### 9. API Proxy (Production Security)

**Purpose**: Protect API key from client exposure

**Files**:
- `api/translate.ts` - Vercel/Netlify serverless function (or Vite proxy for dev)
- Update `togetherApi.ts` to call proxy endpoint

**Effort**: S (Small - simple proxy function)

**Dependencies**: API Integration Layer (#3)

**Notes**: Can be deferred to deployment phase if using .env in dev only

---

### 10. Accessibility & Polish

**Purpose**: Ensure WCAG 2.1 AA compliance and UX polish

**Files**:
- Add ARIA labels to components
- Keyboard navigation testing
- Focus state improvements
- Loading animations and transitions

**Effort**: S (Small - incremental improvements)

**Dependencies**: All UI components (#5, #6, #7)

---

## Build Order & Dependencies

### Phase 1: Foundation (Build First)
1. **Project Infrastructure Setup** (#1) → Blocks everything
2. **Type Definitions** (#2) → Blocks #3, #4
3. **Response Parser Utility** (#4) → Independent, can run in parallel

### Phase 2: Core Logic (Build Second)
4. **API Integration Layer** (#3) → Depends on #1, #2

### Phase 3: UI Layer (Build Third)
5. **UI Components - Base Structure** (#5) → Depends on #1
6. **UI Components - Interactive Elements** (#6) → Depends on #5
7. **Styling & Theming** (#8) → Depends on #5, #6 (can run in parallel)

### Phase 4: Integration (Build Fourth)
8. **Main Application Component** (#7) → Depends on #3, #4, #5, #6
9. **API Proxy** (#9) → Depends on #3 (can defer to deployment)

### Phase 5: Polish (Build Last)
10. **Accessibility & Polish** (#10) → Depends on all UI components

---

## Dependency Graph

```
#1 (Infrastructure) ─┬─> #3 (API Client)
                     ├─> #5 (Base Components)
                     └─> #6 (Interactive Components)

#2 (Types) ──────────┬─> #3 (API Client)
                     └─> #4 (Parser)

#3 (API Client) ─────┬─> #7 (App)
                     └─> #9 (Proxy)

#4 (Parser) ─────────┬─> #7 (App)

#5 (Base Components) ┬─> #6 (Interactive Components)
                     ├─> #7 (App)
                     ├─> #8 (Styling)
                     └─> #10 (Accessibility)

#6 (Interactive) ────┬─> #7 (App)
                     ├─> #8 (Styling)
                     └─> #10 (Accessibility)

#7 (App) ────────────> #10 (Accessibility)
```

---

## External Dependencies

### Required NPM Packages

**Production:**
- `react@^18.3.0` - UI framework
- `react-dom@^18.3.0` - React rendering
- `react-markdown@^9.0.0` (optional) - Markdown rendering in cards

**Development:**
- `@vitejs/plugin-react@^4.3.0` - Vite React plugin
- `@types/react@^18.3.0` - React type definitions
- `@types/react-dom@^18.3.0` - React DOM type definitions
- `@testing-library/react@^16.0.0` - React testing utilities
- `@testing-library/user-event@^14.5.0` - User interaction testing
- `@vitest/browser@^4.1.5` (optional) - Browser-based testing

### External APIs

- **Together.ai API**
  - Endpoint: `https://api.together.xyz/v1/chat/completions`
  - Model: `meta-llama/Llama-3.3-70B-Instruct-Turbo`
  - Authentication: Bearer token
  - Rate limits: Check Together.ai pricing tier
  - **Risk**: API key exposure (mitigated by proxy in #9)

---

## Risks & Assumptions

### Risks

**Risk 1: Together.ai API Rate Limits**
- **Description**: Free tier may have strict rate limits
- **Impact**: Users may hit quota quickly
- **Mitigation**: 
  - Add rate limit detection in API client
  - Display user-friendly error message
  - Consider caching common phrases (post-v1)
  - Document rate limits in README

**Risk 2: API Key Exposure in Client**
- **Description**: VITE_ env vars are bundled into client code
- **Impact**: API key visible in browser DevTools
- **Mitigation**: 
  - Implement proxy endpoint (#9) before production deployment
  - Use Vercel/Netlify serverless functions
  - Never commit .env to git (already in .gitignore)

**Risk 3: LLM Response Format Inconsistency**
- **Description**: AI may not always follow 4-section Markdown format
- **Impact**: Parser fails, UI breaks
- **Mitigation**:
  - Robust parser with graceful degradation
  - Fallback to raw response if parsing fails
  - Unit tests with various response formats
  - Consider few-shot examples in prompt if needed

**Risk 4: Mobile Layout Complexity**
- **Description**: Four cards may be cramped on small screens
- **Impact**: Poor mobile UX
- **Mitigation**:
  - Mobile-first design approach
  - Test on real devices (375px, 390px, 414px viewports)
  - Consider collapsible cards if content is too dense

### Assumptions

**Assumption 1**: Together.ai API availability
- **Assumption**: Service is reliable with <1% downtime
- **Validation**: Monitor API status during development
- **Fallback**: Add retry logic with exponential backoff

**Assumption 2**: Spanish-only input validation not needed
- **Assumption**: Users will self-regulate input language
- **Validation**: Test with English input to see AI behavior
- **Fallback**: Add language detection if needed (post-v1)

**Assumption 3**: Markdown rendering is sufficient
- **Assumption**: AI responses won't need complex formatting
- **Validation**: Test with various phrase complexities
- **Fallback**: Use `react-markdown` if plain text rendering is insufficient

**Assumption 4**: No server-side rendering needed
- **Assumption**: CSR (client-side rendering) is acceptable for SEO/performance
- **Validation**: Lighthouse audit after implementation
- **Fallback**: Migrate to Next.js if SSR becomes necessary

---

## Milestones & Verification

### Milestone 1: Development Environment Ready
**Goal**: Can run React app locally with hot reload

**Verification**:
- [ ] `pnpm dev` starts Vite dev server
- [ ] React app renders in browser
- [ ] TypeScript compilation succeeds with no errors
- [ ] Environment variables load correctly

**ETA**: Day 1

---

### Milestone 2: Core Logic Functional
**Goal**: API client and parser work independently

**Verification**:
- [ ] API client successfully calls Together.ai endpoint
- [ ] Parser correctly splits Markdown response into 4 sections
- [ ] Unit tests pass for both modules
- [ ] Test coverage ≥80% for utils and services

**ETA**: Day 2

---

### Milestone 3: UI Components Built
**Goal**: All components render with mock data

**Verification**:
- [ ] Header displays app title
- [ ] InputSection accepts text and triggers callback
- [ ] ResultCard displays mock content correctly
- [ ] ResultsGrid arranges cards in responsive grid
- [ ] Components pass unit tests

**ETA**: Day 3

---

### Milestone 4: End-to-End Integration
**Goal**: Full user flow works (input → API → parse → display)

**Verification**:
- [ ] User can enter Spanish phrase and click button
- [ ] Loading state displays during API call
- [ ] Results display in four cards
- [ ] Error handling works for API failures
- [ ] Integration tests pass

**ETA**: Day 4

---

### Milestone 5: Production Ready
**Goal**: App is deployed and accessible publicly

**Verification**:
- [ ] API proxy implemented (no key exposure)
- [ ] Deployed to Vercel/Netlify
- [ ] Responsive design verified on mobile/desktop
- [ ] WCAG 2.1 AA accessibility verified
- [ ] Lighthouse score: Performance ≥90, Accessibility 100
- [ ] All tests passing in CI/CD

**ETA**: Day 5

---

## Effort Estimate

**Total Estimated Days**: 4-6 days (1 developer, full-time)

| Phase                | Effort    | Tasks                     |
|----------------------|-----------|---------------------------|
| Foundation           | 0.5 days  | #1, #2                    |
| Core Logic           | 1 day     | #3, #4                    |
| UI Layer             | 1.5 days  | #5, #6, #8                |
| Integration          | 1 day     | #7, #9                    |
| Testing & Polish     | 1 day     | #10, E2E tests, fixes     |
| **TOTAL**            | **5 days**|                           |

**Buffer**: +1 day for unknowns → **4-6 days realistic**

---

## Success Criteria (from Spec)

Implementation is complete when:

- [ ] User can enter a Spanish phrase and receive structured translation
- [ ] All four sections display correctly (Principal, Grammatical, Learning, Variations)
- [ ] API response time is <5 seconds (P95)
- [ ] App is fully responsive (mobile 320px+ and desktop 1024px+)
- [ ] WCAG 2.1 AA accessibility compliance verified
- [ ] Error states display user-friendly messages
- [ ] Zero TypeScript errors in strict mode
- [ ] Test coverage ≥80% for core logic
- [ ] Deployed to production and accessible via URL

---

## Detailed Task Breakdown

### Phase 1: Foundation (Build First)

#### Task 1.1: Install React Dependencies
**Acceptance**: 
- React 18, React DOM, and type definitions installed
- `package.json` updated with correct versions
- `pnpm install` completes successfully

**Files**: 
- `package.json`

**Commands**:
```bash
pnpm add react@^18.3.0 react-dom@^18.3.0
pnpm add -D @vitejs/plugin-react@^4.3.0 @types/react@^18.3.0 @types/react-dom@^18.3.0
pnpm add -D @testing-library/react@^16.0.0 @testing-library/user-event@^14.5.0
```

**Tests**: None (infrastructure)

**Effort**: XS (10 mins)

---

#### Task 1.2: Configure Vite for React
**Acceptance**: 
- `vite.config.ts` includes React plugin
- Dev server starts without errors
- HMR (Hot Module Replacement) works for React components

**Files**: 
- `vite.config.ts`

**Changes**:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // ... existing config
})
```

**Tests**: Manual - verify `pnpm dev` starts successfully

**Effort**: XS (5 mins)

---

#### Task 1.3: Configure TypeScript for JSX
**Acceptance**: 
- `tsconfig.json` includes JSX configuration
- TypeScript can compile `.tsx` files
- `pnpm typecheck` passes

**Files**: 
- `tsconfig.json`

**Changes**:
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    // ... existing config
  }
}
```

**Tests**: Run `pnpm typecheck` - should pass

**Effort**: XS (5 mins)

---

#### Task 1.4: Create Environment Configuration
**Acceptance**: 
- `.env.example` exists with template
- `.env` created locally (not committed)
- Environment variables load in Vite

**Files**: 
- `.env.example`
- `.env` (local only)

**Content**:
```env
# .env.example
VITE_TOGETHER_API_KEY=your_api_key_here
```

**Tests**: Verify `import.meta.env.VITE_TOGETHER_API_KEY` is accessible

**Effort**: XS (5 mins)

---

#### Task 1.5: Update HTML Template
**Acceptance**: 
- `index.html` title and meta tags reflect English Pro branding
- Loads Google Fonts (Lato or Open Sans)
- App div is present

**Files**: 
- `index.html`

**Changes**:
- Title: "English Pro — Spanish Phrase Analyzer"
- Meta description for SEO
- Google Fonts link

**Tests**: Visual verification in browser

**Effort**: XS (10 mins)

---

### Phase 2: Core Logic (Build Second)

#### Task 2.1: Define TypeScript Interfaces
**Acceptance**: 
- All interfaces exported from `src/types/index.ts`
- No TypeScript errors
- Types cover all API interactions and component props

**Files**: 
- `src/types/index.ts`

**Interfaces Needed**:
- `TranslationRequest`
- `TranslationResponse`
- `TogetherAIResponse`
- `CardType`
- `ErrorState`

**Tests**: TypeScript compilation (no unit tests needed for types)

**Effort**: XS (15 mins)

---

#### Task 2.2: Build Response Parser Utility (TDD)
**Acceptance**: 
- Parser correctly extracts 4 sections from Markdown
- Handles missing sections gracefully
- Unit tests pass with ≥90% coverage

**Files**: 
- `src/utils/parseResponse.ts`
- `src/utils/parseResponse.test.ts`

**Test Cases**:
- Valid 4-section response
- Missing sections (defaults to empty string)
- Extra sections (ignored)
- No headers (fallback)

**Effort**: S (1 hour)

---

#### Task 2.3: Build Together.ai API Client (TDD)
**Acceptance**: 
- API client sends correct request payload
- Handles success and error responses
- Unit tests pass with mocked fetch
- Error messages are user-friendly

**Files**: 
- `src/services/togetherApi.ts`
- `src/services/togetherApi.test.ts`

**Test Cases**:
- Successful API call
- Network error
- API error (4xx, 5xx)
- Timeout handling

**Effort**: M (2 hours)

---

### Phase 3: UI Layer (Build Third)

#### Task 3.1: Build Header Component (TDD)
**Acceptance**: 
- Header displays app title and tagline
- Responsive on mobile and desktop
- Unit tests pass

**Files**: 
- `src/components/Header.tsx`
- `src/components/Header.test.tsx`

**Tests**:
- Renders title correctly
- Responsive styling applied

**Effort**: XS (30 mins)

---

#### Task 3.2: Build ResultCard Component (TDD)
**Acceptance**: 
- Card accepts title, content, icon props
- Renders Markdown content (or plain text)
- Supports different highlight styles
- Unit tests pass

**Files**: 
- `src/components/ResultCard.tsx`
- `src/components/ResultCard.test.tsx`

**Props**:
```typescript
interface ResultCardProps {
  title: string;
  content: string;
  icon: string;
  variant: 'translation' | 'grammar' | 'tips' | 'variations';
}
```

**Tests**:
- Renders with all props
- Applies correct variant styles

**Effort**: S (1 hour)

---

#### Task 3.3: Build InputSection Component (TDD)
**Acceptance**: 
- Textarea accepts Spanish input
- Button triggers onSubmit callback
- Loading state disables input and shows spinner
- Error state displays error message
- Unit tests pass

**Files**: 
- `src/components/InputSection.tsx`
- `src/components/InputSection.test.tsx`

**Tests**:
- Calls onSubmit with input value
- Disables during loading
- Shows error message when provided

**Effort**: M (1.5 hours)

---

#### Task 3.4: Build ResultsGrid Component (TDD)
**Acceptance**: 
- Displays 4 ResultCard components in grid
- Responsive layout (stacked on mobile, 2x2 on desktop)
- Fade-in animation on load
- Unit tests pass

**Files**: 
- `src/components/ResultsGrid.tsx`
- `src/components/ResultsGrid.test.tsx`

**Tests**:
- Renders 4 cards with correct data
- Responsive breakpoints apply

**Effort**: S (1 hour)

---

#### Task 3.5: Create Global Styles
**Acceptance**: 
- Color palette defined as CSS variables
- Typography styles applied
- Responsive breakpoints defined
- Mobile-first approach

**Files**: 
- `src/styles/globals.css`
- `src/styles/variables.css`

**CSS Variables**:
- `--color-background: #F0F4F8`
- `--color-card: #FFFFFF`
- `--color-accent: #38A169`
- (etc.)

**Tests**: Visual verification

**Effort**: S (45 mins)

---

### Phase 4: Integration (Build Fourth)

#### Task 4.1: Build Main App Component (TDD)
**Acceptance**: 
- App orchestrates all components
- State management for input, loading, results, errors
- Calls API on submit
- Parses response and displays results
- Integration tests pass

**Files**: 
- `src/App.tsx`
- `src/App.test.tsx`

**State**:
```typescript
const [input, setInput] = useState('')
const [loading, setLoading] = useState(false)
const [results, setResults] = useState<TranslationResponse | null>(null)
const [error, setError] = useState<string | null>(null)
```

**Tests**:
- Full user flow: input → submit → loading → results
- Error flow: input → submit → error
- Empty input validation

**Effort**: M (2 hours)

---

#### Task 4.2: Update Main Entry Point
**Acceptance**: 
- `src/main.tsx` renders React app
- App mounts to #app div
- No console errors

**Files**: 
- `src/main.tsx` (rewrite from vanilla `main.ts`)

**Content**:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**Tests**: Manual - app runs in browser

**Effort**: XS (10 mins)

---

#### Task 4.3: Create API Proxy Endpoint
**Acceptance**: 
- Serverless function proxies requests to Together.ai
- API key not exposed to client
- Handles CORS correctly
- Deployed with app

**Files**: 
- `api/translate.ts` (Vercel function) or `netlify/functions/translate.ts`

**Alternative**: Use Vite proxy for dev, defer to deployment phase

**Tests**: Manual API testing with curl

**Effort**: S (1 hour) or defer to deployment

---

### Phase 5: Polish (Build Last)

#### Task 5.1: Add Accessibility Features
**Acceptance**: 
- All interactive elements have ARIA labels
- Keyboard navigation works (Tab, Enter)
- Focus states visible
- Color contrast meets WCAG AA (4.5:1)
- Screen reader tested

**Files**: 
- Update all components with ARIA attributes

**Checklist**:
- [ ] Input has associated label
- [ ] Button has aria-busy during loading
- [ ] Cards have role="region" with aria-label
- [ ] Color contrast verified with tool

**Tests**: Manual accessibility audit + axe DevTools

**Effort**: S (1 hour)

---

#### Task 5.2: Add Loading & Error Animations
**Acceptance**: 
- Smooth loading spinner
- Fade-in animation for results
- Error banner with icon
- Transitions feel polished

**Files**: 
- Update CSS with animations
- Update components with transition classes

**Tests**: Visual verification

**Effort**: XS (30 mins)

---

#### Task 5.3: Write Integration & E2E Tests
**Acceptance**: 
- Full user flow tested end-to-end
- Error scenarios covered
- Test coverage ≥80% overall

**Files**: 
- `src/App.test.tsx` (expand with E2E scenarios)

**Scenarios**:
- Happy path: translate phrase successfully
- Error path: API failure → retry
- Edge cases: empty input, very long input

**Tests**: Vitest integration tests

**Effort**: M (1.5 hours)

---

#### Task 5.4: Performance Optimization
**Acceptance**: 
- Lighthouse Performance score ≥90
- Accessibility score 100
- First Contentful Paint <1.5s
- API response displays within 5s

**Files**: 
- Code splitting if needed
- Lazy loading optimizations

**Tests**: Lighthouse audit

**Effort**: S (1 hour)

---

#### Task 5.5: Documentation & README Update
**Acceptance**: 
- README describes English Pro app
- Setup instructions clear
- Environment variables documented
- Screenshots included

**Files**: 
- `README.md`
- Add screenshot to `docs/`

**Tests**: Follow own setup instructions

**Effort**: S (45 mins)

---

## Task Summary Table

| ID    | Task                           | Phase      | Effort | Dependencies | Tests |
|-------|--------------------------------|------------|--------|--------------|-------|
| 1.1   | Install React Dependencies     | Foundation | XS     | None         | -     |
| 1.2   | Configure Vite for React       | Foundation | XS     | 1.1          | -     |
| 1.3   | Configure TypeScript for JSX   | Foundation | XS     | 1.1          | ✓     |
| 1.4   | Create Environment Config      | Foundation | XS     | None         | -     |
| 1.5   | Update HTML Template           | Foundation | XS     | None         | -     |
| 2.1   | Define TypeScript Interfaces   | Core Logic | XS     | None         | ✓     |
| 2.2   | Build Response Parser (TDD)    | Core Logic | S      | 2.1          | ✓✓    |
| 2.3   | Build API Client (TDD)         | Core Logic | M      | 2.1, 1.4     | ✓✓    |
| 3.1   | Build Header Component (TDD)   | UI Layer   | XS     | 1.1-1.3      | ✓     |
| 3.2   | Build ResultCard (TDD)         | UI Layer   | S      | 1.1-1.3, 2.1 | ✓     |
| 3.3   | Build InputSection (TDD)       | UI Layer   | M      | 1.1-1.3, 2.1 | ✓✓    |
| 3.4   | Build ResultsGrid (TDD)        | UI Layer   | S      | 3.2          | ✓     |
| 3.5   | Create Global Styles           | UI Layer   | S      | None         | -     |
| 4.1   | Build Main App Component (TDD) | Integration| M      | 2.2, 2.3, 3.* | ✓✓✓  |
| 4.2   | Update Main Entry Point        | Integration| XS     | 4.1          | -     |
| 4.3   | Create API Proxy Endpoint      | Integration| S      | 2.3          | -     |
| 5.1   | Add Accessibility Features     | Polish     | S      | All UI       | ✓     |
| 5.2   | Add Animations                 | Polish     | XS     | All UI       | -     |
| 5.3   | Write E2E Tests                | Polish     | M      | 4.1, 4.2     | ✓✓✓   |
| 5.4   | Performance Optimization       | Polish     | S      | All          | ✓     |
| 5.5   | Documentation & README         | Polish     | S      | All          | -     |

**Total Tasks**: 21  
**Estimated Effort**: 19.5 hours (≈3 days full-time, ≈5 days part-time)

---

## Build Order (Recommended Sequence)

**Day 1: Foundation + Core Logic**
1. Tasks 1.1 → 1.5 (Foundation setup) - 45 mins
2. Task 2.1 (Types) - 15 mins
3. Task 2.2 (Parser with TDD) - 1 hour
4. Task 2.3 (API Client with TDD) - 2 hours
**End of Day 1**: Core utilities ready, tests passing

**Day 2: UI Components**
1. Task 3.1 (Header) - 30 mins
2. Task 3.2 (ResultCard) - 1 hour
3. Task 3.3 (InputSection) - 1.5 hours
4. Task 3.4 (ResultsGrid) - 1 hour
5. Task 3.5 (Styles) - 45 mins
**End of Day 2**: All components built, styled, tested

**Day 3: Integration + Polish**
1. Task 4.1 (Main App) - 2 hours
2. Task 4.2 (Entry Point) - 10 mins
3. Task 4.3 (API Proxy) - 1 hour
4. Task 5.1 (Accessibility) - 1 hour
5. Task 5.2 (Animations) - 30 mins
6. Task 5.3 (E2E Tests) - 1.5 hours
**End of Day 3**: Full app working, tested

**Day 4: Deployment + Polish**
1. Task 5.4 (Performance) - 1 hour
2. Task 5.5 (Documentation) - 45 mins
3. Deploy to Vercel/Netlify
4. Final QA and fixes

---

## Next Steps

1. **Get user approval** for this implementation plan
2. **Proceed to Phase 3 (TASKS)**: Break down components into discrete, implementable tasks ✅ **COMPLETED**
3. **Create GitHub Issues** (optional): Track progress with issues linked to this plan
4. **Begin implementation** following task order

---

## Notes

### Testing Strategy Summary

- **Unit tests**: All utils, services, and presentational components
- **Integration tests**: App.tsx with full user flow
- **E2E tests** (optional): Playwright for critical paths
- **Accessibility tests**: axe-core or Lighthouse CI
- **Coverage target**: 80%+ for src/utils and src/services

### Deployment Recommendations

**Option 1: Vercel** (Recommended)
- Built-in serverless functions for API proxy
- Automatic HTTPS and CDN
- GitHub integration for auto-deploys
- Free tier suitable for MVP

**Option 2: Netlify**
- Similar features to Vercel
- Netlify Functions for API proxy
- Good DX for static sites

**Option 3: Railway/Render**
- If adding backend later
- More complex setup for static site

### Environment Variables

**.env (local development)**
```env
VITE_TOGETHER_API_KEY=your_api_key_here
```

**Production (Vercel/Netlify)**
```env
TOGETHER_API_KEY=your_api_key_here  # Server-side only, not VITE_ prefix
```

### Code Quality Checks

Before considering implementation complete:

1. Run `/testing` skill for TDD guidance
2. Run `/trivy-scan` for security vulnerabilities
3. Run `/sonar-check` for code quality metrics (if configured)
4. Run `pnpm typecheck` - must pass with 0 errors
5. Run `pnpm test:coverage` - must meet 80% target
6. Manual testing on real mobile device
