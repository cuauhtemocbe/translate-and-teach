import { describe, it, expect } from 'vitest';
import { parseResponse } from './parseResponse';

describe('parseResponse', () => {
  it('should parse a valid 4-section Markdown response', () => {
    const markdown = `
## Principal Translation
How are you?

## Grammatical Analysis
Subject: tú (implied)
Verb: estás (present tense of estar)

## Learning Key
- Remember that "estar" is used for temporary states
- This is an informal greeting

## Technical Variations
- Formal: How do you do?
- Casual: What's up?
`;

    const result = parseResponse(markdown);

    expect(result.principalTranslation).toBe('How are you?');
    expect(result.grammaticalAnalysis).toContain('Subject: tú');
    expect(result.learningKey).toContain('Remember that "estar"');
    expect(result.technicalVariations).toContain('Formal: How do you do?');
  });

  it('should handle missing sections gracefully', () => {
    const markdown = `
## Principal Translation
Hello world

## Grammatical Analysis
Simple phrase
`;

    const result = parseResponse(markdown);

    expect(result.principalTranslation).toBe('Hello world');
    expect(result.grammaticalAnalysis).toBe('Simple phrase');
    expect(result.learningKey).toBe('');
    expect(result.technicalVariations).toBe('');
  });

  it('should handle sections with extra content after heading', () => {
    const markdown = `
## Principal Translation
The main translation here

## Grammatical Analysis - Detailed
Breaking down the structure

## Learning Key
Important tip

## Technical Variations
Alternative forms
`;

    const result = parseResponse(markdown);

    expect(result.principalTranslation).toBe('The main translation here');
    expect(result.grammaticalAnalysis).toBe('Breaking down the structure');
    expect(result.learningKey).toBe('Important tip');
    expect(result.technicalVariations).toBe('Alternative forms');
  });

  it('should trim whitespace from content', () => {
    const markdown = `
## Principal Translation

   Translated text with spaces


## Grammatical Analysis

   Grammar here

## Learning Key
Tip

## Technical Variations
Variation
`;

    const result = parseResponse(markdown);

    expect(result.principalTranslation).toBe('Translated text with spaces');
    expect(result.grammaticalAnalysis).toBe('Grammar here');
  });

  it('should handle empty response', () => {
    const markdown = '';

    const result = parseResponse(markdown);

    expect(result.principalTranslation).toBe('');
    expect(result.grammaticalAnalysis).toBe('');
    expect(result.learningKey).toBe('');
    expect(result.technicalVariations).toBe('');
  });

  it('should handle response with no headers', () => {
    const markdown = 'Just some plain text without headers';

    const result = parseResponse(markdown);

    expect(result.principalTranslation).toBe('');
    expect(result.grammaticalAnalysis).toBe('');
    expect(result.learningKey).toBe('');
    expect(result.technicalVariations).toBe('');
  });

  it('should be case-insensitive for section matching', () => {
    const markdown = `
## principal translation
Lowercase heading

## GRAMMATICAL ANALYSIS
Uppercase heading

## Learning Key
Mixed case

## technical variations
Another lowercase
`;

    const result = parseResponse(markdown);

    expect(result.principalTranslation).toBe('Lowercase heading');
    expect(result.grammaticalAnalysis).toBe('Uppercase heading');
    expect(result.learningKey).toBe('Mixed case');
    expect(result.technicalVariations).toBe('Another lowercase');
  });

  it('should handle multiline content within sections', () => {
    const markdown = `
## Principal Translation
Line 1
Line 2
Line 3

## Grammatical Analysis
Analysis line 1
Analysis line 2

## Learning Key
Tip line 1
Tip line 2
Tip line 3

## Technical Variations
Variation 1
Variation 2
`;

    const result = parseResponse(markdown);

    expect(result.principalTranslation).toContain('Line 1');
    expect(result.principalTranslation).toContain('Line 2');
    expect(result.learningKey).toContain('Tip line 3');
  });
});
