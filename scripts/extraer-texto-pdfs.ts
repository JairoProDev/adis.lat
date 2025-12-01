/**
 * Script Mejorado para Extraer Texto de PDFs de Rueda de Negocios
 * 
 * Maneja:
 *   - PDFs partidos en carpetas (16 páginas separadas)
 *   - PDFs completos (todas las páginas en un archivo)
 *   - Múltiples carpetas y archivos en batch
 * 
 * Uso:
 *   # Procesar una carpeta con PDFs partidos
 *   npx ts-node scripts/extraer-texto-pdfs.ts --carpeta /ruta/a/R2538-del20al26-Junio
 * 
 *   # Procesar un PDF completo
 *   npx ts-node scripts/extraer-texto-pdfs.ts --pdf /ruta/a/R2587-del16al18-Diciembre.pdf
 * 
 *   # Procesar TODO (carpetas y PDFs en un directorio)
 *   npx ts-node scripts/extraer-texto-pdfs.ts --todo /ruta/a/Magazines
 * 
 *   # Especificar directorio de salida
 *   npx ts-node scripts/extraer-texto-pdfs.ts --todo /ruta/a/Magazines --salida ./output
 */

import * as fs from 'fs';
import * as path from 'path';

// Usaremos pdf-parse que es más ligero y confiable
// Instalación: npm install pdf-parse
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

interface InfoEdicion {
  numeroEdicion: string;
  fechaInicio: string;
  fechaFin: string;
  mes: string;
  año: number;
  fechaPublicacion: string; // Formato YYYY-MM-DD
}

interface PaginaExtraida {
  edicion: string;
  pagina: number;
  texto: string;
  archivo: string;
  caracteres: number;
}

interface EdicionExtraida {
  info: InfoEdicion;
  carpetaOrigen: string;
  archivoOrigen: string;
  esPdfCompleto: boolean;
  paginas: PaginaExtraida[];
  totalCaracteres: number;
  totalPaginas: number;
  fechaProcesamiento: string;
}

interface ResultadoExtraccion {
  fechaExtraccion: string;
  totalEdiciones: number;
  totalPaginas: number;
  totalCaracteres: number;
  ediciones: EdicionExtraida[];
}

// Mapeo de meses en español a números
const MESES: { [key: string]: number } = {
  'enero': 1, 'ene': 1,
  'febrero': 2, 'feb': 2,
  'marzo': 3, 'mar': 3,
  'abril': 4, 'abr': 4,
  'mayo': 5, 'may': 5,
  'junio': 6, 'jun': 6,
  'julio': 7, 'jul': 7,
  'agosto': 8, 'ago': 8,
  'septiembre': 9, 'sept': 9, 'sep': 9, 'set': 9,
  'octubre': 10, 'oct': 10,
  'noviembre': 11, 'nov': 11,
  'diciembre': 12, 'dic': 12
};

/**
 * Extrae información de la edición del nombre del archivo/carpeta
 * Ejemplos de nombres:
 *   - R2538-del20al26-Junio
 *   - R2587-del16al18-Diciembre.pdf
 *   - R2590-del2al5-Enero.pdf
 *   - R2606-Febrero-27-2-Marzo.pdf
 */
