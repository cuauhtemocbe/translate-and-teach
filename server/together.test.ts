// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { ProviderError, requestTranslation, SYSTEM_PROMPT } from './together.ts';

const encoder = new TextEncoder();

/** One server-sent event carrying a streamed delta, as Together.ai sends it. */
function sse(delta: Record<string, unknown>): string {
  return `data: ${JSON.stringify({ choices: [{ index: 0, delta }] })}\n\n`;
}

/** A successful streaming response whose body yields the given raw chunks. */
function streamResponse(chunks: (string | Uint8Array)[], failAfterChunks = false) {
  return {
    ok: true,
    status: 200,
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(typeof chunk === 'string' ? encoder.encode(chunk) : chunk);
        }
        if (failAfterChunks) {
          controller.error(new Error('connection reset'));
        } else {
          controller.close();
        }
      },
    }),
  } as unknown as Response;
}

function fakeFetch(...responses: Response[]) {
  const fn = vi.fn();
  for (const response of responses) {
    fn.mockResolvedValueOnce(response);
  }
  return fn;
}

function translate(fetchImpl: ReturnType<typeof vi.fn>, overrides = {}) {
  return requestTranslation({
    apiKey: 'test-key',
    model: 'test-model',
    phrase: 'Me quedé en blanco.',
    fetchImpl: fetchImpl as unknown as typeof fetch,
    ...overrides,
  });
}

