'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SessionTimer } from '@/components/app/session-timer';
import { useToast } from '@/hooks/use-toast';
import { Star, Video, PhoneOff, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type SessionStatus = 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface SessionRoomClientProps {
  sessionId: string;
  participantId: string;
  userId: string;
  userName: string;
  partnerName: string;
  durationMinutes: number;
  startAtUtc: string;
  endAtUtc: string;
  status: SessionStatus;
  roomName: string | null;
  hasJoined: boolean;
  hasRated: boolean;
}

function canJoinNow(startAtUtc: string): boolean {
  const startMs = new Date(startAtUtc).getTime();
  const nowMs = Date.now();
  const fiveMinMs = 5 * 60 * 1000;
  return nowMs >= startMs - fiveMinMs;
}

function isSessionOver(endAtUtc: string): boolean {
  return Date.now() >= new Date(endAtUtc).getTime();
}

export function SessionRoomClient({
  sessionId,
  participantId,
  userId,
  userName,
  partnerName,
  durationMinutes,
  startAtUtc,
  endAtUtc,
  status: initialStatus,
  roomName,
  hasJoined: initialHasJoined,
  hasRated: initialHasRated,
}: SessionRoomClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [status, setStatus] = useState<SessionStatus>(initialStatus);
  const [hasJoined, setHasJoined] = useState(initialHasJoined);
  const [isJoining, setIsJoining] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [hasRated, setHasRated] = useState(initialHasRated);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const sessionOver = isSessionOver(endAtUtc) || status === 'COMPLETED' || status === 'CANCELLED';

  const handleJoin = useCallback(async () => {
    setIsJoining(true);
    try {
      const res = await fetch('/api/video/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to get video token');
      }

      setHasJoined(true);
      setStatus('IN_PROGRESS');
      toast('success', 'Joined session. Time to focus.');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to join session');
    } finally {
      setIsJoining(false);
    }
  }, [sessionId, toast]);

  const handleEndSession = useCallback(async () => {
    setIsEnding(true);
    try {
      const res = await fetch('/api/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to end session');
      }

      setStatus('COMPLETED');
      toast('info', 'Session ended.');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to end session');
    } finally {
      setIsEnding(false);
    }
  }, [sessionId, toast]);

  const handleTimeUp = useCallback(() => {
    setStatus('COMPLETED');
    toast('info', 'Time is up. Great session.');
  }, [toast]);

  const handleSubmitRating = useCallback(async () => {
    if (selectedRating === 0) return;
    setIsSubmittingRating(true);
    try {
      const res = await fetch('/api/session/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          rating: selectedRating,
          partnerShowedUp: true,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit rating');
      }

      setHasRated(true);
      toast('success', 'Thanks for rating.');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to submit rating');
    } finally {
      setIsSubmittingRating(false);
    }
  }, [sessionId, selectedRating, toast]);

  const handleNoShow = useCallback(async () => {
    setIsSubmittingRating(true);
    try {
      await fetch('/api/session/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          rating: 1,
          partnerShowedUp: false,
        }),
      });
      setHasRated(true);
      toast('info', 'Marked as no-show. You can match again.');
    } catch {
      toast('error', 'Failed to submit. Try again.');
    } finally {
      setIsSubmittingRating(false);
    }
  }, [sessionId, toast]);

  // -- Completed / post-session state --
  if (sessionOver) {
    return (
      <div className="mx-auto max-w-md space-y-6 pt-8">
        <div className="text-center">
          <CheckCircle size={40} className="mx-auto mb-3 text-success" />
          <h1 className="text-2xl font-semibold text-textPrimary">Session complete</h1>
          <p className="mt-1 text-sm text-textMuted">
            {durationMinutes}min session with {partnerName}
          </p>
        </div>

        {!hasRated ? (
          <Card className="space-y-4 text-center">
            <p className="text-sm font-medium text-textPrimary">How was your session?</p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className="p-1 transition-colors duration-200"
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    size={28}
                    className={cn(
                      'transition-colors duration-200',
                      star <= selectedRating
                        ? 'fill-sandAccent text-sandAccent'
                        : 'text-borderNeutral'
                    )}
                  />
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSubmitRating}
                loading={isSubmittingRating}
                disabled={selectedRating === 0}
              >
                Submit rating
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNoShow}
                disabled={isSubmittingRating}
              >
                Partner did not show up
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="text-center py-6">
            <p className="text-sm text-textMuted">You have rated this session. Thanks.</p>
          </Card>
        )}

        <div className="text-center">
          <Button variant="secondary" onClick={() => router.push('/app/match')}>
            Match again
          </Button>
        </div>
      </div>
    );
  }

  // -- Waiting to join --
  if (!hasJoined) {
    const joinable = canJoinNow(startAtUtc);

    return (
      <div className="mx-auto max-w-md space-y-6 pt-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-textPrimary">
            {durationMinutes}min session
          </h1>
          <p className="mt-1 text-sm text-textMuted">with {partnerName}</p>
        </div>

        <Card className="flex flex-col items-center gap-4 py-8 text-center">
          <Video size={32} className="text-focusBlue" />
          {joinable ? (
            <>
              <p className="text-sm text-textMuted">Your session is ready to join.</p>
              <Button size="lg" onClick={handleJoin} loading={isJoining}>
                Join session
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-textMuted">
                You can join up to 5 minutes before the session starts.
              </p>
              <Button size="lg" disabled>
                Not yet available
              </Button>
            </>
          )}
        </Card>
      </div>
    );
  }

  // -- In progress --
  return (
    <div className="mx-auto max-w-lg space-y-6 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-textPrimary">In session</h1>
          <p className="text-sm text-textMuted">with {partnerName}</p>
        </div>
        <SessionTimer
          startAtUtc={startAtUtc}
          endAtUtc={endAtUtc}
          onTimeUp={handleTimeUp}
        />
      </div>

      <Card className="flex aspect-video items-center justify-center bg-bgPrimary">
        <div className="text-center">
          <Video size={48} className="mx-auto mb-2 text-borderNeutral" />
          <p className="text-sm text-textMuted">Video session active</p>
        </div>
      </Card>

      <div className="flex justify-center">
        <Button
          variant="danger"
          onClick={handleEndSession}
          loading={isEnding}
          className="gap-2"
        >
          <PhoneOff size={16} />
          End session
        </Button>
      </div>
    </div>
  );
}
