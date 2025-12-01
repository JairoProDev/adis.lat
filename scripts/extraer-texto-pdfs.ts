/**
 * Script para extraer texto crudo de PDFs
 * 
 * Uso:
 *   npx ts-node scripts/extraer-texto-pdfs.ts <ruta-carpeta-pdfs> [ruta-salida-json]
 * 
 * Ejemplo:
 *   npx ts-node scripts/extraer-texto-pdfs.ts ./pdfs ./output/texto-extraido.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';

interface PaginaExtraida {
  edicion: string;
  pagina: number;
  texto: string;
  archivo: string;
}

async function extraerTextoDePDF(rutaArchivo: string): Promise<string> {
  try {
    const loader = new PDFLoader(rutaArchivo, {
      splitPages: false, // Mantener todo el texto junto
    });
    
    const docs = await loader.load();
    
    // Combinar todo el texto de todas las páginas
    return docs.map(doc => doc.pageContent).join('\n\n');
  } catch (error) {
    console.error(`Error al extraer texto de ${rutaArchivo}:`, error);
    throw error;
  }
}

async function procesarCarpetaPDFs(rutaCarpeta: string): Promise<PaginaExtraida[]> {
  const resultados: PaginaExtraida[] = [];
  
  if (!fs.existsSync(rutaCarpeta)) {
    throw new Error(`La carpeta ${rutaCarpeta} no existe`);
  }

  // Obtener todos los archivos PDF en la carpeta
  const archivos = fs.readdirSync(rutaCarpeta)
    .filter(archivo => archivo.toLowerCase().endsWith('.pdf'))
    .sort(); // Ordenar para procesar en orden

  console.log(`Encontrados ${archivos.length} archivos PDF`);

  // Extraer número de edición del nombre de la carpeta o del primer archivo
  const nombreCarpeta = path.basename(rutaCarpeta);
  const matchEdicion = nombreCarpeta.match(/R(\d+)/);
  const numeroEdicion = matchEdicion ? matchEdicion[1] : 'desconocido';

  for (let i = 0; i < archivos.length; i++) {
    const archivo = archivos[i];
    const rutaCompleta = path.join(rutaCarpeta, archivo);
    
    console.log(`Procesando ${i + 1}/${archivos.length}: ${archivo}`);
    
    try {
      const texto = await extraerTextoDePDF(rutaCompleta);
      
      // Extraer número de página del nombre del archivo
      const matchPagina = archivo.match(/-(\d+)\.pdf$/i) || archivo.match(/(\d+)\.pdf$/i);
      const numeroPagina = matchPagina ? parseInt(matchPagina[1], 10) : i + 1;
      
      resultados.push({
        edicion: numeroEdicion,
        pagina: numeroPagina,
        texto: texto.trim(),
        archivo: archivo
      });
      
      console.log(`  ✓ Extraído texto de página ${numeroPagina} (${texto.length} caracteres)`);
    } catch (error) {
      console.error(`  ✗ Error al procesar ${archivo}:`, error);
      // Continuar con el siguiente archivo
    }
  }

  return resultados;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Uso: npx ts-node scripts/extraer-texto-pdfs.ts <ruta-carpeta-pdfs> [ruta-salida-json]');
    process.exit(1);
  }

  const rutaCarpeta = args[0];
  const rutaSalida = args[1] || path.join(process.cwd(), 'texto-extraido.json');

  console.log('=== Extracción de Texto de PDFs ===');
  console.log(`Carpeta: ${rutaCarpeta}`);
  console.log(`Salida: ${rutaSalida}`);
  console.log('');

  try {
    const resultados = await procesarCarpetaPDFs(rutaCarpeta);
    
    // Crear directorio de salida si no existe
    const directorioSalida = path.dirname(rutaSalida);
    if (!fs.existsSync(directorioSalida)) {
      fs.mkdirSync(directorioSalida, { recursive: true });
    }
    
    // Guardar resultados en JSON
    fs.writeFileSync(rutaSalida, JSON.stringify(resultados, null, 2), 'utf-8');
    
    console.log('');
    console.log(`✓ Procesados ${resultados.length} archivos PDF`);
    console.log(`✓ Resultados guardados en: ${rutaSalida}`);
    console.log(`✓ Total de caracteres extraídos: ${resultados.reduce((sum, r) => sum + r.texto.length, 0)}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main();
}

export { extraerTextoDePDF, procesarCarpetaPDFs, PaginaExtraida };

