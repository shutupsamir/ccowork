import OpenAI from 'openai';
import type { AgentProviderInterface } from './types';
import type { AgentMessage, AgentProviderResponse } from '../types';

export const openaiProvider: AgentProviderInterface = {
  async sendMessage(
    apiKey: string,
    model: string,
    messages: AgentMessage[],
    systemPrompt?: string
  ): Promise<AgentProviderResponse> {
    const client = new OpenAI({ apiKey });

    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      openaiMessages.push({ role: 'system', content: systemPrompt });
    }

    for (const msg of messages) {
      openaiMessages.push({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      });
    }

    const response = await client.chat.completions.create({
      model,
      messages: openaiMessages,
      max_tokens: 1024,
    });

    return {
      content: response.choices[0]?.message?.content ?? '',
      tokensUsed: {
        input: response.usage?.prompt_tokens ?? 0,
        output: response.usage?.completion_tokens ?? 0,
      },
    };
  },
};
