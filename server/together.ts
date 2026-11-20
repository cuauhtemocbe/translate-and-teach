const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions';

const DEFAULT_TIMEOUT_MS = 60_000;

export const SYSTEM_PROMPT = `You are an expert English language tutor and translator. Your task is to help Spanish speakers understand English translations.

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
 * One server-sent event of a streamed Together.ai chat completion.
 * Reasoning models also send their thinking trace in `reasoning` or
 * `reasoning_content`; only `content` is part of the answer.
 */
interface StreamChunk {
  choices?: Array<{ delta?: { content?: string | null } }>;
}

/**
 * Any way the provider failed to give an answer. The message is for the
 * server log only: it never carries the credential or the provider's own text.
 */
export class ProviderError extends Error {
  readonly rateLimited: boolean;

  constructor(message: string, rateLimited = false) {
    super(message);
    this.name = 'ProviderError';
    this.rateLimited = rateLimited;
  }
}

interface TranslationRequest {
  apiKey: string;
  model: string;
  phrase: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
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
    const chunk: StreamChunk = JSON.parse(line.slice('data:'.length));
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

function isTimeout(error: unknown): boolean {
  return error instanceof Error && error.name === 'TimeoutError';
}

/**
 * Asks Together.ai for the four-section analysis of a Spanish phrase.
 *
 * Streams the reply because some serverless models (e.g. Qwen/Qwen3.8-Flash)
 * reject non-streaming requests, and returns only the answer text.
 *
 * @throws ProviderError on any failure: network, timeout, non-2xx, or no answer text
 */
export async function requestTranslation({
  apiKey,
  model,
  phrase,
  fetchImpl = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: TranslationRequest): Promise<string> {
  let content: string;

  try {
    const response = await fetchImpl(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Spanish phrase: "${phrase}"` },
        ],
      }),
      // Also bounds reading the streamed body, not only the first byte
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new ProviderError(`Together.ai answered ${response.status}`, response.status === 429);
    }

    if (!response.body) {
      throw new ProviderError('Together.ai answered without a body');
    }

    content = await readStreamedContent(response.body);
  } catch (error) {
    if (error instanceof ProviderError) {
      throw error;
    }

    throw new ProviderError(
      isTimeout(error) ? 'Together.ai request timed out' : 'Together.ai request failed',
    );
  }

  // A stream that carried no answer text (e.g. only a reasoning trace) is unusable
  if (content.trim() === '') {
    throw new ProviderError('Together.ai answered without any answer text');
  }

  return content;
}
