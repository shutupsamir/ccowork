import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getJitsiUrl } from '@/lib/video/provider';

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

    // Session must be MATCHED or IN_PROGRESS
    const validStatuses = ['MATCHED', 'IN_PROGRESS'];
    if (!validStatuses.includes(participant.session.status)) {
      return NextResponse.json(
        { error: 'Session is not active' },
        { status: 409 }
      );
    }

    // Update session to IN_PROGRESS if still MATCHED
    if (participant.session.status === 'MATCHED') {
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Mark participant as joined
    if (!participant.joinedAtUtc) {
      await prisma.sessionParticipant.update({
        where: { id: participant.id },
        data: { joinedAtUtc: new Date() },
      });
    }

    const meetingUrl = getJitsiUrl(sessionId);

    return NextResponse.json({ meetingUrl });
  } catch (err) {
    console.error('[POST /api/video/token]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
