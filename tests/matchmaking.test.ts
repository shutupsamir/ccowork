import { describe, it, expect } from 'vitest';

// ── Types ────────────────────────────────────────────────────────────────────

type MockRequest = {
  id: string;
  userId: string;
  durationMinutes: number;
  createdAt: Date;
};

type BlockPair = {
  userId: string;
  blockedUserId: string;
};

// ── Pairing Algorithm (extracted from matchmaking.ts for testability) ────────

/**
 * Pure function that implements the core matchmaking pairing logic:
 * groups requests by duration, pairs oldest-first, respects blocklists,
 * ensures distinct users, and marks each request as used at most once.
 */
function findPairs(
  requests: MockRequest[],
  blocklist: BlockPair[]
): [MockRequest, MockRequest][] {
  const pairs: [MockRequest, MockRequest][] = [];
  const used = new Set<string>();

  // Group by duration
  const byDuration = new Map<number, MockRequest[]>();
  for (const req of requests) {
    const list = byDuration.get(req.durationMinutes) || [];
    list.push(req);
    byDuration.set(req.durationMinutes, list);
  }

  for (const [, reqs] of byDuration) {
    // Sort by creation time (oldest first, matching production behavior)
    const sorted = reqs.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    for (let i = 0; i < sorted.length; i++) {
      if (used.has(sorted[i].id)) continue;

      for (let j = i + 1; j < sorted.length; j++) {
        if (used.has(sorted[j].id)) continue;

        // Same user check
        if (sorted[i].userId === sorted[j].userId) continue;

        // Blocklist check (bidirectional)
        const blocked = blocklist.some(
          (b) =>
            (b.userId === sorted[i].userId &&
              b.blockedUserId === sorted[j].userId) ||
            (b.userId === sorted[j].userId &&
              b.blockedUserId === sorted[i].userId)
        );
        if (blocked) continue;

        // Valid pair found
        pairs.push([sorted[i], sorted[j]]);
        used.add(sorted[i].id);
        used.add(sorted[j].id);
        break;
      }
    }
  }

  return pairs;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

let idCounter = 0;
function makeRequest(
  overrides: Partial<MockRequest> = {}
): MockRequest {
  idCounter++;
  return {
    id: `req-${idCounter}`,
    userId: `user-${idCounter}`,
    durationMinutes: 25,
    createdAt: new Date('2026-02-25T10:00:00Z'),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Matchmaking: findPairs', () => {
  beforeEach(() => {
    idCounter = 0;
  });

  it('pairs two SEARCHING requests of the same duration', () => {
    const requests = [
      makeRequest({ id: 'a', userId: 'u1', durationMinutes: 25 }),
      makeRequest({ id: 'b', userId: 'u2', durationMinutes: 25 }),
    ];

    const pairs = findPairs(requests, []);
    expect(pairs).toHaveLength(1);
    expect(pairs[0][0].id).toBe('a');
    expect(pairs[0][1].id).toBe('b');
  });

  it('does not pair requests of different durations', () => {
    const requests = [
      makeRequest({ id: 'a', userId: 'u1', durationMinutes: 25 }),
      makeRequest({ id: 'b', userId: 'u2', durationMinutes: 50 }),
    ];

    const pairs = findPairs(requests, []);
    expect(pairs).toHaveLength(0);
  });

  it('skips blocklisted pairs (blocker direction)', () => {
    const requests = [
      makeRequest({ id: 'a', userId: 'u1', durationMinutes: 25 }),
      makeRequest({ id: 'b', userId: 'u2', durationMinutes: 25 }),
    ];
    const blocklist: BlockPair[] = [
      { userId: 'u1', blockedUserId: 'u2' },
    ];

    const pairs = findPairs(requests, blocklist);
    expect(pairs).toHaveLength(0);
  });

  it('skips blocklisted pairs (reverse direction)', () => {
    const requests = [
      makeRequest({ id: 'a', userId: 'u1', durationMinutes: 25 }),
      makeRequest({ id: 'b', userId: 'u2', durationMinutes: 25 }),
    ];
    const blocklist: BlockPair[] = [
      { userId: 'u2', blockedUserId: 'u1' },
    ];

    const pairs = findPairs(requests, blocklist);
    expect(pairs).toHaveLength(0);
  });

  it('does not pair a user with themselves', () => {
    const requests = [
      makeRequest({
        id: 'a',
        userId: 'u1',
        durationMinutes: 25,
        createdAt: new Date('2026-02-25T10:00:00Z'),
      }),
      makeRequest({
        id: 'b',
        userId: 'u1',
        durationMinutes: 25,
        createdAt: new Date('2026-02-25T10:01:00Z'),
      }),
    ];

    const pairs = findPairs(requests, []);
    expect(pairs).toHaveLength(0);
  });

  it('pairs oldest requests first (FIFO)', () => {
    const requests = [
      makeRequest({
        id: 'a',
        userId: 'u1',
        createdAt: new Date('2026-02-25T10:00:00Z'),
      }),
      makeRequest({
        id: 'b',
        userId: 'u2',
        createdAt: new Date('2026-02-25T10:05:00Z'),
      }),
      makeRequest({
        id: 'c',
        userId: 'u3',
        createdAt: new Date('2026-02-25T10:01:00Z'),
      }),
    ];

    const pairs = findPairs(requests, []);
    expect(pairs).toHaveLength(1);
    // u1 (oldest) pairs with u3 (second oldest), u2 is left over
    expect(pairs[0][0].id).toBe('a');
    expect(pairs[0][1].id).toBe('c');
  });

  it('creates multiple pairs from a larger pool', () => {
    const requests = [
      makeRequest({ id: 'a', userId: 'u1', createdAt: new Date('2026-02-25T10:00:00Z') }),
      makeRequest({ id: 'b', userId: 'u2', createdAt: new Date('2026-02-25T10:01:00Z') }),
      makeRequest({ id: 'c', userId: 'u3', createdAt: new Date('2026-02-25T10:02:00Z') }),
      makeRequest({ id: 'd', userId: 'u4', createdAt: new Date('2026-02-25T10:03:00Z') }),
    ];

    const pairs = findPairs(requests, []);
    expect(pairs).toHaveLength(2);
    expect(pairs[0][0].id).toBe('a');
    expect(pairs[0][1].id).toBe('b');
    expect(pairs[1][0].id).toBe('c');
    expect(pairs[1][1].id).toBe('d');
  });

  it('handles an odd number of requests (one left unpaired)', () => {
    const requests = [
      makeRequest({ id: 'a', userId: 'u1', createdAt: new Date('2026-02-25T10:00:00Z') }),
      makeRequest({ id: 'b', userId: 'u2', createdAt: new Date('2026-02-25T10:01:00Z') }),
      makeRequest({ id: 'c', userId: 'u3', createdAt: new Date('2026-02-25T10:02:00Z') }),
    ];

    const pairs = findPairs(requests, []);
    expect(pairs).toHaveLength(1);
    // u3 left unpaired
    const pairedIds = new Set([pairs[0][0].id, pairs[0][1].id]);
    expect(pairedIds).toContain('a');
    expect(pairedIds).toContain('b');
  });

  it('skips blocked pair and matches with next available user', () => {
    const requests = [
      makeRequest({ id: 'a', userId: 'u1', createdAt: new Date('2026-02-25T10:00:00Z') }),
      makeRequest({ id: 'b', userId: 'u2', createdAt: new Date('2026-02-25T10:01:00Z') }),
      makeRequest({ id: 'c', userId: 'u3', createdAt: new Date('2026-02-25T10:02:00Z') }),
    ];
    const blocklist: BlockPair[] = [
      { userId: 'u1', blockedUserId: 'u2' },
    ];

    const pairs = findPairs(requests, blocklist);
    expect(pairs).toHaveLength(1);
    // u1 can't match u2, so u1 pairs with u3
    expect(pairs[0][0].id).toBe('a');
    expect(pairs[0][1].id).toBe('c');
  });

  it('returns empty array when no requests exist', () => {
    const pairs = findPairs([], []);
    expect(pairs).toHaveLength(0);
  });

  it('returns empty array for a single request', () => {
    const requests = [makeRequest({ id: 'a', userId: 'u1' })];
    const pairs = findPairs(requests, []);
    expect(pairs).toHaveLength(0);
  });

  it('handles multiple durations independently', () => {
    const requests = [
      makeRequest({ id: 'a', userId: 'u1', durationMinutes: 25, createdAt: new Date('2026-02-25T10:00:00Z') }),
      makeRequest({ id: 'b', userId: 'u2', durationMinutes: 50, createdAt: new Date('2026-02-25T10:00:00Z') }),
      makeRequest({ id: 'c', userId: 'u3', durationMinutes: 25, createdAt: new Date('2026-02-25T10:01:00Z') }),
      makeRequest({ id: 'd', userId: 'u4', durationMinutes: 50, createdAt: new Date('2026-02-25T10:01:00Z') }),
    ];

    const pairs = findPairs(requests, []);
    expect(pairs).toHaveLength(2);

    const pair25 = pairs.find(
      ([a]) => a.durationMinutes === 25
    );
    const pair50 = pairs.find(
      ([a]) => a.durationMinutes === 50
    );
    expect(pair25).toBeDefined();
    expect(pair50).toBeDefined();
    expect(pair25![0].id).toBe('a');
    expect(pair25![1].id).toBe('c');
    expect(pair50![0].id).toBe('b');
    expect(pair50![1].id).toBe('d');
  });

  it('does not reuse a request in multiple pairs', () => {
    const requests = [
      makeRequest({ id: 'a', userId: 'u1', createdAt: new Date('2026-02-25T10:00:00Z') }),
      makeRequest({ id: 'b', userId: 'u2', createdAt: new Date('2026-02-25T10:01:00Z') }),
      makeRequest({ id: 'c', userId: 'u3', createdAt: new Date('2026-02-25T10:02:00Z') }),
      makeRequest({ id: 'd', userId: 'u4', createdAt: new Date('2026-02-25T10:03:00Z') }),
    ];

    const pairs = findPairs(requests, []);
    const allPairedIds = pairs.flatMap(([a, b]) => [a.id, b.id]);
    const uniqueIds = new Set(allPairedIds);
    expect(uniqueIds.size).toBe(allPairedIds.length);
  });
});
