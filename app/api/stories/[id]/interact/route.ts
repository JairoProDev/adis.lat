import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import {
  recordStoryInteractionServer,
  toggleStoryFavoriteServer,
} from '@/lib/stories/server';
import { StoryInteractionType } from '@/types';

const bodySchema = z.object({
  type: z.enum([
    'view',
    'cta_click',
    'whatsapp_click',
    'chat_open',
    'favorite',
    'share',
  ]),
  toggleFavorite: z.boolean().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromRouteRequest(request);
    const { id: storyId } = await params;

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    const interactionType = parsed.data.type as StoryInteractionType;

    if (interactionType === 'favorite' && parsed.data.toggleFavorite && user?.id) {
      const favorited = await toggleStoryFavoriteServer(user.id, storyId);
      return NextResponse.json({ success: true, favorited });
    }

    await recordStoryInteractionServer(storyId, interactionType, user?.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[api/stories/interact]', e);
    return NextResponse.json({ error: 'Error al registrar interacción' }, { status: 500 });
  }
}
