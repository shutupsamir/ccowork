import { prisma } from '@/lib/db';
import { getJitsiUrl } from '@/lib/video/provider';
import { GuestJoinClient } from './guest-join-client';

interface JoinPageProps {
  params: Promise<{ code: string }>;
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { code } = await params;

  const session = await prisma.session.findUnique({
    where: { inviteCode: code },
    include: {
      participants: {
        include: { user: { select: { name: true } } },
        take: 1,
        orderBy: { joinedAtUtc: 'asc' },
      },
    },
  });

  if (!session || session.status !== 'IN_PROGRESS') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bgPrimary px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-textPrimary">
            Session not found
          </h1>
          <p className="mt-2 text-sm text-textMuted">
            This session has ended or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const hostName = session.participants[0]?.user?.name ?? 'Someone';
  const meetingUrl = getJitsiUrl(code);

  return (
    <GuestJoinClient
      hostName={hostName}
      durationMinutes={session.durationMinutes}
      startAtUtc={session.startAtUtc.toISOString()}
      endAtUtc={session.endAtUtc.toISOString()}
      meetingUrl={meetingUrl}
    />
  );
}
