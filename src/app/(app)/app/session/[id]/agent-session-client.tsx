'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AgentPanel } from '@/components/app/agent-panel';
import { SessionChat } from '@/components/app/session-chat';
import { useAgentTurn } from '@/hooks/use-agent-turn';
import { CheckCircle, StopCircle } from 'lucide-react';

interface AgentInfo {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED';
  avatarUrl?: string | null;
}

interface AgentSessionClientProps {
  sessionId: string;
  userId: string;
  userName: string;
  topic: string;
  agentA: AgentInfo;
  agentB: AgentInfo;
  initialStatus: 'IN_PROGRESS' | 'COMPLETED';
  initialSummary: string | null;
}

export function AgentSessionClient({
  sessionId,
  userId,
  userName,
  topic,
  agentA,
  agentB,
  initialStatus,
  initialSummary,
}: AgentSessionClientProps) {
  const router = useRouter();
  const [isEnding, setIsEnding] = useState(false);

  const { isProcessing, isDone, summary, turnCount, stop } = useAgentTurn({
    sessionId,
    enabled: initialStatus === 'IN_PROGRESS',
  });

  const finalSummary = summary ?? initialSummary;
  const sessionDone = isDone || initialStatus === 'COMPLETED';

  const handleEndEarly = useCallback(async () => {
    setIsEnding(true);
    try {
      await fetch('/api/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      stop();
    } catch {
      // ignore
    } finally {
      setIsEnding(false);
    }
  }, [sessionId, stop]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pt-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-textPrimary">Agent discussion</h1>
        <p className="mt-1 text-sm text-textMuted">{topic}</p>
      </div>

      {/* Agent panels */}
      <div className="grid grid-cols-2 gap-3">
        <AgentPanel
          agentName={agentA.name}
          agentStatus={agentA.status}
          avatarUrl={agentA.avatarUrl}
          isResponding={isProcessing && !sessionDone}
        />
        <AgentPanel
          agentName={agentB.name}
          agentStatus={agentB.status}
          avatarUrl={agentB.avatarUrl}
          isResponding={false}
        />
      </div>

      {/* Status */}
      {!sessionDone && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-textMuted">
            {isProcessing ? 'Generating...' : `${turnCount} turns completed`}
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={handleEndEarly}
            loading={isEnding}
            className="gap-1.5"
          >
            <StopCircle size={14} />
            End early
          </Button>
        </div>
      )}

      {/* Chat — readOnly for agent-only sessions */}
      <SessionChat
        sessionId={sessionId}
        userId={userId}
        userName={userName}
        hasAgent={true}
        readOnly={true}
      />

      {/* Summary when done */}
      {sessionDone && finalSummary && (
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-success" />
            <h3 className="text-sm font-semibold text-textPrimary">Discussion summary</h3>
          </div>
          <p className="text-sm text-textMuted whitespace-pre-wrap">{finalSummary}</p>
        </Card>
      )}

      {sessionDone && (
        <div className="text-center">
          <Button variant="secondary" onClick={() => router.push('/app')}>
            Back to dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
