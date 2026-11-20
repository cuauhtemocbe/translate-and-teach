import { beforeEach, describe, expect, it, vi } from 'vitest';
import { translatePhrase } from './translateApi';

// Mock fetch globally
global.fetch = vi.fn();

const UNAVAILABLE = 'The translation service is unavailable. Try again later.';
const RATE_LIMIT = 'Rate limit exceeded. Please wait a moment and try again.';

const FOUR_SECTIONS = `## Principal Translation
Hello

## Grammatical Analysis
Simple greeting

## Learning Key
Common phrase

## Technical Variations
Hi, Hey`;

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe('translateApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('request', () => {
    it('should send one request, to /api/translate on the app origin', async () => {
      (global.fetch as any).mockResolvedValueOnce(jsonResponse(200, { content: FOUR_SECTIONS }));

      await translatePhrase('Me quedé en blanco.');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, init] = (global.fetch as any).mock.calls[0];
      expect(url).toBe('/api/translate');
      expect(init.method).toBe('POST');
      expect(init.headers['Content-Type']).toBe('application/json');
    });

    it('should send the trimmed phrase as JSON', async () => {
      (global.fetch as any).mockResolvedValueOnce(jsonResponse(200, { content: FOUR_SECTIONS }));

      await translatePhrase('  ¿Cómo estás?  ');

      const init = (global.fetch as any).mock.calls[0][1];
      expect(JSON.parse(init.body)).toEqual({ phrase: '¿Cómo estás?' });
    });

    it('should never talk to the provider or carry a credential', async () => {
      (global.fetch as any).mockResolvedValueOnce(jsonResponse(200, { content: FOUR_SECTIONS }));

      await translatePhrase('Me quedé en blanco.');

      const [url, init] = (global.fetch as any).mock.calls[0];
      expect(String(url)).not.toContain('together');
      expect(JSON.stringify(init)).not.toMatch(/authorization|bearer|api[-_]?key/i);
    });

    it.each(['', '   '])(
      'should reject the phrase %j without calling the server',
      async (phrase) => {
        await expect(translatePhrase(phrase)).rejects.toThrow('Spanish phrase cannot be empty');

        expect(global.fetch).not.toHaveBeenCalled();
      },
    );
  });

  describe('response', () => {
    it('should return the analysis for a valid phrase', async () => {
      (global.fetch as any).mockResolvedValueOnce(jsonResponse(200, { content: FOUR_SECTIONS }));

      await expect(translatePhrase('Hola')).resolves.toBe(FOUR_SECTIONS);
    });

    it.each([
      ['no content', {}],
      ['empty content', { content: '' }],
      ['whitespace content', { content: '   ' }],
      ['non-string content', { content: 42 }],
      ['a null body', null],
    ])('should treat %s as an invalid response', async (_name, body) => {
      (global.fetch as any).mockResolvedValueOnce(jsonResponse(200, body));

      await expect(translatePhrase('Hola')).rejects.toThrow('Invalid response from API');
    });

    it('should treat an unreadable success body as an invalid response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token <');
        },
      });

      await expect(translatePhrase('Hola')).rejects.toThrow('Invalid response from API');
    });
  });

  describe('errors', () => {
    it.each([[401], [403], [404], [500], [502], [503]])(
      'should show a readable message when the server answers %i',
      async (status) => {
        (global.fetch as any).mockResolvedValueOnce(
          jsonResponse(status, { error: 'Together exploded: tgp_v1_SECRET' }),
        );

        const error = await translatePhrase('Me quedé en blanco.').catch((e) => e);

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe(UNAVAILABLE);
        expect(error.message).not.toContain('API error');
      },
    );

    it('should show the same readable message when the failure has no JSON body', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError('Unexpected token <');
        },
      });

      await expect(translatePhrase('Hola')).rejects.toThrow(UNAVAILABLE);
    });

    it('should show the server message when the rate limit is reached', async () => {
      (global.fetch as any).mockResolvedValueOnce(
        jsonResponse(429, { error: 'Daily limit reached. Please try again tomorrow.' }),
      );

      await expect(translatePhrase('Hola')).rejects.toThrow(
        'Daily limit reached. Please try again tomorrow.',
      );
    });

    it('should fall back to the rate limit message without a server message', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => {
          throw new SyntaxError('Unexpected token <');
        },
      });

      await expect(translatePhrase('Hola')).rejects.toThrow(RATE_LIMIT);
    });

    it('should show the server message when the phrase is rejected', async () => {
      (global.fetch as any).mockResolvedValueOnce(
        jsonResponse(400, { error: 'Enter a phrase of 1 to 500 characters.' }),
      );

      await expect(translatePhrase('a'.repeat(501))).rejects.toThrow(
        'Enter a phrase of 1 to 500 characters.',
      );
    });

    it('should fall back to a phrase message when a 400 has no server message', async () => {
      (global.fetch as any).mockResolvedValueOnce(jsonResponse(400, {}));

      await expect(translatePhrase('Hola')).rejects.toThrow(
        'Enter a phrase of 1 to 500 characters.',
      );
    });

    it('should report a network error when the server cannot be reached', async () => {
      (global.fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(translatePhrase('Hola')).rejects.toThrow(
        'Network error. Please check your connection and try again.',
      );
    });
  });
});
