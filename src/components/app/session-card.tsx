import Link from 'next/link';
import { Star, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Session {
  id: string;
  startAtUtc: string;
  durationMinutes: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled' | 'no_show';
  partnerName?: string;
  rating?: number;
}

export interface SessionCardProps {
  session: Session;
}

const statusConfig: Record<Session['status'], { label: string; variant: BadgeVariant }> = {
  scheduled: { label: 'Scheduled', variant: 'info' },
  active: { label: 'Active', variant: 'success' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'warning' },
  no_show: { label: 'No show', variant: 'error' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function SessionCard({ session }: SessionCardProps) {
  const { label, variant } = statusConfig[session.status];

  return (
    <Link href={`/app/session/${session.id}`} className="block group">
      <Card variant="interactive">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5 min-w-0">
            {/* Date & time */}
            <p className="text-sm font-medium text-textPrimary">
              {formatDate(session.startAtUtc)} at {formatTime(session.startAtUtc)}
            </p>

            {/* Partner name */}
            {session.partnerName && (
              <p className="text-sm text-textMuted truncate">
                with {session.partnerName}
              </p>
            )}

            {/* Rating stars */}
            {session.rating != null && (
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    className={cn(
                      star <= session.rating!
                        ? 'fill-mintAccent text-mintAccent'
                        : 'fill-transparent text-textMuted'
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant={variant}>{label}</Badge>
            <span className="inline-flex items-center gap-1 text-xs text-textMuted">
              <Clock size={12} />
              {session.durationMinutes}m
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
