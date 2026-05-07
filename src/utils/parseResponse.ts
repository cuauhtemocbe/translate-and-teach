import type { TranslationResponse } from '../types';

/**
 * Parses a Markdown-formatted AI response into four structured sections
 *
 * Expected format:
 * ## Principal Translation
 * [content]
 *
 * ## Grammatical Analysis
 * [content]
 *
 * ## Learning Key
 * [content]
 *
 * ## Technical Variations
 * [content]
 *
 * @param markdown - The Markdown response from the AI
 * @returns Parsed response with four sections
 */
export function parseResponse(markdown: string): TranslationResponse {
  // Split by ## headings
  const sections = markdown.split(/^##\s+/m);

  // Helper function to find and extract section content
  const findSection = (title: string): string => {
    const section = sections.find(s =>
      s.toLowerCase().startsWith(title.toLowerCase())
    );

    if (!section) return '';

    // Remove the heading line and trim whitespace
    const content = section
      .replace(/^[^\n]+\n/, '') // Remove first line (heading)
      .trim();

    return content;
  };

  return {
    principalTranslation: findSection('Principal Translation'),
    grammaticalAnalysis: findSection('Grammatical Analysis'),
    learningKey: findSection('Learning Key'),
    technicalVariations: findSection('Technical Variations'),
  };
}
