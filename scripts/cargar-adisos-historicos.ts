/**
 * Script para cargar adisos históricos desde archivos TXT
 * 
 * Procesa archivos de la estructura:
 * - 36 carpetas (ediciones de revista)
 * - ~16 archivos por carpeta (pagina-01.txt, pagina-02.txt, etc.)
 * - Cada línea: "NÚMERO. TÍTULO: DESCRIPCIÓN"
 * 
 * Uso:
 *   npx tsx scripts/cargar-adisos-historicos.ts [--carpeta R2561-Sep16-18] [--todas] [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { Adiso, Categoria, ContactoMultiple } from '@/types';
import { extraerNumerosTelefono, extraerEmails, esWhatsApp, limpiarContactosDeDescripcion } from '@/lib/limpiar-contactos';
import { adisoToDb } from '@/lib/supabase';
import { generarIdUnico } from '@/lib/utils';

// Cargar variables de entorno
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Configuración
const CARPETAS_BASE = '/home/jairoprodev/proyectos/adisos-processing/procesamiento/04-anuncios-separados';
const CHUNK_SIZE = 100; // Adisos por lote para insertar en Supabase

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Estadísticas
interface Estadisticas {
  totalCarpetas: number;
  totalArchivos: number;
  totalLineas: number;
  adisosProcesados: number;
  adisosCargados: number;
  errores: number;
  erroresDetalle: string[];
}

/**
 * Parsea una línea de adiso del formato "NÚMERO. TÍTULO: DESCRIPCIÓN"
 */
function parsearLineaAdiso(linea: string): { titulo: string; descripcion: string } | null {
  if (!linea || linea.trim().length === 0) {
    return null;
  }

  // Remover número inicial si existe (ej: "1. ", "2. ", etc.)
  const sinNumero = linea.replace(/^\d+\.\s*/, '').trim();
  
  if (sinNumero.length === 0) {
    return null;
  }

  // Buscar el primer ":" que separa título de descripción
  const indiceSeparador = sinNumero.indexOf(':');
  
  if (indiceSeparador === -1) {
    // Si no hay ":", toda la línea es descripción y el título es una parte
    // Intentar dividir por la primera frase
    const palabras = sinNumero.split(/\s+/);
    if (palabras.length < 3) {
      return null; // Muy corto para ser válido
    }
    // Tomar primeras 5-10 palabras como título
    const titulo = palabras.slice(0, Math.min(10, palabras.length - 5)).join(' ');
    const descripcion = palabras.slice(Math.min(10, palabras.length - 5)).join(' ');
    return { titulo: titulo.trim(), descripcion: descripcion.trim() };
  }

  const titulo = sinNumero.substring(0, indiceSeparador).trim();
  const descripcion = sinNumero.substring(indiceSeparador + 1).trim();

  if (!titulo || !descripcion || titulo.length < 3 || descripcion.length < 10) {
    return null;
  }

  return { titulo, descripcion };
}

/**
 * Detecta la categoría basándose en palabras clave
 */
function detectarCategoria(titulo: string, descripcion: string): Categoria {
  const texto = `${titulo} ${descripcion}`.toLowerCase();
  
  // Empleos
  if (texto.match(/\b(empleo|trabajo|busco|requiero|necesito|personal|asesor|vendedor|operador|mozo|mozo|chef|cocinero|recepcionista|practicante|practicante|auxiliar|administrador|gerente|contador|abogado|médico|enfermera|profesor|maestro|barista|housekeeping|limpieza)\b/)) {
    return 'empleos';
  }
  
  // Inmuebles
  if (texto.match(/\b(casa|departamento|terreno|alquiler|alquilo|alquila|vendo|venta|inmueble|propiedad|local|oficina|tienda|hostal|hotel|habitación|dormitorio|garaje|cochera|sótano)\b/)) {
    return 'inmuebles';
  }
  
  // Vehículos
  if (texto.match(/\b(auto|carro|vehículo|vehiculo|moto|camioneta|vendo|compra|remato|remate)\b/)) {
    return 'vehiculos';
  }
  
  // Eventos
  if (texto.match(/\b(evento|fiesta|celebración|celebracion|concierto|show|espectáculo|espectaculo|festival)\b/)) {
    return 'eventos';
  }
  
  // Negocios
  if (texto.match(/\b(negocio|empresa|franquicia|socio|inversión|inversion|oportunidad)\b/)) {
    return 'negocios';
  }
  
  // Productos
  if (texto.match(/\b(vendo|venta|producto|artículo|articulo|equipo|maquinaria|mueble|electrodoméstico|electrodomestico)\b/)) {
    return 'productos';
  }
  
  // Por defecto: servicios
  return 'servicios';
}

/**
 * Crea un adiso histórico a partir de título, descripción y contactos
 */
