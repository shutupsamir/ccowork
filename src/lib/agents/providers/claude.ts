import Anthropic from '@anthropic-ai/sdk';
import type { AgentProviderInterface } from './types';
import type { AgentMessage, AgentProviderResponse } from '../types';

export const claudeProvider: AgentProviderInterface = {
  async sendMessage(
    apiKey: string,
    model: string,
    messages: AgentMessage[],
    systemPrompt?: string
  ): Promise<AgentProviderResponse> {
    const client = new Anthropic({ apiKey });

    const anthropicMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt || undefined,
      messages: anthropicMessages,
    });

    const textBlock = response.content.find((b) => b.type === 'text');

    return {
      content: textBlock?.text ?? '',
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  },
};
