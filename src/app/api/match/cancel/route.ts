import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { cancelMatchRequest } from '@/lib/matchmaking';

export async function POST(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updated = await cancelMatchRequest(userId);

    return NextResponse.json({
      success: true,
      matchRequest: updated,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';

    if (message.includes('No active match request')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    console.error('[POST /api/match/cancel]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
