import { NextResponse } from 'next/server';
import { requireDbUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createRoomName, getMeetingUrl } from '@/lib/video/provider';

export async function POST(request: Request) {
  try {
    const dbUser = await requireDbUser();
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.hostUserId !== dbUser.id) {
      return NextResponse.json({ error: 'Only the host can start this session' }, { status: 403 });
    }

    if (session.status !== 'SCHEDULED') {
      return NextResponse.json({ error: 'Session is not in SCHEDULED state' }, { status: 400 });
    }

    const now = new Date();
    const endAt = new Date(now.getTime() + session.durationMinutes * 60 * 1000);

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'IN_PROGRESS',
        startAtUtc: now,
        endAtUtc: endAt,
        participants: {
          create: {
            userId: dbUser.id,
            joinedAtUtc: now,
          },
        },
        videoRoom: {
          create: {
            provider: 'JITSI',
            roomName: createRoomName(session.inviteCode!),
          },
        },
      },
    });

    const meetingUrl = await getMeetingUrl(session.inviteCode!, {
      name: dbUser.name ?? 'Host',
      email: dbUser.email,
      isModerator: true,
    });

    return NextResponse.json({ meetingUrl });
  } catch (err) {
    if (err instanceof Error && err.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('open-session/start error:', message, err);
    return NextResponse.json(
      { error: `Failed to start session: ${message}` },
      { status: 500 }
    );
  }
}
