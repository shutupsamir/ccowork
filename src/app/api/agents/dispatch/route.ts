import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendAgentMessage } from '@/lib/agents/runtime';

export const maxDuration = 30;

const dispatchSchema = z.object({
  agentAId: z.string().uuid(),
  agentBId: z.string().uuid(),
  topic: z.string().min(1).max(500),
  maxTurns: z.number().int().min(4).max(40).default(20),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = dispatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { agentAId, agentBId, topic, maxTurns } = parsed.data;

    if (agentAId === agentBId) {
      return NextResponse.json(
        { error: 'Agents must be different' },
        { status: 400 }
      );
    }

    // Verify both agents exist, are ACTIVE, and belong to user
    const [agentA, agentB] = await Promise.all([
      prisma.agent.findUnique({ where: { id: agentAId } }),
      prisma.agent.findUnique({ where: { id: agentBId } }),
    ]);

    if (!agentA || !agentB) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (agentA.ownerId !== userId || agentB.ownerId !== userId) {
      return NextResponse.json({ error: 'Not your agent' }, { status: 403 });
    }

    if (agentA.status !== 'ACTIVE' || agentB.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Both agents must be ACTIVE' },
        { status: 400 }
      );
    }

    // Verify user has API keys for both providers
    const providers = Array.from(new Set([agentA.provider, agentB.provider]));
    for (const provider of providers) {
      const key = await prisma.agentApiKey.findUnique({
        where: { userId_provider: { userId, provider } },
      });
      if (!key) {
        return NextResponse.json(
          { error: `No API key for ${provider}. Add one in Settings > Agents.` },
          { status: 400 }
        );
      }
    }

    // Create AGENT_ONLY session
    const now = new Date();
    const session = await prisma.session.create({
      data: {
        startAtUtc: now,
        endAtUtc: new Date(now.getTime() + 60 * 60 * 1000), // 1hr max
        durationMinutes: 60,
        status: 'IN_PROGRESS',
        sessionType: 'AGENT_ONLY',
        topic,
      },
    });

    // Create observer participant for user
    await prisma.sessionParticipant.create({
      data: {
        sessionId: session.id,
        userId,
        joinedAtUtc: now,
      },
    });

    // Seed SYSTEM message with metadata
    await prisma.sessionMessage.create({
      data: {
        sessionId: session.id,
        type: 'SYSTEM',
        content: `Agent discussion started. Topic: ${topic}`,
        metadata: { agentAId, agentBId, maxTurns },
      },
    });

    // Run first turn: Agent A responds to topic
    try {
      const result = await sendAgentMessage(
        agentAId,
        session.id,
        `Let's discuss: ${topic}`,
        agentAId
      );

      await prisma.sessionMessage.create({
        data: {
          sessionId: session.id,
          agentId: agentAId,
          type: 'AGENT',
          content: result.content,
          metadata: { tokensUsed: result.tokensUsed },
        },
      });
    } catch (err) {
      await prisma.sessionMessage.create({
        data: {
          sessionId: session.id,
          type: 'SYSTEM',
          content: `Agent A could not respond: ${err instanceof Error ? err.message : 'Unknown error'}`,
        },
      });
    }

    return NextResponse.json({ sessionId: session.id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/agents/dispatch]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
