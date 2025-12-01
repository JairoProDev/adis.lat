/**
 * Script para generar datos TOON (Token Oriented Object Notation) de anuncios
 * 
 * TOON es un formato optimizado para búsquedas semánticas del chatbot
 * 
 * Uso:
 *   npx ts-node scripts/generar-toon.ts [--adiso-id ID_ESPECIFICO] [--todos]
 */

import { supabase } from '@/lib/supabase';
import { Adiso } from '@/types';

interface TokenToon {
  tipo: 'entidad' | 'atributo' | 'valor' | 'relacion';
  valor: string;
  contexto?: string;
  peso?: number;
}

function generarTOON(adiso: Adiso): string {
  const tokens: TokenToon[] = [];
  
  // Entidad principal
  tokens.push({
    tipo: 'entidad',
    valor: 'anuncio',
    peso: 10
  });
  
  // Categoría
  tokens.push({
    tipo: 'atributo',
    valor: 'categoria',
    contexto: adiso.categoria,
    peso: 9
  });
  tokens.push({
    tipo: 'valor',
    valor: adiso.categoria,
    contexto: 'categoria',
    peso: 8
  });
  
  // Título (palabras clave)
  const palabrasTitulo = adiso.titulo.toLowerCase()
    .split(/\s+/)
    .filter(p => p.length > 3)
    .slice(0, 10); // Máximo 10 palabras clave
  
  palabrasTitulo.forEach(palabra => {
    tokens.push({
      tipo: 'valor',
      valor: palabra,
      contexto: 'titulo',
      peso: 7
    });
  });
  
  // Descripción (extraer palabras clave importantes)
  const palabrasDescripcion = adiso.descripcion
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(p => p.length > 4)
    .filter(p => !['para', 'con', 'del', 'las', 'los', 'una', 'uno', 'este', 'esta'].includes(p))
    .slice(0, 20); // Máximo 20 palabras clave
  
  palabrasDescripcion.forEach(palabra => {
    tokens.push({
      tipo: 'valor',
      valor: palabra,
      contexto: 'descripcion',
      peso: 5
    });
  });
  
  // Ubicación
  if (typeof adiso.ubicacion === 'string') {
    const ubicacionTokens = adiso.ubicacion.toLowerCase().split(/[,\s]+/);
    ubicacionTokens.forEach(token => {
      if (token.length > 2) {
        tokens.push({
          tipo: 'valor',
          valor: token,
          contexto: 'ubicacion',
          peso: 6
        });
      }
    });
  } else if (adiso.ubicacion && typeof adiso.ubicacion === 'object') {
    const ubi = adiso.ubicacion as any;
    if (ubi.distrito) {
      tokens.push({
        tipo: 'valor',
        valor: ubi.distrito.toLowerCase(),
        contexto: 'distrito',
        peso: 7
      });
    }
    if (ubi.provincia) {
      tokens.push({
        tipo: 'valor',
        valor: ubi.provincia.toLowerCase(),
        contexto: 'provincia',
        peso: 6
      });
    }
    if (ubi.departamento) {
      tokens.push({
        tipo: 'valor',
        valor: ubi.departamento.toLowerCase(),
        contexto: 'departamento',
        peso: 6
      });
    }
  }
  
  // Contactos (solo tipo, no valores por privacidad)
  if (adiso.contactosMultiples && adiso.contactosMultiples.length > 0) {
    adiso.contactosMultiples.forEach(contacto => {
      tokens.push({
        tipo: 'atributo',
        valor: `contacto_${contacto.tipo}`,
        peso: 3
      });
    });
  }
  
  // Tamaño
  if (adiso.tamaño) {
    tokens.push({
      tipo: 'atributo',
      valor: 'tamaño',
      contexto: adiso.tamaño,
      peso: 4
    });
  }
  
  // Fecha (solo año y mes para búsquedas temporales)
  if (adiso.fechaPublicacion) {
    const fecha = new Date(adiso.fechaPublicacion);
    tokens.push({
      tipo: 'valor',
      valor: fecha.getFullYear().toString(),
      contexto: 'año',
      peso: 3
    });
    tokens.push({
      tipo: 'valor',
      valor: (fecha.getMonth() + 1).toString(),
      contexto: 'mes',
      peso: 2
    });
  }
  
  // Convertir a formato TOON string
  // Formato: tipo:valor:contexto:peso|tipo:valor:contexto:peso|...
  const toonString = tokens
    .map(t => `${t.tipo}:${t.valor}${t.contexto ? ':' + t.contexto : ''}${t.peso ? ':' + t.peso : ''}`)
    .join('|');
  
  return toonString;
}

