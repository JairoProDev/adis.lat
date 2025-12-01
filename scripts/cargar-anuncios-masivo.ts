/**
 * Script para cargar anuncios procesados a Supabase en chunks
 * 
 * Uso:
 *   npx ts-node scripts/cargar-anuncios-masivo.ts <ruta-json-anuncios> [--chunk-size 1000]
 * 
 * Requiere variables de entorno:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import * as fs from 'fs';
import * as path from 'path';
import { createAdisoInSupabase } from '@/lib/supabase';
import { Adiso, ContactoMultiple } from '@/types';
import { ResultadoProcesamiento, AnuncioExtraido } from './procesar-con-llm';

// Mapeo de ediciones a fechas (ajustar según tus datos)
const MAPA_EDICIONES_FECHAS: Record<string, string> = {
  // Ejemplo: '2587': '2024-12-16'
  // Agregar más según necesites
};

function calcularFechaPublicacion(edicionNumero: string, fechaMencionada?: string): string {
  // Si hay fecha mencionada en el anuncio, usarla
  if (fechaMencionada) {
    return fechaMencionada;
  }
  
  // Si hay mapeo de edición a fecha, usarlo
  if (MAPA_EDICIONES_FECHAS[edicionNumero]) {
    return MAPA_EDICIONES_FECHAS[edicionNumero];
  }
  
  // Por defecto, usar fecha actual (para anuncios históricos, esto debería ajustarse)
  return new Date().toISOString().split('T')[0];
}

function calcularFechaExpiracion(fechaPublicacion: string, tamañoVisual: string): string {
  const fecha = new Date(fechaPublicacion);
  
  // Días de expiración según tamaño (para anuncios históricos, ya expiraron)
  // Pero calculamos la fecha original de expiración
  const diasExpiracion: Record<string, number> = {
    miniatura: 7,
    pequeño: 14,
    mediano: 21,
    grande: 30,
    gigante: 45
  };
  
  const dias = diasExpiracion[tamañoVisual] || 14;
  fecha.setDate(fecha.getDate() + dias);
  
  return fecha.toISOString();
}

function convertirAnuncioExtraido(
  anuncio: AnuncioExtraido,
  edicionNumero: string,
  fechaPublicacionOriginal: string
): Adiso {
  // Generar ID único
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const id = `rueda-negocios-${edicionNumero}-${timestamp}-${random}`;
  
  // Convertir contactos múltiples
  const contactosMultiples: ContactoMultiple[] = anuncio.contactos.map((c, index) => ({
    tipo: c.tipo,
    valor: c.valor,
    principal: c.principal || index === 0,
    etiqueta: c.etiqueta
  }));
  
  // Si no hay contactos múltiples pero hay contacto principal, crear uno
  if (contactosMultiples.length === 0 && anuncio.contactos.length > 0) {
    contactosMultiples.push({
      tipo: anuncio.contactos[0].tipo,
      valor: anuncio.contactos[0].valor,
      principal: true
    });
  }
  
  // Determinar contacto principal para el campo contacto (compatibilidad)
  const contactoPrincipal = contactosMultiples.find(c => c.principal) || contactosMultiples[0];
  const contactoString = contactoPrincipal?.valor || '';
  
  // Calcular fechas
  const fechaPublicacion = calcularFechaPublicacion(edicionNumero, anuncio.fecha_publicacion);
  const fechaExpiracion = calcularFechaExpiracion(fechaPublicacion, anuncio.tamaño_visual);
  
  return {
    id,
    categoria: anuncio.categoria as any,
    titulo: anuncio.titulo.substring(0, 100), // Asegurar máximo 100 caracteres
    descripcion: anuncio.descripcion.substring(0, 2000), // Asegurar máximo 2000 caracteres
    contacto: contactoString,
    ubicacion: anuncio.ubicacion || 'Cusco, Cusco, Cusco',
    fechaPublicacion,
    horaPublicacion: '00:00',
    tamaño: anuncio.tamaño_visual,
    esHistorico: true,
    fuenteOriginal: 'rueda_negocios',
    edicionNumero,
    fechaPublicacionOriginal,
    estaActivo: false, // Todos los históricos inician como inactivos
    fechaExpiracion,
    contactosMultiples: contactosMultiples.length > 0 ? contactosMultiples : undefined
  };
}

async function cargarChunk(anuncios: Adiso[], chunkNum: number, totalChunks: number): Promise<{ exitosos: number; errores: number }> {
  let exitosos = 0;
  let errores = 0;
  
  console.log(`  Cargando chunk ${chunkNum}/${totalChunks} (${anuncios.length} anuncios)...`);
  
  for (let i = 0; i < anuncios.length; i++) {
    try {
      await createAdisoInSupabase(anuncios[i]);
      exitosos++;
      
      if ((i + 1) % 100 === 0) {
        console.log(`    Progreso: ${i + 1}/${anuncios.length} anuncios cargados`);
      }
    } catch (error: any) {
      errores++;
      console.error(`    Error al cargar anuncio ${anuncios[i].id}:`, error.message);
    }
  }
  
  return { exitosos, errores };
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Uso: npx ts-node scripts/cargar-anuncios-masivo.ts <ruta-json-anuncios> [--chunk-size 1000]');
    process.exit(1);
  }

  const rutaEntrada = args[0];
  const chunkSizeIndex = args.indexOf('--chunk-size');
  const chunkSize = chunkSizeIndex >= 0 && args[chunkSizeIndex + 1]
    ? parseInt(args[chunkSizeIndex + 1], 10)
    : 1000;

  console.log('=== Carga Masiva de Anuncios ===');
  console.log(`Archivo entrada: ${rutaEntrada}`);
  console.log(`Tamaño de chunk: ${chunkSize}`);
  console.log('');

  if (!fs.existsSync(rutaEntrada)) {
    console.error(`Error: El archivo ${rutaEntrada} no existe`);
    process.exit(1);
  }

  // Verificar variables de entorno
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Error: Variables de entorno de Supabase no configuradas');
    console.error('Necesitas: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  try {
    const resultados: ResultadoProcesamiento[] = JSON.parse(fs.readFileSync(rutaEntrada, 'utf-8'));
    console.log(`Cargados ${resultados.length} resultados de procesamiento`);
    
    // Convertir todos los anuncios
    const anuncios: Adiso[] = [];
    for (const resultado of resultados) {
      if (resultado.error) {
        console.warn(`⚠ Omitiendo página ${resultado.pagina} (edición ${resultado.edicion}): ${resultado.error}`);
        continue;
      }
      
      for (const anuncioExtraido of resultado.anuncios) {
        try {
          const adiso = convertirAnuncioExtraido(
            anuncioExtraido,
            resultado.edicion,
            calcularFechaPublicacion(resultado.edicion, anuncioExtraido.fecha_publicacion)
          );
          anuncios.push(adiso);
        } catch (error: any) {
          console.error(`Error al convertir anuncio:`, error.message);
        }
      }
    }
    
    console.log(`Total de anuncios a cargar: ${anuncios.length}`);
    console.log('');
    
    // Dividir en chunks
    const chunks: Adiso[][] = [];
    for (let i = 0; i < anuncios.length; i += chunkSize) {
      chunks.push(anuncios.slice(i, i + chunkSize));
    }
    
    console.log(`Divididos en ${chunks.length} chunks de máximo ${chunkSize} anuncios`);
    console.log('');
    
    // Cargar cada chunk
    let totalExitosos = 0;
    let totalErrores = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const resultado = await cargarChunk(chunks[i], i + 1, chunks.length);
      totalExitosos += resultado.exitosos;
      totalErrores += resultado.errores;
      
      // Pausa entre chunks para no saturar
      if (i < chunks.length - 1) {
        console.log(`  Pausa de 2 segundos antes del siguiente chunk...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('');
    console.log('=== Resumen Final ===');
    console.log(`✓ Anuncios cargados exitosamente: ${totalExitosos}`);
    console.log(`✗ Errores: ${totalErrores}`);
    console.log(`Total procesado: ${totalExitosos + totalErrores}`);
  } catch (error: any) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { convertirAnuncioExtraido, cargarChunk };

