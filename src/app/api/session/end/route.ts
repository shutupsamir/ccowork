import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const bodySchema = z.object({
  sessionId: z.string().uuid(),
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

    const { sessionId } = parsed.data;

    // Verify user is a participant
    const participant = await prisma.sessionParticipant.findUnique({
      where: {
        userId_sessionId: { userId, sessionId },
      },
      include: { session: true },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'You are not a participant of this session' },
        { status: 403 }
      );
    }

    if (participant.session.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Session already completed' },
        { status: 409 }
      );
    }

    // Update session status and participant leftAtUtc
    const now = new Date();

    await prisma.$transaction([
      prisma.session.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED' },
      }),
      prisma.sessionParticipant.update({
        where: {
          userId_sessionId: { userId, sessionId },
        },
        data: { leftAtUtc: now },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/session/end]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
