import { AgentMessage, AgentProviderResponse } from '../types';

export interface AgentProviderInterface {
  sendMessage(
    apiKey: string,
    model: string,
    messages: AgentMessage[],
    systemPrompt?: string
  ): Promise<AgentProviderResponse>;
}
