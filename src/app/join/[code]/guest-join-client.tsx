'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SessionTimer } from '@/components/app/session-timer';

interface GuestJoinClientProps {
  hostName: string;
  durationMinutes: number;
  startAtUtc: string;
  endAtUtc: string;
  meetingUrl: string;
}

export function GuestJoinClient({
  hostName,
  durationMinutes,
  startAtUtc,
  endAtUtc,
  meetingUrl,
}: GuestJoinClientProps) {
  const [displayName, setDisplayName] = useState('');
  const [joined, setJoined] = useState(false);
  const [ended, setEnded] = useState(false);

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
            startAtUtc={startAtUtc}
            endAtUtc={endAtUtc}
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
