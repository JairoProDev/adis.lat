import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getUserStoriesServer } from '@/lib/stories/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const archivedOnly = request.nextUrl.searchParams.get('archived') === 'true';
    const stories = await getUserStoriesServer(user.id, true);
    const filtered = archivedOnly
      ? stories.filter((s) => s.status === 'archived')
      : stories;

    return NextResponse.json({ stories: filtered });
  } catch (e) {
    console.error('[api/stories/mine]', e);
    return NextResponse.json({ error: 'Error al cargar historias' }, { status: 500 });
  }
}
