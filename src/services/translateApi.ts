const TRANSLATE_URL = '/api/translate';

const SERVICE_UNAVAILABLE_MESSAGE = 'The translation service is unavailable. Try again later.';
const INVALID_PHRASE_MESSAGE = 'Enter a phrase of 1 to 500 characters.';
const RATE_LIMIT_MESSAGE = 'Rate limit exceeded. Please wait a moment and try again.';

/**
 * The `error` text the server sent, when there is one. Only used for the
 * statuses where the server's wording is the useful part (400, 429); any other
 * failure gets a fixed message so nothing unexpected is shown to the visitor.
 */
async function readServerMessage(response: Response): Promise<string | null> {
  try {
    const body = await response.json();
    return typeof body?.error === 'string' ? body.error : null;
  } catch {
    return null;
  }
}

async function failureMessage(response: Response): Promise<string> {
  if (response.status === 400) {
    return (await readServerMessage(response)) ?? INVALID_PHRASE_MESSAGE;
  }

  if (response.status === 429) {
    return (await readServerMessage(response)) ?? RATE_LIMIT_MESSAGE;
  }

  return SERVICE_UNAVAILABLE_MESSAGE;
}

/**
 * Translates a Spanish phrase through the app's own server.
 *
 * The browser only ever talks to `/api/translate` on its own origin: the
 * provider credential lives on the server and never reaches the page.
 *
 * @param spanishPhrase - The Spanish phrase to translate
 * @returns The AI-generated translation response (Markdown formatted)
 * @throws Error with a visitor-readable message if the request fails or input is invalid
 */
export async function translatePhrase(spanishPhrase: string): Promise<string> {
  if (!spanishPhrase || spanishPhrase.trim() === '') {
    throw new Error('Spanish phrase cannot be empty');
  }

  let response: Response;

  try {
    response = await fetch(TRANSLATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phrase: spanishPhrase.trim() }),
    });
  } catch {
    throw new Error('Network error. Please check your connection and try again.');
  }

  if (!response.ok) {
    throw new Error(await failureMessage(response));
  }

  let content: unknown;

  try {
    content = (await response.json())?.content;
  } catch {
    throw new Error('Invalid response from API');
  }

  if (typeof content !== 'string' || content.trim() === '') {
    throw new Error('Invalid response from API');
  }

  return content;
}
