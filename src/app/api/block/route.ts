import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const bodySchema = z.object({
  blockedUserId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { blockedUserId } = parsed.data;

    if (blockedUserId === userId) {
      return NextResponse.json(
        { error: 'You cannot block yourself' },
        { status: 400 }
      );
    }

    // Verify the blocked user exists
    const blockedUser = await prisma.user.findUnique({
      where: { id: blockedUserId },
    });

    if (!blockedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Upsert to handle idempotent block requests
    await prisma.userBlocklist.upsert({
      where: {
        userId_blockedUserId: { userId, blockedUserId },
      },
      update: {},
      create: { userId, blockedUserId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/block]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
