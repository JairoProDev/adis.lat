/**
 * Script para Procesar TODAS las Revistas Automáticamente
 * 
 * Procesa todas las carpetas y PDFs encontrados en el directorio
 * Guarda cada revista por separado para procesamiento paralelo
 * 
 * Uso:
 *   npx ts-node scripts/procesar-todas-revistas.ts <directorio-magazines>
 */

import * as fs from 'fs';
import * as path from 'path';
import { procesarCarpetaPartida, procesarPdfCompleto, EdicionExtraida } from './extraer-texto-pdfs';

const PROMPT_BASE = `Eres un experto en extraer información estructurada de anuncios clasificados de la revista peruana "Rueda de Negocios" de Cusco.

CONTEXTO:
Estoy procesando el texto extraído de una página de la revista. La página contiene múltiples anuncios clasificados de diferentes categorías. Cada anuncio puede tener diferentes tamaños visuales según el precio pagado por el anunciante.

TAREA:
Extrae TODOS los anuncios presentes en el texto y estructura cada uno en formato JSON estricto. NO omitas ningún anuncio, incluso los más pequeños.

FORMATO DE SALIDA (JSON estricto, sin markdown, sin código, solo JSON puro):

{
  "edicion": "[EDICION]",
  "pagina": [PAGINA],
  "fecha_publicacion": "[FECHA]",
  "anuncios": [
    {
      "titulo": "Título descriptivo (máx 100 caracteres)",
      "descripcion": "Descripción completa (máx 2000 caracteres)",
      "categoria": "empleos|inmuebles|vehiculos|servicios|productos|eventos|negocios|comunidad",
      "contactos": [
        {
          "tipo": "telefono|whatsapp|email",
          "valor": "número/email normalizado",
          "principal": true
        }
      ],
      "ubicacion": "Ubicación mencionada",
      "tamaño_visual": "miniatura|pequeño|mediano|grande|gigante",
      "precio": "Precio si existe"
    }
  ]
}

REGLAS CRÍTICAS:
1. Categorías: empleos (trabajo), inmuebles (casas/alquiler), vehiculos (autos/motos), servicios (profesionales), productos (venta), eventos (cursos), negocios (traspasos), comunidad (otros)
2. Contactos: Normaliza números (sin espacios/guiones). Si dice "WhatsApp", usa tipo "whatsapp"
3. Tamaño: miniatura (1-3 líneas), pequeño (4-8), mediano (9-15), grande (16-25), gigante (+25)
4. NO inventes información. Solo extrae lo explícito
5. Extrae TODOS los anuncios, incluso pequeños

TEXTO DE LA PÁGINA A PROCESAR:

`;

