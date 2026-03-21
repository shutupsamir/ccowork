import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SessionRoomClient } from './session-room-client';
import { AgentSessionClient } from './agent-session-client';

interface SessionPageProps {
  params: { id: string };
}

export default async function SessionPage({ params }: SessionPageProps) {
  const userId = await getCurrentUser();
  if (!userId) redirect('/sign-in');

  const session = await prisma.session.findUnique({
    where: { id: params.id },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true } },
          agent: { select: { id: true, name: true, status: true } },
        },
      },
      videoRoom: { select: { roomName: true } },
    },
  });

  if (!session) notFound();

  const isParticipant = session.participants.some((p) => p.userId === userId);
  if (!isParticipant) notFound();

  const currentParticipant = session.participants.find((p) => p.userId === userId)!;

  // Agent-only session — show agent discussion view
  if (session.sessionType === 'AGENT_ONLY') {
    // Get agent IDs from session messages
    const agentIds = await prisma.sessionMessage.findMany({
      where: { sessionId: session.id, type: 'AGENT', agentId: { not: null } },
      select: { agentId: true },
      distinct: ['agentId'],
    });

    // Also check SYSTEM message metadata for agent IDs (in case no messages yet)
    const systemMsg = await prisma.sessionMessage.findFirst({
      where: { sessionId: session.id, type: 'SYSTEM' },
      orderBy: { createdAt: 'asc' },
    });

    const meta = systemMsg?.metadata as { agentAId?: string; agentBId?: string } | null;
    const allAgentIds = new Set([
      ...agentIds.map((m) => m.agentId!),
      ...(meta?.agentAId ? [meta.agentAId] : []),
      ...(meta?.agentBId ? [meta.agentBId] : []),
    ]);

    const agents = await prisma.agent.findMany({
      where: { id: { in: Array.from(allAgentIds) } },
      select: { id: true, name: true, status: true, avatarUrl: true },
    });

    const agentA = agents[0] ?? { id: '', name: 'Agent A', status: 'ACTIVE' as const, avatarUrl: null };
    const agentB = agents[1] ?? { id: '', name: 'Agent B', status: 'ACTIVE' as const, avatarUrl: null };

    return (
      <AgentSessionClient
        sessionId={session.id}
        userId={userId}
        userName={currentParticipant.user.name ?? 'You'}
        topic={session.topic ?? 'Agent discussion'}
        agentA={agentA}
        agentB={agentB}
        initialStatus={session.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'COMPLETED'}
        initialSummary={session.summary}
      />
    );
  }

  // Human session — existing flow
  const partner = session.participants.find((p) => p.userId !== userId && p.agentId === null);
  const agentParticipant = session.participants.find((p) => p.agentId !== null);

  return (
    <SessionRoomClient
      sessionId={session.id}
      participantId={currentParticipant.id}
      userId={userId}
      userName={currentParticipant.user.name ?? 'You'}
      partnerName={partner?.user.name ?? 'Coworker'}
      durationMinutes={session.durationMinutes}
      startAtUtc={session.startAtUtc.toISOString()}
      endAtUtc={session.endAtUtc.toISOString()}
      status={session.status}
      roomName={session.videoRoom?.roomName ?? null}
      hasJoined={!!currentParticipant.joinedAtUtc}
      hasRated={currentParticipant.rating !== null}
      hasAgent={!!agentParticipant}
      agentName={agentParticipant?.agent?.name ?? null}
    />
  );
}
