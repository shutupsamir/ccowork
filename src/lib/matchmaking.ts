import { Prisma } from '@prisma/client';
import { prisma } from './db';

const DAILY_REQUEST_LIMIT = 10;
const SEARCH_TTL_MINUTES = 5;

/**
 * Count how many match requests a user has made today (UTC).
 */
export async function getDailyRequestCount(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  return prisma.matchRequest.count({
    where: {
      userId,
      createdAt: { gte: startOfDay },
    },
  });
}

/**
 * Get the user's currently active SEARCHING match request, if any.
 */
export async function getActiveMatchRequest(userId: string) {
  return prisma.matchRequest.findFirst({
    where: {
      userId,
      status: 'SEARCHING',
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Create a new match request for a user.
 * Enforces daily limit and prevents duplicate active searches.
 */
export async function createMatchRequest(
  userId: string,
  durationMinutes: 25 | 50
) {
  // Check for existing active search
  const existing = await getActiveMatchRequest(userId);
  if (existing) {
    throw new Error('You already have an active search. Cancel it first.');
  }

  // Check daily limit
  const todayCount = await getDailyRequestCount(userId);
  if (todayCount >= DAILY_REQUEST_LIMIT) {
    throw new Error(
      `Daily limit of ${DAILY_REQUEST_LIMIT} match requests reached. Try again tomorrow.`
    );
  }

  const expiresAtUtc = new Date(Date.now() + SEARCH_TTL_MINUTES * 60 * 1000);

  return prisma.matchRequest.create({
    data: {
      userId,
      durationMinutes,
      status: 'SEARCHING',
      expiresAtUtc,
    },
  });
}

/**
 * Cancel the user's active SEARCHING match request.
 */
export async function cancelMatchRequest(userId: string) {
  const active = await getActiveMatchRequest(userId);
  if (!active) {
    throw new Error('No active match request to cancel.');
  }

  return prisma.matchRequest.update({
    where: { id: active.id },
    data: { status: 'CANCELLED' },
  });
}

/**
 * Expire all SEARCHING requests that have passed their expiresAtUtc.
 * Returns the count of expired requests.
 */
export async function expireOldRequests(): Promise<number> {
  const result = await prisma.matchRequest.updateMany({
    where: {
      status: 'SEARCHING',
      expiresAtUtc: { lte: new Date() },
    },
    data: { status: 'EXPIRED' },
  });

  return result.count;
}

/**
 * Core matchmaker: finds SEARCHING requests, groups by duration, pairs the
 * oldest two distinct users (respecting blocklists), creates a Session with
 * VideoRoom and SessionParticipants in a transaction.
 *
 * Returns the number of matches made.
 */
export async function runMatchmaker(): Promise<number> {
  const now = new Date();

  // Fetch all valid searching requests ordered by creation time
  const searchingRequests = await prisma.matchRequest.findMany({
    where: {
      status: 'SEARCHING',
      expiresAtUtc: { gt: now },
    },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        include: {
          blockedUsers: { select: { blockedUserId: true } },
          blockedBy: { select: { userId: true } },
        },
      },
    },
  });

  // Group by duration
  const byDuration = new Map<number, typeof searchingRequests>();
  for (const req of searchingRequests) {
    const group = byDuration.get(req.durationMinutes) ?? [];
    group.push(req);
    byDuration.set(req.durationMinutes, group);
  }

  let matchCount = 0;

  for (const [durationMinutes, requests] of Array.from(byDuration)) {
    // Track which request indices have been paired this cycle
    const paired = new Set<number>();

    for (let i = 0; i < requests.length; i++) {
      if (paired.has(i)) continue;

      const reqA = requests[i];

      for (let j = i + 1; j < requests.length; j++) {
        if (paired.has(j)) continue;

        const reqB = requests[j];

        // Same user check (shouldn't happen but defensive)
        if (reqA.userId === reqB.userId) continue;

        // Blocklist check: A blocked B, or B blocked A
        const aBlockedIds = new Set(
          reqA.user.blockedUsers.map((b: { blockedUserId: string }) => b.blockedUserId)
        );
        const aBlockedByIds = new Set(
          reqA.user.blockedBy.map((b: { userId: string }) => b.userId)
        );

        if (aBlockedIds.has(reqB.userId) || aBlockedByIds.has(reqB.userId)) {
          continue;
        }

        // Found a valid pair — create match in transaction
        try {
          await prisma.$transaction(
            async (tx) => {
              const startAtUtc = new Date();
              const endAtUtc = new Date(
                startAtUtc.getTime() + durationMinutes * 60 * 1000
              );

              // Create session
              const session = await tx.session.create({
                data: {
                  startAtUtc,
                  endAtUtc,
                  durationMinutes,
                  status: 'MATCHED',
                },
              });

              // Create video room
              await tx.videoRoom.create({
                data: {
                  sessionId: session.id,
                  provider: 'TWILIO',
                  roomName: `ccowork_${session.id}`,
                },
              });

              // Create participants
              await tx.sessionParticipant.createMany({
                data: [
                  { sessionId: session.id, userId: reqA.userId },
                  { sessionId: session.id, userId: reqB.userId },
                ],
              });

              // Update both match requests to MATCHED
              // Use updateMany with status filter to ensure atomicity
              const updatedA = await tx.matchRequest.updateMany({
                where: { id: reqA.id, status: 'SEARCHING' },
                data: {
                  status: 'MATCHED',
                  matchedSessionId: session.id,
                },
              });

              const updatedB = await tx.matchRequest.updateMany({
                where: { id: reqB.id, status: 'SEARCHING' },
                data: {
                  status: 'MATCHED',
                  matchedSessionId: session.id,
                },
              });

              // Verify both requests were still SEARCHING
              if (updatedA.count !== 1 || updatedB.count !== 1) {
                throw new Error(
                  'Match request status changed during transaction — rolling back'
                );
              }
            },
            {
              isolationLevel:
                Prisma.TransactionIsolationLevel.Serializable,
            }
          );

          paired.add(i);
          paired.add(j);
          matchCount++;
          break; // Move to next unpaired request
        } catch (err) {
          // Transaction failed (likely a race condition), skip this pair
          console.error(
            `Matchmaker transaction failed for requests ${reqA.id} + ${reqB.id}:`,
            err
          );
          continue;
        }
      }
    }
  }

  return matchCount;
}
