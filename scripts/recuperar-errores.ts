/**
 * Script de Recuperación de Errores
 * 
 * Reintenta la carga de anuncios que fallaron durante el procesamiento
 * 
 * Uso:
 *   npx tsx scripts/recuperar-errores.ts [--revista R2538] [--todos]
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { Adiso } from '@/types';

// Cargar variables de entorno
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AnuncioFallido {
  adiso: Adiso;
  error: string;
  intentos: number;
}

/**
 * Lee anuncios fallidos de un archivo
 */
function leerAnunciosFallidos(rutaArchivo: string): AnuncioFallido[] {
  if (!fs.existsSync(rutaArchivo)) {
    return [];
  }
  
  try {
    const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
    return JSON.parse(contenido);
  } catch (error) {
    console.error(`❌ Error al leer archivo de errores: ${error}`);
    return [];
  }
}

/**
 * Guarda anuncios fallidos en un archivo
 */
function guardarAnunciosFallidos(rutaArchivo: string, anuncios: AnuncioFallido[]): void {
  const directorio = path.dirname(rutaArchivo);
  
  if (!fs.existsSync(directorio)) {
    fs.mkdirSync(directorio, { recursive: true });
  }
  
  fs.writeFileSync(rutaArchivo, JSON.stringify(anuncios, null, 2), 'utf-8');
}

/**
 * Intenta cargar un anuncio a Supabase
 */
