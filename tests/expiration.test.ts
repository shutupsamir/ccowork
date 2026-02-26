import { describe, it, expect, vi, afterEach } from 'vitest';

// ── Types ────────────────────────────────────────────────────────────────────

type MockRequest = {
  id: string;
  userId: string;
  status: 'SEARCHING' | 'MATCHED' | 'CANCELLED' | 'EXPIRED';
  expiresAtUtc: Date;
  createdAt: Date;
};

// ── Expiration Logic (pure function extracted for testability) ────────────────

/**
 * Given a list of SEARCHING requests and the current time,
 * returns the IDs of requests that should be marked EXPIRED.
 */
function findExpiredRequests(
  requests: MockRequest[],
  now: Date
): string[] {
  return requests
    .filter(
      (req) =>
        req.status === 'SEARCHING' &&
        req.expiresAtUtc.getTime() <= now.getTime()
    )
    .map((req) => req.id);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Expiration: findExpiredRequests', () => {
  const NOW = new Date('2026-02-25T12:00:00Z');

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('identifies requests past their expiresAtUtc', () => {
    const requests: MockRequest[] = [
      {
        id: 'r1',
        userId: 'u1',
        status: 'SEARCHING',
        expiresAtUtc: new Date('2026-02-25T11:55:00Z'), // 5 min ago
        createdAt: new Date('2026-02-25T11:50:00Z'),
      },
    ];

    const expired = findExpiredRequests(requests, NOW);
    expect(expired).toEqual(['r1']);
  });

  it('does not expire requests still within their TTL', () => {
    const requests: MockRequest[] = [
      {
        id: 'r1',
        userId: 'u1',
        status: 'SEARCHING',
        expiresAtUtc: new Date('2026-02-25T12:05:00Z'), // 5 min from now
        createdAt: new Date('2026-02-25T12:00:00Z'),
      },
    ];

    const expired = findExpiredRequests(requests, NOW);
    expect(expired).toHaveLength(0);
  });

  it('expires request exactly at the boundary (expiresAtUtc === now)', () => {
    const requests: MockRequest[] = [
      {
        id: 'r1',
        userId: 'u1',
        status: 'SEARCHING',
        expiresAtUtc: new Date('2026-02-25T12:00:00Z'), // exactly now
        createdAt: new Date('2026-02-25T11:55:00Z'),
      },
    ];

    const expired = findExpiredRequests(requests, NOW);
    expect(expired).toEqual(['r1']);
  });

  it('ignores non-SEARCHING statuses', () => {
    const requests: MockRequest[] = [
      {
        id: 'r1',
        userId: 'u1',
        status: 'MATCHED',
        expiresAtUtc: new Date('2026-02-25T11:50:00Z'), // expired
        createdAt: new Date('2026-02-25T11:45:00Z'),
      },
      {
        id: 'r2',
        userId: 'u2',
        status: 'CANCELLED',
        expiresAtUtc: new Date('2026-02-25T11:50:00Z'),
        createdAt: new Date('2026-02-25T11:45:00Z'),
      },
      {
        id: 'r3',
        userId: 'u3',
        status: 'EXPIRED',
        expiresAtUtc: new Date('2026-02-25T11:50:00Z'),
        createdAt: new Date('2026-02-25T11:45:00Z'),
      },
    ];

    const expired = findExpiredRequests(requests, NOW);
    expect(expired).toHaveLength(0);
  });

  it('handles a mix of expired and active requests', () => {
    const requests: MockRequest[] = [
      {
        id: 'r1',
        userId: 'u1',
        status: 'SEARCHING',
        expiresAtUtc: new Date('2026-02-25T11:50:00Z'), // expired
        createdAt: new Date('2026-02-25T11:45:00Z'),
      },
      {
        id: 'r2',
        userId: 'u2',
        status: 'SEARCHING',
        expiresAtUtc: new Date('2026-02-25T12:10:00Z'), // still active
        createdAt: new Date('2026-02-25T12:05:00Z'),
      },
      {
        id: 'r3',
        userId: 'u3',
        status: 'SEARCHING',
        expiresAtUtc: new Date('2026-02-25T11:59:59Z'), // expired by 1 second
        createdAt: new Date('2026-02-25T11:54:59Z'),
      },
    ];

    const expired = findExpiredRequests(requests, NOW);
    expect(expired).toHaveLength(2);
    expect(expired).toContain('r1');
    expect(expired).toContain('r3');
    expect(expired).not.toContain('r2');
  });

  it('returns empty array when there are no requests', () => {
    const expired = findExpiredRequests([], NOW);
    expect(expired).toHaveLength(0);
  });

  it('handles requests with very old expiration times', () => {
    const requests: MockRequest[] = [
      {
        id: 'r1',
        userId: 'u1',
        status: 'SEARCHING',
        expiresAtUtc: new Date('2025-01-01T00:00:00Z'), // over a year ago
        createdAt: new Date('2024-12-31T23:55:00Z'),
      },
    ];

    const expired = findExpiredRequests(requests, NOW);
    expect(expired).toEqual(['r1']);
  });

  it('does not expire a request 1ms before boundary', () => {
    const almostExpired = new Date(NOW.getTime() + 1); // 1ms in the future
    const requests: MockRequest[] = [
      {
        id: 'r1',
        userId: 'u1',
        status: 'SEARCHING',
        expiresAtUtc: almostExpired,
        createdAt: new Date('2026-02-25T11:55:00Z'),
      },
    ];

    const expired = findExpiredRequests(requests, NOW);
    expect(expired).toHaveLength(0);
  });
});
