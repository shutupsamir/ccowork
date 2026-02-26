import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { ensureDbUser } from '@/lib/auth';
import { createMatchRequest } from '@/lib/matchmaking';
import { checkRateLimit } from '@/lib/rate-limit';
import { currentUser } from '@clerk/nextjs/server';

const bodySchema = z.object({
  durationMinutes: z.union([z.literal(25), z.literal(50)]),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 20 requests per minute per user
    const rateCheck = checkRateLimit(userId, 20, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Ensure DB user exists
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Could not resolve user' },
        { status: 401 }
      );
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json(
        { error: 'User has no email address' },
        { status: 400 }
      );
    }

    const name = clerkUser.firstName
      ? `${clerkUser.firstName}${clerkUser.lastName ? ` ${clerkUser.lastName}` : ''}`
      : null;

    await ensureDbUser(userId, email, name);

    const matchRequest = await createMatchRequest(
      userId,
      parsed.data.durationMinutes
    );

    return NextResponse.json({ matchRequest }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';

    // Known business logic errors
    if (
      message.includes('active search') ||
      message.includes('Daily limit')
    ) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    console.error('[POST /api/match/start]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
