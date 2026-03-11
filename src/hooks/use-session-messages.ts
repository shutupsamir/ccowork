'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface SessionMessage {
  id: string;
  sessionId: string;
  senderId: string | null;
  agentId: string | null;
  type: 'USER' | 'AGENT' | 'SYSTEM';
  content: string;
  createdAt: string;
  senderName?: string;
}

export function useSessionMessages(sessionId: string | null) {
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!sessionId) return;

    try {
      const res = await fetch(`/api/session/messages?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch {
      // Silent fail on poll
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    setIsLoading(true);
    fetchMessages().finally(() => setIsLoading(false));

    // Poll every 3 seconds
    intervalRef.current = setInterval(fetchMessages, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionId, fetchMessages]);

  return { messages, isLoading, refresh: fetchMessages };
}