function crearAdisoHistorico(
  titulo: string,
  descripcion: string,
  contactos: ContactoMultiple[],
  carpeta: string,
  archivo: string,
  numeroLinea: number
): Adiso {
  const ahora = new Date();
  const fecha = ahora.toISOString().split('T')[0];
  const hora = ahora.toTimeString().split(' ')[0].substring(0, 5);
  
  // Limpiar descripción de contactos
  const descripcionLimpia = limpiarContactosDeDescripcion(descripcion, contactos);
  
  // Contacto principal (primer teléfono o email)
  const contactoPrincipal = contactos.find(c => c.principal)?.valor || 
                           contactos.find(c => c.tipo === 'telefono' || c.tipo === 'whatsapp')?.valor ||
                           contactos.find(c => c.tipo === 'email')?.valor ||
                           contactos[0]?.valor || 
                           '';
  
  // Detectar categoría
  const categoria = detectarCategoria(titulo, descripcionLimpia);
  
  // Extraer número de edición del nombre de carpeta (ej: "R2561-Sep16-18" -> "R2561")
  const edicionNumero = carpeta.match(/^R\d+/)?.[0] || carpeta;
  
  return {
    id: generarIdUnico(),
    categoria,
    titulo: titulo.substring(0, 100), // Limitar título
    descripcion: descripcionLimpia.substring(0, 2000), // Limitar descripción
    contacto: contactoPrincipal,
    ubicacion: 'Cusco, Perú', // Por defecto, se puede mejorar con geocoding
    fechaPublicacion: fecha,
    horaPublicacion: hora,
    tamaño: 'miniatura',
    esHistorico: true,
    estaActivo: false, // NO contactable directamente
    fuenteOriginal: 'rueda_negocios',
    edicionNumero: edicionNumero,
    fechaPublicacionOriginal: null, // Se puede extraer del nombre de carpeta si tiene fecha
    contactosMultiples: contactos.length > 0 ? contactos : undefined
  };
}

/**
 * Procesa un archivo y retorna los adisos encontrados
 */
function procesarArchivo(rutaArchivo: string, carpeta: string, archivo: string): Adiso[] {
  const adisos: Adiso[] = [];
  
  try {
    const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
    const lineas = contenido.split('\n');
    
    lineas.forEach((linea, indice) => {
      const lineaNumero = indice + 1;
      const parseado = parsearLineaAdiso(linea);
      
      if (!parseado) {
        return; // Saltar líneas inválidas
      }
      
      const { titulo, descripcion } = parseado;
      
      // Extraer contactos
      const numerosTelefono = extraerNumerosTelefono(descripcion);
      const emails = extraerEmails(descripcion);
      
      const contactos: ContactoMultiple[] = [];
      
      // Agregar números de teléfono
      numerosTelefono.forEach((numero, index) => {
        const esWA = esWhatsApp(descripcion, numero);
        contactos.push({
          tipo: esWA ? 'whatsapp' : 'telefono',
          valor: numero,
          principal: index === 0 // Primer número es principal
        });
      });
      
      // Agregar emails
      emails.forEach((email, index) => {
        contactos.push({
          tipo: 'email',
          valor: email,
          principal: contactos.length === 0 && index === 0 // Principal solo si no hay teléfonos
        });
      });
      
      // Crear adiso histórico
      const adiso = crearAdisoHistorico(titulo, descripcion, contactos, carpeta, archivo, lineaNumero);
      adisos.push(adiso);
    });
  } catch (error: any) {
    console.error(`  ❌ Error al procesar archivo ${archivo}:`, error.message);
  }
  
  return adisos;
}

/**
 * Carga adisos a Supabase en lotes
 */
