# CCowork.ai — Agent Coworking Feature

## Overview
People and their AI agents ccoworking together. Agents are first-class session participants.

Session types:
- **Human-only** (current behavior)
- **Human + Agent** (bring your AI into the video room)
- **Agent-only** (agents cowork autonomously while humans are offline)

---

## Phase 1: Foundation (Start Here)

### Prisma Schema
- [ ] Add `Agent` model (ownerId, name, provider, model, systemPrompt, avatarUrl, capabilities, status)
- [ ] Add `AgentApiKey` model (userId, provider, encryptedKey, label)
- [ ] Add `SessionMessage` model (sessionId, senderId?, agentId?, type, content, metadata)
- [ ] Add `SharedWorkspace` + `WorkspaceArtifact` models
- [ ] Add enums: `AgentProvider` (CCOWORK, CLAUDE, OPENAI, CUSTOM), `AgentStatus`, `AgentCapability`, `MessageType`, `SessionType`
- [ ] Modify `Session` — add `sessionType`, `messages`, `sharedWorkspace` relations
- [ ] Modify `SessionParticipant` — add optional `agentId` (polymorphic: user OR agent)
- [ ] Modify `MatchRequest` — add `bringAgent`, `agentId`, `preferAgent`, `sessionType`
- [ ] Run migration

### Agent Provider Layer
- [ ] Create `src/lib/agents/types.ts` — agent type definitions, provider interface
- [ ] Create `src/lib/agents/providers/claude.ts` — Anthropic SDK wrapper
- [ ] Create `src/lib/agents/providers/openai.ts` — OpenAI SDK wrapper
- [ ] Create `src/lib/agents/providers/index.ts` — provider factory (route to correct provider)
- [ ] Create `src/lib/agents/encryption.ts` — AES-256-GCM encrypt/decrypt for API keys

### Agent CRUD API
- [ ] `GET /api/agents` — list user's agents
- [ ] `POST /api/agents` — create agent
- [ ] `GET /api/agents/[id]` — get agent details
- [ ] `PATCH /api/agents/[id]` — update agent config
- [ ] `DELETE /api/agents/[id]` — archive agent
- [ ] `POST /api/agents/keys` — store encrypted API key
- [ ] `GET /api/agents/keys` — list user's keys (masked)

### Agent Settings UI
- [ ] `src/components/app/agent-config-card.tsx` — card for managing an agent
- [ ] `src/components/app/agent-setup-modal.tsx` — create/edit agent modal
- [ ] `src/components/app/agent-avatar.tsx` — animated avatar (pulsing ring for status)
- [ ] Update `src/app/(app)/app/settings/page.tsx` — add "Agents" tab

### Env Vars Needed
- `AGENT_KEY_ENCRYPTION_SECRET` — 32-byte hex for AES-256-GCM
- `ANTHROPIC_API_KEY` — default Claude key for CCowork built-in agent
- `OPENAI_API_KEY` — default OpenAI key for CCowork built-in agent
- `AGENT_DEFAULT_PROVIDER` — which provider the default agent uses
- `NEXT_PUBLIC_SUPABASE_URL` — for Realtime client
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — for Realtime client

### New Dependencies
- `@anthropic-ai/sdk`
- `openai`
- `@supabase/supabase-js` (for Realtime)

---

## Phase 2: Agent in Session

- [ ] Extend match start API — accept `bringAgent`, `agentId`
- [ ] Update match page UI — "Bring my agent?" toggle + agent selector
- [ ] Create `agent-session-orchestrator` Inngest function (agent runtime during session)
- [ ] Create `src/lib/agents/runtime.ts` — prompt construction, turn management
- [ ] Create `src/hooks/use-session-messages.ts` — Supabase Realtime subscription
- [ ] Create `src/components/app/agent-panel.tsx` — agent visual presence (avatar, status, activity feed)
- [ ] Create `src/components/app/session-chat.tsx` — text chat panel (humans + agents)
- [ ] Modify `video-room.tsx` — flexible grid (VideoFrame for humans, AgentPanel for agents)
- [ ] Modify `session-room-client.tsx` — integrate chat panel alongside video
- [ ] Build `/api/session/messages` GET/POST routes

---

## Phase 3: Agent-to-Agent + Shared Workspace

- [ ] Agent-only matching logic (directed invitations, not random FIFO)
- [ ] Create `src/components/app/agent-dispatch-modal.tsx` — dispatch agent-only sessions
- [ ] Build `/api/agents/[id]/dispatch` POST route
- [ ] Build `/api/session/workspace` and `/api/session/workspace/artifacts` routes
- [ ] Create `src/components/app/shared-workspace-panel.tsx` — artifacts viewer
- [ ] Agent-only session view (agent panels + chat + workspace, no video)
- [ ] Email notification when agent-only session completes

---

## Phase 4: Polish + Advanced

- [ ] Full multi-provider support (custom OpenAI-compatible endpoints)
- [ ] Agent capability enforcement
- [ ] Session summary generation (agent writes summary at session end)
- [ ] Agent analytics (token usage, session count, artifacts per agent)
- [ ] Per-session token budgets (50k/25min, 100k/50min)
- [ ] Agent-to-agent structured protocol (turn-taking across providers)
- [ ] Rate limiting for agent API calls

---

## Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Agent data model | Separate `Agent` model, not User | Agents don't have Clerk accounts. Avoids auth pollution. |
| Real-time comms | Supabase Realtime | Already have Supabase. No new infra. Free pub/sub on Postgres changes. |
| Agent runtime | Inngest step functions | Already in stack. Durable, retryable. Each LLM call is a step. |
| API key storage | AES-256-GCM with server secret | Standard approach. No KMS needed. Never sent to client. |
| Agent-only matching | Directed invitations (not random FIFO) | Avoids weird UX of agents randomly matching with strangers' agents. |
| Token cost control | Per-session budgets | Prevents runaway agent from burning money. Users see cost estimate before dispatch. |
