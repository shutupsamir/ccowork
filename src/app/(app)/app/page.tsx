import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar } from 'lucide-react';

function formatSessionTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
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

export default async function DashboardPage() {
  const userId = await getCurrentUser();
  if (!userId) redirect('/sign-in');

  const recentParticipations = await prisma.sessionParticipant.findMany({
    where: { userId },
    orderBy: { session: { startAtUtc: 'desc' } },
    take: 5,
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

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-textPrimary">Ready to focus?</h1>
        <p className="mt-1 text-textMuted">Match with a coworker and get to work.</p>
      </div>

      {/* Primary CTA */}
      <Card className="flex flex-col items-center gap-4 py-10 text-center">
        <p className="text-lg font-medium text-textPrimary">
          Start a coworking session
        </p>
        <p className="max-w-md text-sm text-textMuted">
          You will be paired with someone who is also ready to focus. Choose 25 or 50 minutes.
        </p>
        <Link
          href="/app/match"
          className="mt-2 inline-flex h-12 items-center justify-center rounded-button bg-focusBlue px-8 text-base font-medium text-white transition-colors duration-200 hover:bg-focusBlue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focusBlue focus-visible:ring-offset-2 focus-visible:ring-offset-bgPrimary"
        >
          Match me now
        </Link>
      </Card>

      {/* Recent Sessions */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-textPrimary">Recent sessions</h2>

        {recentParticipations.length === 0 ? (
          <EmptyState
            icon={<Calendar size={32} />}
            title="No sessions yet"
            description="Start your first coworking session."
            action={
              <Link
                href="/app/match"
                className="inline-flex h-10 items-center rounded-button bg-focusBlue px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-focusBlue/90"
              >
                Match me now
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {recentParticipations.map(({ session }) => {
              const partner = session.participants[0]?.user;
              return (
                <Link key={session.id} href={`/app/session/${session.id}`}>
                  <Card variant="interactive" className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-textPrimary">
                        {session.durationMinutes}min session
                        {partner?.name ? ` with ${partner.name}` : ''}
                      </p>
                      <p className="mt-0.5 text-xs text-textMuted">
                        {formatSessionTime(session.startAtUtc)}
                      </p>
                    </div>
                    <Badge variant={statusBadgeVariant(session.status)}>
                      {session.status.replace('_', ' ').toLowerCase()}
                    </Badge>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
