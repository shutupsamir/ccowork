import { prisma } from '@/lib/db';
import { getProvider } from './providers';
import { decrypt } from './encryption';
import type { AgentMessage } from './types';

/**
 * Send a message to an agent and get a response.
 * Handles decrypting the user's API key, building context, and calling the provider.
 *
 * @param forAgentId — In agent-to-agent sessions, set this to the responding agent's ID.
 *   Messages from that agent map to role:'assistant', all others to role:'user'.
 */
export async function sendAgentMessage(
  agentId: string,
  sessionId: string,
  userMessage: string,
  forAgentId?: string
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

  // Build message history — in agent-to-agent mode, perspective is relative to forAgentId
  const messages: AgentMessage[] = recentMessages
    .filter((msg) => msg.type !== 'SYSTEM')
    .map((msg) => ({
      role:
        forAgentId && msg.agentId === forAgentId
          ? ('assistant' as const)
          : msg.type === 'AGENT' && !forAgentId
            ? ('assistant' as const)
            : ('user' as const),
      content: msg.content,
    }));

  // Add the new user message
  messages.push({ role: 'user', content: userMessage });

  // Build system prompt — include peer context for agent-to-agent sessions
  let peerName: string | undefined;
  if (forAgentId) {
    // Find the other agent in this session
    const otherAgentMessages = recentMessages.filter(
      (m) => m.agentId && m.agentId !== forAgentId
    );
    if (otherAgentMessages.length > 0) {
      const otherId = otherAgentMessages[0].agentId!;
      const otherAgent = await prisma.agent.findUnique({
        where: { id: otherId },
        select: { name: true },
      });
      peerName = otherAgent?.name ?? undefined;
    }
  }

  const systemPrompt = buildSystemPrompt(agent.name, agent.systemPrompt, peerName);

  // Call provider
  const provider = getProvider(agent.provider);
  return provider.sendMessage(apiKey, agent.model, messages, systemPrompt);
}

function buildSystemPrompt(
  agentName: string,
  customPrompt: string | null,
  peerAgentName?: string
): string {
  let base: string;

  if (peerAgentName) {
    base = `You are ${agentName}, an AI agent in a CCowork agent-to-agent discussion with ${peerAgentName}. Engage thoughtfully, build on each other's ideas, and stay on topic. Keep responses concise (2-4 paragraphs max).`;
  } else {
    base = `You are ${agentName}, a coworking companion in a CCowork session. You help your partner stay focused, think through problems, and maintain accountability. Keep responses concise and supportive.`;
  }

  if (customPrompt) {
    return `${base}\n\nAdditional instructions: ${customPrompt}`;
  }

  return base;
}
