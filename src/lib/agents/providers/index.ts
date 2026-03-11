import type { AgentProviderInterface } from './types';
import { claudeProvider } from './claude';
import { openaiProvider } from './openai';

const providers: Record<string, AgentProviderInterface> = {
  ANTHROPIC: claudeProvider,
  OPENAI: openaiProvider,
};

export function getProvider(providerName: string): AgentProviderInterface {
  const provider = providers[providerName];
  if (!provider) {
    throw new Error(`Unknown agent provider: ${providerName}`);
  }
  return provider;
}
