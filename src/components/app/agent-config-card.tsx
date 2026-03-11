'use client';

import { Bot, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AgentConfigCardProps {
  agent: {
    id: string;
    name: string;
    provider: string;
    model: string;
    status: string;
    capabilities: string[];
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const providerLabels: Record<string, string> = {
  ANTHROPIC: 'Claude',
  OPENAI: 'OpenAI',
};

export function AgentConfigCard({ agent, onEdit, onDelete }: AgentConfigCardProps) {
  return (
    <Card className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-focusBlue/10 text-focusBlue">
        <Bot size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-textPrimary truncate">
            {agent.name}
          </h3>
          <Badge variant={agent.status === 'ACTIVE' ? 'success' : 'warning'}>
            {agent.status.toLowerCase()}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-textMuted">
          {providerLabels[agent.provider] ?? agent.provider} &middot; {agent.model}
        </p>
        {agent.capabilities.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {agent.capabilities.map((cap) => (
              <Badge key={cap} variant="info">
                {cap.toLowerCase().replace('_', ' ')}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(agent.id)}
          aria-label="Edit agent"
        >
          <Pencil size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(agent.id)}
          aria-label="Delete agent"
        >
          <Trash2 size={14} className="text-error" />
        </Button>
      </div>
    </Card>
  );
}
