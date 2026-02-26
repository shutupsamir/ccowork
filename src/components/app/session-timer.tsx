'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SessionTimerProps {
  startAtUtc: string;
  endAtUtc: string;
  onTimeUp: () => void;
}

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function SessionTimer({ startAtUtc, endAtUtc, onTimeUp }: SessionTimerProps) {
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  const calcRemaining = useCallback(() => {
    const endMs = new Date(endAtUtc).getTime();
    const nowMs = Date.now();
    return Math.max(0, Math.floor((endMs - nowMs) / 1000));
  }, [endAtUtc]);

  const calcTotal = useCallback(() => {
    const startMs = new Date(startAtUtc).getTime();
    const endMs = new Date(endAtUtc).getTime();
    return Math.max(1, Math.floor((endMs - startMs) / 1000));
  }, [startAtUtc, endAtUtc]);

  const [remaining, setRemaining] = useState(calcRemaining);
  const totalDuration = calcTotal();
  const progress = 1 - remaining / totalDuration;
  const isLowTime = remaining > 0 && remaining <= 300;

  useEffect(() => {
    const interval = setInterval(() => {
      const r = calcRemaining();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        onTimeUpRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calcRemaining]);

  return (
    <motion.div
      initial={{ borderColor: 'rgba(58, 123, 255, 0.5)' }}
      animate={{ borderColor: 'rgba(58, 123, 255, 0)' }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      className="inline-flex flex-col items-center gap-2 border rounded-card p-3 border-transparent"
    >
      <span
        className={cn(
          'text-2xl font-mono font-semibold tabular-nums',
          isLowTime ? 'text-sandAccent' : 'text-textPrimary'
        )}
      >
        {formatMMSS(remaining)}
      </span>

      {/* Progress bar */}
      <div className="w-32 h-1 rounded-full bg-borderNeutral overflow-hidden">
        <motion.div
          className="h-full bg-focusBlue rounded-full"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}