async function cargarAnuncio(adiso: Adiso): Promise<{ exito: boolean; error?: string }> {
  try {
    // Convertir a formato de BD
    const ubicacionString = typeof adiso.ubicacion === 'string' 
      ? adiso.ubicacion 
      : `${adiso.ubicacion.distrito}, ${adiso.ubicacion.provincia}, ${adiso.ubicacion.departamento}`;
    
    const dbData: any = {
      id: adiso.id,
      categoria: adiso.categoria,
      titulo: adiso.titulo,
      descripcion: adiso.descripcion,
      contacto: adiso.contacto,
      ubicacion: ubicacionString,
      fecha_publicacion: adiso.fechaPublicacion,
      hora_publicacion: adiso.horaPublicacion,
      tamaño: adiso.tamaño,
      es_historico: adiso.esHistorico,
      esta_activo: adiso.estaActivo,
      fuente_original: adiso.fuenteOriginal,
      edicion_numero: adiso.edicionNumero,
      fecha_publicacion_original: adiso.fechaPublicacionOriginal,
      fecha_expiracion: adiso.fechaExpiracion,
      contactos_multiples: adiso.contactosMultiples ? JSON.stringify(adiso.contactosMultiples) : null
    };
    
    // Agregar campos de ubicación detallada
    if (typeof adiso.ubicacion === 'object' && adiso.ubicacion !== null) {
      dbData.pais = adiso.ubicacion.pais;
      dbData.departamento = adiso.ubicacion.departamento;
      dbData.provincia = adiso.ubicacion.provincia;
      dbData.distrito = adiso.ubicacion.distrito;
      if (adiso.ubicacion.direccion) {
        dbData.direccion = adiso.ubicacion.direccion;
      }
      if (adiso.ubicacion.latitud !== undefined) {
        dbData.latitud = adiso.ubicacion.latitud;
      }
      if (adiso.ubicacion.longitud !== undefined) {
        dbData.longitud = adiso.ubicacion.longitud;
      }
    }
    
    const { error } = await supabase
      .from('adisos')
      .upsert(dbData, {
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (error) {
      return { exito: false, error: error.message };
    }
    
    return { exito: true };
  } catch (error: any) {
    return { exito: false, error: error.message };
  }
}

/**
 * Reintenta cargar anuncios fallidos
 */
async function recuperarAnuncios(
  anunciosFallidos: AnuncioFallido[],
  maxIntentos: number = 3
): Promise<{ exitosos: number; fallidos: AnuncioFallido[] }> {
  let exitosos = 0;
  const fallidos: AnuncioFallido[] = [];
  
  console.log(`\n🔄 Reintentando carga de ${anunciosFallidos.length} anuncios fallidos...\n`);
  
  for (let i = 0; i < anunciosFallidos.length; i++) {
    const anuncioFallido = anunciosFallidos[i];
    
    // Si ya se intentó muchas veces, saltar
    if (anuncioFallido.intentos >= maxIntentos) {
      fallidos.push(anuncioFallido);
      console.log(`  ⏭️  ${i + 1}/${anunciosFallidos.length} - ${anuncioFallido.adiso.id} (máximo de intentos alcanzado)`);
      continue;
    }
    
    // Intentar cargar
    const resultado = await cargarAnuncio(anuncioFallido.adiso);
    
    if (resultado.exito) {
      exitosos++;
      console.log(`  ✅ ${i + 1}/${anunciosFallidos.length} - ${anuncioFallido.adiso.id} cargado exitosamente`);
    } else {
      anuncioFallido.intentos++;
      anuncioFallido.error = resultado.error || 'Error desconocido';
      fallidos.push(anuncioFallido);
      console.log(`  ❌ ${i + 1}/${anunciosFallidos.length} - ${anuncioFallido.adiso.id} - ${anuncioFallido.error}`);
    }
    
    // Pequeña pausa para no sobrecargar la BD
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return { exitosos, fallidos };
}

/**
 * Busca archivos de errores en el directorio de errores
 */
function buscarArchivosErrores(): string[] {
  const rutaErrores = path.join(process.cwd(), 'output', 'errores');
  
  if (!fs.existsSync(rutaErrores)) {
    return [];
  }
  
  return fs.readdirSync(rutaErrores)
    .filter(archivo => archivo.startsWith('anuncios-fallidos-') && archivo.endsWith('.json'))
    .map(archivo => path.join(rutaErrores, archivo));
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
🔄 RECUPERADOR DE ERRORES
${'='.repeat(50)}

Uso:
  npx tsx scripts/recuperar-errores.ts [opciones]

Opciones:
  --revista <cod>   Recuperar errores de una revista específica
  --todos           Recuperar errores de todas las revistas
  --archivo <ruta>  Recuperar errores de un archivo específico
  --max-intentos <n> Máximo de intentos por anuncio (default: 3)
  --help            Mostrar ayuda

Ejemplos:
  npx tsx scripts/recuperar-errores.ts --revista R2538
  npx tsx scripts/recuperar-errores.ts --todos
  npx tsx scripts/recuperar-errores.ts --archivo output/errores/anuncios-fallidos-R2538.json
    `);
    process.exit(0);
  }
  
  const revistaIndex = args.indexOf('--revista');
  const codigoRevista = revistaIndex >= 0 && args[revistaIndex + 1] ? args[revistaIndex + 1] : null;
  const todos = args.includes('--todos');
  const archivoIndex = args.indexOf('--archivo');
  const rutaArchivo = archivoIndex >= 0 && args[archivoIndex + 1] ? args[archivoIndex + 1] : null;
  const maxIntentosIndex = args.indexOf('--max-intentos');
  const maxIntentos = maxIntentosIndex >= 0 && args[maxIntentosIndex + 1] 
    ? parseInt(args[maxIntentosIndex + 1], 10) 
    : 3;
  
  let archivos: string[] = [];
  
  if (rutaArchivo) {
    // Archivo específico
    if (!fs.existsSync(rutaArchivo)) {
      console.error(`❌ El archivo no existe: ${rutaArchivo}`);
      process.exit(1);
    }
    archivos = [rutaArchivo];
  } else if (codigoRevista) {
    // Revista específica
    const ruta = path.join(process.cwd(), 'output', 'errores', `anuncios-fallidos-${codigoRevista}.json`);
    if (fs.existsSync(ruta)) {
      archivos = [ruta];
    } else {
      console.error(`❌ No se encontró archivo de errores para ${codigoRevista}`);
      process.exit(1);
    }
  } else if (todos) {
    // Todos los archivos de errores
    archivos = buscarArchivosErrores();
    if (archivos.length === 0) {
      console.log('ℹ️  No se encontraron archivos de errores.');
      process.exit(0);
    }
  } else {
    console.error('❌ Debes especificar --revista <codigo>, --todos o --archivo <ruta>');
    process.exit(1);
  }
  
  console.log(`📁 Encontrados ${archivos.length} archivo(s) de errores\n`);
  
  let totalExitosos = 0;
  let totalFallidos = 0;
  
  for (const archivo of archivos) {
    const nombreArchivo = path.basename(archivo);
    console.log(`📄 Procesando: ${nombreArchivo}`);
    
    const anunciosFallidos = leerAnunciosFallidos(archivo);
    
    if (anunciosFallidos.length === 0) {
      console.log(`  ℹ️  No hay anuncios fallidos en este archivo.\n`);
      continue;
    }
    
    console.log(`  📊 ${anunciosFallidos.length} anuncios fallidos encontrados`);
    
    const resultado = await recuperarAnuncios(anunciosFallidos, maxIntentos);
    
    totalExitosos += resultado.exitosos;
    totalFallidos += resultado.fallidos.length;
    
    // Guardar anuncios que aún fallan
    if (resultado.fallidos.length > 0) {
      guardarAnunciosFallidos(archivo, resultado.fallidos);
      console.log(`\n  💾 ${resultado.fallidos.length} anuncios aún fallan, guardados en ${nombreArchivo}`);
    } else {
      // Si todos se recuperaron, eliminar el archivo
      fs.unlinkSync(archivo);
      console.log(`\n  ✅ Todos los anuncios recuperados, archivo eliminado`);
    }
    
    console.log('');
  }
  
  console.log(`${'='.repeat(50)}`);
  console.log(`📊 RESUMEN`);
  console.log(`${'='.repeat(50)}`);
  console.log(`Anuncios recuperados: ${totalExitosos}`);
  console.log(`Anuncios que aún fallan: ${totalFallidos}`);
  console.log(`${'='.repeat(50)}\n`);
}

// Ejecutar
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

export { recuperarAnuncios, leerAnunciosFallidos, guardarAnunciosFallidos };










