import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const sessions = await prisma.session.findMany({
      where: {
        participants: {
          some: { userId },
        },
        status: { in: ['MATCHED', 'IN_PROGRESS'] },
        startAtUtc: { gte: oneHourAgo },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        videoRoom: { select: { roomName: true } },
      },
      orderBy: { startAtUtc: 'asc' },
    });

    return NextResponse.json({ sessions });
  } catch (err) {
    console.error('[GET /api/sessions/upcoming]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
