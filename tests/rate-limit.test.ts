import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';

describe('Rate Limiter: checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-25T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests under the limit', () => {
    const result = checkRateLimit('user-1', 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('decrements remaining count with each request', () => {
    const limit = 5;
    const windowMs = 60_000;

    const r1 = checkRateLimit('user-dec', limit, windowMs);
    expect(r1.remaining).toBe(4);

    const r2 = checkRateLimit('user-dec', limit, windowMs);
    expect(r2.remaining).toBe(3);

    const r3 = checkRateLimit('user-dec', limit, windowMs);
    expect(r3.remaining).toBe(2);
  });

  it('blocks requests over the limit', () => {
    const limit = 3;
    const windowMs = 60_000;

    // Use up all 3 requests
    checkRateLimit('user-block', limit, windowMs);
    checkRateLimit('user-block', limit, windowMs);
    checkRateLimit('user-block', limit, windowMs);

    // 4th request should be blocked
    const result = checkRateLimit('user-block', limit, windowMs);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after the window expires', () => {
    const limit = 2;
    const windowMs = 60_000; // 1 minute

    // Use up both requests
    checkRateLimit('user-reset', limit, windowMs);
    checkRateLimit('user-reset', limit, windowMs);

    // Should be blocked
    const blocked = checkRateLimit('user-reset', limit, windowMs);
    expect(blocked.allowed).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(60_001);

    // Should be allowed again with full remaining
    const afterReset = checkRateLimit('user-reset', limit, windowMs);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(1);
  });

  it('tracks per-user independently', () => {
    const limit = 2;
    const windowMs = 60_000;

    // User A uses both requests
    checkRateLimit('user-a', limit, windowMs);
    checkRateLimit('user-a', limit, windowMs);
    const aBlocked = checkRateLimit('user-a', limit, windowMs);
    expect(aBlocked.allowed).toBe(false);

    // User B should still have full limit
    const bFirst = checkRateLimit('user-b', limit, windowMs);
    expect(bFirst.allowed).toBe(true);
    expect(bFirst.remaining).toBe(1);
  });

  it('allows exactly `limit` requests before blocking', () => {
    const limit = 4;
    const windowMs = 60_000;

    for (let i = 0; i < limit; i++) {
      const result = checkRateLimit('user-exact', limit, windowMs);
      expect(result.allowed).toBe(true);
    }

    const overLimit = checkRateLimit('user-exact', limit, windowMs);
    expect(overLimit.allowed).toBe(false);
    expect(overLimit.remaining).toBe(0);
  });

  it('handles limit of 1 (single request allowed)', () => {
    const result1 = checkRateLimit('user-one', 1, 60_000);
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(0);

    const result2 = checkRateLimit('user-one', 1, 60_000);
    expect(result2.allowed).toBe(false);
    expect(result2.remaining).toBe(0);
  });

  it('respects different window sizes', () => {
    const limit = 2;

    // Short window: 1 second
    checkRateLimit('user-short', limit, 1_000);
    checkRateLimit('user-short', limit, 1_000);
    expect(checkRateLimit('user-short', limit, 1_000).allowed).toBe(false);

    // Advance 1.1 seconds
    vi.advanceTimersByTime(1_100);

    // Should be allowed again
    expect(checkRateLimit('user-short', limit, 1_000).allowed).toBe(true);
  });
});