async function cargarAdisos(adisos: Adiso[]): Promise<{ exitosos: number; errores: number; erroresDetalle: string[] }> {
  let exitosos = 0;
  let errores = 0;
  const erroresDetalle: string[] = [];
  
  // Procesar en lotes
  for (let i = 0; i < adisos.length; i += CHUNK_SIZE) {
    const lote = adisos.slice(i, i + CHUNK_SIZE);
    const datosDb = lote.map(adiso => adisoToDb(adiso));
    
    try {
      const { data, error } = await supabase
        .from('adisos')
        .insert(datosDb)
        .select('id');
      
      if (error) {
        // Si hay error de duplicado, intentar insertar uno por uno
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          console.log(`  ⚠️ Lote con duplicados, insertando uno por uno...`);
          for (const adiso of lote) {
            try {
              const { error: errorIndividual } = await supabase
                .from('adisos')
                .insert(adisoToDb(adiso))
                .select('id');
              
              if (errorIndividual) {
                errores++;
                erroresDetalle.push(`${adiso.titulo.substring(0, 50)}: ${errorIndividual.message}`);
              } else {
                exitosos++;
              }
            } catch (err: any) {
              errores++;
              erroresDetalle.push(`${adiso.titulo.substring(0, 50)}: ${err.message}`);
            }
          }
        } else {
          errores += lote.length;
          erroresDetalle.push(`Lote ${i / CHUNK_SIZE + 1}: ${error.message}`);
        }
      } else {
        exitosos += lote.length;
      }
    } catch (error: any) {
      errores += lote.length;
      erroresDetalle.push(`Lote ${i / CHUNK_SIZE + 1}: ${error.message}`);
    }
    
    // Pequeña pausa entre lotes para no sobrecargar
    if (i + CHUNK_SIZE < adisos.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return { exitosos, errores, erroresDetalle };
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);
  const carpetaArg = args.find(arg => arg.startsWith('--carpeta='));
  const carpetaEspecifica = carpetaArg ? carpetaArg.split('=')[1] : undefined;
  const todas = args.includes('--todas');
  const dryRun = args.includes('--dry-run');
  
  console.log('🚀 Iniciando carga de adisos históricos...\n');
  
  if (dryRun) {
    console.log('⚠️  MODO DRY-RUN: No se cargarán datos a Supabase\n');
  }
  
  const estadisticas: Estadisticas = {
    totalCarpetas: 0,
    totalArchivos: 0,
    totalLineas: 0,
    adisosProcesados: 0,
    adisosCargados: 0,
    errores: 0,
    erroresDetalle: []
  };
  
  // Obtener carpetas
  let carpetas: string[] = [];
  
  if (carpetaEspecifica) {
    carpetas = [carpetaEspecifica];
    console.log(`📁 Procesando carpeta específica: ${carpetaEspecifica}\n`);
  } else if (todas) {
    const todasLasCarpetas = fs.readdirSync(CARPETAS_BASE, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .sort();
    carpetas = todasLasCarpetas;
    console.log(`📁 Procesando TODAS las carpetas (${carpetas.length} carpetas)\n`);
  } else {
    console.log('❌ Debes especificar --carpeta=NOMBRE o --todas');
    console.log('   Ejemplo: npx tsx scripts/cargar-adisos-historicos.ts --carpeta=R2561-Sep16-18');
    console.log('   Ejemplo: npx tsx scripts/cargar-adisos-historicos.ts --todas');
    process.exit(1);
  }
  
  estadisticas.totalCarpetas = carpetas.length;
  
  // Procesar cada carpeta
  for (const carpeta of carpetas) {
    const rutaCarpeta = path.join(CARPETAS_BASE, carpeta);
    
    if (!fs.existsSync(rutaCarpeta)) {
      console.log(`⚠️  Carpeta no encontrada: ${carpeta}`);
      continue;
    }
    
    console.log(`\n📂 Procesando carpeta: ${carpeta}`);
    
    // Obtener archivos .txt
    const archivos = fs.readdirSync(rutaCarpeta)
      .filter(archivo => archivo.endsWith('.txt'))
      .sort();
    
    estadisticas.totalArchivos += archivos.length;
    console.log(`   📄 Encontrados ${archivos.length} archivos`);
    
    const todosLosAdisos: Adiso[] = [];
    
    // Procesar cada archivo
    for (const archivo of archivos) {
      const rutaArchivo = path.join(rutaCarpeta, archivo);
      const adisos = procesarArchivo(rutaArchivo, carpeta, archivo);
      todosLosAdisos.push(...adisos);
      estadisticas.totalLineas += fs.readFileSync(rutaArchivo, 'utf-8').split('\n').length;
    }
    
    estadisticas.adisosProcesados += todosLosAdisos.length;
    console.log(`   ✅ ${todosLosAdisos.length} adisos procesados de ${carpeta}`);
    
    // Cargar a Supabase
    if (!dryRun && todosLosAdisos.length > 0) {
      console.log(`   📤 Cargando ${todosLosAdisos.length} adisos a Supabase...`);
      const resultado = await cargarAdisos(todosLosAdisos);
      estadisticas.adisosCargados += resultado.exitosos;
      estadisticas.errores += resultado.errores;
      estadisticas.erroresDetalle.push(...resultado.erroresDetalle);
      console.log(`   ✅ ${resultado.exitosos} cargados, ${resultado.errores} errores`);
    }
  }
  
  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(60));
  console.log(`Carpetas procesadas: ${estadisticas.totalCarpetas}`);
  console.log(`Archivos procesados: ${estadisticas.totalArchivos}`);
  console.log(`Líneas leídas: ${estadisticas.totalLineas}`);
  console.log(`Adisos procesados: ${estadisticas.adisosProcesados}`);
  if (!dryRun) {
    console.log(`Adisos cargados: ${estadisticas.adisosCargados}`);
    console.log(`Errores: ${estadisticas.errores}`);
  }
  
  if (estadisticas.erroresDetalle.length > 0 && !dryRun) {
    console.log('\n❌ Errores detallados:');
    estadisticas.erroresDetalle.slice(0, 10).forEach(error => {
      console.log(`   - ${error}`);
    });
    if (estadisticas.erroresDetalle.length > 10) {
      console.log(`   ... y ${estadisticas.erroresDetalle.length - 10} errores más`);
    }
  }
  
  console.log('\n✅ Proceso completado');
}

// Ejecutar
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

