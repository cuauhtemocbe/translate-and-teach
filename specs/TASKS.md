# English Pro - Task Checklist

**Spec**: [english-pro.md](./english-pro.md)  
**Plan**: [english-pro-plan.md](./english-pro-plan.md)  
**Status**: Ready to implement

---

## Quick Reference

**Total Tasks**: 21  
**Estimated Effort**: 19.5 hours (≈3-5 days)  
**Current Phase**: Phase 3 (TASKS) ✅ → Ready for Phase 4 (IMPLEMENT)

---

## Task Checklist

### Phase 1: Foundation (45 mins)
- [ ] 1.1 - Install React Dependencies (XS - 10m)
- [ ] 1.2 - Configure Vite for React (XS - 5m)
- [ ] 1.3 - Configure TypeScript for JSX (XS - 5m)
- [ ] 1.4 - Create Environment Configuration (XS - 5m)
- [ ] 1.5 - Update HTML Template (XS - 10m)

### Phase 2: Core Logic (3.25 hours)
- [ ] 2.1 - Define TypeScript Interfaces (XS - 15m)
- [ ] 2.2 - Build Response Parser (TDD) (S - 1h)
- [ ] 2.3 - Build Together.ai API Client (TDD) (M - 2h)

### Phase 3: UI Layer (4.75 hours)
- [ ] 3.1 - Build Header Component (TDD) (XS - 30m)
- [ ] 3.2 - Build ResultCard Component (TDD) (S - 1h)
- [ ] 3.3 - Build InputSection Component (TDD) (M - 1.5h)
- [ ] 3.4 - Build ResultsGrid Component (TDD) (S - 1h)
- [ ] 3.5 - Create Global Styles (S - 45m)

### Phase 4: Integration (3.15 hours)
- [ ] 4.1 - Build Main App Component (TDD) (M - 2h)
- [ ] 4.2 - Update Main Entry Point (XS - 10m)
- [ ] 4.3 - Create API Proxy Endpoint (S - 1h)

### Phase 5: Polish (4.75 hours)
- [ ] 5.1 - Add Accessibility Features (S - 1h)
- [ ] 5.2 - Add Loading & Error Animations (XS - 30m)
- [ ] 5.3 - Write Integration & E2E Tests (M - 1.5h)
- [ ] 5.4 - Performance Optimization (S - 1h)
- [ ] 5.5 - Documentation & README Update (S - 45m)

### Deployment
- [ ] Deploy to Vercel/Netlify
- [ ] Configure API proxy in production
- [ ] Run final QA tests
- [ ] Update GitHub repository

---

## Quick Start Commands

```bash
# Install dependencies
pnpm add react@^18.3.0 react-dom@^18.3.0
pnpm add -D @vitejs/plugin-react@^4.3.0 @types/react@^18.3.0 @types/react-dom@^18.3.0
pnpm add -D @testing-library/react@^16.0.0 @testing-library/user-event@^14.5.0

# Run development server
pnpm dev

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm typecheck

# Build for production
pnpm build
```

---

## Critical Milestones

- [ ] **Milestone 1**: Dev environment runs React app (End of Phase 1)
- [ ] **Milestone 2**: API client and parser tested and working (End of Phase 2)
- [ ] **Milestone 3**: All UI components render with mock data (End of Phase 3)
- [ ] **Milestone 4**: Full user flow works end-to-end (End of Phase 4)
- [ ] **Milestone 5**: Deployed to production with 80%+ test coverage (End of Phase 5)

---

## TDD Workflow Reminder

For each component/utility with tests:

1. **Red**: Write failing test first
2. **Green**: Write minimum code to pass
3. **Refactor**: Improve code while keeping tests green
4. **Verify**: Run `/testing` skill for guidance if needed

---

## Quality Gates (Before Merge)

- [ ] All tests passing (unit, integration, E2E)
- [ ] Test coverage ≥80% for core logic
- [ ] Zero TypeScript errors (`pnpm typecheck`)
- [ ] Lighthouse Performance ≥90, Accessibility 100
- [ ] No security vulnerabilities (`/trivy-scan`)
- [ ] Code quality meets standards (`/sonar-check` if configured)

---

## GitHub Issues (Optional)

To create GitHub Issues for tracking, install `gh` CLI and run:

```bash
# Install gh CLI (if not installed)
# macOS: brew install gh
# Linux: see https://github.com/cli/cli#installation

# Authenticate
gh auth login

# Create main issue
gh issue create --repo cuauhtemocbe/translate-and-teach \
  --title "Implement English Pro - Spanish Phrase Analyzer" \
  --label "feature,spec-approved" \
  --body "See specs/english-pro.md and specs/english-pro-plan.md"

# Create sub-issues per phase (optional)
gh issue create --title "[Phase 1] Foundation Setup" --label "phase-1"
gh issue create --title "[Phase 2] Core Logic" --label "phase-2"
# ... etc
```

---

**Last Updated**: 2026-05-06  
**Next Action**: Proceed to Phase 4 (IMPLEMENT) or await user approval
