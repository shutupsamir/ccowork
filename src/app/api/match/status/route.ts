import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getActiveMatchRequest } from '@/lib/matchmaking';

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const matchRequest = await getActiveMatchRequest(userId);

    if (!matchRequest) {
      return NextResponse.json({ status: 'IDLE', matchRequest: null });
    }

    return NextResponse.json({
      status: matchRequest.status,
      matchRequest: {
        id: matchRequest.id,
        durationMinutes: matchRequest.durationMinutes,
        status: matchRequest.status,
        expiresAtUtc: matchRequest.expiresAtUtc,
        matchedSessionId: matchRequest.matchedSessionId,
        createdAt: matchRequest.createdAt,
      },
    });
  } catch (err) {
    console.error('[GET /api/match/status]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
