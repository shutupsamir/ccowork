import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireDbUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createRoomName, getMeetingUrl } from '@/lib/video/provider';

export async function POST(request: Request) {
  try {
    const dbUser = await requireDbUser();
    const { durationMinutes, scheduledStart } = await request.json();

    if (durationMinutes !== 25 && durationMinutes !== 50) {
      return NextResponse.json(
        { error: 'Duration must be 25 or 50 minutes' },
        { status: 400 }
      );
    }

    const inviteCode = crypto.randomUUID().slice(0, 8);
    const now = new Date();

    // Scheduled session: scheduledStart is in the future
    const scheduledDate = scheduledStart ? new Date(scheduledStart) : null;
    const isScheduled = scheduledDate && scheduledDate.getTime() > now.getTime();

    if (isScheduled) {
      const endAt = new Date(scheduledDate.getTime() + durationMinutes * 60 * 1000);

      const session = await prisma.session.create({
        data: {
          sessionType: 'OPEN',
          status: 'SCHEDULED',
          durationMinutes,
          startAtUtc: scheduledDate,
          endAtUtc: endAt,
          inviteCode,
          hostUserId: dbUser.id,
        },
      });

      return NextResponse.json({
        sessionId: session.id,
        inviteCode,
        status: 'SCHEDULED',
        startAtUtc: scheduledDate.toISOString(),
        endAtUtc: endAt.toISOString(),
      });
    }

    // Immediate session (existing behavior)
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

    const meetingUrl = await getMeetingUrl(inviteCode, {
      name: dbUser.name ?? 'Host',
      email: dbUser.email,
      isModerator: true,
    });

    return NextResponse.json({
      sessionId: session.id,
      inviteCode,
      status: 'IN_PROGRESS',
      meetingUrl,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('open-session/create error:', message, err);
    return NextResponse.json(
      { error: `Failed to create session: ${message}` },
      { status: 500 }
    );
  }
}
