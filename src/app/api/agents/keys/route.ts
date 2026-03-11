import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/agents/encryption';

const storeKeySchema = z.object({
  provider: z.enum(['ANTHROPIC', 'OPENAI']),
  apiKey: z.string().min(10),
  label: z.string().max(50).optional(),
});

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keys = await prisma.agentApiKey.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        label: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ keys });
  } catch (err) {
    console.error('[GET /api/agents/keys]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = storeKeySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { provider, apiKey, label } = parsed.data;
    const { encrypted, iv } = encrypt(apiKey);

    const key = await prisma.agentApiKey.upsert({
      where: {
        userId_provider: { userId, provider },
      },
      update: {
        encryptedKey: encrypted,
        iv,
        label: label ?? null,
      },
      create: {
        userId,
        provider,
        encryptedKey: encrypted,
        iv,
        label: label ?? null,
      },
      select: {
        id: true,
        provider: true,
        label: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ key }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/agents/keys]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
