import type { TogetherAIStreamChunk } from '../types';

const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions';

const SERVICE_UNAVAILABLE_MESSAGE = 'The translation service is unavailable. Try again later.';

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
      'Together.ai API key not configured. Please set VITE_TOGETHER_API_KEY in your .env file.',
    );
  }

  return apiKey;
}

/**
 * Get model name from environment variables
 */
function getModel(): string {
  const model = import.meta.env.VITE_TOGETHER_MODEL;

  if (!model || model.trim() === '') {
    throw new Error(
      'Together.ai model not configured. Please set VITE_TOGETHER_MODEL in your .env file.',
    );
  }

  return model;
}

/**
 * Extracts the answer text from one line of a server-sent event stream.
 * Anything that is not a `data:` event with a JSON `delta.content` (comments,
 * `[DONE]`, usage chunks, reasoning-only deltas) contributes nothing.
 */
function extractDelta(rawLine: string): string {
  const line = rawLine.trim();

  if (!line.startsWith('data:')) {
    return '';
  }

  try {
    const chunk: TogetherAIStreamChunk = JSON.parse(line.slice('data:'.length));
    return chunk.choices?.[0]?.delta?.content ?? '';
  } catch {
    return '';
  }
}

/**
 * Reads a streamed chat completion and returns the concatenated answer text
 */
async function readStreamedContent(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    // A network chunk can end mid-line: keep the unfinished tail for the next read
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      content += extractDelta(line);
    }
  }

  buffer += decoder.decode();
  content += extractDelta(buffer);

  return content;
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
  apiKeyOverride?: string,
): Promise<string> {
  // Validate input
  if (!spanishPhrase || spanishPhrase.trim() === '') {
    throw new Error('Spanish phrase cannot be empty');
  }

  const apiKey = getApiKey(apiKeyOverride);
  const model = getModel();

  const requestBody = {
    model: model,
    max_tokens: 1024,
    // Some serverless models (e.g. Qwen/Qwen3.8-Flash) reject non-streaming requests
    stream: true,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Spanish phrase: "${spanishPhrase.trim()}"`,
      },
    ],
  };

  try {
    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Handle rate limiting
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }

    // Any other provider failure (bad model, bad credential, 5xx) reads the same to the visitor
    if (!response.ok) {
      throw new Error(SERVICE_UNAVAILABLE_MESSAGE);
    }

    if (!response.body) {
      throw new Error('Invalid response from API');
    }

    const content = await readStreamedContent(response.body);

    // A stream that carried no answer text (e.g. only a reasoning trace) is unusable
    if (content.trim() === '') {
      throw new Error('Invalid response from API');
    }

    return content;
  } catch (error) {
    // Re-throw custom errors as-is
    if (error instanceof Error && error.message === SERVICE_UNAVAILABLE_MESSAGE) {
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
