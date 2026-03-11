'use client';

import { AgentAvatar } from './agent-avatar';

interface AgentPanelProps {
  agentName: string;
  agentStatus: 'ACTIVE' | 'PAUSED';
  avatarUrl?: string | null;
  isResponding: boolean;
}

export function AgentPanel({ agentName, agentStatus, avatarUrl, isResponding }: AgentPanelProps) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-borderNeutral bg-bgSecondary px-4 py-3">
      <AgentAvatar name={agentName} avatarUrl={avatarUrl} status={agentStatus} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-textPrimary truncate">{agentName}</p>
        <p className="text-xs text-textMuted">
          {isResponding ? 'Thinking...' : 'Listening'}
        </p>
      </div>
      {isResponding && (
        <div className="flex gap-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-focusBlue animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-focusBlue animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-focusBlue animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  );
}