async function generarTOONParaAnuncio(adisoId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  // Obtener anuncio
  const { data: adisoData, error: fetchError } = await supabase
    .from('adisos')
    .select('*')
    .eq('id', adisoId)
    .single();
  
  if (fetchError || !adisoData) {
    throw new Error(`Anuncio no encontrado: ${adisoId}`);
  }
  
  // Convertir a Adiso
  const { dbToAdiso } = await import('@/lib/supabase');
  const adiso = dbToAdiso(adisoData);
  
  // Generar TOON
  const contenidoToon = generarTOON(adiso);
  
  // Insertar o actualizar en BD
  const { error: upsertError } = await supabase
    .from('datos_toon_anuncios')
    .upsert({
      adiso_id: adisoId,
      contenido_toon: contenidoToon,
      fecha_actualizacion: new Date().toISOString()
    }, {
      onConflict: 'adiso_id'
    });
  
  if (upsertError) {
    throw new Error(`Error al guardar TOON: ${upsertError.message}`);
  }
}

async function generarTOONParaTodos(): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  console.log('Obteniendo todos los anuncios...');
  
  // Obtener todos los anuncios en batches
  let offset = 0;
  const limit = 1000;
  let totalProcesados = 0;
  
  while (true) {
    const { data: adisosData, error } = await supabase
      .from('adisos')
      .select('*')
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw new Error(`Error al obtener anuncios: ${error.message}`);
    }
    
    if (!adisosData || adisosData.length === 0) {
      break;
    }
    
    console.log(`Procesando batch: ${offset + 1} - ${offset + adisosData.length}`);
    
    const { dbToAdiso } = await import('../lib/supabase');
    
    for (const adisoData of adisosData) {
      try {
        const adiso = dbToAdiso(adisoData);
        const contenidoToon = generarTOON(adiso);
        
        await supabase
          .from('datos_toon_anuncios')
          .upsert({
            adiso_id: adiso.id,
            contenido_toon: contenidoToon,
            fecha_actualizacion: new Date().toISOString()
          }, {
            onConflict: 'adiso_id'
          });
        
        totalProcesados++;
        
        if (totalProcesados % 100 === 0) {
          console.log(`  Procesados: ${totalProcesados}`);
        }
      } catch (error: any) {
        console.error(`  Error al procesar ${adisoData.id}:`, error.message);
      }
    }
    
    if (adisosData.length < limit) {
      break;
    }
    
    offset += limit;
  }
  
  console.log(`Total procesado: ${totalProcesados} anuncios`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Error: Variables de entorno de Supabase no configuradas');
    process.exit(1);
  }
  
  const adisoIdIndex = args.indexOf('--adiso-id');
  const todos = args.includes('--todos');
  
  try {
    if (adisoIdIndex >= 0 && args[adisoIdIndex + 1]) {
      const adisoId = args[adisoIdIndex + 1];
      console.log(`Generando TOON para anuncio: ${adisoId}`);
      await generarTOONParaAnuncio(adisoId);
      console.log('✓ TOON generado exitosamente');
    } else if (todos) {
      console.log('Generando TOON para todos los anuncios...');
      await generarTOONParaTodos();
      console.log('✓ Proceso completado');
    } else {
      console.error('Uso: npx ts-node scripts/generar-toon.ts [--adiso-id ID] [--todos]');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { generarTOON, generarTOONParaAnuncio, generarTOONParaTodos };

