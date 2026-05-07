---
title: English Pro — Spanish Phrase Analyzer
status: draft
created: 2026-05-06
updated: 2026-05-06
issue: TBD
---

# English Pro — Spanish Phrase Analyzer

## Objective

Build a mobile-first responsive web application that helps Spanish speakers learn English by providing AI-powered, structured translations with grammatical analysis, learning tips, and contextual variations. The app transforms simple phrase translation into a rich educational experience using Together.ai's LLM API.

## Context

### Problem Statement

Spanish speakers learning English often receive only literal translations without understanding the underlying grammatical structure, context, or common usage patterns. This limits their ability to internalize and apply learned phrases in real conversations.

### User Needs

- **Target users**: Spanish speakers learning English (intermediate level)
- **Pain point**: Need deeper understanding beyond simple translation
- **Desired outcome**: Learn not just what to say, but why and how English works differently from Spanish

### Business Justification

An MVP educational tool demonstrating AI-powered language learning. Focused on depth (rich analysis) rather than breadth (multiple language pairs).

## Requirements

### Functional Requirements

- [ ] User can input Spanish phrases (textarea/input field)
- [ ] User can trigger translation analysis (button click)
- [ ] System sends phrase to Together.ai API for LLM analysis
- [ ] System displays four structured sections:
  - [ ] Principal Translation: Main English translation
  - [ ] Grammatical Analysis: Step-by-step breakdown of structure
  - [ ] Learning Key: 2-4 practical tips and insights
  - [ ] Technical Variations: 2-4 context-specific alternatives (formal, informal, etc.)
- [ ] System parses Markdown-formatted AI response into sections
- [ ] System displays loading state during API call
- [ ] System displays error state on API failure
- [ ] UI adapts responsively (mobile-first, desktop 2-column grid)

### Non-Functional Requirements

- [ ] **Performance**: API response displayed within 5 seconds (P95)
- [ ] **Security**: API key not exposed in client-side code (use proxy endpoint)
- [ ] **Usability**: Mobile-first design, works on viewports ≥320px
- [ ] **Accessibility**: WCAG 2.1 AA compliance (4.5:1 contrast, keyboard navigation, ARIA labels)
- [ ] **Reliability**: Graceful error handling with user-friendly messages
- [ ] **Maintainability**: TypeScript strict mode, component-based architecture

## Architecture

### Components

```
┌─────────────────────────────────────┐
│          Frontend (React)           │
│  ┌──────────────────────────────┐  │
│  │  App.tsx (Main container)    │  │
│  │  ├─ Header                    │  │
│  │  ├─ InputSection              │  │
│  │  └─ ResultsGrid               │  │
│  │     ├─ ResultCard (x4)        │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Services                     │  │
│  │  └─ togetherApi.ts            │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Utils                        │  │
│  │  └─ parseResponse.ts          │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
              ↓ HTTPS
┌─────────────────────────────────────┐
│      Together.ai API                │
│  (meta-llama/Llama-3.3-70B)         │
└─────────────────────────────────────┘
```

### Data Model

**Input:**
```typescript
interface TranslationRequest {
  spanishPhrase: string;
}
```

**Output:**
```typescript
interface TranslationResponse {
  principalTranslation: string;
  grammaticalAnalysis: string;
  learningKey: string;
  technicalVariations: string;
}
```

**API Response:**
```typescript
interface TogetherAIResponse {
  choices: Array<{
    message: {
      content: string; // Markdown-formatted text
    };
  }>;
}
```

### External Dependencies

- **Together.ai API**: LLM inference (meta-llama/Llama-3.3-70B-Instruct-Turbo)
  - Purpose: AI-powered translation and analysis
  - Authentication: Bearer token (API key)
  - Rate limits: TBD (check Together.ai pricing tier)

- **React 18**: UI framework
- **TypeScript 5**: Type safety
- **Vite**: Build tool and dev server
- **react-markdown** (optional): Markdown rendering in cards

### Prompt Engineering

**System Prompt:**
```
You are an expert English language tutor and translator. Your task is to help Spanish speakers understand English translations.

When given a Spanish phrase, respond with exactly four sections using the following Markdown structure:

## Principal Translation
[Provide the main, natural English translation]

## Grammatical Analysis
[Provide a step-by-step breakdown of the grammatical structure of the original Spanish phrase and the translation. Identify parts of speech, verb tenses, subject/object relationships, etc.]

## Learning Key
[Provide 2–4 practical tips or insights to help the user remember or understand this translation more deeply. Focus on common mistakes, false cognates, or cultural nuances.]

## Technical Variations
[Provide 2–4 alternative translations for different contexts: formal, informal, written, colloquial, or domain-specific (e.g., business, academic). Label each variation clearly.]

Be concise, clear, and educational. Do not include any preamble or closing remarks outside of the four sections.
```

**User Message Template:**
```
Spanish phrase: "{user_input}"
```

## User Stories

### Story 1: Basic Translation Request

**As a** Spanish speaker learning English  
**I want** to translate a Spanish phrase and see its grammatical breakdown  
**So that** I can understand not just what to say, but how English grammar differs from Spanish

**Acceptance Criteria:**
```gherkin
Feature: Spanish phrase translation and analysis

Scenario: User translates a simple phrase
  Given I am on the English Pro app homepage
  When I enter "¿Cómo estás?" in the input field
  And I click "Generar traducción"
  Then I should see a loading indicator
  And within 5 seconds I should see four cards displayed:
    | Card Title              | Contains                          |
    | Principal Translation   | "How are you?"                    |
    | Grammatical Analysis    | Breakdown of phrase structure     |
    | Learning Key            | At least 2 learning tips          |
    | Technical Variations    | At least 2 alternative phrases    |
```

