import { NextRequest, NextResponse } from 'next/server';

const HEADER = 'x-adis-debug-secret';

/**
 * Protege rutas de diagnóstico que usan service role u operaciones sensibles.
 *
 * - Producción sin ADMIN_DEBUG_SECRET: 404 (no revela que la ruta existe).
 * - Producción con secret: exige cabecera x-adis-debug-secret igual al valor.
 * - Desarrollo: permite acceso; si ADMIN_DEBUG_SECRET está definido, también exige la cabecera.
 */
export function guardDebugRoute(request: NextRequest): NextResponse | null {
  const secret = process.env.ADMIN_DEBUG_SECRET?.trim();
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && !secret) {
    return new NextResponse(null, { status: 404 });
  }

  const mustVerify = isProd || !!secret;
  if (!mustVerify) {
    return null;
  }

  const provided =
    request.headers.get(HEADER)?.trim() ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  return null;
}
