import { NextRequest, NextResponse } from 'next/server';
import { buscarEnTOON, buscarMultiplesTerminos } from '@/lib/busqueda-toon';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { consulta, limite = 10, terminos } = body;
    
    if (!consulta && !terminos) {
      return NextResponse.json(
        { error: 'Se requiere "consulta" o "terminos"' },
        { status: 400 }
      );
    }
    
    let resultados;
    
    if (terminos && Array.isArray(terminos)) {
      resultados = await buscarMultiplesTerminos(terminos, limite);
    } else {
      resultados = await buscarEnTOON(consulta, limite);
    }
    
    return NextResponse.json({
      success: true,
      resultados: resultados.map(adiso => ({
        id: adiso.id,
        titulo: adiso.titulo,
        categoria: adiso.categoria,
        descripcion: adiso.descripcion?.substring(0, 200), // Limitar para respuesta
        ubicacion: typeof adiso.ubicacion === 'string' 
          ? adiso.ubicacion 
          : `${adiso.ubicacion.distrito}, ${adiso.ubicacion.provincia}`,
        fechaPublicacion: adiso.fechaPublicacion,
        estaActivo: adiso.estaActivo
      })),
      total: resultados.length
    });
  } catch (error: any) {
    console.error('Error en chatbot/buscar:', error);
    return NextResponse.json(
      { error: 'Error al buscar anuncios' },
      { status: 500 }
    );
  }
}