describe('requestTranslation', () => {
  describe('request sent to the provider', () => {
    it('should post a streaming chat completion with the credential and model', async () => {
      const fetchImpl = fakeFetch(streamResponse([sse({ content: 'ok' })]));

      await translate(fetchImpl);

      expect(fetchImpl).toHaveBeenCalledTimes(1);
      const [url, init] = fetchImpl.mock.calls[0];
      expect(url).toBe('https://api.together.xyz/v1/chat/completions');
      expect(init.method).toBe('POST');
      expect(init.headers.Authorization).toBe('Bearer test-key');
      expect(init.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(init.body);
      expect(body.model).toBe('test-model');
      expect(body.stream).toBe(true);
      expect(body.max_tokens).toBe(1024);
      expect(body.messages).toEqual([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'Spanish phrase: "Me quedé en blanco."' },
      ]);
    });

    it('should ask for the four sections in the system prompt', () => {
      for (const heading of [
        'Principal Translation',
        'Grammatical Analysis',
        'Learning Key',
        'Technical Variations',
      ]) {
        expect(SYSTEM_PROMPT).toContain(`## ${heading}`);
      }
    });

    it('should abort the request when a signal is given to bound the wait', async () => {
      const fetchImpl = fakeFetch(streamResponse([sse({ content: 'ok' })]));

      await translate(fetchImpl);

      expect(fetchImpl.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('streamed answer', () => {
    it('should join the content deltas of several events in order', async () => {
      const fetchImpl = fakeFetch(
        streamResponse([
          sse({ content: '## Principal Translation\n' }),
          sse({ content: 'I drew a blank.' }),
          sse({ content: '\n\n## Grammatical Analysis\nIdiom' }),
          'data: [DONE]\n\n',
        ]),
      );

      await expect(translate(fetchImpl)).resolves.toBe(
        '## Principal Translation\nI drew a blank.\n\n## Grammatical Analysis\nIdiom',
      );
    });

    it('should reassemble an event split across network chunks', async () => {
      const event = sse({ content: 'Hello' });
      const cut = Math.floor(event.length / 2);
      const fetchImpl = fakeFetch(
        streamResponse([event.slice(0, cut), event.slice(cut), sse({ content: ' world' })]),
      );

      await expect(translate(fetchImpl)).resolves.toBe('Hello world');
    });

    it('should decode multi-byte characters split across chunks', async () => {
      const bytes = encoder.encode(sse({ content: 'quedé' }));
      const accentIndex = bytes.indexOf(0xc3); // first byte of "é"
      const fetchImpl = fakeFetch(
        streamResponse([bytes.slice(0, accentIndex + 1), bytes.slice(accentIndex + 1)]),
      );

      await expect(translate(fetchImpl)).resolves.toBe('quedé');
    });

    it('should accept CRLF line endings', async () => {
      const fetchImpl = fakeFetch(
        streamResponse([sse({ content: 'Hi' }).replaceAll('\n', '\r\n')]),
      );

      await expect(translate(fetchImpl)).resolves.toBe('Hi');
    });

    it('should read a last event that has no trailing newline', async () => {
      const fetchImpl = fakeFetch(
        streamResponse([sse({ content: 'Hi ' }), sse({ content: 'there' }).trimEnd()]),
      );

      await expect(translate(fetchImpl)).resolves.toBe('Hi there');
    });

    it('should ignore the reasoning trace and keep only the answer', async () => {
      const fetchImpl = fakeFetch(
        streamResponse([
          sse({ reasoning: 'The user wants a translation...' }),
          sse({ reasoning_content: 'Let me think about the grammar...' }),
          sse({ content: null }),
          sse({ content: 'Answer' }),
        ]),
      );

      await expect(translate(fetchImpl)).resolves.toBe('Answer');
    });

    it('should skip comments, blank lines, malformed JSON and events without choices', async () => {
      const fetchImpl = fakeFetch(
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

      await expect(translate(fetchImpl)).resolves.toBe('Kept');
    });
  });

  describe('provider failures', () => {
    it.each([
      [400, 'Bad Request'],
      [401, 'Unauthorized'],
      [403, 'Forbidden'],
      [500, 'Internal Server Error'],
      [503, 'Service Unavailable'],
    ])(
      'should fail with an unavailable ProviderError when the provider answers %i',
      async (status) => {
        const fetchImpl = fakeFetch({ ok: false, status } as Response);

        const error = await translate(fetchImpl).catch((e) => e);

        expect(error).toBeInstanceOf(ProviderError);
        expect(error.rateLimited).toBe(false);
        expect(error.message).toContain(String(status));
      },
    );

    it('should flag a provider 429 as rate limited', async () => {
      const fetchImpl = fakeFetch({ ok: false, status: 429 } as Response);

      const error = await translate(fetchImpl).catch((e) => e);

      expect(error).toBeInstanceOf(ProviderError);
      expect(error.rateLimited).toBe(true);
    });

    it('should fail when the stream carries only a reasoning trace', async () => {
      const fetchImpl = fakeFetch(
        streamResponse([sse({ reasoning: 'Thinking forever...' }), 'data: [DONE]\n\n']),
      );

      await expect(translate(fetchImpl)).rejects.toBeInstanceOf(ProviderError);
    });

    it('should fail on an empty stream', async () => {
      const fetchImpl = fakeFetch(streamResponse([]));

      await expect(translate(fetchImpl)).rejects.toBeInstanceOf(ProviderError);
    });

    it('should fail on a response without a body', async () => {
      const fetchImpl = fakeFetch({ ok: true, status: 200, body: null } as Response);

      await expect(translate(fetchImpl)).rejects.toBeInstanceOf(ProviderError);
    });

    it('should fail when the connection drops mid-stream', async () => {
      const fetchImpl = fakeFetch(streamResponse([sse({ content: 'Half an ans' })], true));

      await expect(translate(fetchImpl)).rejects.toBeInstanceOf(ProviderError);
    });

    it('should fail when the request cannot reach the provider', async () => {
      const fetchImpl = vi.fn().mockRejectedValueOnce(new TypeError('fetch failed'));

      await expect(translate(fetchImpl)).rejects.toBeInstanceOf(ProviderError);
    });

    it('should fail when the provider does not answer within the timeout', async () => {
      const fetchImpl = vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
          }),
      );

      const error = await translate(fetchImpl as unknown as ReturnType<typeof vi.fn>, {
        timeoutMs: 20,
      }).catch((e) => e);

      expect(error).toBeInstanceOf(ProviderError);
      expect(error.message).toContain('timed out');
    });

    it('should never put the credential or the provider text in the error', async () => {
      const fetchImpl = fakeFetch({
        ok: false,
        status: 500,
        text: async () => 'provider said: key test-key is bad',
      } as unknown as Response);

      const error = await translate(fetchImpl).catch((e) => e);

      expect(error.message).not.toContain('test-key');
      expect(error.message).not.toContain('provider said');
    });
  });
});
