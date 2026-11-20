const DEFAULT_DAILY_LIMIT = 25;

export interface DailyRateLimiter {
  /** Counts one request for the client; false once it is over today's limit. */
  (clientId: string): boolean;
  trackedClients(): number;
}

/**
 * Limits each client to `limit` requests per UTC day.
 *
 * In memory and per process: a safety net for a single-instance demo so one
 * visitor cannot spend the whole provider quota, not a distributed limiter.
 */
export function createDailyRateLimiter(
  limit = DEFAULT_DAILY_LIMIT,
  clock: () => Date = () => new Date(),
): DailyRateLimiter {
  const counts = new Map<string, number>();
  let countedDay = '';

  const isAllowed = (clientId: string): boolean => {
    const utcDay = clock().toISOString().slice(0, 10);

    // Only the current UTC day matters: drop everything when it rolls over,
    // otherwise one entry per client per day piles up for the life of the process
    if (utcDay !== countedDay) {
      counts.clear();
      countedDay = utcDay;
    }

    const count = counts.get(clientId) ?? 0;

    if (count >= limit) {
      return false;
    }

    counts.set(clientId, count + 1);
    return true;
  };

  return Object.assign(isAllowed, { trackedClients: () => counts.size });
}
