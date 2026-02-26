'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface VideoFrameProps {
  stream: MediaStream | null;
  muted: boolean;
  label: string;
  isLocal: boolean;
  isActive: boolean;
}

function getInitial(label: string): string {
  return label.trim().charAt(0).toUpperCase() || '?';
}

export function VideoFrame({ stream, muted, label, isLocal, isActive }: VideoFrameProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (stream) {
      el.srcObject = stream;
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  return (
    <div
      className={cn(
        'relative aspect-video rounded-card overflow-hidden bg-bgSecondary border border-borderNeutral',
        isActive && 'shadow-[0_0_0_2px_rgba(58,123,255,0.3)]'
      )}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={cn(
            'w-full h-full object-cover',
            isLocal && 'scale-x-[-1]'
          )}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-borderNeutral text-textPrimary text-2xl font-semibold select-none">
            {getInitial(label)}
          </div>
        </div>
      )}

      {/* Label */}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-button bg-bgPrimary/70 text-xs text-textPrimary">
        {label}
        {isLocal && ' (You)'}
      </div>
    </div>
  );
}
