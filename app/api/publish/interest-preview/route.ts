import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { matchInterestedUsers } from '@/lib/matching/server';

const querySchema = z.object({
  categoria: z.string().min(1),
  titulo: z.string().min(1).max(300),
  descripcion: z.string().max(5000).optional(),
  ubicacion: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const limited = rateLimit(`interest-preview-${ip}`, { windowMs: 60_000, maxRequests: 40 });
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const params = request.nextUrl.searchParams;
  const parsed = querySchema.safeParse({
    categoria: params.get('categoria'),
    titulo: params.get('titulo'),
    descripcion: params.get('descripcion') || '',
    ubicacion: params.get('ubicacion') || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid draft params' }, { status: 400 });
  }

  try {
    const { categoria, titulo, descripcion, ubicacion } = parsed.data;
    const interested = await matchInterestedUsers(
      {
        categoria,
        titulo,
        descripcion: descripcion || '',
        ubicacion: ubicacion ? { label: ubicacion } : {},
      },
      50
    );

    return NextResponse.json({
      count: interested.length,
      interested: interested.slice(0, 10).map((u) => ({
        matchScore: Math.round(u.matchScore * 100),
        reasons: u.matchReasons,
        hint: u.queryHint,
        locationHint: u.locationHint,
        lastActiveAt: u.lastActiveAt,
      })),
      message:
        interested.length > 0
          ? `${interested.length} personas podrían estar interesadas en tu oferta`
          : 'Aún estamos detectando demanda para esta categoría',
    });
  } catch (e) {
    console.error('[interest-preview]', e);
    return NextResponse.json({ count: 0, interested: [], message: 'Preview no disponible' });
  }
}
