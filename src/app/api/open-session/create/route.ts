import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireDbUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createRoomName, getJitsiUrl } from '@/lib/video/provider';

export async function POST(request: Request) {
  try {
    const dbUser = await requireDbUser();
    const { durationMinutes } = await request.json();

    if (durationMinutes !== 25 && durationMinutes !== 50) {
      return NextResponse.json(
        { error: 'Duration must be 25 or 50 minutes' },
        { status: 400 }
      );
    }

    const inviteCode = crypto.randomUUID().slice(0, 8);
    const now = new Date();
    const endAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const session = await prisma.session.create({
      data: {
        sessionType: 'OPEN',
        status: 'IN_PROGRESS',
        durationMinutes,
        startAtUtc: now,
        endAtUtc: endAt,
        inviteCode,
        hostUserId: dbUser.id,
        participants: {
          create: {
            userId: dbUser.id,
            joinedAtUtc: now,
          },
        },
        videoRoom: {
          create: {
            provider: 'JITSI',
            roomName: createRoomName(inviteCode),
          },
        },
      },
    });

    const meetingUrl = getJitsiUrl(inviteCode);

    return NextResponse.json({
      sessionId: session.id,
      inviteCode,
      meetingUrl,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('open-session/create error:', err);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