function extraerInfoEdicion(nombre: string): InfoEdicion {
  // Limpiar extensión .pdf si existe
  const nombreLimpio = nombre.replace(/\.pdf$/i, '');
  
  // Extraer número de edición (R2538, R2587, etc.)
  const matchEdicion = nombreLimpio.match(/R(\d+)/i);
  const numeroEdicion = matchEdicion ? matchEdicion[1] : 'desconocido';
  
  // Intentar extraer fechas y mes
  let fechaInicio = '';
  let fechaFin = '';
  let mes = '';
  let año = new Date().getFullYear(); // Por defecto año actual
  
  // Patrón: del16al18-Diciembre o del2al5-Enero
  const matchFechas = nombreLimpio.match(/del(\d+)al(\d+)[_-]?(\w+)/i);
  if (matchFechas) {
    fechaInicio = matchFechas[1];
    fechaFin = matchFechas[2];
    mes = matchFechas[3].toLowerCase();
  } else {
    // Patrón alternativo: Febrero-27-2-Marzo (del 27 de Feb al 2 de Mar)
    const matchAlternativo = nombreLimpio.match(/[_-](\w+)[_-](\d+)[_-](\d+)[_-]?(\w+)?/i);
    if (matchAlternativo) {
      mes = matchAlternativo[1].toLowerCase();
      fechaInicio = matchAlternativo[2];
      fechaFin = matchAlternativo[3];
    } else {
      // Intentar extraer solo el mes
      const matchMes = nombreLimpio.match(/[_-](\w+)$/i);
      if (matchMes) {
        mes = matchMes[1].toLowerCase();
      }
    }
  }
  
  // Determinar año basado en el número de edición y mes
  // Las ediciones alrededor de R2538 son de junio 2024
  // Las ediciones alrededor de R2634 son de junio 2025
  const numEdicion = parseInt(numeroEdicion, 10);
  if (!isNaN(numEdicion)) {
    // Aproximación: R2538 ≈ junio 2024, ~2 ediciones por semana = ~100 ediciones por año
    if (numEdicion < 2590) {
      año = 2024;
    } else {
      año = 2025;
    }
  }
  
  // Calcular fecha de publicación
  const mesNumero = MESES[mes] || 1;
  const dia = parseInt(fechaInicio, 10) || 1;
  const fechaPublicacion = `${año}-${String(mesNumero).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  
  return {
    numeroEdicion,
    fechaInicio,
    fechaFin,
    mes,
    año,
    fechaPublicacion
  };
}

/**
 * Extrae texto de un archivo PDF
 */
async function extraerTextoDePDF(rutaArchivo: string): Promise<{ texto: string; numPaginas: number }> {
  
  try {
    const dataBuffer = fs.readFileSync(rutaArchivo);
    const data = await pdfParse(dataBuffer);
    
    return {
      texto: data.text.trim(),
      numPaginas: data.numpages
    };
  } catch (error: any) {
    console.error(`  ✗ Error al extraer texto de ${rutaArchivo}:`, error.message);
    throw error;
  }
}

/**
 * Procesa una carpeta con PDFs partidos (16 páginas separadas)
 */
async function procesarCarpetaPartida(rutaCarpeta: string): Promise<EdicionExtraida | null> {
  const nombreCarpeta = path.basename(rutaCarpeta);
  const info = extraerInfoEdicion(nombreCarpeta);
  
  console.log(`\n📁 Procesando carpeta: ${nombreCarpeta}`);
  console.log(`   Edición: R${info.numeroEdicion} | Fecha: ${info.fechaPublicacion}`);
  
  // Obtener todos los archivos PDF
  const archivos = fs.readdirSync(rutaCarpeta)
    .filter(archivo => archivo.toLowerCase().endsWith('.pdf'))
    .sort((a, b) => {
      // Ordenar por número de página
      const numA = parseInt(a.match(/(\d+)\.pdf$/i)?.[1] || '0', 10);
      const numB = parseInt(b.match(/(\d+)\.pdf$/i)?.[1] || '0', 10);
      return numA - numB;
    });
  
  if (archivos.length === 0) {
    console.log(`   ⚠ No se encontraron PDFs en la carpeta`);
    return null;
  }
  
  console.log(`   📄 ${archivos.length} archivos PDF encontrados`);
  
  const paginas: PaginaExtraida[] = [];
  let totalCaracteres = 0;
  
  for (let i = 0; i < archivos.length; i++) {
    const archivo = archivos[i];
    const rutaCompleta = path.join(rutaCarpeta, archivo);
    
    // Extraer número de página del nombre
    const matchPagina = archivo.match(/[_-]?(\d+)\.pdf$/i);
    const numeroPagina = matchPagina ? parseInt(matchPagina[1], 10) : i + 1;
    
    try {
      const { texto } = await extraerTextoDePDF(rutaCompleta);
      
      paginas.push({
        edicion: info.numeroEdicion,
        pagina: numeroPagina,
        texto,
        archivo,
        caracteres: texto.length
      });
      
      totalCaracteres += texto.length;
      process.stdout.write(`\r   ✓ Procesadas ${i + 1}/${archivos.length} páginas (${totalCaracteres.toLocaleString()} caracteres)`);
    } catch (error) {
      console.log(`\n   ✗ Error en página ${numeroPagina}: ${archivo}`);
    }
  }
  
  console.log(''); // Nueva línea después del progreso
  
  return {
    info,
    carpetaOrigen: rutaCarpeta,
    archivoOrigen: '',
    esPdfCompleto: false,
    paginas: paginas.sort((a, b) => a.pagina - b.pagina),
    totalCaracteres,
    totalPaginas: paginas.length,
    fechaProcesamiento: new Date().toISOString()
  };
}

/**
 * Procesa un PDF completo (todas las páginas en un archivo)
 */
async function procesarPdfCompleto(rutaArchivo: string): Promise<EdicionExtraida | null> {
  const nombreArchivo = path.basename(rutaArchivo);
  const info = extraerInfoEdicion(nombreArchivo);
  
  console.log(`\n📄 Procesando PDF completo: ${nombreArchivo}`);
  console.log(`   Edición: R${info.numeroEdicion} | Fecha: ${info.fechaPublicacion}`);
  
  try {
    const { texto, numPaginas } = await extraerTextoDePDF(rutaArchivo);
    
    // Para PDFs completos, dividimos el texto aproximadamente por páginas
    // Asumiendo ~2500 caracteres por página promedio
    const caracteresPromediosPorPagina = Math.ceil(texto.length / numPaginas);
    
    const paginas: PaginaExtraida[] = [];
    
    // Dividir el texto en chunks (aproximadamente por páginas)
    // Buscamos saltos de línea dobles o triples como separadores naturales
    const partes = texto.split(/\n{3,}/).filter(p => p.trim().length > 0);
    
    // Si hay muy pocas partes, usar todo como una página
    if (partes.length < numPaginas / 2) {
      // Dividir por caracteres
      for (let i = 0; i < numPaginas; i++) {
        const inicio = i * caracteresPromediosPorPagina;
        const fin = Math.min((i + 1) * caracteresPromediosPorPagina, texto.length);
        const textoPage = texto.substring(inicio, fin).trim();
        
        if (textoPage.length > 0) {
          paginas.push({
            edicion: info.numeroEdicion,
            pagina: i + 1,
            texto: textoPage,
            archivo: nombreArchivo,
            caracteres: textoPage.length
          });
        }
      }
    } else {
      // Agrupar partes en páginas aproximadas
      const partesPorPagina = Math.ceil(partes.length / numPaginas);
      for (let i = 0; i < numPaginas; i++) {
        const inicio = i * partesPorPagina;
        const fin = Math.min((i + 1) * partesPorPagina, partes.length);
        const textoPage = partes.slice(inicio, fin).join('\n\n').trim();
        
        if (textoPage.length > 0) {
          paginas.push({
            edicion: info.numeroEdicion,
            pagina: i + 1,
            texto: textoPage,
            archivo: nombreArchivo,
            caracteres: textoPage.length
          });
        }
      }
    }
    
    console.log(`   ✓ Extraídas ${paginas.length} páginas (${texto.length.toLocaleString()} caracteres)`);
    
    return {
      info,
      carpetaOrigen: '',
      archivoOrigen: rutaArchivo,
      esPdfCompleto: true,
      paginas,
      totalCaracteres: texto.length,
      totalPaginas: paginas.length,
      fechaProcesamiento: new Date().toISOString()
    };
  } catch (error) {
    console.log(`   ✗ Error al procesar PDF`);
    return null;
  }
}

/**
 * Procesa un directorio completo (carpetas con PDFs partidos + PDFs sueltos)
 */
async function procesarDirectorioCompleto(rutaDirectorio: string): Promise<EdicionExtraida[]> {
  const resultados: EdicionExtraida[] = [];
  
  console.log(`\n🗂️  Escaneando directorio: ${rutaDirectorio}`);
  
  const items = fs.readdirSync(rutaDirectorio, { withFileTypes: true });
  
  // Separar carpetas y archivos PDF
  const carpetas = items.filter(item => item.isDirectory()).map(item => item.name);
  const pdfsSueltos = items.filter(item => item.isFile() && item.name.toLowerCase().endsWith('.pdf')).map(item => item.name);
  
  console.log(`   📁 ${carpetas.length} carpetas encontradas`);
  console.log(`   📄 ${pdfsSueltos.length} PDFs sueltos encontrados`);
  
  // Procesar carpetas (PDFs partidos)
  for (const carpeta of carpetas) {
    const rutaCarpeta = path.join(rutaDirectorio, carpeta);
    const resultado = await procesarCarpetaPartida(rutaCarpeta);
    if (resultado) {
      resultados.push(resultado);
    }
  }
  
  // Procesar PDFs sueltos (PDFs completos)
  for (const pdf of pdfsSueltos) {
    const rutaPdf = path.join(rutaDirectorio, pdf);
    const resultado = await procesarPdfCompleto(rutaPdf);
    if (resultado) {
      resultados.push(resultado);
    }
  }
  
  return resultados;
}

/**
 * Guarda los resultados en un archivo JSON
 */
function guardarResultados(resultados: EdicionExtraida[], rutaSalida: string): void {
  // Crear directorio si no existe
  const directorio = path.dirname(rutaSalida);
  if (!fs.existsSync(directorio)) {
    fs.mkdirSync(directorio, { recursive: true });
  }
  
  const resultado: ResultadoExtraccion = {
    fechaExtraccion: new Date().toISOString(),
    totalEdiciones: resultados.length,
    totalPaginas: resultados.reduce((sum, r) => sum + r.totalPaginas, 0),
    totalCaracteres: resultados.reduce((sum, r) => sum + r.totalCaracteres, 0),
    ediciones: resultados.sort((a, b) => {
      // Ordenar por número de edición
      const numA = parseInt(a.info.numeroEdicion, 10);
      const numB = parseInt(b.info.numeroEdicion, 10);
      return numA - numB;
    })
  };
  
  fs.writeFileSync(rutaSalida, JSON.stringify(resultado, null, 2), 'utf-8');
  console.log(`\n💾 Resultados guardados en: ${rutaSalida}`);
}

/**
 * Muestra estadísticas finales
 */
function mostrarEstadisticas(resultados: EdicionExtraida[]): void {
  const totalPaginas = resultados.reduce((sum, r) => sum + r.totalPaginas, 0);
  const totalCaracteres = resultados.reduce((sum, r) => sum + r.totalCaracteres, 0);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 ESTADÍSTICAS FINALES');
  console.log('='.repeat(60));
  console.log(`   Ediciones procesadas: ${resultados.length}`);
  console.log(`   Total de páginas: ${totalPaginas}`);
  console.log(`   Total de caracteres: ${totalCaracteres.toLocaleString()}`);
  console.log(`   Promedio caracteres/página: ${Math.round(totalCaracteres / totalPaginas).toLocaleString()}`);
  console.log('='.repeat(60));
}

/**
 * Muestra ayuda de uso
 */
function mostrarAyuda(): void {
  console.log(`
📚 EXTRACTOR DE TEXTO DE PDFS - RUEDA DE NEGOCIOS
${'='.repeat(55)}

USO:
  npx ts-node scripts/extraer-texto-pdfs.ts [opciones]

OPCIONES:
  --carpeta <ruta>    Procesar una carpeta con PDFs partidos
  --pdf <ruta>        Procesar un PDF completo
  --todo <ruta>       Procesar un directorio completo (carpetas + PDFs)
  --salida <ruta>     Directorio de salida (default: ./output/texto-extraido)
  --ayuda             Mostrar esta ayuda

EJEMPLOS:
  # Procesar TODO el directorio Magazines
  npx ts-node scripts/extraer-texto-pdfs.ts --todo ~/Desktop/Magazines

  # Procesar una carpeta específica
  npx ts-node scripts/extraer-texto-pdfs.ts --carpeta ~/Desktop/Magazines/R2538-del20al26-Junio

  # Procesar un PDF completo
  npx ts-node scripts/extraer-texto-pdfs.ts --pdf ~/Desktop/Magazines/R2587-del16al18-Diciembre.pdf

  # Especificar directorio de salida
  npx ts-node scripts/extraer-texto-pdfs.ts --todo ~/Desktop/Magazines --salida ./output
  `);
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--ayuda') || args.includes('--help')) {
    mostrarAyuda();
    process.exit(0);
  }
  
  // Parsear argumentos
  let modo: 'carpeta' | 'pdf' | 'todo' | null = null;
  let rutaEntrada = '';
  let rutaSalida = './output/texto-extraido';
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--carpeta':
        modo = 'carpeta';
        rutaEntrada = args[++i] || '';
        break;
      case '--pdf':
        modo = 'pdf';
        rutaEntrada = args[++i] || '';
        break;
      case '--todo':
        modo = 'todo';
        rutaEntrada = args[++i] || '';
        break;
      case '--salida':
        rutaSalida = args[++i] || './output/texto-extraido';
        break;
    }
  }
  
  if (!modo || !rutaEntrada) {
    console.error('❌ Error: Debes especificar --carpeta, --pdf o --todo con una ruta');
    mostrarAyuda();
    process.exit(1);
  }
  
  // Verificar que la ruta existe
  if (!fs.existsSync(rutaEntrada)) {
    console.error(`❌ Error: La ruta no existe: ${rutaEntrada}`);
    process.exit(1);
  }
  
  console.log('🚀 INICIANDO EXTRACCIÓN DE TEXTO');
  console.log('='.repeat(60));
  console.log(`   Modo: ${modo}`);
  console.log(`   Entrada: ${rutaEntrada}`);
  console.log(`   Salida: ${rutaSalida}`);
  
  let resultados: EdicionExtraida[] = [];
  
  switch (modo) {
    case 'carpeta':
      const resCarpeta = await procesarCarpetaPartida(rutaEntrada);
      if (resCarpeta) resultados.push(resCarpeta);
      break;
      
    case 'pdf':
      const resPdf = await procesarPdfCompleto(rutaEntrada);
      if (resPdf) resultados.push(resPdf);
      break;
      
    case 'todo':
      resultados = await procesarDirectorioCompleto(rutaEntrada);
      break;
  }
  
  if (resultados.length === 0) {
    console.log('\n⚠️  No se procesaron archivos');
    process.exit(1);
  }
  
  // Guardar resultados
  const archivoSalida = path.join(rutaSalida, 'texto-extraido.json');
  guardarResultados(resultados, archivoSalida);
  
  // Mostrar estadísticas
  mostrarEstadisticas(resultados);
  
  console.log('\n✅ Extracción completada exitosamente');
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

export { 
  extraerTextoDePDF, 
  procesarCarpetaPartida, 
  procesarPdfCompleto,
  procesarDirectorioCompleto,
  extraerInfoEdicion
};

export type {
  PaginaExtraida, 
  EdicionExtraida,
  ResultadoExtraccion
};
