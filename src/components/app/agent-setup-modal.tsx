'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface AgentData {
  id?: string;
  name: string;
  provider: string;
  model: string;
  systemPrompt: string;
  capabilities: string[];
}

interface AgentSetupModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editAgent?: AgentData | null;
}

const PROVIDER_OPTIONS = [
  { value: 'ANTHROPIC', label: 'Claude (Anthropic)' },
  { value: 'OPENAI', label: 'OpenAI' },
];

const MODEL_OPTIONS: Record<string, { value: string; label: string }[]> = {
  ANTHROPIC: [
    { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  ],
  OPENAI: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  ],
};

const CAPABILITY_OPTIONS = [
  { value: 'CHAT', label: 'Chat' },
  { value: 'CODE_REVIEW', label: 'Code Review' },
  { value: 'BRAINSTORM', label: 'Brainstorm' },
  { value: 'ACCOUNTABILITY', label: 'Accountability' },
];

export function AgentSetupModal({ open, onClose, onSaved, editAgent }: AgentSetupModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('ANTHROPIC');
  const [model, setModel] = useState('claude-sonnet-4-6');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!editAgent?.id;

  useEffect(() => {
    if (editAgent) {
      setName(editAgent.name);
      setProvider(editAgent.provider);
      setModel(editAgent.model);
      setSystemPrompt(editAgent.systemPrompt ?? '');
      setCapabilities(editAgent.capabilities);
    } else {
      setName('');
      setProvider('ANTHROPIC');
      setModel('claude-sonnet-4-6');
      setSystemPrompt('');
      setCapabilities([]);
    }
  }, [editAgent, open]);

  const toggleCapability = (cap: string) => {
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast('error', 'Agent name is required');
      return;
    }

    setIsSaving(true);
    try {
      const url = isEditing ? `/api/agents/${editAgent!.id}` : '/api/agents';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          provider,
          model,
          systemPrompt: systemPrompt.trim() || undefined,
          capabilities,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save agent');
      }

      toast('success', isEditing ? 'Agent updated.' : 'Agent created.');
      onSaved();
      onClose();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit Agent' : 'Create Agent'}>
      <div className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My cowork buddy"
        />

        <Select
          label="Provider"
          value={provider}
          onChange={(e) => {
            const p = e.target.value;
            setProvider(p);
            setModel(MODEL_OPTIONS[p]?.[0]?.value ?? '');
          }}
          options={PROVIDER_OPTIONS}
        />

        <Select
          label="Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          options={MODEL_OPTIONS[provider] ?? []}
        />

        <div>
          <label className="block text-sm font-medium text-textPrimary mb-1.5">
            System prompt
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are a helpful coworking companion..."
            rows={3}
            className="w-full rounded-button border border-borderNeutral bg-bgPrimary px-3 py-2 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-focusBlue focus:border-transparent transition-colors duration-200 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-textPrimary mb-1.5">
            Capabilities
          </label>
          <div className="flex flex-wrap gap-2">
            {CAPABILITY_OPTIONS.map((cap) => (
              <button
                key={cap.value}
                type="button"
                onClick={() => toggleCapability(cap.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors duration-200 ${
                  capabilities.includes(cap.value)
                    ? 'bg-focusBlue/10 border-focusBlue text-focusBlue'
                    : 'bg-bgPrimary border-borderNeutral text-textMuted hover:text-textPrimary'
                }`}
              >
                {cap.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            {isEditing ? 'Save changes' : 'Create agent'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