function generarPromptsParaEdicion(edicion: EdicionExtraida, directorioSalida: string): void {
  const numeroEdicion = edicion.info.numeroEdicion;
  const dirEdicion = path.join(directorioSalida, `R${numeroEdicion}`);
  
  if (!fs.existsSync(dirEdicion)) {
    fs.mkdirSync(dirEdicion, { recursive: true });
  }
  
  const dirRespuestas = path.join(dirEdicion, 'respuestas');
  if (!fs.existsSync(dirRespuestas)) {
    fs.mkdirSync(dirRespuestas, { recursive: true });
  }
  
  for (const pagina of edicion.paginas) {
    const nombreArchivo = `R${numeroEdicion}_pag${pagina.pagina.toString().padStart(2, '0')}.txt`;
    const rutaArchivo = path.join(dirEdicion, nombreArchivo);
    
    let prompt = PROMPT_BASE
      .replace('[EDICION]', numeroEdicion)
      .replace('[PAGINA]', pagina.pagina.toString())
      .replace('[FECHA]', edicion.info.fechaPublicacion);
    
    prompt += pagina.texto;
    prompt += '\n\nIMPORTANTE: Responde SOLO con JSON válido, sin texto adicional.';
    
    fs.writeFileSync(rutaArchivo, prompt, 'utf-8');
  }
  
  const info = {
    edicion: numeroEdicion,
    fechaPublicacion: edicion.info.fechaPublicacion,
    totalPaginas: edicion.paginas.length,
    totalCaracteres: edicion.totalCaracteres,
    esPdfCompleto: edicion.esPdfCompleto,
    fechaProcesamiento: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(dirEdicion, 'info.json'),
    JSON.stringify(info, null, 2),
    'utf-8'
  );
  
  const textoCompleto = edicion.paginas
    .map(p => `=== PÁGINA ${p.pagina} ===\n\n${p.texto}`)
    .join('\n\n');
  
  fs.writeFileSync(
    path.join(dirEdicion, 'texto-crudo.txt'),
    textoCompleto,
    'utf-8'
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(`
🔄 PROCESADOR AUTOMÁTICO DE TODAS LAS REVISTAS
${'='.repeat(60)}

Procesa todas las carpetas y PDFs encontrados en el directorio.

Uso:
  npx ts-node scripts/procesar-todas-revistas.ts <directorio-magazines>

Ejemplo:
  npx ts-node scripts/procesar-todas-revistas.ts ~/Desktop/Magazines
  npx ts-node scripts/procesar-todas-revistas.ts ~/OneDrive/Desktop/Magazines

Resultado:
  Cada revista se guarda en: ./output/revistas/R{numero}/
    `);
    process.exit(0);
  }
  
  const directorio = args[0];
  
  if (!fs.existsSync(directorio)) {
    console.error(`❌ El directorio no existe: ${directorio}`);
    process.exit(1);
  }
  
  console.log('🔄 PROCESANDO TODAS LAS REVISTAS');
  console.log('='.repeat(60));
  console.log(`   Directorio: ${directorio}`);
  
  const items = fs.readdirSync(directorio, { withFileTypes: true });
  
  const carpetas = items
    .filter(item => item.isDirectory() && item.name.match(/^R\d+/i))
    .map(item => ({ nombre: item.name, ruta: path.join(directorio, item.name) }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  
  const pdfs = items
    .filter(item => item.isFile() && item.name.toLowerCase().endsWith('.pdf') && item.name.match(/^R\d+/i))
    .map(item => ({ nombre: item.name, ruta: path.join(directorio, item.name) }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  
  const total = carpetas.length + pdfs.length;
  
  console.log(`\n📊 Encontradas: ${carpetas.length} carpetas + ${pdfs.length} PDFs = ${total} revistas`);
  console.log(`\n🚀 Iniciando procesamiento...\n`);
  
  const directorioSalida = './output/revistas';
  let procesadas = 0;
  let errores = 0;
  const erroresDetalle: string[] = [];
  
  // Procesar carpetas
  for (const carpeta of carpetas) {
    try {
      console.log(`\n📁 [${procesadas + 1}/${total}] Procesando carpeta: ${carpeta.nombre}`);
      const edicion = await procesarCarpetaPartida(carpeta.ruta);
      
      if (edicion) {
        generarPromptsParaEdicion(edicion, directorioSalida);
        procesadas++;
        console.log(`   ✅ Completada: R${edicion.info.numeroEdicion} (${edicion.paginas.length} páginas)`);
      } else {
        errores++;
        erroresDetalle.push(`Carpeta: ${carpeta.nombre} - No se pudo procesar`);
      }
    } catch (error: any) {
      errores++;
      erroresDetalle.push(`Carpeta: ${carpeta.nombre} - ${error.message}`);
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Procesar PDFs
  for (const pdf of pdfs) {
    try {
      console.log(`\n📄 [${procesadas + 1}/${total}] Procesando PDF: ${pdf.nombre}`);
      const edicion = await procesarPdfCompleto(pdf.ruta);
      
      if (edicion) {
        generarPromptsParaEdicion(edicion, directorioSalida);
        procesadas++;
        console.log(`   ✅ Completada: R${edicion.info.numeroEdicion} (${edicion.paginas.length} páginas)`);
      } else {
        errores++;
        erroresDetalle.push(`PDF: ${pdf.nombre} - No se pudo procesar`);
      }
    } catch (error: any) {
      errores++;
      erroresDetalle.push(`PDF: ${pdf.nombre} - ${error.message}`);
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(60));
  console.log(`   ✅ Procesadas exitosamente: ${procesadas}`);
  console.log(`   ❌ Errores: ${errores}`);
  console.log(`   📁 Revistas guardadas en: ${directorioSalida}`);
  
  if (erroresDetalle.length > 0) {
    console.log('\n⚠️  Errores detallados:');
    for (const error of erroresDetalle) {
      console.log(`   - ${error}`);
    }
  }
  
  console.log('\n✅ Procesamiento completado');
  console.log('\n💡 Próximos pasos:');
  console.log('   1. Revisa las revistas en ./output/revistas/');
  console.log('   2. Procesa los prompts con ChatGPT/Claude/Gemini');
  console.log('   3. Guarda las respuestas JSON en cada carpeta/respuestas/');
  console.log('   4. Usa consolidar-respuestas.ts para unir todo\n');
}

main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});




