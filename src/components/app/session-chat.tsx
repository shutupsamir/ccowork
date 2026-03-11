'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSessionMessages } from '@/hooks/use-session-messages';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SessionChatProps {
  sessionId: string;
  userId: string;
  userName: string;
  hasAgent: boolean;
}

export function SessionChat({ sessionId, userId, userName, hasAgent }: SessionChatProps) {
  const { messages, refresh } = useSessionMessages(sessionId);
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    setIsSending(true);
    setInput('');

    try {
      const res = await fetch('/api/session/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, content: text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send message');
      }

      await refresh();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to send');
      setInput(text); // Restore input on failure
    } finally {
      setIsSending(false);
    }
  }, [input, sessionId, refresh, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Suppress unused variable warning — userName is available for future use
  void userName;

  return (
    <div className="flex flex-col rounded-card border border-borderNeutral bg-bgSecondary overflow-hidden" style={{ height: '400px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-borderNeutral">
        <span className="text-sm font-medium text-textPrimary">Session chat</span>
        {hasAgent && (
          <span className="flex items-center gap-1 text-xs text-focusBlue">
            <Bot size={12} />
            Agent active
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-textMuted pt-8">
            {hasAgent
              ? 'Say something to start chatting with your agent.'
              : 'No messages yet.'}
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === userId;
            const isAgent = msg.type === 'AGENT';
            const isSystem = msg.type === 'SYSTEM';

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center">
                  <span className="text-xs text-textMuted italic">{msg.content}</span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2',
                  isOwn && !isAgent && 'justify-end'
                )}
              >
                {(isAgent || !isOwn) && (
                  <div className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5',
                    isAgent ? 'bg-focusBlue/10 text-focusBlue' : 'bg-borderNeutral text-textMuted'
                  )}>
                    {isAgent ? <Bot size={12} /> : <User size={12} />}
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-card px-3 py-2',
                    isOwn && !isAgent
                      ? 'bg-focusBlue text-white'
                      : isAgent
                        ? 'bg-focusBlue/5 border border-focusBlue/20 text-textPrimary'
                        : 'bg-bgPrimary border border-borderNeutral text-textPrimary'
                  )}
                >
                  {(isAgent || !isOwn) && (
                    <p className="text-xs font-medium mb-0.5 opacity-70">
                      {msg.senderName ?? (isAgent ? 'Agent' : 'Partner')}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t border-borderNeutral p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 rounded-button border border-borderNeutral bg-bgPrimary px-3 py-2 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-focusBlue focus:border-transparent transition-colors duration-200"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            loading={isSending}
          >
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
