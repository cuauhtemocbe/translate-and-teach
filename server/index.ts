import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { createRequestHandler } from './handler.ts';
import { createDailyRateLimiter } from './rateLimiter.ts';
import { ProviderError, requestTranslation } from './together.ts';

// Runtime variables on purpose (no VITE_ prefix, not Docker build args):
// nothing here is ever inlined into the files served to the browser.
const apiKey = process.env.TOGETHER_API_KEY?.trim();
const model = process.env.TOGETHER_MODEL?.trim();
const port = Number(process.env.PORT) || 8080;

if (!apiKey || !model) {
  // Keep serving the site; translations answer 502 until this is fixed
  console.error('TOGETHER_API_KEY and TOGETHER_MODEL must be set for translations to work.');
}

const handler = createRequestHandler({
  distDir: resolve(import.meta.dirname, '..', 'dist'),
  translate: (phrase) => {
    if (!apiKey || !model) {
      return Promise.reject(new ProviderError('TOGETHER_API_KEY or TOGETHER_MODEL is not set'));
    }

    return requestTranslation({ apiKey, model, phrase });
  },
  isRequestAllowed: createDailyRateLimiter(),
  logError: (message) => console.error(message),
});

createServer(handler).listen(port, () => {
  console.log(`Listening on port ${port}`);
});
