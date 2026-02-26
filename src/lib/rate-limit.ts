interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Simple in-memory rate limiter. Suitable for single-process deployments.
 * For multi-instance deployments, swap this with a Redis-backed limiter.
 */
export function checkRateLimit(
  userId: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(userId);

  // No entry or window expired — reset
  if (!entry || now >= entry.resetAt) {
    store.set(userId, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  // Within window
  if (entry.count < limit) {
    entry.count++;
    return { allowed: true, remaining: limit - entry.count };
  }

  // Over limit
  return { allowed: false, remaining: 0 };
}
