'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SessionTimer } from '@/components/app/session-timer';
import { VideoRoom } from '@/components/app/video-room';
import { useToast } from '@/hooks/use-toast';
import { Copy, CheckCircle, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Phase = 'create' | 'active' | 'done';

export default function OpenSessionPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>('create');
  const [duration, setDuration] = useState<25 | 50>(25);
  const [isCreating, setIsCreating] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [copied, setCopied] = useState(false);

  // Session data (set after creation)
  const [sessionId, setSessionId] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [startAtUtc, setStartAtUtc] = useState('');
  const [endAtUtc, setEndAtUtc] = useState('');

  const shareLink = inviteCode
    ? `${window.location.origin}/join/${inviteCode}`
    : '';

  const handleCreate = useCallback(async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/open-session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMinutes: duration }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create session');
      }

      const data = await res.json();
      setSessionId(data.sessionId);
      setInviteCode(data.inviteCode);
      setMeetingUrl(data.meetingUrl);

      const now = new Date();
      setStartAtUtc(now.toISOString());
      setEndAtUtc(new Date(now.getTime() + duration * 60 * 1000).toISOString());

      setPhase('active');
      toast('success', 'Room created. Share the link to invite others.');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setIsCreating(false);
    }
  }, [duration, toast]);

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast('success', 'Link copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  }, [shareLink, toast]);

  const handleEnd = useCallback(async () => {
    setIsEnding(true);
    try {
      const res = await fetch('/api/open-session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to end session');
      }

      setPhase('done');
      toast('info', 'Session ended.');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to end session');
    } finally {
      setIsEnding(false);
    }
  }, [sessionId, toast]);

  const handleTimeUp = useCallback(() => {
    setPhase('done');
    toast('info', 'Time is up. Great session.');
  }, [toast]);

  // -- Done --
  if (phase === 'done') {
    return (
      <div className="mx-auto max-w-md space-y-6 pt-8 text-center">
        <CheckCircle size={40} className="mx-auto mb-3 text-success" />
        <h1 className="text-2xl font-semibold text-textPrimary">Session complete</h1>
        <p className="text-sm text-textMuted">Nice work. Your open room has ended.</p>
        <Button variant="secondary" onClick={() => router.push('/app')}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  // -- Active --
  if (phase === 'active') {
    return (
      <div className="mx-auto max-w-5xl space-y-6 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-textPrimary">Open room</h1>
            <p className="text-sm text-textMuted">{duration}min session</p>
          </div>
          <SessionTimer
            startAtUtc={startAtUtc}
            endAtUtc={endAtUtc}
            onTimeUp={handleTimeUp}
          />
        </div>

        {/* Share link */}
        <Card className="flex items-center gap-3">
          <Link2 size={18} className="shrink-0 text-textMuted" />
          <code className="flex-1 truncate text-sm text-textPrimary">{shareLink}</code>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyLink}
            className="gap-1.5 shrink-0"
          >
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </Card>

        <VideoRoom meetingUrl={meetingUrl} partnerName="your guests" />

        <div className="flex justify-center">
          <Button
            variant="danger"
            onClick={handleEnd}
            loading={isEnding}
          >
            End session
          </Button>
        </div>
      </div>
    );
  }

  // -- Create --
  return (
    <div className="mx-auto max-w-md space-y-6 pt-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-textPrimary">Host an open room</h1>
        <p className="mt-1 text-sm text-textMuted">
          Create a room and share the link. Anyone can join — no sign-up needed.
        </p>
      </div>

      <Card className="flex flex-col items-center gap-6 py-8">
        <p className="text-sm font-medium text-textPrimary">How long?</p>
        <div className="flex gap-3">
          <button
            onClick={() => setDuration(25)}
            className={cn(
              'rounded-button px-6 py-3 text-base font-medium transition-colors duration-200',
              duration === 25
                ? 'bg-focusBlue text-white'
                : 'border border-borderNeutral bg-bgSecondary text-textPrimary hover:bg-borderNeutral/50'
            )}
          >
            25 min
          </button>
          <button
            onClick={() => setDuration(50)}
            className={cn(
              'rounded-button px-6 py-3 text-base font-medium transition-colors duration-200',
              duration === 50
                ? 'bg-focusBlue text-white'
                : 'border border-borderNeutral bg-bgSecondary text-textPrimary hover:bg-borderNeutral/50'
            )}
          >
            50 min
          </button>
        </div>
        <Button size="lg" onClick={handleCreate} loading={isCreating}>
          Create room
        </Button>
      </Card>
    </div>
  );
}
