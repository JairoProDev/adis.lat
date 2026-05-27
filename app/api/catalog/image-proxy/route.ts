import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ALLOWED_HOST = /\.supabase\.co$/i;

function isAllowedImageUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return false;
    if (!ALLOWED_HOST.test(u.hostname)) return false;
    return u.pathname.includes('/storage/v1/object/');
  } catch {
    return false;
  }
}

/** Proxy de imágenes del catálogo para PDF / canvas (evita CORS en el cliente). */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url || !isAllowedImageUrl(url)) {
    return NextResponse.json({ error: 'URL no permitida' }, { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'image/*' },
      next: { revalidate: 3600 },
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Imagen no disponible' }, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error al obtener imagen' }, { status: 502 });
  }
}
