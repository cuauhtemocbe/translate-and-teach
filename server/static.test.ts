// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import type { ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Writable } from 'node:stream';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { resolveStaticFile, serveStatic } from './static.ts';

let root: string;
let dist: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'static-'));
  dist = join(root, 'dist');
  mkdirSync(join(dist, 'assets'), { recursive: true });
  writeFileSync(join(dist, 'index.html'), '<html>shell</html>');
  writeFileSync(join(dist, 'assets', 'app-abc123.js'), 'console.log(1)');
  // A sibling that shares the "dist" prefix: must not be reachable from dist
  mkdirSync(join(root, 'dist-secrets'));
  writeFileSync(join(root, 'dist-secrets', 'key.txt'), 'secret');
  writeFileSync(join(root, 'outside.txt'), 'secret');
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('resolveStaticFile', () => {
  it('should serve index.html for the root path', async () => {
    expect(await resolveStaticFile('/', dist)).toBe(join(dist, 'index.html'));
  });

  it('should serve a real file under dist', async () => {
    expect(await resolveStaticFile('/assets/app-abc123.js', dist)).toBe(
      join(dist, 'assets', 'app-abc123.js'),
    );
  });

  it('should ignore the query string', async () => {
    expect(await resolveStaticFile('/assets/app-abc123.js?v=2', dist)).toBe(
      join(dist, 'assets', 'app-abc123.js'),
    );
  });

  it('should fall back to the app shell for client-side routes', async () => {
    expect(await resolveStaticFile('/some/route', dist)).toBe(join(dist, 'index.html'));
  });

  it('should answer a missing asset with nothing instead of the app shell', async () => {
    expect(await resolveStaticFile('/assets/missing.js', dist)).toBeNull();
  });

  it.each([
    '/../outside.txt',
    '/../dist-secrets/key.txt',
    '/..%2foutside.txt',
    '/%2e%2e/outside.txt',
    '/assets/../../outside.txt',
  ])('should not read outside dist through %s', async (urlPath) => {
    const resolved = await resolveStaticFile(urlPath, dist);

    expect(resolved === null || resolved === join(dist, 'index.html')).toBe(true);
  });

  it('should treat a malformed percent escape as the app shell', async () => {
    expect(await resolveStaticFile('/%E0%A4%A', dist)).toBe(join(dist, 'index.html'));
  });

  it('should answer nothing when dist has no index.html', async () => {
    expect(await resolveStaticFile('/', join(root, 'empty-dist'))).toBeNull();
  });
});

describe('serveStatic', () => {
  it('should destroy the response when the body cannot be written to the client', async () => {
    const res = Object.assign(
      new Writable({
        write(_chunk, _encoding, callback) {
          callback(new Error('client went away'));
        },
      }),
      { writeHead: vi.fn() },
    );
    const destroy = vi.spyOn(res, 'destroy');

    await serveStatic('GET', '/', dist, res as unknown as ServerResponse);

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
    expect(destroy).toHaveBeenCalled();
  });
});
