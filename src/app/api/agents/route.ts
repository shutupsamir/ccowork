import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const createSchema = z.object({
  name: z.string().min(1).max(50),
  provider: z.enum(['ANTHROPIC', 'OPENAI']),
  model: z.string().min(1),
  systemPrompt: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional(),
  capabilities: z
    .array(z.enum(['CHAT', 'CODE_REVIEW', 'BRAINSTORM', 'ACCOUNTABILITY']))
    .default([]),
});

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agents = await prisma.agent.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ agents });
  } catch (err) {
    console.error('[GET /api/agents]', err);
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
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Limit to 5 agents per user
    const count = await prisma.agent.count({ where: { ownerId: userId } });
    if (count >= 5) {
      return NextResponse.json(
        { error: 'Maximum of 5 agents allowed' },
        { status: 409 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        ownerId: userId,
        ...parsed.data,
      },
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/agents]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
