import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeItemImage } from '@/actions/ai-vision';
import { hasOpenAIKey } from '@/lib/ai/openai-client';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { Categoria } from '@/types';

const bodySchema = z.object({
  image: z.string().min(32),
});

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const limit = rateLimit(`visual-search-${ip}`, { windowMs: 60_000, maxRequests: 15 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Demasiadas búsquedas visuales. Espera un momento.' }, { status: 429 });
  }

  try {
    const body = bodySchema.parse(await request.json());
    const image = body.image.trim();

    if (!image.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Formato de imagen no válido' }, { status: 400 });
    }

    if (!hasOpenAIKey()) {
      return NextResponse.json(
        {
          ok: false,
          fallback: true,
          message: 'Búsqueda visual con IA no está configurada en este entorno.',
        },
        { status: 503 }
      );
    }

    const analysis = await analyzeItemImage(image);
    const tags = (analysis.searchTags || []).slice(0, 4);
    const queryParts = [analysis.title, analysis.brand, analysis.model, ...tags].filter(Boolean);
    const query = [...new Set(queryParts.join(' ').split(/\s+/))].slice(0, 8).join(' ');

    return NextResponse.json({
      ok: true,
      query: query || analysis.title,
      category: analysis.category as Categoria,
      hint: analysis.suggestedDescription?.slice(0, 120),
    });
  } catch (error: unknown) {
    console.error('visual-search error:', error);
    return NextResponse.json(
      { ok: false, error: 'No pudimos analizar la imagen. Prueba con otra foto más clara.' },
      { status: 500 }
    );
  }
}
