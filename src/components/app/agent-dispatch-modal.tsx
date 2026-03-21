'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: string;
  name: string;
  provider: string;
  status: string;
}

interface AgentDispatchModalProps {
  open: boolean;
  onClose: () => void;
}

export function AgentDispatchModal({ open, onClose }: AgentDispatchModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentAId, setAgentAId] = useState('');
  const [agentBId, setAgentBId] = useState('');
  const [topic, setTopic] = useState('');
  const [maxTurns, setMaxTurns] = useState(20);
  const [isDispatching, setIsDispatching] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch('/api/agents')
      .then((r) => r.json())
      .then((data) => {
        const active = (data.agents ?? []).filter(
          (a: Agent) => a.status === 'ACTIVE'
        );
        setAgents(active);
        if (active.length >= 2) {
          setAgentAId(active[0].id);
          setAgentBId(active[1].id);
        }
      })
      .catch(() => {});
  }, [open]);

  const agentOptions = agents.map((a) => ({
    value: a.id,
    label: `${a.name} (${a.provider})`,
  }));

  const canDispatch =
    agentAId && agentBId && agentAId !== agentBId && topic.trim().length > 0;

  const handleDispatch = async () => {
    if (!canDispatch) return;
    setIsDispatching(true);

    try {
      const res = await fetch('/api/agents/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentAId,
          agentBId,
          topic: topic.trim(),
          maxTurns,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to dispatch agents');
      }

      const data = await res.json();
      toast('success', 'Agents dispatched.');
      onClose();
      router.push(`/app/session/${data.sessionId}`);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to dispatch');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Dispatch Agents">
      <div className="space-y-4">
        {agents.length < 2 ? (
          <p className="text-sm text-textMuted">
            You need at least 2 active agents to dispatch. Create agents in Settings.
          </p>
        ) : (
          <>
            <Select
              label="Agent A"
              value={agentAId}
              onChange={(e) => setAgentAId(e.target.value)}
              options={agentOptions}
            />

            <Select
              label="Agent B"
              value={agentBId}
              onChange={(e) => setAgentBId(e.target.value)}
              options={agentOptions}
            />

            {agentAId && agentBId && agentAId === agentBId && (
              <p className="text-xs text-error">Agents must be different.</p>
            )}

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1.5">
                Topic / Goal
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Brainstorm marketing strategies for Q2..."
                rows={3}
                className="w-full rounded-button border border-borderNeutral bg-bgPrimary px-3 py-2 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-focusBlue focus:border-transparent transition-colors duration-200 resize-none"
              />
            </div>

            <Input
              label="Max turns"
              type="number"
              value={String(maxTurns)}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (v >= 4 && v <= 40) setMaxTurns(v);
              }}
              min={4}
              max={40}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleDispatch}
                disabled={!canDispatch}
                loading={isDispatching}
              >
                Dispatch
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
