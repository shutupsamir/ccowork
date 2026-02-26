# CCowork.ai

> Presence creates progress.

Instant coworking video sessions for accountability. Free.

Match with a stranger, work on camera for 25 or 50 minutes, then go. No scheduling, no small talk, no commitment. Just focused work with another human present.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | TailwindCSS + Framer Motion |
| Database | Prisma ORM + PostgreSQL |
| Auth | Clerk |
| Video | Twilio Video |
| Background Jobs | Inngest |
| Email | Resend |
| Testing | Vitest |

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (local, [Neon](https://neon.tech), or [Supabase](https://supabase.com))
- [Clerk](https://clerk.com) account
- [Twilio](https://twilio.com) account with Video enabled
- [Resend](https://resend.com) account
- [Inngest](https://inngest.com) account (or use Inngest Dev Server locally)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in all values in `.env` (see [Environment Variables](#environment-variables) below).

### 3. Set up database

```bash
npx prisma generate
npx prisma db push
```

For migration-based workflow:

```bash
npx prisma migrate dev
```

### 4. Start Inngest Dev Server (separate terminal)

```bash
npx inngest-cli@latest dev
```

This provides a local dashboard at `http://localhost:8288` for monitoring background jobs.

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `CLERK_SECRET_KEY` | Yes | Clerk backend secret key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk frontend publishable key |
| `TWILIO_ACCOUNT_SID` | Yes | Twilio Account SID |
| `TWILIO_API_KEY_SID` | Yes | Twilio API Key SID (create in Twilio console) |
| `TWILIO_API_KEY_SECRET` | Yes | Twilio API Key Secret |
| `RESEND_API_KEY` | Yes | Resend API key for transactional email |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL (e.g., `http://localhost:3000`) |
| `INNGEST_EVENT_KEY` | No | Inngest event key (auto-configured on Vercel) |

## Architecture

### Instant Match Flow

```
User clicks "Start Working" (25 or 50 min)
  |
  v
POST /api/match/request
  |-- Creates MatchRequest (status: SEARCHING, TTL: 5 min)
  |-- Triggers Inngest matchmaker function
  |
  v
Inngest: matchmaker.run (runs every few seconds)
  |-- Fetches all SEARCHING requests not yet expired
  |-- Groups by durationMinutes
  |-- Pairs oldest two distinct users (FIFO)
  |-- Checks blocklist (bidirectional)
  |-- Creates Session + VideoRoom + SessionParticipants in transaction
  |-- Updates both MatchRequests to MATCHED
  |
  v
Client polls /api/match/status
  |-- Detects MATCHED status
  |-- Redirects to /session/[id]
  |-- Connects to Twilio Video room
  |
  v
Session ends (timer or manual)
  |-- Participants rate each other
  |-- Session marked COMPLETED
```

### Key Design Decisions

- **5-minute search TTL**: Requests auto-expire if no match is found. Prevents stale queue buildup.
- **Serializable transactions**: Matchmaker uses serializable isolation to prevent double-matching race conditions.
- **Bidirectional blocklist**: If either user has blocked the other, they will never be paired.
- **In-memory rate limiter**: Simple per-user rate limiting for API routes. Suitable for single-process deployments; swap for Redis in multi-instance setups.

## Testing

```bash
# Run all unit tests
npm test

# Watch mode
npm run test:watch

# E2E tests (requires running dev server)
npm run test:e2e
```

### Test Structure

```
tests/
  setup.ts               # Vitest setup, Prisma mock factory
  matchmaking.test.ts     # Pairing algorithm: duration grouping, blocklist, FIFO
  expiration.test.ts      # TTL boundary conditions
  rate-limit.test.ts      # In-memory rate limiter
```

## Database

```bash
# Open Prisma Studio (GUI for browsing data)
npm run db:studio

# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database (no migration history)
npm run db:push

# Create a migration
npm run db:migrate
```

## Deployment

### Vercel (recommended)

1. Push to GitHub and import in [Vercel](https://vercel.com)
2. Set all environment variables in the Vercel dashboard
3. Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) for PostgreSQL
4. Inngest auto-connects when deployed to Vercel (install the Inngest Vercel integration)
5. Configure Clerk webhook URL if using webhooks: `https://your-domain.com/api/webhooks/clerk`
6. Ensure Twilio Video is enabled in your Twilio account

### Post-deploy checklist

- [ ] All env vars set in Vercel dashboard
- [ ] Database is accessible from Vercel (check connection pooling)
- [ ] `npx prisma db push` or migrations applied to production DB
- [ ] Clerk webhook endpoint configured (if applicable)
- [ ] Inngest dashboard shows functions registered
- [ ] Twilio Video room creation works (test with a match)

## License

Private. All rights reserved.
