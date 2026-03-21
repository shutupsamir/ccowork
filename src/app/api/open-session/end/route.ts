import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const userId = await requireUser();
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

    if (session.hostUserId !== userId) {
      return NextResponse.json({ error: 'Only the host can end this session' }, { status: 403 });
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('open-session/end error:', message, err);
    return NextResponse.json(
      { error: `Failed to end session: ${message}` },
      { status: 500 }
    );
  }
}
