export interface AgentConfig {
  id: string;
  name: string;
  provider: 'ANTHROPIC' | 'OPENAI';
  model: string;
  systemPrompt: string | null;
  avatarUrl: string | null;
  capabilities: string[];
  status: 'ACTIVE' | 'PAUSED';
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentProviderResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
  };
}