### Story 2: Error Handling

**As a** user  
**I want** to see clear error messages when translation fails  
**So that** I know what went wrong and can retry

**Acceptance Criteria:**
```gherkin
Scenario: API call fails
  Given I am on the English Pro app homepage
  When I enter "Hola mundo" in the input field
  And the Together.ai API is unavailable
  When I click "Generar traducción"
  Then I should see an error message "Ocurrió un error al generar la traducción. Intenta de nuevo."
  And the input field should remain editable
  And I should be able to retry the request
```

### Story 3: Responsive Layout

**As a** mobile user  
**I want** the app to work well on my phone  
**So that** I can learn English on-the-go

**Acceptance Criteria:**
```gherkin
Scenario: Mobile viewport displays stacked layout
  Given I am viewing the app on a 375px wide screen
  When translation results are displayed
  Then the four cards should be stacked vertically
  And each card should be full-width
  And text should be readable without zooming

Scenario: Desktop viewport displays grid layout
  Given I am viewing the app on a 1024px wide screen
  When translation results are displayed
  Then the four cards should be arranged in a 2x2 grid
  And the layout should be centered with max-width 960px
```

## Testing Strategy

### Unit Tests

**Coverage target**: 80%+

**Units to test:**
- `parseResponse()`: Markdown parsing logic
  - Test: Correctly splits response by `##` headings
  - Test: Handles missing sections gracefully
  - Test: Trims whitespace correctly
- `togetherApi.ts`: API client
  - Test: Constructs correct request payload
  - Test: Handles network errors
  - Test: Parses successful responses

**Test files:**
- `src/utils/parseResponse.test.ts`
- `src/services/togetherApi.test.ts`

### Integration Tests

**Components to test:**
- `App.tsx` + `InputSection` + `ResultsGrid`
  - Test: User enters phrase and clicks button → API called with correct params
  - Test: API success → results rendered in four cards
  - Test: API failure → error message displayed
  - Test: Loading state shown during API call

**Test files:**
- `src/components/App.test.tsx`

### E2E Tests

**Critical user flows:**
1. **Happy path**: Enter phrase → see results
2. **Error path**: API fails → see error → retry succeeds
3. **Responsive**: Test on mobile and desktop viewports

**Tools**: Vitest + jsdom (or Playwright for true E2E)

### Performance Tests

- Measure time from button click to results displayed (target: <5s P95)
- Test with slow network simulation (Throttling)

## Boundaries & Constraints

### In Scope

- Spanish → English translation only
- Single phrase translation (not bulk)
- Four-section structured output
- Mobile-first responsive design
- Basic error handling
- Client-side rendering

### Out of Scope (v1)

- User authentication or accounts
- Translation history / persistence (no database)
- Audio pronunciation
- Multi-language support (French, German, etc.)
- Native mobile apps (iOS/Android)
- Offline mode
- Social sharing features
- Favoriting/bookmarking translations

### Technical Constraints

- **Language**: TypeScript (strict mode)
- **Framework**: React 18
- **Build tool**: Vite
- **AI Provider**: Together.ai (cannot switch to OpenAI/Anthropic without rewrite)
- **Browser support**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- **No backend**: API calls proxied through Vite dev server or simple serverless function

## Success Criteria

- [ ] User can enter a Spanish phrase and receive structured translation
- [ ] All four sections (Principal, Grammatical, Learning, Variations) display correctly
- [ ] API response time is <5 seconds (P95)
- [ ] App is fully responsive (mobile 320px+ and desktop 1024px+)
- [ ] WCAG 2.1 AA accessibility compliance verified
- [ ] Error states display user-friendly messages
- [ ] Zero TypeScript errors in strict mode
- [ ] Test coverage ≥80% for core logic (utils, services)
- [ ] Deployed to production (Vercel/Netlify) and accessible via URL

## Implementation Plan

See: [specs/english-pro-plan.md](./english-pro-plan.md)

---

## Notes

### API Key Security

The Together.ai API key must NOT be exposed in client-side code. Options:

1. **Vite proxy** (dev only): Use `vite.config.ts` proxy
2. **Serverless function** (prod): Deploy a simple Vercel/Netlify function that proxies requests
3. **Backend route** (if adding backend): Express/Next.js API route

Recommended: Serverless function for production deployment.

### Color Palette Reference

| Role                | Color      | Hex       |
|---------------------|------------|-----------|
| Background          | Light gray | `#F0F4F8` |
| Card surface        | White      | `#FFFFFF` |
| Primary text        | Dark blue  | `#1A2B3C` |
| Secondary text      | Gray       | `#4A5568` |
| Accent (button)     | Green      | `#38A169` |
| Accent hover        | Dark green | `#2F855A` |
| Border / Divider    | Light gray | `#CBD5E0` |
| Highlight (tips)    | Amber      | `#FFF3CD` |

### Typography Reference

- **Font**: Lato or Open Sans (Google Fonts)
- **Header**: 24-28px, bold
- **Card heading**: 16-18px, semi-bold
- **Body**: 14-16px, regular, line-height 1.6

### Future Enhancements (Post-v1)

- Add copy-to-clipboard button per card
- Save favorite translations to `localStorage`
- Text-to-speech for English pronunciation
- Dark mode toggle
- Expand to other language pairs (French → English, etc.)
- History view of past translations
