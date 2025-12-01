import { NextRequest, NextResponse } from 'next/server';
import { procesarNotificacionesPendientes } from '@/lib/notificaciones';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const minimoIntereses = body.minimoIntereses || 3;
    
    const resultado = await procesarNotificacionesPendientes(minimoIntereses);
    
    return NextResponse.json({
      success: true,
      notificados: resultado.notificados,
      errores: resultado.errores
    });
  } catch (error: any) {
    console.error('Error en notificar-anunciante:', error);
    return NextResponse.json(
      { error: 'Error al procesar notificaciones' },
      { status: 500 }
    );
  }
}

