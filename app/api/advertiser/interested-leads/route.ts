import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { matchInterestedUsers } from '@/lib/matching/server';

export async function GET(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: adisos } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, descripcion, categoria')
    .eq('user_id', user.id)
    .eq('esta_activo', true)
    .order('fecha_publicacion', { ascending: false })
    .limit(5);

  const leads: {
    userId: string;
    matchScore: number;
    reasons: string[];
    lastActiveAt?: string;
    adisoId?: string;
    adisoTitle?: string;
  }[] = [];

  for (const adiso of adisos || []) {
    const interested = await matchInterestedUsers(
      {
        categoria: adiso.categoria,
        titulo: adiso.titulo,
        descripcion: adiso.descripcion || '',
      },
      20
    );

    for (const u of interested) {
      leads.push({
        userId: u.userId,
        matchScore: u.matchScore,
        reasons: u.matchReasons,
        lastActiveAt: u.lastActiveAt,
        adisoId: adiso.id,
        adisoTitle: adiso.titulo,
      });
    }
  }

  leads.sort((a, b) => b.matchScore - a.matchScore);

  return NextResponse.json({ leads: leads.slice(0, 30) });
}
