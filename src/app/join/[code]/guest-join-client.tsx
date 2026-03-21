'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SessionTimer } from '@/components/app/session-timer';

interface GuestJoinClientProps {
  hostName: string;
  durationMinutes: number;
  startAtUtc: string;
  endAtUtc: string;
  meetingUrl: string;
  status?: string;
  inviteCode?: string;
}

function Countdown({ targetUtc }: { targetUtc: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    function update() {
      const diff = new Date(targetUtc).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('Starting soon...');
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (hours > 0) {
        setRemaining(`${hours}h ${mins}m ${secs}s`);
      } else {
        setRemaining(`${mins}m ${secs}s`);
      }
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetUtc]);

  return <span className="text-2xl font-semibold tabular-nums text-focusBlue">{remaining}</span>;
}

export function GuestJoinClient({
  hostName,
  durationMinutes,
  startAtUtc,
  endAtUtc,
  meetingUrl: initialMeetingUrl,
  status: initialStatus = 'IN_PROGRESS',
  inviteCode,
}: GuestJoinClientProps) {
  const [displayName, setDisplayName] = useState('');
  const [joined, setJoined] = useState(false);
  const [ended, setEnded] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [meetingUrl, setMeetingUrl] = useState(initialMeetingUrl);
  const [currentStartAtUtc, setCurrentStartAtUtc] = useState(startAtUtc);
  const [currentEndAtUtc, setCurrentEndAtUtc] = useState(endAtUtc);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for status changes when session is SCHEDULED
  useEffect(() => {
    if (status !== 'SCHEDULED' || !inviteCode) return;

    async function poll() {
      try {
        const res = await fetch(`/api/open-session/lookup?code=${inviteCode}`);
        if (!res.ok) {
          // Session was cancelled or deleted
          setEnded(true);
          return;
        }
        const data = await res.json();
        if (data.status === 'IN_PROGRESS') {
          setStatus('IN_PROGRESS');
          setMeetingUrl(data.meetingUrl);
          setCurrentStartAtUtc(data.startAtUtc);
          setCurrentEndAtUtc(data.endAtUtc);
        }
      } catch {
        // Ignore network errors, will retry
      }
    }

    pollRef.current = setInterval(poll, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, inviteCode]);

  // Clear polling when status changes away from SCHEDULED
  useEffect(() => {
    if (status !== 'SCHEDULED' && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [status]);

  const jitsiUrlWithName = `${meetingUrl}#userInfo.displayName=${encodeURIComponent(displayName)}`;

  const handleJoin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (displayName.trim()) {
        setJoined(true);
      }
    },
    [displayName]
  );

  const handleTimeUp = useCallback(() => {
    setEnded(true);
  }, []);

  const handleLeave = useCallback(() => {
    setJoined(false);
    setEnded(true);
  }, []);

  // -- Session ended --
  if (ended) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bgPrimary px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-textPrimary">Session ended</h1>
          <p className="mt-2 text-sm text-textMuted">
            Thanks for joining. The session has ended.
          </p>
        </div>
      </div>
    );
  }

  // -- Waiting for scheduled session to start --
  if (status === 'SCHEDULED') {
    const scheduledTime = new Date(currentStartAtUtc);
    return (
      <div className="flex min-h-screen items-center justify-center bg-bgPrimary px-4">
        <Card className="mx-auto w-full max-w-sm space-y-6 py-8 text-center">
          <div>
            <h1 className="text-2xl font-semibold text-textPrimary">
              {hostName}&apos;s session
            </h1>
            <p className="mt-1 text-sm text-textMuted">
              {durationMinutes}min coworking session
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-textMuted">Starts at</p>
            <p className="text-lg font-medium text-textPrimary">
              {scheduledTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
              {scheduledTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </p>
            <Countdown targetUtc={currentStartAtUtc} />
          </div>

          <p className="text-xs text-textMuted">
            This page will update automatically when the host starts the session.
          </p>
        </Card>
      </div>
    );
  }

  // -- In session --
  if (joined) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-textPrimary">
              {hostName}&apos;s room
            </h1>
            <p className="text-sm text-textMuted">
              {durationMinutes}min session
            </p>
          </div>
          <SessionTimer
            startAtUtc={currentStartAtUtc}
            endAtUtc={currentEndAtUtc}
            onTimeUp={handleTimeUp}
          />
        </div>

        <div className="relative aspect-video rounded-card overflow-hidden border border-borderNeutral bg-bgSecondary">
          <iframe
            src={jitsiUrlWithName}
            allow="camera;microphone;display-capture;fullscreen"
            className="h-full w-full"
            title="Video call"
          />
        </div>

        <div className="flex justify-center">
          <Button variant="danger" onClick={handleLeave}>
            Leave session
          </Button>
        </div>
      </div>
    );
  }

  // -- Name input --
  return (
    <div className="flex min-h-screen items-center justify-center bg-bgPrimary px-4">
      <Card className="mx-auto w-full max-w-sm space-y-6 py-8 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-textPrimary">
            Join {hostName}&apos;s room
          </h1>
          <p className="mt-1 text-sm text-textMuted">
            {durationMinutes}min coworking session
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            required
            maxLength={50}
            className="w-full rounded-button border border-borderNeutral bg-bgSecondary px-4 py-3 text-base text-textPrimary placeholder:text-textMuted focus:border-focusBlue focus:outline-none focus:ring-1 focus:ring-focusBlue"
          />
          <Button type="submit" size="lg" className="w-full" disabled={!displayName.trim()}>
            Join session
          </Button>
        </form>
      </Card>
    </div>
  );
}
