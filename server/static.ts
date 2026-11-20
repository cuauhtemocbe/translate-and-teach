import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import { extname, join, relative, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

/**
 * Maps a request path to a file under `distDir`, or null for a real 404.
 *
 * Paths that are not a real file fall back to index.html so client-side routes
 * load the app, except paths that look like a file (have an extension): a
 * missing asset must not come back as HTML. Anything resolving outside
 * `distDir` (traversal, or a sibling sharing the "dist" prefix) is treated as
 * not found.
 */
export async function resolveStaticFile(urlPath: string, distDir: string): Promise<string | null> {
  let pathname: string;

  try {
    pathname = decodeURIComponent(urlPath.split('?')[0] ?? '/');
  } catch {
    // A malformed percent escape cannot name a file: serve the app shell
    pathname = '/';
  }

  const root = resolve(distDir);
  const candidate = resolve(root, `.${pathname}`);
  const isInsideDist = candidate.startsWith(root + sep);

  if (isInsideDist && (await isFile(candidate))) {
    return candidate;
  }

  if (extname(pathname) !== '') {
    return null;
  }

  const index = join(root, 'index.html');
  return (await isFile(index)) ? index : null;
}

/**
 * Streams a file from `distDir` to the response (headers only for HEAD)
 */
export async function serveStatic(
  method: string,
  urlPath: string,
  distDir: string,
  res: ServerResponse,
): Promise<void> {
  const file = await resolveStaticFile(urlPath, distDir);

  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  // Vite fingerprints everything under assets/, so those can be cached forever
  const isHashedAsset = relative(resolve(distDir), file).startsWith(`assets${sep}`);

  res.writeHead(200, {
    'content-type': MIME_TYPES[extname(file)] ?? 'application/octet-stream',
    'cache-control': isHashedAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
  });

  if (method === 'HEAD') {
    res.end();
    return;
  }

  try {
    await pipeline(createReadStream(file), res);
  } catch {
    // The client went away or the read failed mid-way; headers are already sent
    res.destroy();
  }
}
