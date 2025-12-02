/**
 * Script de Reportes de Progreso
 * 
 * Muestra estadísticas y reportes del procesamiento de revistas
 * 
 * Uso:
 *   npx tsx scripts/reportar-progreso.ts [--resumen] [--detallado] [--revista R2538]
 */

import * as fs from 'fs';
import * as path from 'path';

interface ProgresoRevista {
  estado: 'pendiente' | 'en_proceso' | 'completada' | 'error';
  paginaActual?: number;
  paginasProcesadas?: number;
  anunciosExtraidos?: number;
  anunciosCargados?: number;
  errores?: string[];
  fechaCompletado?: string;
}

interface ProgresoProcesamiento {
  fechaInicio: string;
  ultimaActualizacion: string;
  revistas: { [key: string]: ProgresoRevista };
  estadisticas: {
    totalRevistas: number;
    revistasCompletadas: number;
    totalAnuncios: number;
    totalCargados: number;
    totalErrores: number;
  };
}

/**
 * Lee el archivo de progreso
 */
function leerProgreso(): ProgresoProcesamiento | null {
  const rutaProgreso = path.join(process.cwd(), 'output', 'progreso-procesamiento.json');
  
  if (!fs.existsSync(rutaProgreso)) {
    return null;
  }
  
  try {
    const contenido = fs.readFileSync(rutaProgreso, 'utf-8');
    return JSON.parse(contenido);
  } catch (error) {
    console.error('❌ Error al leer progreso:', error);
    return null;
  }
}

/**
 * Formatea tiempo transcurrido
 */
function formatearTiempo(ms: number): string {
  const segundos = Math.floor(ms / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  
  if (dias > 0) {
    return `${dias}d ${horas % 24}h ${minutos % 60}m`;
  } else if (horas > 0) {
    return `${horas}h ${minutos % 60}m ${segundos % 60}s`;
  } else if (minutos > 0) {
    return `${minutos}m ${segundos % 60}s`;
  } else {
    return `${segundos}s`;
  }
}

/**
 * Calcula tiempo estimado restante
 */
function calcularTiempoRestante(progreso: ProgresoProcesamiento): string {
  if (progreso.estadisticas.revistasCompletadas === 0) {
    return 'N/A';
  }
  
  const tiempoTranscurrido = new Date(progreso.ultimaActualizacion).getTime() - 
                             new Date(progreso.fechaInicio).getTime();
  const revistasPorHora = progreso.estadisticas.revistasCompletadas / (tiempoTranscurrido / (1000 * 60 * 60));
  const revistasRestantes = progreso.estadisticas.totalRevistas - progreso.estadisticas.revistasCompletadas;
  const horasRestantes = revistasRestantes / revistasPorHora;
  
  return formatearTiempo(horasRestantes * 60 * 60 * 1000);
}

/**
 * Calcula velocidad de procesamiento
 */
function calcularVelocidad(progreso: ProgresoProcesamiento): string {
  const tiempoTranscurrido = new Date(progreso.ultimaActualizacion).getTime() - 
                             new Date(progreso.fechaInicio).getTime();
  const horas = tiempoTranscurrido / (1000 * 60 * 60);
  
  if (horas === 0) {
    return 'N/A';
  }
  
  const anunciosPorHora = progreso.estadisticas.totalCargados / horas;
  return `${anunciosPorHora.toFixed(1)} anuncios/hora`;
}

/**
 * Muestra resumen general
 */
function mostrarResumen(progreso: ProgresoProcesamiento): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 RESUMEN DE PROGRESO`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Fecha inicio: ${new Date(progreso.fechaInicio).toLocaleString()}`);
  console.log(`Última actualización: ${new Date(progreso.ultimaActualizacion).toLocaleString()}`);
  console.log(`Tiempo transcurrido: ${formatearTiempo(new Date(progreso.ultimaActualizacion).getTime() - new Date(progreso.fechaInicio).getTime())}`);
  console.log('');
  console.log(`📚 Revistas:`);
  console.log(`   Total: ${progreso.estadisticas.totalRevistas}`);
  console.log(`   Completadas: ${progreso.estadisticas.revistasCompletadas}`);
  console.log(`   Pendientes: ${progreso.estadisticas.totalRevistas - progreso.estadisticas.revistasCompletadas}`);
  console.log(`   Progreso: ${((progreso.estadisticas.revistasCompletadas / progreso.estadisticas.totalRevistas) * 100).toFixed(1)}%`);
  console.log('');
  console.log(`📝 Anuncios:`);
  console.log(`   Extraídos: ${progreso.estadisticas.totalAnuncios}`);
  console.log(`   Cargados: ${progreso.estadisticas.totalCargados}`);
  console.log(`   Errores: ${progreso.estadisticas.totalErrores}`);
  console.log(`   Tasa de éxito: ${((progreso.estadisticas.totalCargados / progreso.estadisticas.totalAnuncios) * 100).toFixed(1)}%`);
  console.log('');
  console.log(`⚡ Rendimiento:`);
  console.log(`   Velocidad: ${calcularVelocidad(progreso)}`);
  console.log(`   Tiempo estimado restante: ${calcularTiempoRestante(progreso)}`);
  console.log(`${'='.repeat(60)}\n`);
}

/**
 * Muestra reporte detallado por revista
 */
