import type { TogetherAIResponse } from '../types';

const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions';
const MODEL = 'meta-llama/Llama-3.3-70B-Instruct-Turbo';

const SYSTEM_PROMPT = `You are an expert English language tutor and translator. Your task is to help Spanish speakers understand English translations.

When given a Spanish phrase, respond with exactly four sections using the following Markdown structure:

## Principal Translation
[Provide the main, natural English translation]

## Grammatical Analysis
[Provide a step-by-step breakdown of the grammatical structure of the original Spanish phrase and the translation. Identify parts of speech, verb tenses, subject/object relationships, etc.]

## Learning Key
[Provide 2–4 practical tips or insights to help the user remember or understand this translation more deeply. Focus on common mistakes, false cognates, or cultural nuances.]

## Technical Variations
[Provide 2–4 alternative translations for different contexts: formal, informal, written, colloquial, or domain-specific (e.g., business, academic). Label each variation clearly.]

Be concise, clear, and educational. Do not include any preamble or closing remarks outside of the four sections.`;

/**
 * Get API key from environment variables
 */
function getApiKey(apiKeyOverride?: string): string {
  const apiKey = apiKeyOverride || import.meta.env.VITE_TOGETHER_API_KEY;

  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error(
      'Together.ai API key not configured. Please set VITE_TOGETHER_API_KEY in your .env file.'
    );
  }

  return apiKey;
}

/**
 * Translates a Spanish phrase using Together.ai LLM
 *
 * @param spanishPhrase - The Spanish phrase to translate
 * @param apiKeyOverride - Optional API key for testing (defaults to env var)
 * @returns The AI-generated translation response (Markdown formatted)
 * @throws Error if API call fails or input is invalid
 */
export async function translatePhrase(
  spanishPhrase: string,
  apiKeyOverride?: string
): Promise<string> {
  // Validate input
  if (!spanishPhrase || spanishPhrase.trim() === '') {
    throw new Error('Spanish phrase cannot be empty');
  }

  const apiKey = getApiKey(apiKeyOverride);

  const requestBody = {
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `Spanish phrase: "${spanishPhrase.trim()}"`
      }
    ]
  };

  try {
    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Handle rate limiting
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }

    // Handle other HTTP errors
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: TogetherAIResponse = await response.json();

    // Validate response structure
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message?.content) {
      throw new Error('Invalid response from API');
    }

    return data.choices[0].message.content;

  } catch (error) {
    // Re-throw custom errors as-is
    if (error instanceof Error && error.message.startsWith('API error')) {
      throw error;
    }

    if (error instanceof Error && error.message.includes('Rate limit')) {
      throw error;
    }

    if (error instanceof Error && error.message.includes('Invalid response')) {
      throw error;
    }

    // Handle network errors - wrap all network-related errors
    throw new Error('Network error. Please check your connection and try again.');
  }
}
