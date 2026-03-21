import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMeetingUrl } from '@/lib/video/provider';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const session = await prisma.session.findUnique({
    where: { inviteCode: code },
    include: {
      participants: {
        where: { userId: { not: undefined } },
        include: { user: { select: { name: true } } },
        take: 1,
        orderBy: { joinedAtUtc: 'asc' },
      },
    },
  });

  if (!session || (session.status !== 'IN_PROGRESS' && session.status !== 'SCHEDULED')) {
    return NextResponse.json(
      { error: 'Session not found or has ended' },
      { status: 404 }
    );
  }

  const hostName = session.participants[0]?.user?.name ?? 'Someone';

  // Only generate meeting URL for in-progress sessions
  const meetingUrl = session.status === 'IN_PROGRESS'
    ? await getMeetingUrl(code, { name: 'Guest' })
    : null;

  return NextResponse.json({
    status: session.status,
    hostName,
    durationMinutes: session.durationMinutes,
    startAtUtc: session.startAtUtc.toISOString(),
    endAtUtc: session.endAtUtc.toISOString(),
    meetingUrl,
  });
}
