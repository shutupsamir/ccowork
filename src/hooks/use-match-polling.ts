'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type PollingStatus = 'idle' | 'searching' | 'matched' | 'expired' | 'error';

interface UseMatchPollingReturn {
  status: PollingStatus;
  matchedSessionId: string | null;
  elapsedSeconds: number;
  error: string | null;
}

export function useMatchPolling(matchRequestId: string | null): UseMatchPollingReturn {
  const [status, setStatus] = useState<PollingStatus>('idle');
  const [matchedSessionId, setMatchedSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!matchRequestId) {
      setStatus('idle');
      setMatchedSessionId(null);
      setElapsedSeconds(0);
      setError(null);
      cleanup();
      return;
    }

    setStatus('searching');
    setMatchedSessionId(null);
    setElapsedSeconds(0);
    setError(null);

    // Elapsed time counter
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Poll for match status
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/match/status?matchRequestId=${encodeURIComponent(matchRequestId)}`
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Polling failed');
        }

        const data = await res.json();

        switch (data.status) {
          case 'SEARCHING':
            setStatus('searching');
            break;
          case 'MATCHED':
            setStatus('matched');
            setMatchedSessionId(data.matchedSessionId ?? null);
            cleanup();
            break;
          case 'EXPIRED':
            setStatus('expired');
            cleanup();
            break;
          case 'CANCELLED':
            setStatus('idle');
            cleanup();
            break;
          default:
            break;
        }
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Polling failed');
        cleanup();
      }
    };

    // Initial poll
    poll();

    // Poll every 2 seconds
    intervalRef.current = setInterval(poll, 2000);

    return cleanup;
  }, [matchRequestId, cleanup]);

  return { status, matchedSessionId, elapsedSeconds, error };
}
