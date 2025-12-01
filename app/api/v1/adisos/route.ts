import { NextRequest, NextResponse } from 'next/server';
import { getAdisosFromSupabase } from '@/lib/supabase';
import { requireApiKey } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  // Verificar API Key
  const authError = await requireApiKey(request);
  if (authError) {
    return authError;
  }
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoria = searchParams.get('categoria');
    const activos = searchParams.get('activos') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const buscar = searchParams.get('buscar') || '';
    
    // Validar límite
    if (limit > 1000) {
      return NextResponse.json(
        { error: 'El límite máximo es 1000' },
        { status: 400 }
      );
    }
    
    // Obtener anuncios
    const adisos = await getAdisosFromSupabase({
      limit,
      offset,
      soloActivos: activos
    });
    
    // Filtrar por categoría si se especifica
    let adisosFiltrados = adisos;
    if (categoria) {
      adisosFiltrados = adisos.filter(a => a.categoria === categoria);
    }
    
    // Filtrar por búsqueda si se especifica
    if (buscar) {
      const busquedaLower = buscar.toLowerCase();
      adisosFiltrados = adisosFiltrados.filter(a => 
        a.titulo.toLowerCase().includes(busquedaLower) ||
        a.descripcion?.toLowerCase().includes(busquedaLower) ||
        (typeof a.ubicacion === 'string' && a.ubicacion.toLowerCase().includes(busquedaLower))
      );
    }
    
    return NextResponse.json({
      data: adisosFiltrados,
      paginacion: {
        total: adisosFiltrados.length,
        limit,
        offset,
        hasMore: adisosFiltrados.length === limit
      }
    });
  } catch (error: any) {
    console.error('Error en API v1/adisos:', error);
    return NextResponse.json(
      { error: 'Error al obtener anuncios' },
      { status: 500 }
    );
  }
}

