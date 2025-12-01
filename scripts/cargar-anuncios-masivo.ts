/**
 * Script para cargar anuncios procesados a Supabase en chunks
 * 
 * Uso:
 *   npx ts-node scripts/cargar-anuncios-masivo.ts <ruta-json-anuncios> [--chunk-size 500]
 * 
 * Requiere variables de entorno:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

interface Contacto {
  tipo: 'telefono' | 'whatsapp' | 'email';
  valor: string;
  principal?: boolean;
  etiqueta?: string;
}

interface AnuncioConsolidado {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  contactos: Contacto[];
  ubicacion: string;
  tamaño_visual: string;
  precio?: string;
  edicion: string;
  pagina: number;
  fuente_original: string;
  fecha_publicacion_original: string;
  es_historico: boolean;
  esta_activo: boolean;
}

interface ResultadoConsolidado {
  fechaConsolidacion: string;
  totalAnuncios: number;
  porCategoria: { [key: string]: number };
  porEdicion: { [key: string]: number };
  anuncios: AnuncioConsolidado[];
}

// Mapeo de tamaño visual a días de expiración
const DIAS_EXPIRACION: Record<string, number> = {
  miniatura: 7,
  pequeño: 14,
  mediano: 21,
  grande: 30,
  gigante: 45
};

/**
 * Calcula la fecha de expiración basada en la fecha de publicación y tamaño
 */
function calcularFechaExpiracion(fechaPublicacion: string, tamañoVisual: string): string {
  const fecha = new Date(fechaPublicacion);
  const dias = DIAS_EXPIRACION[tamañoVisual] || 14;
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString();
}

/**
 * Convierte un anuncio consolidado al formato de la base de datos
 */
function convertirAFormatoDB(anuncio: AnuncioConsolidado): Record<string, any> {
  // Obtener contacto principal
  const contactoPrincipal = anuncio.contactos.find(c => c.principal) || anuncio.contactos[0];
  const contactoString = contactoPrincipal?.valor || '';
  
  // Calcular fecha de expiración (ya pasó para históricos)
  const fechaExpiracion = calcularFechaExpiracion(
    anuncio.fecha_publicacion_original,
    anuncio.tamaño_visual
  );
  
  // Parsear ubicación
  const partes = anuncio.ubicacion.split(',').map(s => s.trim());
  const ubicacion = {
    distrito: partes[0] || 'Cusco',
    provincia: partes[1] || 'Cusco',
    departamento: partes[2] || 'Cusco'
  };
  
  return {
    id: anuncio.id,
    categoria: anuncio.categoria,
    titulo: anuncio.titulo.substring(0, 100),
    descripcion: anuncio.descripcion.substring(0, 2000),
    contacto: contactoString,
    ubicacion: JSON.stringify(ubicacion),
    fecha_publicacion: anuncio.fecha_publicacion_original,
    hora_publicacion: '00:00',
    tamaño: anuncio.tamaño_visual,
    es_gratuito: true,
    fecha_expiracion: fechaExpiracion,
    esta_activo: false,
    es_historico: true,
    fuente_original: 'rueda_negocios',
    edicion_numero: anuncio.edicion,
    fecha_publicacion_original: anuncio.fecha_publicacion_original,
    // Guardar contactos múltiples como JSON
    contactos_multiples: anuncio.contactos.length > 0 ? JSON.stringify(anuncio.contactos) : null
  };
}

/**
 * Carga un chunk de anuncios a Supabase
 */
