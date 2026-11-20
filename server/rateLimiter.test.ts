// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createDailyRateLimiter } from './rateLimiter.ts';

function clockAt(iso: string) {
  let now = new Date(iso);
  return {
    now: () => now,
    set(next: string) {
      now = new Date(next);
    },
  };
}

describe('createDailyRateLimiter', () => {
  it('should allow a client up to the limit and block the next request', () => {
    const allow = createDailyRateLimiter(3, clockAt('2026-11-19T10:00:00Z').now);

    expect([allow('1.1.1.1'), allow('1.1.1.1'), allow('1.1.1.1')]).toEqual([true, true, true]);
    expect(allow('1.1.1.1')).toBe(false);
  });

  it('should count each client separately', () => {
    const allow = createDailyRateLimiter(1, clockAt('2026-11-19T10:00:00Z').now);

    expect(allow('1.1.1.1')).toBe(true);
    expect(allow('1.1.1.1')).toBe(false);
    expect(allow('2.2.2.2')).toBe(true);
  });

  it('should keep blocking until the UTC day rolls over, then start from zero', () => {
    const clock = clockAt('2026-11-19T23:59:59Z');
    const allow = createDailyRateLimiter(1, clock.now);

    expect(allow('1.1.1.1')).toBe(true);
    expect(allow('1.1.1.1')).toBe(false);

    clock.set('2026-11-20T00:00:00Z');

    expect(allow('1.1.1.1')).toBe(true);
  });

  it('should drop the previous day counters instead of piling them up', () => {
    const clock = clockAt('2026-11-19T10:00:00Z');
    const allow = createDailyRateLimiter(5, clock.now);
    allow('1.1.1.1');
    allow('2.2.2.2');
    expect(allow.trackedClients()).toBe(2);

    clock.set('2026-11-20T10:00:00Z');
    allow('3.3.3.3');

    expect(allow.trackedClients()).toBe(1);
  });

  it('should default to 25 requests per client per day', () => {
    const allow = createDailyRateLimiter();

    const results = Array.from({ length: 26 }, () => allow('1.1.1.1'));

    expect(results.slice(0, 25).every(Boolean)).toBe(true);
    expect(results[25]).toBe(false);
  });
});
