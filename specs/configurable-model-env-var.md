---
title: Configurable Model via Environment Variable
status: completed
created: 2026-05-06
updated: 2026-05-06
issue: TBD
---

# Configurable Model via Environment Variable

## Objective

Make the Together.ai model name configurable through a `.env` variable instead of hardcoded, allowing users to easily switch between different LLM models without modifying code.

## Context

Currently, the model name is hardcoded in `src/services/togetherApi.ts`:

```typescript
const MODEL = 'meta-llama/Llama-3.3-70B-Instruct-Turbo';
```

This makes it difficult to:
- Test different models without code changes
- Deploy with different models per environment
- Allow users to choose their preferred model

Moving this to an environment variable provides flexibility without requiring code modifications.

## Requirements

### Functional Requirements

- [ ] Add `VITE_TOGETHER_MODEL` environment variable
- [ ] Read model name from environment variable in `togetherApi.ts`
- [ ] Throw descriptive error if `VITE_TOGETHER_MODEL` is not set or empty
- [ ] Update `.env.example` with model configuration example
- [ ] Remove hardcoded `MODEL` constant from `togetherApi.ts`

### Non-Functional Requirements

- [ ] **No validation**: Accept any model string (validation happens at API call time)
- [ ] **No default fallback**: Explicit error if variable is missing (fail fast)
- [ ] **Backward incompatible**: Existing deployments must add the new env var
- [ ] **Test coverage**: All existing tests must pass with new implementation

## Architecture

### Changes Required

**File: `src/services/togetherApi.ts`**
- Remove `const MODEL = '...'` line
- Read model from `import.meta.env.VITE_TOGETHER_MODEL`
- Add validation similar to existing `getApiKey()` function

**File: `.env.example`**
- Add `VITE_TOGETHER_MODEL` with example value

**File: `.env`** (local only, not committed)
- Add actual model name

**File: `src/services/togetherApi.test.ts`** (if exists)
- Update tests to mock or provide model env var
- Add test case for missing model env var (should throw error)

### Implementation Approach

1. Create helper function `getModel()` similar to existing `getApiKey()`
2. Use `getModel()` in `translatePhrase()` function
3. Update error message to guide user to set env var
4. Update documentation

## Testing Strategy

### Unit Tests

- [ ] Test `translatePhrase()` works with valid model env var
- [ ] Test `getModel()` throws error when `VITE_TOGETHER_MODEL` is undefined
- [ ] Test `getModel()` throws error when `VITE_TOGETHER_MODEL` is empty string
- [ ] Test existing functionality still works (no regression)

### Manual Testing

- [ ] Verify error message appears when env var is missing
- [ ] Verify app works with different model names
- [ ] Verify `.env.example` has clear instructions

## Boundaries & Constraints

### In Scope

- Making model name configurable via env var
- Error handling for missing env var
- Updating tests and documentation

### Out of Scope

- Validating model name against Together.ai model list
- Making other parameters configurable (max_tokens, temperature, etc.)
- Providing default/fallback model
- UI for model selection
- Runtime model switching (requires restart)

### Technical Constraints

- Must use `VITE_` prefix (Vite requirement for client-side env vars)
- Environment variables are embedded at build time (not runtime configurable)
- No backward compatibility required (breaking change accepted)

## Success Criteria

- [ ] `VITE_TOGETHER_MODEL` env var controls which model is used
- [ ] Clear error message when env var is missing
- [ ] All existing tests pass
- [ ] `.env.example` updated with model configuration
- [ ] No hardcoded model name in source code
- [ ] User can change model by editing `.env` and rebuilding

## Implementation Plan

See `specs/configurable-model-env-var-plan.md` (to be created in Phase 2)
