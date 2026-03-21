'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAgentTurnOptions {
  sessionId: string;
  enabled: boolean;
}

export function useAgentTurn({ sessionId, enabled }: UseAgentTurnOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const processingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const executeTurn = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/agents/dispatch/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        // Stop on error
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      const data = await res.json();

      if (data.done) {
        setIsDone(true);
        setSummary(data.summary ?? null);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        setTurnCount(data.turnCount ?? 0);
      }
    } catch {
      // Silent fail, will retry next interval
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [sessionId]);

  useEffect(() => {
    if (!enabled || isDone) return;

    // Start first turn after a short delay
    const timeout = setTimeout(executeTurn, 2000);

    // Then run every 4 seconds
    intervalRef.current = setInterval(executeTurn, 4000);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, isDone, executeTurn]);

  const stop = useCallback(() => {
    setIsDone(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  return { isProcessing, isDone, summary, turnCount, stop };
}
