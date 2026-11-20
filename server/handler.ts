import type { IncomingMessage, ServerResponse } from 'node:http';
import { serveStatic } from './static.ts';
import { ProviderError } from './together.ts';

export const MAX_PHRASE_LENGTH = 500;

// A phrase of MAX_PHRASE_LENGTH characters fits in a few KB even in UTF-8
const MAX_BODY_BYTES = 8 * 1024;

const TRANSLATE_PATH = '/api/translate';

const MESSAGES = {
  invalidPhrase: `Enter a phrase of 1 to ${MAX_PHRASE_LENGTH} characters.`,
  dailyLimit: 'Daily limit reached. Please try again tomorrow.',
  providerRateLimited: 'Rate limit exceeded. Please wait a moment and try again.',
  unavailable: 'The translation service is unavailable. Try again later.',
  notFound: 'Not found',
} as const;

export interface HandlerOptions {
  /** Directory holding the Vite build output */
  distDir: string;
  /** Resolves the analysis for a validated phrase; rejects with ProviderError */
  translate: (phrase: string) => Promise<string>;
  /** Counts one request for the client; false when it is over its daily limit */
  isRequestAllowed: (clientId: string) => boolean;
  /** Operator-facing log sink */
  logError?: (message: string) => void;
}

function sendJson(res: ServerResponse, status: number, body: unknown, headers = {}): void {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers,
  });
  res.end(JSON.stringify(body));
}

/**
 * Railway's edge overwrites X-Real-IP with the client's address, so a value the
 * client sends never survives (X-Forwarded-For cannot be used: its last entry
 * is an edge address shared by every visitor). Off Railway the socket address
 * is the best available identity.
 */
function getClientId(req: IncomingMessage): string {
  const realIp = String(req.headers['x-real-ip'] ?? '').trim();
  return realIp || req.socket.remoteAddress || 'unknown';
}

/** Reads the request body, or null when it is larger than allowed */
async function readBody(req: IncomingMessage): Promise<string | null> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;

    if (size > MAX_BODY_BYTES) {
      return null;
    }

    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}

/** The trimmed phrase from the request body, or null when it is not acceptable */
function parsePhrase(body: string | null): string | null {
  if (body === null) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }

  const phrase = (parsed as { phrase?: unknown } | null)?.phrase;

  if (typeof phrase !== 'string') {
    return null;
  }

  const trimmed = phrase.trim();
  return trimmed !== '' && trimmed.length <= MAX_PHRASE_LENGTH ? trimmed : null;
}

async function handleTranslate(
  req: IncomingMessage,
  res: ServerResponse,
  { translate, isRequestAllowed, logError }: HandlerOptions,
): Promise<void> {
  const phrase = parsePhrase(await readBody(req));

  if (phrase === null) {
    sendJson(res, 400, { error: MESSAGES.invalidPhrase });
    return;
  }

  // After validation, so a rejected phrase does not spend the daily allowance
  if (!isRequestAllowed(getClientId(req))) {
    sendJson(res, 429, { error: MESSAGES.dailyLimit });
    return;
  }

  try {
    sendJson(res, 200, { content: await translate(phrase) });
  } catch (error) {
    logError?.(`Translation failed: ${error instanceof Error ? error.message : 'unknown error'}`);

    if (error instanceof ProviderError && error.rateLimited) {
      sendJson(res, 429, { error: MESSAGES.providerRateLimited });
      return;
    }

    // Same generic answer whatever went wrong: provider details never reach the visitor
    sendJson(res, 502, { error: MESSAGES.unavailable });
  }
}

async function route(
  req: IncomingMessage,
  res: ServerResponse,
  options: HandlerOptions,
): Promise<void> {
  const method = req.method ?? 'GET';
  const urlPath = req.url ?? '/';
  const pathname = urlPath.split('?')[0];

  if (pathname === TRANSLATE_PATH) {
    if (method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' }, { allow: 'POST' });
      return;
    }

    await handleTranslate(req, res, options);
    return;
  }

  // An API path that does not exist must not fall through to the app shell
  if (pathname.startsWith('/api/')) {
    sendJson(res, 404, { error: MESSAGES.notFound });
    return;
  }

  if (method !== 'GET' && method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' });
    res.end();
    return;
  }

  await serveStatic(method, urlPath, options.distDir, res);
}

/**
 * Request handler for the production server: POST /api/translate plus the
 * static site. Framework-free on purpose, so the image needs no dependencies.
 */
export function createRequestHandler(options: HandlerOptions) {
  return (req: IncomingMessage, res: ServerResponse): void => {
    res.setHeader('x-content-type-options', 'nosniff');

    route(req, res, options).catch((error: unknown) => {
      options.logError?.(
        `Unhandled request error: ${error instanceof Error ? error.message : 'unknown error'}`,
      );

      if (res.headersSent) {
        res.destroy();
        return;
      }

      sendJson(res, 500, { error: 'Internal server error' });
    });
  };
}
