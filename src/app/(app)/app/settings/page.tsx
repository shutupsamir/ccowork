'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabList, TabTrigger, TabPanel } from '@/components/ui/tabs';
import { AgentConfigCard } from '@/components/app/agent-config-card';
import { AgentSetupModal } from '@/components/app/agent-setup-modal';
import { useToast } from '@/hooks/use-toast';
import { Plus, Key } from 'lucide-react';

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (New York)' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { value: 'America/Anchorage', label: 'Alaska Time (Anchorage)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (Honolulu)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: 'Kolkata (IST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
  { value: 'UTC', label: 'UTC' },
];

interface UserSettings {
  name: string;
  timezone: string;
}

interface AgentData {
  id: string;
  name: string;
  provider: string;
  model: string;
  systemPrompt: string;
  status: string;
  capabilities: string[];
}

interface ApiKeyData {
  id: string;
  provider: string;
  label: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const { toast } = useToast();

  // Profile state
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Agent state
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentData | null>(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiKeyProvider, setNewApiKeyProvider] = useState('ANTHROPIC');
  const [isSavingKey, setIsSavingKey] = useState(false);

  // Load profile settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const userRes = await fetch('/api/user/settings');
        if (userRes.ok) {
          const data: UserSettings = await userRes.json();
          setName(data.name ?? '');
          setTimezone(data.timezone ?? 'UTC');
        }
      } catch {
        // Silently fail on load
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveProfile = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), timezone }),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      toast('success', 'Settings saved.');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }, [name, timezone, toast]);

  // Load agents
  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents);
      }
    } catch {
      // Silent fail
    }
  }, []);

  // Load API keys
  const loadApiKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/keys');
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys);
      }
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    loadAgents();
    loadApiKeys();
  }, [loadAgents, loadApiKeys]);

  const handleEditAgent = (id: string) => {
    const agent = agents.find((a) => a.id === id);
    if (agent) {
      setEditingAgent(agent);
      setIsAgentModalOpen(true);
    }
  };

  const handleDeleteAgent = async (id: string) => {
    try {
      const res = await fetch(`/api/agents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete agent');
      toast('success', 'Agent deleted.');
      loadAgents();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleSaveApiKey = async () => {
    if (!newApiKey.trim()) return;
    setIsSavingKey(true);
    try {
      const res = await fetch('/api/agents/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: newApiKeyProvider,
          apiKey: newApiKey.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to save API key');
      toast('success', 'API key saved.');
      setNewApiKey('');
      loadApiKeys();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to save key');
    } finally {
      setIsSavingKey(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-textPrimary">Settings</h1>

      <Tabs defaultValue="profile">
        <TabList>
          <TabTrigger value="profile">Profile</TabTrigger>
          <TabTrigger value="agents">Agents</TabTrigger>
        </TabList>

        <TabPanel value="profile">
          <Card className="space-y-5">
            <Input
              label="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              disabled={isLoading}
            />
            <Select
              label="Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              options={TIMEZONE_OPTIONS}
              disabled={isLoading}
            />
            <Button onClick={handleSaveProfile} loading={isSaving} disabled={isLoading}>
              Save changes
            </Button>
          </Card>
        </TabPanel>

        <TabPanel value="agents">
          <div className="space-y-4">
            {/* Agent list header */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-textMuted">
                {agents.length} agent{agents.length !== 1 ? 's' : ''}
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setEditingAgent(null);
                  setIsAgentModalOpen(true);
                }}
                className="gap-1.5"
              >
                <Plus size={14} />
                New agent
              </Button>
            </div>

            {agents.length === 0 ? (
              <Card className="py-8 text-center">
                <p className="text-sm text-textMuted">
                  No agents yet. Create one to bring into coworking sessions.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {agents.map((agent) => (
                  <AgentConfigCard
                    key={agent.id}
                    agent={agent}
                    onEdit={handleEditAgent}
                    onDelete={handleDeleteAgent}
                  />
                ))}
              </div>
            )}

            {/* API Keys section */}
            <div className="pt-4 border-t border-borderNeutral">
              <div className="flex items-center gap-2 mb-3">
                <Key size={16} className="text-textMuted" />
                <h3 className="text-sm font-semibold text-textPrimary">API Keys</h3>
              </div>
              <p className="text-xs text-textMuted mb-3">
                Your API keys are encrypted and stored securely. They are used to power your agents.
              </p>

              {apiKeys.length > 0 && (
                <div className="space-y-2 mb-3">
                  {apiKeys.map((k) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between rounded-button border border-borderNeutral bg-bgPrimary px-3 py-2"
                    >
                      <span className="text-sm text-textPrimary">
                        {k.provider === 'ANTHROPIC' ? 'Claude' : 'OpenAI'}
                      </span>
                      <span className="text-xs text-textMuted">
                        Added {new Date(k.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Select
                  value={newApiKeyProvider}
                  onChange={(e) => setNewApiKeyProvider(e.target.value)}
                  options={[
                    { value: 'ANTHROPIC', label: 'Anthropic' },
                    { value: 'OPENAI', label: 'OpenAI' },
                  ]}
                />
                <Input
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="sk-..."
                  type="password"
                />
                <Button
                  size="sm"
                  onClick={handleSaveApiKey}
                  loading={isSavingKey}
                  disabled={!newApiKey.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </TabPanel>
      </Tabs>

      <AgentSetupModal
        open={isAgentModalOpen}
        onClose={() => {
          setIsAgentModalOpen(false);
          setEditingAgent(null);
        }}
        onSaved={loadAgents}
        editAgent={editingAgent}
      />
    </div>
  );
}
