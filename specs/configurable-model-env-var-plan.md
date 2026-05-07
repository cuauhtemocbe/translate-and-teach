# Implementation Plan: Configurable Model via Environment Variable

**Spec**: [configurable-model-env-var.md](./configurable-model-env-var.md)  
**Created**: 2026-05-06  
**Status**: approved

## Components

### 1. Environment Variable Configuration
- **Purpose**: Add `VITE_TOGETHER_MODEL` to env files
- **Files**: `.env.example`, `.env` (user's local copy)
- **Effort**: XS

### 2. API Service Refactoring
- **Purpose**: Replace hardcoded model with env var read
- **Files**: `src/services/togetherApi.ts`
- **Effort**: S

### 3. Test Updates
- **Purpose**: Update tests to cover new env var behavior
- **Files**: `src/services/togetherApi.test.ts` (if exists, otherwise create)
- **Effort**: S

### 4. TypeScript Type Definitions (optional)
- **Purpose**: Add type safety for env vars
- **Files**: `src/vite-env.d.ts` or `src/env.d.ts`
- **Effort**: XS

## Dependencies

### Build Order
1. **Environment Variable Configuration** (foundation)
   - No dependencies, can be done first
   - Blocks: API Service Refactoring

2. **API Service Refactoring** (core change)
   - Depends on: Environment Variable Configuration
   - Blocks: Test Updates

3. **Test Updates** (validation)
   - Depends on: API Service Refactoring
   - Blocks: None

4. **TypeScript Type Definitions** (optional polish)
   - Can be done in parallel with other work
   - Blocks: None

### External Dependencies
- None (uses existing Vite env var system)

## Risks & Assumptions

### Risks
- **Risk 1**: Breaking change requires all deployments to update `.env`
  - **Mitigation**: Clear error message guides users to add missing var
  - **Mitigation**: Update deployment docs (DEPLOYMENT.md, README.md)

- **Risk 2**: Tests might not exist yet for `togetherApi.ts`
  - **Mitigation**: Create test file if missing, following existing test patterns
  - **Mitigation**: Use existing test infrastructure (Vitest, based on project)

### Assumptions
- User understands environment variables must be set before build
- Current model (`meta-llama/Llama-3.3-70B-Instruct-Turbo`) is acceptable as example
- Tests exist or test infrastructure is already configured

## Milestones

- [ ] **Milestone 1**: Environment variables configured
  - Verification: `.env.example` has `VITE_TOGETHER_MODEL`
  
- [ ] **Milestone 2**: API service reads from env var
  - Verification: Code compiles, no hardcoded model in source
  
- [ ] **Milestone 3**: Tests pass
  - Verification: All tests green, coverage maintained

- [ ] **Milestone 4**: Documentation updated
  - Verification: README/deployment docs mention new env var

## Tasks

### Foundation (Build First)

- [ ] **Task 1**: Update `.env.example` with model variable
  - **Acceptance**: `.env.example` contains `VITE_TOGETHER_MODEL` with example value and comment
  - **Files**: `.env.example`
  - **Tests**: None (documentation file)
  - **Effort**: XS (2 minutes)

- [ ] **Task 2**: Add model variable to local `.env`
  - **Acceptance**: User's local `.env` has `VITE_TOGETHER_MODEL` set to desired model
  - **Files**: `.env` (local, not committed)
  - **Tests**: None (local configuration)
  - **Effort**: XS (1 minute)

### Core Implementation (Build Second)

- [ ] **Task 3**: Create `getModel()` helper function
  - **Acceptance**: 
    - Function reads `import.meta.env.VITE_TOGETHER_MODEL`
    - Throws descriptive error if undefined or empty
    - Error message guides user to set env var
  - **Files**: `src/services/togetherApi.ts`
  - **Tests**: Unit test for error conditions
  - **Effort**: S (15 minutes)

- [ ] **Task 4**: Replace hardcoded MODEL constant
  - **Acceptance**:
    - Remove `const MODEL = '...'` line
    - Call `getModel()` in `translatePhrase()` function
    - Model is retrieved fresh on each call (or cached appropriately)
  - **Files**: `src/services/togetherApi.ts`
  - **Tests**: Integration test verifies env var is used
  - **Effort**: XS (5 minutes)

### Testing (Build Third)

- [ ] **Task 5**: Add unit tests for `getModel()`
  - **Acceptance**:
    - Test throws error when `VITE_TOGETHER_MODEL` is undefined
    - Test throws error when `VITE_TOGETHER_MODEL` is empty string
    - Test returns correct value when env var is set
  - **Files**: `src/services/togetherApi.test.ts`
  - **Tests**: Self-testing (these are the tests)
  - **Effort**: S (15 minutes)

- [ ] **Task 6**: Update existing tests to work with env var
  - **Acceptance**:
    - All existing `translatePhrase()` tests pass
    - Tests either mock env var or use test env config
    - No test relies on hardcoded model name
  - **Files**: `src/services/togetherApi.test.ts`, `vitest.config.ts` (if env mocking needed)
  - **Tests**: All existing tests green
  - **Effort**: S (10 minutes)

### Documentation & Polish (Build Last)

- [ ] **Task 7**: Add TypeScript type definitions for env var (optional)
  - **Acceptance**:
    - `ImportMetaEnv` interface includes `VITE_TOGETHER_MODEL: string`
    - TypeScript autocomplete works for env var
  - **Files**: `src/vite-env.d.ts` or `src/env.d.ts`
  - **Tests**: TypeScript compiles without errors
  - **Effort**: XS (5 minutes)

- [ ] **Task 8**: Update documentation
  - **Acceptance**:
    - README.md mentions `VITE_TOGETHER_MODEL` requirement
    - DEPLOYMENT.md includes model env var in setup steps
  - **Files**: `README.md`, `DEPLOYMENT.md` (if exists)
  - **Tests**: Documentation is clear and complete
  - **Effort**: XS (5 minutes)

## Effort Estimate

**Total Estimated Time**: ~1 hour

| Phase | Effort |
|-------|--------|
| Foundation (Tasks 1-2) | 3 minutes |
| Core Implementation (Tasks 3-4) | 20 minutes |
| Testing (Tasks 5-6) | 25 minutes |
| Documentation & Polish (Tasks 7-8) | 10 minutes |

## Implementation Notes

### Code Pattern for `getModel()`

Follow the same pattern as existing `getApiKey()` function:

```typescript
function getModel(): string {
  const model = import.meta.env.VITE_TOGETHER_MODEL;

  if (!model || model.trim() === '') {
    throw new Error(
      'Together.ai model not configured. Please set VITE_TOGETHER_MODEL in your .env file.'
    );
  }

  return model;
}
```

### Test Pattern

Use Vitest's `vi.stubEnv()` or similar to mock environment variables in tests:

```typescript
describe('getModel', () => {
  it('should throw error when VITE_TOGETHER_MODEL is not set', () => {
    vi.stubEnv('VITE_TOGETHER_MODEL', undefined);
    expect(() => getModel()).toThrow('model not configured');
  });
});
```

### Breaking Change Communication

Since this is a breaking change, ensure:
- Error message is clear and actionable
- `.env.example` has helpful comments
- Documentation clearly states this is a required variable
