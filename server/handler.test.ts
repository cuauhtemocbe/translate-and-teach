// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from 'vitest';
import { createRequestHandler } from './handler.ts';
import { createDailyRateLimiter } from './rateLimiter.ts';
import { ProviderError, requestTranslation } from './together.ts';

const UNAVAILABLE = 'The translation service is unavailable. Try again later.';
const FOUR_SECTIONS = `## Principal Translation
I drew a blank.

## Grammatical Analysis
Idiom

## Learning Key
Common phrase

## Technical Variations
My mind went blank.`;

let dist: string;
let server: Server;
let baseUrl: string;
let translate: Mock<(phrase: string) => Promise<string>>;
let isRequestAllowed: Mock<(clientId: string) => boolean>;
let logError: Mock<(message: string) => void>;

function listen(handler: ReturnType<typeof createRequestHandler>) {
  server = createServer(handler);
  return new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      resolve();
    });
  });
}

function post(body: unknown, headers: Record<string, string> = {}) {
  return fetch(`${baseUrl}/api/translate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

beforeAll(() => {
  dist = mkdtempSync(join(tmpdir(), 'handler-'));
  mkdirSync(join(dist, 'assets'));
  writeFileSync(join(dist, 'index.html'), '<html>shell</html>');
  writeFileSync(join(dist, 'assets', 'app-abc123.js'), 'console.log(1)');
});

afterAll(() => {
  rmSync(dist, { recursive: true, force: true });
});

beforeEach(async () => {
  translate = vi.fn<(phrase: string) => Promise<string>>().mockResolvedValue(FOUR_SECTIONS);
  isRequestAllowed = vi.fn<(clientId: string) => boolean>().mockReturnValue(true);
  logError = vi.fn<(message: string) => void>();
  await listen(createRequestHandler({ distDir: dist, translate, isRequestAllowed, logError }));
});

afterEach(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

describe('POST /api/translate', () => {
  it('should answer a valid phrase with the provider analysis', async () => {
    const response = await post({ phrase: 'Me quedé en blanco.' });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({ content: FOUR_SECTIONS });
    expect(translate).toHaveBeenCalledExactlyOnceWith('Me quedé en blanco.');
  });

  it('should trim the phrase before translating it', async () => {
    await post({ phrase: '  Hola  ' });

    expect(translate).toHaveBeenCalledExactlyOnceWith('Hola');
  });

  it('should accept a phrase of exactly 500 characters', async () => {
    const response = await post({ phrase: 'a'.repeat(500) });

    expect(response.status).toBe(200);
  });

  it('should not cache translations', async () => {
    const response = await post({ phrase: 'Hola' });

    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  describe('invalid phrases', () => {
    it.each([
      ['empty', { phrase: '' }],
      ['three spaces', { phrase: '   ' }],
      ['501 characters', { phrase: 'a'.repeat(501) }],
      ['missing', {}],
      ['a number', { phrase: 42 }],
      ['null body', null],
      ['an array body', ['Hola']],
    ])('should reject %s with 400 and never call the provider', async (_name, body) => {
      const response = await post(body);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: expect.any(String) });
      expect(translate).not.toHaveBeenCalled();
    });

    it('should reject malformed JSON with 400', async () => {
      const response = await post('{"phrase": "Hola"');

      expect(response.status).toBe(400);
      expect(translate).not.toHaveBeenCalled();
    });

    it('should reject an oversized body with 400', async () => {
      const response = await post({ phrase: 'Hola', padding: 'x'.repeat(20_000) });

      expect(response.status).toBe(400);
      expect(translate).not.toHaveBeenCalled();
    });

    it('should not spend the daily allowance on an invalid phrase', async () => {
      await post({ phrase: '   ' });

      expect(isRequestAllowed).not.toHaveBeenCalled();
    });
  });

  describe('daily limit per client', () => {
    it('should answer 429 and not call the provider once the client is over its limit', async () => {
      isRequestAllowed.mockReturnValue(false);

      const response = await post({ phrase: 'Hola' });

      expect(response.status).toBe(429);
      expect(await response.json()).toEqual({ error: expect.stringContaining('tomorrow') });
      expect(translate).not.toHaveBeenCalled();
    });

    it('should identify the client by the X-Real-IP header', async () => {
      await post({ phrase: 'Hola' }, { 'x-real-ip': '203.0.113.7' });

      expect(isRequestAllowed).toHaveBeenCalledExactlyOnceWith('203.0.113.7');
    });

    it('should fall back to the socket address without the header', async () => {
      await post({ phrase: 'Hola' });

      expect(isRequestAllowed).toHaveBeenCalledExactlyOnceWith(
        expect.stringMatching(/127\.0\.0\.1/),
      );
    });

    it('should block the 26th request of a client and still serve another client', async () => {
      await new Promise((resolve) => server.close(resolve));
      await listen(
        createRequestHandler({
          distDir: dist,
          translate,
          isRequestAllowed: createDailyRateLimiter(25),
          logError,
        }),
      );
      const asClient = (ip: string) => post({ phrase: 'Hola' }, { 'x-real-ip': ip });

      const statuses: number[] = [];
      for (let i = 0; i < 26; i++) {
        statuses.push((await asClient('198.51.100.1')).status);
      }

      expect(statuses.slice(0, 25)).toEqual(Array(25).fill(200));
      expect(statuses[25]).toBe(429);
      expect((await asClient('198.51.100.2')).status).toBe(200);
      expect(translate).toHaveBeenCalledTimes(26);
    });
  });

  describe('provider failures', () => {
    it('should answer 502 with a generic message when the provider fails', async () => {
      translate.mockRejectedValue(new ProviderError('Together.ai answered 500'));

      const response = await post({ phrase: 'Hola' });

      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ error: UNAVAILABLE });
    });

    it('should answer 429 asking to wait when the provider is rate limiting', async () => {
      translate.mockRejectedValue(new ProviderError('Together.ai answered 429', true));

      const response = await post({ phrase: 'Hola' });

      expect(response.status).toBe(429);
      expect(await response.json()).toEqual({
        error: 'Rate limit exceeded. Please wait a moment and try again.',
      });
    });

    it('should answer 502 for an unexpected error too', async () => {
      translate.mockRejectedValue(new Error('boom'));

      const response = await post({ phrase: 'Hola' });

      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ error: UNAVAILABLE });
    });

    it('should log the reason server-side for the operator', async () => {
      translate.mockRejectedValue(new ProviderError('Together.ai answered 401'));

      await post({ phrase: 'Hola' });

      expect(logError).toHaveBeenCalledWith(expect.stringContaining('Together.ai answered 401'));
    });

    it('should leak neither the provider text nor the credential end to end', async () => {
      const secret = 'tgp_v1_SECRET-VALUE';
      const leaky = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => `upstream failure for key ${secret}`,
      });
      await new Promise((resolve) => server.close(resolve));
      await listen(
        createRequestHandler({
          distDir: dist,
          translate: (phrase) =>
            requestTranslation({
              apiKey: secret,
              model: 'm',
              phrase,
              fetchImpl: leaky as unknown as typeof fetch,
            }),
          isRequestAllowed,
          logError,
        }),
      );

      const response = await post({ phrase: 'Hola' });
      const text = await response.text();

      expect(response.status).toBe(502);
      expect(leaky).toHaveBeenCalledTimes(1);
      expect(text).not.toContain(secret);
      expect(text).not.toContain('upstream failure');
      expect(logError).not.toHaveBeenCalledWith(expect.stringContaining(secret));
    });
  });
});

describe('routing', () => {
  it('should refuse other methods on /api/translate with 405', async () => {
    const response = await fetch(`${baseUrl}/api/translate`);

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
    expect(translate).not.toHaveBeenCalled();
  });

  it('should answer an unknown API path with a JSON 404, not the app shell', async () => {
    const response = await fetch(`${baseUrl}/api/unknown`);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Not found' });
  });

  it('should match /api/translate with a query string', async () => {
    const response = await fetch(`${baseUrl}/api/translate?x=1`, {
      method: 'POST',
      body: JSON.stringify({ phrase: 'Hola' }),
    });

    expect(response.status).toBe(200);
  });

  it('should refuse methods other than GET and HEAD on static paths', async () => {
    const response = await fetch(`${baseUrl}/`, { method: 'POST' });

    expect(response.status).toBe(405);
  });
});

describe('static files', () => {
  it('should serve the app shell at the root', async () => {
    const response = await fetch(`${baseUrl}/`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.headers.get('cache-control')).toBe('no-cache');
    expect(await response.text()).toBe('<html>shell</html>');
  });

  it('should serve hashed assets as immutable', async () => {
    const response = await fetch(`${baseUrl}/assets/app-abc123.js`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/javascript');
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(await response.text()).toBe('console.log(1)');
  });

  it('should answer HEAD without a body', async () => {
    const response = await fetch(`${baseUrl}/`, { method: 'HEAD' });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
  });

  it('should answer 404 for a missing asset', async () => {
    const response = await fetch(`${baseUrl}/assets/missing.js`);

    expect(response.status).toBe(404);
  });

  it('should tell browsers not to sniff content types', async () => {
    const response = await fetch(`${baseUrl}/`);

    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });
});

describe('unexpected failures', () => {
  function fakeRequest(overrides: Record<string, unknown> = {}) {
    return Object.assign(Readable.from([Buffer.from('{"phrase":"Hola"}')]), {
      method: 'POST',
      url: '/api/translate',
      headers: {},
      socket: {},
      ...overrides,
    }) as unknown as IncomingMessage;
  }

  function fakeResponse(headersSent: boolean, end = vi.fn()) {
    return {
      headersSent,
      setHeader: vi.fn(),
      writeHead: vi.fn(),
      end,
      destroy: vi.fn(),
    };
  }

  it('should answer 500 and log it when something outside the provider call throws', async () => {
    isRequestAllowed.mockImplementation(() => {
      throw new Error('limiter exploded');
    });

    const response = await post({ phrase: 'Hola' });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('limiter exploded'));
  });

  it('should still answer 500 when what was thrown is not an Error', async () => {
    isRequestAllowed.mockImplementation(() => {
      throw 'not an error object';
    });

    const response = await post({ phrase: 'Hola' });

    expect(response.status).toBe(500);
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('unknown error'));
  });

  it('should destroy the connection when it fails after the headers were sent', async () => {
    const res = fakeResponse(
      true,
      vi.fn(() => {
        throw new Error('socket closed');
      }),
    );

    createRequestHandler({ distDir: dist, translate, isRequestAllowed, logError })(
      fakeRequest(),
      res as unknown as ServerResponse,
    );

    await vi.waitFor(() => expect(res.destroy).toHaveBeenCalled());
  });

  it('should identify a client without any address as unknown', async () => {
    const res = fakeResponse(false);

    createRequestHandler({ distDir: dist, translate, isRequestAllowed, logError })(
      fakeRequest(),
      res as unknown as ServerResponse,
    );

    await vi.waitFor(() => expect(res.end).toHaveBeenCalled());
    expect(isRequestAllowed).toHaveBeenCalledExactlyOnceWith('unknown');
  });

  it('should treat a request without method and url as GET /', async () => {
    const res = fakeResponse(false);

    createRequestHandler({ distDir: dist, translate, isRequestAllowed, logError })(
      fakeRequest({ method: undefined, url: undefined }),
      res as unknown as ServerResponse,
    );

    await vi.waitFor(() => expect(res.writeHead).toHaveBeenCalledWith(200, expect.any(Object)));
  });
});
