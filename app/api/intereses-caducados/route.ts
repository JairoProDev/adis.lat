import { NextRequest, NextResponse } from 'next/server';
import { registrarInteresAnuncioCaducado } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adisoId, contactoUsuario, mensaje } = body;

    // Validar datos de entrada
    if (!adisoId || !contactoUsuario) {
      return NextResponse.json(
        { error: 'adisoId y contactoUsuario son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de contacto (debe ser un número de teléfono o email válido)
    const contactoRegex = /^(\+?[1-9]\d{8,14}|[^\s@]+@[^\s@]+\.[^\s@]+)$/;
    if (!contactoRegex.test(contactoUsuario)) {
      return NextResponse.json(
        { error: 'Formato de contacto inválido' },
        { status: 400 }
      );
    }

    // Registrar interés
    const interes = await registrarInteresAnuncioCaducado(
      adisoId,
      undefined, // usuarioId - puede ser undefined si no está autenticado
      contactoUsuario,
      mensaje || undefined
    );

    return NextResponse.json({
      success: true,
      interes: {
        id: interes.id,
        adisoId: interes.adisoId,
        fechaInteres: interes.fechaInteres
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error al registrar interés:', error);
    
    // Errores específicos
    if (error.message?.includes('no está configurado')) {
      return NextResponse.json(
        { error: 'Servicio no configurado' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Error al registrar interés. Por favor, intenta nuevamente.' },
      { status: 500 }
    );
  }
}





