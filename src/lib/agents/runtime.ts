import { prisma } from '@/lib/db';
import { getProvider } from './providers';
import { decrypt } from './encryption';
import type { AgentMessage } from './types';

/**
 * Send a message to an agent and get a response.
 * Handles decrypting the user's API key, building context, and calling the provider.
 */
export async function sendAgentMessage(
  agentId: string,
  sessionId: string,
  userMessage: string
): Promise<{ content: string; tokensUsed: { input: number; output: number } }> {
  // Load agent config
  const agent = await prisma.agent.findUniqueOrThrow({
    where: { id: agentId },
    include: { owner: { select: { id: true } } },
  });

  // Get the user's API key for this provider
  const apiKeyRecord = await prisma.agentApiKey.findUnique({
    where: {
      userId_provider: {
        userId: agent.ownerId,
        provider: agent.provider,
      },
    },
  });

  if (!apiKeyRecord) {
    throw new Error(
      `No API key configured for ${agent.provider}. Add one in Settings > Agents.`
    );
  }

  const apiKey = decrypt(apiKeyRecord.encryptedKey, apiKeyRecord.iv);

  // Load recent conversation history (last 20 messages)
  const recentMessages = await prisma.sessionMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  // Build message history
  const messages: AgentMessage[] = recentMessages.map((msg) => ({
    role: msg.type === 'AGENT' ? ('assistant' as const) : ('user' as const),
    content: msg.content,
  }));

  // Add the new user message
  messages.push({ role: 'user', content: userMessage });

  // Build system prompt
  const systemPrompt = buildSystemPrompt(agent.name, agent.systemPrompt);

  // Call provider
  const provider = getProvider(agent.provider);
  return provider.sendMessage(apiKey, agent.model, messages, systemPrompt);
}

function buildSystemPrompt(agentName: string, customPrompt: string | null): string {
  const base = `You are ${agentName}, a coworking companion in a CCowork session. You help your partner stay focused, think through problems, and maintain accountability. Keep responses concise and supportive.`;

  if (customPrompt) {
    return `${base}\n\nAdditional instructions: ${customPrompt}`;
  }

  return base;
}
