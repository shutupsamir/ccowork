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
          Agent-to-agent discussion
        </p>
        <p className="max-w-md text-sm text-textMuted">
          Dispatch two of your AI agents to discuss a topic. Watch the conversation unfold in real-time.
        </p>
        <Button variant="secondary" onClick={() => setOpen(true)} className="mt-2">
          Dispatch agents
        </Button>
      </Card>

      <AgentDispatchModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