async function cargarChunk(
  supabase: any, 
  anuncios: Record<string, any>[], 
  chunkNum: number, 
  totalChunks: number
): Promise<{ exitosos: number; errores: number; erroresDetalle: string[] }> {
  let exitosos = 0;
  let errores = 0;
  const erroresDetalle: string[] = [];
  
  console.log(`  📦 Cargando chunk ${chunkNum}/${totalChunks} (${anuncios.length} anuncios)...`);
  
  // Insertar en batches de 50 para mejor rendimiento
  const batchSize = 50;
  for (let i = 0; i < anuncios.length; i += batchSize) {
    const batch = anuncios.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('adisos')
        .upsert(batch, { 
          onConflict: 'id',
          ignoreDuplicates: true 
        });
      
      if (error) {
        errores += batch.length;
        erroresDetalle.push(`Batch ${Math.floor(i/batchSize)}: ${error.message}`);
      } else {
        exitosos += batch.length;
      }
      
      process.stdout.write(`\r    ✓ ${Math.min(i + batchSize, anuncios.length)}/${anuncios.length} anuncios procesados`);
    } catch (error: any) {
      errores += batch.length;
      erroresDetalle.push(`Batch ${Math.floor(i/batchSize)}: ${error.message}`);
    }
  }
  
  console.log('');
  
  return { exitosos, errores, erroresDetalle };
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length < 1 || args.includes('--help')) {
    console.log(`
📤 CARGADOR MASIVO DE ANUNCIOS A SUPABASE
${'='.repeat(50)}

Uso:
  npx ts-node scripts/cargar-anuncios-masivo.ts <json-consolidado> [opciones]

Opciones:
  --chunk-size <n>  Tamaño de cada chunk (default: 500)
  --dry-run         Simular sin cargar
  --help            Mostrar ayuda

Ejemplo:
  npx ts-node scripts/cargar-anuncios-masivo.ts ./output/anuncios-consolidados.json --chunk-size 500
    `);
    process.exit(0);
  }

  const rutaEntrada = args[0];
  const chunkSizeIndex = args.indexOf('--chunk-size');
  const chunkSize = chunkSizeIndex >= 0 && args[chunkSizeIndex + 1]
    ? parseInt(args[chunkSizeIndex + 1], 10)
    : 500;
  const dryRun = args.includes('--dry-run');

  // Verificar archivo de entrada
  if (!fs.existsSync(rutaEntrada)) {
    console.error(`❌ Error: El archivo no existe: ${rutaEntrada}`);
    process.exit(1);
  }

  // Verificar variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Variables de entorno de Supabase no configuradas');
    console.error('   Necesitas: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.error('   Verifica tu archivo .env.local');
    process.exit(1);
  }

  console.log('🚀 CARGADOR MASIVO DE ANUNCIOS');
  console.log('='.repeat(50));
  console.log(`   Archivo: ${rutaEntrada}`);
  console.log(`   Chunk size: ${chunkSize}`);
  console.log(`   Modo: ${dryRun ? 'DRY RUN (simulación)' : 'PRODUCCIÓN'}`);
  console.log(`   Supabase: ${supabaseUrl.substring(0, 30)}...`);

  // Crear cliente Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Leer y parsear el archivo
  console.log('\n📖 Leyendo archivo de anuncios...');
  const contenido = fs.readFileSync(rutaEntrada, 'utf-8');
  const datos: ResultadoConsolidado = JSON.parse(contenido);

  console.log(`   ✓ ${datos.totalAnuncios} anuncios encontrados`);
  console.log(`   ✓ ${Object.keys(datos.porEdicion).length} ediciones`);

  // Convertir anuncios al formato de BD
  console.log('\n🔄 Convirtiendo anuncios al formato de BD...');
  const anunciosDB = datos.anuncios.map(convertirAFormatoDB);
  console.log(`   ✓ ${anunciosDB.length} anuncios convertidos`);

  if (dryRun) {
    console.log('\n⚠️  MODO DRY RUN - No se cargarán datos');
    console.log('   Ejecuta sin --dry-run para cargar realmente');
    
    // Mostrar muestra
    console.log('\n📋 Muestra del primer anuncio:');
    console.log(JSON.stringify(anunciosDB[0], null, 2));
    process.exit(0);
  }

  // Dividir en chunks
  const chunks: Record<string, any>[][] = [];
  for (let i = 0; i < anunciosDB.length; i += chunkSize) {
    chunks.push(anunciosDB.slice(i, i + chunkSize));
  }

  console.log(`\n📦 Divididos en ${chunks.length} chunks de máximo ${chunkSize} anuncios`);

  // Cargar cada chunk
  let totalExitosos = 0;
  let totalErrores = 0;
  const todosErrores: string[] = [];

  const tiempoInicio = Date.now();

  for (let i = 0; i < chunks.length; i++) {
    const resultado = await cargarChunk(supabase, chunks[i], i + 1, chunks.length);
    totalExitosos += resultado.exitosos;
    totalErrores += resultado.errores;
    todosErrores.push(...resultado.erroresDetalle);

    // Pausa entre chunks
    if (i < chunks.length - 1) {
      console.log(`   ⏳ Pausa de 1 segundo...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const tiempoTotal = ((Date.now() - tiempoInicio) / 1000).toFixed(1);

  // Resumen final
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(50));
  console.log(`   ✓ Anuncios cargados: ${totalExitosos}`);
  console.log(`   ✗ Errores: ${totalErrores}`);
  console.log(`   ⏱️  Tiempo total: ${tiempoTotal} segundos`);
  console.log(`   📈 Velocidad: ${(totalExitosos / parseFloat(tiempoTotal)).toFixed(0)} anuncios/segundo`);

  if (todosErrores.length > 0) {
    console.log('\n⚠️  Errores encontrados:');
    for (const error of todosErrores.slice(0, 10)) {
      console.log(`   - ${error}`);
    }
    if (todosErrores.length > 10) {
      console.log(`   ... y ${todosErrores.length - 10} errores más`);
    }
  }

  console.log('\n✅ Carga completada');
  console.log('   Verifica los anuncios en tu plataforma\n');
}

// Ejecutar
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

export { convertirAFormatoDB, cargarChunk };
