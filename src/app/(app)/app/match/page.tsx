'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MatchStatusPanel } from '@/components/app/match-status-panel';
import { useMatchPolling } from '@/hooks/use-match-polling';
import { cn } from '@/lib/utils';

type Duration = 25 | 50;

export default function MatchPage() {
  const [duration, setDuration] = useState<Duration>(25);
  const [matchRequestId, setMatchRequestId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const { status, matchedSessionId, elapsedSeconds, error: pollError } =
    useMatchPolling(matchRequestId);

  const handleMatch = useCallback(async () => {
    setIsStarting(true);
    setStartError(null);

    try {
      const res = await fetch('/api/match/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMinutes: duration }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to start matching');
      }

      const data = await res.json();
      setMatchRequestId(data.matchRequestId);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsStarting(false);
    }
  }, [duration]);

  const handleCancel = useCallback(async () => {
    if (matchRequestId) {
      await fetch('/api/match/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchRequestId }),
      }).catch(() => {});
    }
    setMatchRequestId(null);
  }, [matchRequestId]);

  const handleRetry = useCallback(() => {
    setMatchRequestId(null);
    handleMatch();
  }, [handleMatch]);

  const isSearching = status === 'searching';

  return (
    <div className="mx-auto max-w-md space-y-6 pt-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-textPrimary">Find a coworker</h1>
        <p className="mt-1 text-sm text-textMuted">
          Choose your session length and we will pair you.
        </p>
      </div>

      {!matchRequestId ? (
        <Card className="flex flex-col items-center gap-6 py-8">
          {/* Duration selector */}
          <div className="flex gap-2">
            {([25, 50] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={cn(
                  'rounded-button px-6 py-2.5 text-sm font-medium transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focusBlue focus-visible:ring-offset-2 focus-visible:ring-offset-bgPrimary',
                  duration === d
                    ? 'bg-focusBlue text-white'
                    : 'bg-bgPrimary text-textMuted border border-borderNeutral hover:text-textPrimary hover:border-focusBlue/40'
                )}
              >
                {d} min
              </button>
            ))}
          </div>

          <Button
            size="lg"
            onClick={handleMatch}
            loading={isStarting}
            className="w-full max-w-[200px]"
          >
            Match me now
          </Button>

          {startError && (
            <p className="text-sm text-error" role="alert">
              {startError}
            </p>
          )}
        </Card>
      ) : (
        <MatchStatusPanel
          status={
            status === 'searching'
              ? 'searching'
              : status === 'matched'
                ? 'matched'
                : status === 'expired'
                  ? 'expired'
                  : status === 'error'
                    ? 'error'
                    : 'idle'
          }
          elapsedSeconds={elapsedSeconds}
          onCancel={handleCancel}
          onRetry={handleRetry}
          matchedSessionId={matchedSessionId}
          errorMessage={pollError ?? undefined}
        />
      )}
    </div>
  );
}
