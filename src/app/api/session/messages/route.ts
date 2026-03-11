import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendAgentMessage } from '@/lib/agents/runtime';

const postSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = req.nextUrl.searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    // Verify participation
    const participant = await prisma.sessionParticipant.findUnique({
      where: { userId_sessionId: { userId, sessionId } },
    });
    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    const messages = await prisma.sessionMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    // Enrich with sender names
    const userIds = [...new Set(messages.filter((m) => m.senderId).map((m) => m.senderId!))];
    const agentIds = [...new Set(messages.filter((m) => m.agentId).map((m) => m.agentId!))];

    const [users, agents] = await Promise.all([
      userIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true },
          })
        : [],
      agentIds.length > 0
        ? prisma.agent.findMany({
            where: { id: { in: agentIds } },
            select: { id: true, name: true },
          })
        : [],
    ]);

    const userMap = new Map(users.map((u) => [u.id, u.name ?? 'User']));
    const agentMap = new Map(agents.map((a) => [a.id, a.name]));

    const enriched = messages.map((msg) => ({
      ...msg,
      senderName: msg.agentId
        ? agentMap.get(msg.agentId) ?? 'Agent'
        : msg.senderId
          ? userMap.get(msg.senderId) ?? 'User'
          : null,
    }));

    return NextResponse.json({ messages: enriched });
  } catch (err) {
    console.error('[GET /api/session/messages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId, content } = parsed.data;

    // Verify participation
    const participant = await prisma.sessionParticipant.findUnique({
      where: { userId_sessionId: { userId, sessionId } },
      include: { session: true },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    if (!['MATCHED', 'IN_PROGRESS'].includes(participant.session.status)) {
      return NextResponse.json({ error: 'Session is not active' }, { status: 409 });
    }

    // Save user message
    const userMessage = await prisma.sessionMessage.create({
      data: {
        sessionId,
        senderId: userId,
        type: 'USER',
        content,
      },
    });

    // Check if session has an agent participant
    const agentParticipant = await prisma.sessionParticipant.findFirst({
      where: {
        sessionId,
        agentId: { not: null },
      },
      include: { agent: true },
    });

    let agentResponse = null;

    if (agentParticipant?.agent) {
      try {
        const result = await sendAgentMessage(
          agentParticipant.agent.id,
          sessionId,
          content
        );

        agentResponse = await prisma.sessionMessage.create({
          data: {
            sessionId,
            agentId: agentParticipant.agent.id,
            type: 'AGENT',
            content: result.content,
            metadata: {
              tokensUsed: result.tokensUsed,
            },
          },
        });
      } catch (err) {
        console.error('[Agent response error]', err);
        // Create system message about agent error
        await prisma.sessionMessage.create({
          data: {
            sessionId,
            type: 'SYSTEM',
            content: `Agent could not respond: ${err instanceof Error ? err.message : 'Unknown error'}`,
          },
        });
      }
    }

    return NextResponse.json(
      {
        message: userMessage,
        agentResponse,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/session/messages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
