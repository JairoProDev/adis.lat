import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase no está configurado' },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener feedbacks:', error);
      return NextResponse.json(
        { error: 'Error al obtener feedbacks' },
        { status: 500 }
      );
    }

    // Calcular estadísticas
    const total = data?.length || 0;
    const sugerencias = data?.filter(f => f.tipo === 'sugerencia').length || 0;
    const problemas = data?.filter(f => f.tipo === 'problema').length || 0;
    const noLeidos = data?.filter(f => !f.leido).length || 0;
    const leidos = data?.filter(f => f.leido).length || 0;

    return NextResponse.json({
      feedbacks: data || [],
      estadisticas: {
        total,
        sugerencias,
        problemas,
        noLeidos,
        leidos
      }
    });
  } catch (error: any) {
    console.error('Error en API de admin feedback:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

