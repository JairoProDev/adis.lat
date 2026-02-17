import { NextRequest, NextResponse } from 'next/server';
import { createAdisoGratuitoInSupabase, getAdisosGratuitosFromSupabase } from '@/lib/supabase';
import { generarIdUnico } from '@/lib/utils';
import { AdisoGratuito } from '@/types';
import { createAdisoGratuitoSchema, sanitizeText } from '@/lib/validations';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Rate limiting para GET
  const ip = getClientIP(request);
  const limitResult = rateLimit(`get-adisos-gratuitos-${ip}`, {
    windowMs: 60 * 1000,
    maxRequests: 120,
  });

  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Por favor intenta más tarde.' },
      { status: 429 }
    );
  }
  try {
    const adisos = await getAdisosGratuitosFromSupabase();
    return NextResponse.json(adisos, { status: 200 });
  } catch (error: any) {
    // Solo log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('Error al obtener adisos gratuitos:', error);
    }

    // Si la tabla no existe aún (error de tabla no encontrada), retornar array vacío
    // Esto permite que la funcionalidad funcione aunque la tabla no esté creada
    if (
      (error?.message?.includes('relation') && error?.message?.includes('does not exist')) ||
      error?.code === 'PGRST204' ||
      error?.code === '42P01' ||
      error?.message?.includes('tabla') ||
      error?.message?.includes('table')
    ) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Tabla de adisos gratuitos no existe aún, retornando array vacío');
      }
      return NextResponse.json([], { status: 200 });
    }

    // Si es un error de conexión real, retornar 503
    if (error?.message?.includes('timeout') ||
      error?.message?.includes('fetch failed') ||
      error?.message?.includes('network') ||
      error?.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'Error de conexión con Supabase. Verifica tu conexión y las credenciales.' },
        { status: 503 }
      );
    }

    // Para otros errores (incluyendo RLS), retornar array vacío en lugar de error
    // Esto evita que la UI se rompa si hay problemas menores de configuración
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error al obtener adisos gratuitos, retornando array vacío:', error?.message);
    }
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  // Rate limiting más estricto para POST (adisos gratuitos)
  const ip = getClientIP(request);
  const limitResult = rateLimit(`post-adisos-gratuitos-${ip}`, {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 5, // Solo 5 adisos gratuitos por hora por IP
  });

  if (!limitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Has alcanzado el límite de adisos gratuitos. Por favor espera antes de crear otro.',
        retryAfter: Math.ceil((limitResult.resetTime - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((limitResult.resetTime - Date.now()) / 1000).toString(),
        }
      }
    );
  }

  try {
    const body = await request.json();

    // Validar y sanitizar entrada con zod
    const validationResult = createAdisoGratuitoSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Datos de entrada inválidos',
          details: validationResult.error.issues.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Sanitizar campos de texto
    const sanitizedData = {
      ...validatedData,
      titulo: sanitizeText(validatedData.titulo),
      contacto: sanitizeText(validatedData.contacto),
    };

    const ahora = new Date();
    const fechaCreacion = ahora.toISOString();
    const fechaExpiracion = new Date(ahora.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 1 día después

    const nuevoAdiso: AdisoGratuito = {
      id: generarIdUnico(),
      categoria: sanitizedData.categoria,
      titulo: sanitizedData.titulo,
      contacto: sanitizedData.contacto,
      fechaCreacion,
      fechaExpiracion
    };

    const adisoCreado = await createAdisoGratuitoInSupabase(nuevoAdiso);

    return NextResponse.json(adisoCreado, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear adiso gratuito:', error);

    let errorMessage = 'Error al crear adiso gratuito';
    let statusCode = 500;

    if (error?.message?.includes('políticas de seguridad') || error?.message?.includes('permission denied')) {
      errorMessage = 'Las políticas de seguridad no están configuradas. Ejecuta el SQL de seguridad en Supabase.';
      statusCode = 403;
    } else if (error?.message?.includes('timeout') || error?.message?.includes('fetch failed')) {
      errorMessage = 'Error de conexión con Supabase. Verifica tu conexión y las credenciales.';
      statusCode = 503;
    }

    return NextResponse.json(
      { error: errorMessage, details: error?.message },
      { status: statusCode }
    );
  }
}

