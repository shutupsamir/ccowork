import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { SessionsTabsClient } from './sessions-tabs-client';
import { Calendar, Clock } from 'lucide-react';

function formatSessionTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'success' as const;
    case 'MATCHED':
      return 'info' as const;
    case 'COMPLETED':
      return 'default' as const;
    case 'CANCELLED':
      return 'error' as const;
    default:
      return 'default' as const;
  }
}

interface SessionCardData {
  id: string;
  durationMinutes: number;
  startAtUtc: string;
  status: string;
  partnerName: string | null;
}

function SessionCard({ session }: { session: SessionCardData }) {
  return (
    <Link href={`/app/session/${session.id}`}>
      <Card variant="interactive" className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-button bg-bgPrimary p-2 text-textMuted">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-sm font-medium text-textPrimary">
              {session.durationMinutes}min session
              {session.partnerName ? ` with ${session.partnerName}` : ''}
            </p>
            <p className="mt-0.5 text-xs text-textMuted">
              {formatSessionTime(new Date(session.startAtUtc))}
            </p>
          </div>
        </div>
        <Badge variant={statusBadgeVariant(session.status)}>
          {session.status.replace('_', ' ').toLowerCase()}
        </Badge>
      </Card>
    </Link>
  );
}

export default async function SessionsPage() {
  const userId = await getCurrentUser();
  if (!userId) redirect('/sign-in');

  const participations = await prisma.sessionParticipant.findMany({
    where: { userId },
    orderBy: { session: { startAtUtc: 'desc' } },
    include: {
      session: {
        include: {
          participants: {
            where: { userId: { not: userId } },
            include: { user: { select: { name: true } } },
          },
        },
      },
    },
  });

  const sessions: SessionCardData[] = participations.map(({ session }) => ({
    id: session.id,
    durationMinutes: session.durationMinutes,
    startAtUtc: session.startAtUtc.toISOString(),
    status: session.status,
    partnerName: session.participants[0]?.user?.name ?? null,
  }));

  const upcoming = sessions.filter(
    (s) => s.status === 'MATCHED' || s.status === 'IN_PROGRESS'
  );
  const past = sessions.filter(
    (s) => s.status === 'COMPLETED' || s.status === 'CANCELLED'
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-textPrimary">Sessions</h1>

      <SessionsTabsClient
        upcomingContent={
          upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Calendar size={32} />}
              title="No upcoming sessions"
              description="Match with a coworker to get started."
              action={
                <Link
                  href="/app/match"
                  className="inline-flex h-10 items-center rounded-button bg-focusBlue px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-focusBlue/90"
                >
                  Match me now
                </Link>
              }
            />
          )
        }
        pastContent={
          past.length > 0 ? (
            <div className="space-y-3">
              {past.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Calendar size={32} />}
              title="No past sessions"
              description="Your completed sessions will appear here."
            />
          )
        }
      />
    </div>
  );
}
