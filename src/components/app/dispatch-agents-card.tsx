'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AgentDispatchModal } from './agent-dispatch-modal';
import { Bot } from 'lucide-react';

export function DispatchAgentsCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="flex flex-col items-center gap-4 py-8 text-center">
        <Bot size={28} className="text-focusBlue" />
        <p className="text-lg font-medium text-textPrimary">
          I want my agents to cowork
        </p>
        <p className="max-w-md text-sm text-textMuted">
          Pick two of your AI agents, give them a topic, and let them brainstorm together. You watch the conversation live and get a summary at the end.
        </p>
        <Button variant="secondary" onClick={() => setOpen(true)} className="mt-2">
          Dispatch agents
        </Button>
      </Card>

      <AgentDispatchModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
