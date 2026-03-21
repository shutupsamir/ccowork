import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendAgentMessage } from '@/lib/agents/runtime';

export const maxDuration = 30;

const turnSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = turnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId } = parsed.data;

    // Load session and verify
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.sessionType !== 'AGENT_ONLY') {
      return NextResponse.json({ error: 'Not an agent-only session' }, { status: 400 });
    }

    if (session.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { done: true, summary: session.summary ?? 'Session ended.' },
        { status: 200 }
      );
    }

    // Verify user is participant
    const participant = await prisma.sessionParticipant.findUnique({
      where: { userId_sessionId: { userId, sessionId } },
    });
    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Get agent IDs and maxTurns from SYSTEM message metadata
    const systemMsg = await prisma.sessionMessage.findFirst({
      where: { sessionId, type: 'SYSTEM' },
      orderBy: { createdAt: 'asc' },
    });

    if (!systemMsg?.metadata) {
      return NextResponse.json({ error: 'Missing session metadata' }, { status: 500 });
    }

    const meta = systemMsg.metadata as { agentAId: string; agentBId: string; maxTurns: number };
    const { agentAId, agentBId, maxTurns } = meta;

    // Count AGENT messages
    const agentMessages = await prisma.sessionMessage.findMany({
      where: { sessionId, type: 'AGENT' },
      orderBy: { createdAt: 'asc' },
    });

    // Check if done
    if (agentMessages.length >= maxTurns) {
      // Generate summary using agent A
      let summary = 'Discussion completed.';
      try {
        const summaryResult = await sendAgentMessage(
          agentAId,
          sessionId,
          'Please provide a brief 2-3 sentence summary of our discussion and any key conclusions or action items.',
          agentAId
        );
        summary = summaryResult.content;
      } catch {
        // Use default summary
      }

      await prisma.session.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', summary },
      });

      return NextResponse.json({ done: true, summary });
    }

    // Determine next agent (alternate based on last message)
    const lastAgentMsg = agentMessages[agentMessages.length - 1];
    const nextAgentId = lastAgentMsg?.agentId === agentAId ? agentBId : agentAId;
    const lastContent = lastAgentMsg?.content ?? `Let's discuss: ${session.topic}`;

    // Call next agent
    try {
      const result = await sendAgentMessage(
        nextAgentId,
        sessionId,
        lastContent,
        nextAgentId
      );

      const message = await prisma.sessionMessage.create({
        data: {
          sessionId,
          agentId: nextAgentId,
          type: 'AGENT',
          content: result.content,
          metadata: { tokensUsed: result.tokensUsed },
        },
      });

      // Load agent name for the response
      const agent = await prisma.agent.findUnique({
        where: { id: nextAgentId },
        select: { name: true },
      });

      return NextResponse.json({
        done: false,
        message: {
          ...message,
          senderName: agent?.name ?? 'Agent',
        },
        turnCount: agentMessages.length + 1,
      });
    } catch (err) {
      await prisma.sessionMessage.create({
        data: {
          sessionId,
          type: 'SYSTEM',
          content: `Agent error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        },
      });

      return NextResponse.json(
        { error: 'Agent failed to respond' },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error('[POST /api/agents/dispatch/turn]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
