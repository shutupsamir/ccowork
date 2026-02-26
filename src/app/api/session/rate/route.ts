import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  partnerShowedUp: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId, rating, partnerShowedUp } = parsed.data;

    // Verify user is a participant
    const participant = await prisma.sessionParticipant.findUnique({
      where: {
        userId_sessionId: { userId, sessionId },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'You are not a participant of this session' },
        { status: 403 }
      );
    }

    if (participant.rating !== null) {
      return NextResponse.json(
        { error: 'You have already rated this session' },
        { status: 409 }
      );
    }

    const updated = await prisma.sessionParticipant.update({
      where: {
        userId_sessionId: { userId, sessionId },
      },
      data: { rating, partnerShowedUp },
    });

    return NextResponse.json({ success: true, participant: updated });
  } catch (err) {
    console.error('[POST /api/session/rate]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
