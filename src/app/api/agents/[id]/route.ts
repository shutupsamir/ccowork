import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const updateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  model: z.string().min(1).optional(),
  systemPrompt: z.string().max(2000).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  capabilities: z
    .array(z.enum(['CHAT', 'CODE_REVIEW', 'BRAINSTORM', 'ACCOUNTABILITY']))
    .optional(),
  status: z.enum(['ACTIVE', 'PAUSED']).optional(),
});

interface RouteContext {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agent = await prisma.agent.findFirst({
      where: { id: params.id, ownerId: userId },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ agent });
  } catch (err) {
    console.error('[GET /api/agents/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.agent.findFirst({
      where: { id: params.id, ownerId: userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = await prisma.agent.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json({ agent });
  } catch (err) {
    console.error('[PATCH /api/agents/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.agent.findFirst({
      where: { id: params.id, ownerId: userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    await prisma.agent.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/agents/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
