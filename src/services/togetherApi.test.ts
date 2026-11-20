import { beforeEach, describe, expect, it, vi } from 'vitest';
import { translatePhrase } from './togetherApi';

// Mock fetch globally
global.fetch = vi.fn();

const encoder = new TextEncoder();

/** One server-sent event carrying a streamed delta, as Together.ai sends it. */
function sse(delta: Record<string, unknown>): string {
  return `data: ${JSON.stringify({ choices: [{ index: 0, delta }] })}\n\n`;
}

/** A successful streaming response whose body yields the given raw chunks. */
function streamResponse(chunks: string[], failAfterChunks = false) {
  return {
    ok: true,
    status: 200,
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        if (failAfterChunks) {
          controller.error(new Error('connection reset'));
        } else {
          controller.close();
        }
      },
    }),
  };
}

const FOUR_SECTIONS = `## Principal Translation
Hello

## Grammatical Analysis
Simple greeting

## Learning Key
Common phrase

## Technical Variations
Hi, Hey`;

describe('togetherApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default env vars for tests
    vi.stubEnv('VITE_TOGETHER_MODEL', 'meta-llama/Llama-3.3-70B-Instruct-Turbo');
  });

  it('should successfully translate a Spanish phrase', async () => {
    (global.fetch as any).mockResolvedValueOnce(
      streamResponse([sse({ content: FOUR_SECTIONS }), 'data: [DONE]\n\n']),
    );

    const result = await translatePhrase('Hola', 'test-api-key');

    expect(result).toBe(FOUR_SECTIONS);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.together.xyz/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('should include correct prompt structure and request streaming', async () => {
    (global.fetch as any).mockResolvedValueOnce(
      streamResponse([sse({ content: 'Test response' })]),
    );

    await translatePhrase('¿Cómo estás?', 'test-api-key');

    const fetchCall = (global.fetch as any).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);

    expect(requestBody.model).toBe('meta-llama/Llama-3.3-70B-Instruct-Turbo');
    expect(requestBody.stream).toBe(true);
    expect(requestBody.messages).toHaveLength(2);
    expect(requestBody.messages[0].role).toBe('system');
    expect(requestBody.messages[1].role).toBe('user');
    expect(requestBody.messages[1].content).toContain('¿Cómo estás?');
  });

  describe('streamed response', () => {
    it('should join the content deltas of several events in order', async () => {
      (global.fetch as any).mockResolvedValueOnce(
        streamResponse([
          sse({ content: '## Principal Translation\n' }),
          sse({ content: 'I drew a blank.' }),
          sse({ content: '\n\n## Grammatical Analysis\nIdiom' }),
          'data: [DONE]\n\n',
        ]),
      );

      const result = await translatePhrase('Me quedé en blanco.', 'test-api-key');

      expect(result).toBe(
        '## Principal Translation\nI drew a blank.\n\n## Grammatical Analysis\nIdiom',
      );
    });

    it('should reassemble an event split across network chunks', async () => {
      const event = sse({ content: 'Hello' });
      const cut = Math.floor(event.length / 2);

      (global.fetch as any).mockResolvedValueOnce(
        streamResponse([event.slice(0, cut), event.slice(cut), sse({ content: ' world' })]),
      );

      const result = await translatePhrase('Hola', 'test-api-key');

      expect(result).toBe('Hello world');
    });

    it('should decode multi-byte characters split across chunks', async () => {
      const bytes = encoder.encode(sse({ content: 'quedé' }));
      const accentIndex = bytes.indexOf(0xc3); // first byte of "é"
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(bytes.slice(0, accentIndex + 1));
          controller.enqueue(bytes.slice(accentIndex + 1));
          controller.close();
        },
      });

      (global.fetch as any).mockResolvedValueOnce({ ok: true, status: 200, body });

      const result = await translatePhrase('Hola', 'test-api-key');

      expect(result).toBe('quedé');
    });

    it('should accept CRLF line endings', async () => {
      (global.fetch as any).mockResolvedValueOnce(
        streamResponse([sse({ content: 'Hi' }).replaceAll('\n', '\r\n')]),
      );

      const result = await translatePhrase('Hola', 'test-api-key');

      expect(result).toBe('Hi');
    });

    it('should read a last event that has no trailing newline', async () => {
      (global.fetch as any).mockResolvedValueOnce(
        streamResponse([sse({ content: 'Hi ' }), sse({ content: 'there' }).trimEnd()]),
      );

      const result = await translatePhrase('Hola', 'test-api-key');

      expect(result).toBe('Hi there');
    });

    it('should ignore the reasoning trace and keep only the answer', async () => {
      (global.fetch as any).mockResolvedValueOnce(
        streamResponse([
          sse({ reasoning: 'The user wants a translation...' }),
          sse({ reasoning_content: 'Let me think about the grammar...' }),
          sse({ content: null }),
          sse({ content: 'Answer' }),
        ]),
      );

      const result = await translatePhrase('Hola', 'test-api-key');

      expect(result).toBe('Answer');
    });

    it('should skip comments, blank lines, malformed JSON and events without choices', async () => {
      (global.fetch as any).mockResolvedValueOnce(
        streamResponse([
          ': keep-alive\n\n',
          'event: ping\n',
          'data: this is not json\n\n',
          'data: {"choices":[]}\n\n',
          'data: {"usage":{"total_tokens":3}}\n\n',
          sse({ content: 'Kept' }),
          'data: [DONE]\n\n',
        ]),
      );

      const result = await translatePhrase('Hola', 'test-api-key');

      expect(result).toBe('Kept');
    });

    it('should treat a stream with only reasoning and no answer as an invalid response', async () => {
      (global.fetch as any).mockResolvedValueOnce(
        streamResponse([sse({ reasoning: 'Thinking forever...' }), 'data: [DONE]\n\n']),
      );

      await expect(translatePhrase('Hola', 'test-api-key')).rejects.toThrow(
        'Invalid response from API',
      );
    });

    it('should treat an empty stream as an invalid response', async () => {
      (global.fetch as any).mockResolvedValueOnce(streamResponse([]));

      await expect(translatePhrase('Hola', 'test-api-key')).rejects.toThrow(
        'Invalid response from API',
      );
    });

    it('should treat a response without a body as an invalid response', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, status: 200, body: null });

      await expect(translatePhrase('Hola', 'test-api-key')).rejects.toThrow(
        'Invalid response from API',
      );
    });

    it('should report a network error when the connection drops mid-stream', async () => {
      (global.fetch as any).mockResolvedValueOnce(
        streamResponse([sse({ content: 'Half an ans' })], true),
      );

      await expect(translatePhrase('Hola', 'test-api-key')).rejects.toThrow(
        'Network error. Please check your connection and try again.',
      );
    });
  });

  it('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(translatePhrase('Hola', 'test-api-key')).rejects.toThrow(
      'Network error. Please check your connection and try again.',
    );
  });

  it.each([
    [400, 'Bad Request'],
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
    [500, 'Internal Server Error'],
    [503, 'Service Unavailable'],
  ])('should show a readable message when the provider answers %i', async (status, statusText) => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status,
      statusText,
    });

    const error = await translatePhrase('Me quedé en blanco.', 'test-api-key').catch((e) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('The translation service is unavailable. Try again later.');
    expect(error.message).not.toContain('API error');
  });

  it('should handle rate limit errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    await expect(translatePhrase('Hola', 'test-api-key')).rejects.toThrow(
      'Rate limit exceeded. Please wait a moment and try again.',
    );
  });

  it('should handle empty Spanish phrase', async () => {
    await expect(translatePhrase('')).rejects.toThrow('Spanish phrase cannot be empty');
  });

  it('should handle whitespace-only input', async () => {
    await expect(translatePhrase('   ')).rejects.toThrow('Spanish phrase cannot be empty');
  });

  it('should include API key in headers', async () => {
    (global.fetch as any).mockResolvedValueOnce(streamResponse([sse({ content: 'Test' })]));

    await translatePhrase('Test', 'test-api-key');

    const fetchCall = (global.fetch as any).mock.calls[0];
    const headers = fetchCall[1].headers;

    // API key should be included
    expect(headers.Authorization).toBe('Bearer test-api-key');
  });

  describe('getModel validation', () => {
    it('should throw error when VITE_TOGETHER_MODEL is not set', async () => {
      vi.stubEnv('VITE_TOGETHER_MODEL', undefined);

      await expect(translatePhrase('Hola', 'test-api-key')).rejects.toThrow(
        'Together.ai model not configured. Please set VITE_TOGETHER_MODEL in your .env file.',
      );
    });

    it('should throw error when VITE_TOGETHER_MODEL is empty string', async () => {
      vi.stubEnv('VITE_TOGETHER_MODEL', '');

      await expect(translatePhrase('Hola', 'test-api-key')).rejects.toThrow(
        'Together.ai model not configured. Please set VITE_TOGETHER_MODEL in your .env file.',
      );
    });

    it('should throw error when VITE_TOGETHER_MODEL is whitespace only', async () => {
      vi.stubEnv('VITE_TOGETHER_MODEL', '   ');

      await expect(translatePhrase('Hola', 'test-api-key')).rejects.toThrow(
        'Together.ai model not configured. Please set VITE_TOGETHER_MODEL in your .env file.',
      );
    });

    it('should use model from environment variable', async () => {
      vi.stubEnv('VITE_TOGETHER_MODEL', 'custom-model-name');

      (global.fetch as any).mockResolvedValueOnce(
        streamResponse([sse({ content: 'Test response' })]),
      );

      await translatePhrase('Hola', 'test-api-key');

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.model).toBe('custom-model-name');
    });
  });
});
