import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SessionRoomClient } from './session-room-client';

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