function mostrarDetallado(progreso: ProgresoProcesamiento, codigoRevista?: string): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 REPORTE DETALLADO`);
  console.log(`${'='.repeat(60)}\n`);
  
  const revistas = codigoRevista 
    ? [codigoRevista].filter(r => progreso.revistas[r])
    : Object.keys(progreso.revistas).sort();
  
  if (revistas.length === 0) {
    console.log('No hay revistas procesadas aún.');
    return;
  }
  
  for (const revista of revistas) {
    const info = progreso.revistas[revista];
    const estadoIcono = {
      'pendiente': '⏳',
      'en_proceso': '🔄',
      'completada': '✅',
      'error': '❌'
    }[info.estado] || '❓';
    
    console.log(`${estadoIcono} ${revista}`);
    console.log(`   Estado: ${info.estado}`);
    
    if (info.paginasProcesadas) {
      console.log(`   Páginas: ${info.paginasProcesadas}`);
    }
    
    if (info.anunciosExtraidos !== undefined) {
      console.log(`   Anuncios extraídos: ${info.anunciosExtraidos}`);
    }
    
    if (info.anunciosCargados !== undefined) {
      console.log(`   Anuncios cargados: ${info.anunciosCargados}`);
    }
    
    if (info.errores && info.errores.length > 0) {
      console.log(`   Errores: ${info.errores.length}`);
      if (info.errores.length <= 5) {
        info.errores.forEach(error => {
          console.log(`      - ${error.substring(0, 80)}`);
        });
      } else {
        info.errores.slice(0, 5).forEach(error => {
          console.log(`      - ${error.substring(0, 80)}`);
        });
        console.log(`      ... y ${info.errores.length - 5} errores más`);
      }
    }
    
    if (info.fechaCompletado) {
      console.log(`   Completado: ${new Date(info.fechaCompletado).toLocaleString()}`);
    }
    
    console.log('');
  }
  
  console.log(`${'='.repeat(60)}\n`);
}

/**
 * Muestra estadísticas por cada 100 revistas
 */
function mostrarEstadisticasPeriodicas(progreso: ProgresoProcesamiento): void {
  const revistasCompletadas = progreso.estadisticas.revistasCompletadas;
  
  // Mostrar resumen cada 100 revistas
  if (revistasCompletadas > 0 && revistasCompletadas % 100 === 0) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎉 HITO: ${revistasCompletadas} revistas procesadas`);
    console.log(`${'='.repeat(60)}`);
    mostrarResumen(progreso);
  }
}

/**
 * Genera reporte en archivo de log
 */
function generarLog(progreso: ProgresoProcesamiento): void {
  const fecha = new Date().toISOString().split('T')[0];
  const rutaLog = path.join(process.cwd(), 'output', 'logs', `procesamiento-${fecha}.log`);
  const directorio = path.dirname(rutaLog);
  
  if (!fs.existsSync(directorio)) {
    fs.mkdirSync(directorio, { recursive: true });
  }
  
  const contenido = `
==========================================
REPORTE DE PROGRESO - ${new Date().toLocaleString()}
==========================================

FECHA INICIO: ${new Date(progreso.fechaInicio).toLocaleString()}
ÚLTIMA ACTUALIZACIÓN: ${new Date(progreso.ultimaActualizacion).toLocaleString()}

ESTADÍSTICAS GENERALES:
- Total revistas: ${progreso.estadisticas.totalRevistas}
- Revistas completadas: ${progreso.estadisticas.revistasCompletadas}
- Total anuncios extraídos: ${progreso.estadisticas.totalAnuncios}
- Total anuncios cargados: ${progreso.estadisticas.totalCargados}
- Total errores: ${progreso.estadisticas.totalErrores}
- Tasa de éxito: ${((progreso.estadisticas.totalCargados / progreso.estadisticas.totalAnuncios) * 100).toFixed(1)}%
- Velocidad: ${calcularVelocidad(progreso)}

REVISTAS PROCESADAS:
${Object.keys(progreso.revistas).map(revista => {
  const info = progreso.revistas[revista];
  return `- ${revista}: ${info.estado} (${info.anunciosCargados || 0} anuncios)`;
}).join('\n')}

==========================================
`;
  
  fs.appendFileSync(rutaLog, contenido, 'utf-8');
  console.log(`📝 Log guardado en: ${rutaLog}`);
}

/**
 * Función principal
 */
function main(): void {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
📊 REPORTE DE PROGRESO
${'='.repeat(50)}

Uso:
  npx tsx scripts/reportar-progreso.ts [opciones]

Opciones:
  --resumen         Mostrar solo resumen general
  --detallado       Mostrar reporte detallado por revista
  --revista <cod>   Mostrar detalles de una revista específica
  --log             Generar archivo de log
  --help            Mostrar ayuda

Ejemplos:
  npx tsx scripts/reportar-progreso.ts --resumen
  npx tsx scripts/reportar-progreso.ts --detallado
  npx tsx scripts/reportar-progreso.ts --revista R2538
  npx tsx scripts/reportar-progreso.ts --resumen --log
    `);
    process.exit(0);
  }
  
  const progreso = leerProgreso();
  
  if (!progreso) {
    console.error('❌ No se encontró archivo de progreso. Ejecuta primero el procesador.');
    process.exit(1);
  }
  
  const resumen = args.includes('--resumen');
  const detallado = args.includes('--detallado');
  const revistaIndex = args.indexOf('--revista');
  const codigoRevista = revistaIndex >= 0 && args[revistaIndex + 1] ? args[revistaIndex + 1] : undefined;
  const generarLogFile = args.includes('--log');
  
  // Mostrar estadísticas periódicas
  mostrarEstadisticasPeriodicas(progreso);
  
  // Mostrar reportes según opciones
  if (resumen || (!detallado && !codigoRevista)) {
    mostrarResumen(progreso);
  }
  
  if (detallado || codigoRevista) {
    mostrarDetallado(progreso, codigoRevista);
  }
  
  // Generar log si se solicita
  if (generarLogFile) {
    generarLog(progreso);
  }
}

// Ejecutar
if (require.main === module) {
  main();
}

export { leerProgreso, mostrarResumen, mostrarDetallado, generarLog };




