'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface VideoRoomProps {
  meetingUrl: string;
  partnerName: string;
}

export function VideoRoom({ meetingUrl, partnerName }: VideoRoomProps) {
  const [showEmbed, setShowEmbed] = useState(true);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-textMuted">
          Video session with {partnerName}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmbed((s) => !s)}
          >
            {showEmbed ? 'Hide video' : 'Show video'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(meetingUrl, '_blank')}
            className="gap-1.5"
          >
            <ExternalLink size={14} />
            Open in new tab
          </Button>
        </div>
      </div>

      {showEmbed && (
        <div className="relative aspect-video rounded-card overflow-hidden border border-borderNeutral bg-bgSecondary">
          <iframe
            src={meetingUrl}
            allow="camera;microphone;display-capture;fullscreen"
            className="w-full h-full"
            title="Video call"
          />
        </div>
      )}
    </div>
  );
}
