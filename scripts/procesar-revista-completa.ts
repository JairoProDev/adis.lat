/**
 * Script para Procesar una Revista Completa
 * 
 * Extrae texto y genera prompts listos para los LLMs
 * 
 * Uso:
 *   # Para una carpeta con PDFs partidos
 *   npx ts-node scripts/procesar-revista-completa.ts --carpeta ~/Desktop/Magazines/R2538-del20al26-Junio
 * 
 *   # Para un PDF completo
 *   npx ts-node scripts/procesar-revista-completa.ts --pdf ~/Desktop/Magazines/R2587-del16al18-Diciembre.pdf
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  procesarCarpetaPartida, 
  procesarPdfCompleto, 
  EdicionExtraida 
} from './extraer-texto-pdfs';

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

/**
 * Genera prompts para una edición
 */
function generarPromptsParaEdicion(edicion: EdicionExtraida, directorioSalida: string): void {
  const numeroEdicion = edicion.info.numeroEdicion;
  const dirEdicion = path.join(directorioSalida, `R${numeroEdicion}`);
  
  // Crear directorio para esta edición
  if (!fs.existsSync(dirEdicion)) {
    fs.mkdirSync(dirEdicion, { recursive: true });
  }
  
  // Crear subdirectorios para respuestas
  const dirRespuestas = path.join(dirEdicion, 'respuestas');
  if (!fs.existsSync(dirRespuestas)) {
    fs.mkdirSync(dirRespuestas, { recursive: true });
  }
  
  console.log(`\n📝 Generando prompts para edición R${numeroEdicion}...`);
  console.log(`   Total de páginas: ${edicion.paginas.length}`);
  
  // Generar un prompt por página
  for (const pagina of edicion.paginas) {
    const nombreArchivo = `R${numeroEdicion}_pag${pagina.pagina.toString().padStart(2, '0')}.txt`;
    const rutaArchivo = path.join(dirEdicion, nombreArchivo);
    
    // Generar prompt
    let prompt = PROMPT_BASE
      .replace('[EDICION]', numeroEdicion)
      .replace('[PAGINA]', pagina.pagina.toString())
      .replace('[FECHA]', edicion.info.fechaPublicacion);
    
    prompt += pagina.texto;
    prompt += '\n\nIMPORTANTE: Responde SOLO con JSON válido, sin texto adicional.';
    
    // Guardar prompt
    fs.writeFileSync(rutaArchivo, prompt, 'utf-8');
  }
  
  // Crear archivo de información
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
  
  // Crear archivo de texto crudo (por si acaso)
  const textoCompleto = edicion.paginas
    .map(p => `=== PÁGINA ${p.pagina} ===\n\n${p.texto}`)
    .join('\n\n');
  
  fs.writeFileSync(
    path.join(dirEdicion, 'texto-crudo.txt'),
    textoCompleto,
    'utf-8'
  );
  
  console.log(`   ✓ ${edicion.paginas.length} prompts generados`);
  console.log(`   ✓ Guardado en: ${dirEdicion}`);
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length < 1 || args.includes('--help')) {
    console.log(`
📚 PROCESADOR DE REVISTA COMPLETA
${'='.repeat(50)}

Procesa una revista completa: extrae texto y genera prompts listos para LLMs.

Uso:
  # Para una carpeta con PDFs partidos (16 páginas)
  npx ts-node scripts/procesar-revista-completa.ts --carpeta <ruta-carpeta>

  # Para un PDF completo
  npx ts-node scripts/procesar-revista-completa.ts --pdf <ruta-pdf>

Ejemplo:
  npx ts-node scripts/procesar-revista-completa.ts --carpeta ~/Desktop/Magazines/R2538-del20al26-Junio
  npx ts-node scripts/procesar-revista-completa.ts --pdf ~/Desktop/Magazines/R2587-del16al18-Diciembre.pdf

Resultado:
  ./output/revistas/R{numero}/
    ├── info.json              # Información de la edición
    ├── texto-crudo.txt       # Texto completo (por si acaso)
    ├── R{numero}_pag01.txt   # Prompts listos para LLMs
    ├── R{numero}_pag02.txt
    └── ...
    `);
    process.exit(0);
  }
  
  let modo: 'carpeta' | 'pdf' | null = null;
  let rutaEntrada = '';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--carpeta') {
      modo = 'carpeta';
      rutaEntrada = args[++i] || '';
    } else if (args[i] === '--pdf') {
      modo = 'pdf';
      rutaEntrada = args[++i] || '';
    }
  }
  
  if (!modo || !rutaEntrada) {
    console.error('❌ Error: Debes especificar --carpeta o --pdf con una ruta');
    process.exit(1);
  }
  
  if (!fs.existsSync(rutaEntrada)) {
    console.error(`❌ Error: La ruta no existe: ${rutaEntrada}`);
    process.exit(1);
  }
  
  console.log('🚀 PROCESANDO REVISTA COMPLETA');
  console.log('='.repeat(50));
  console.log(`   Modo: ${modo}`);
  console.log(`   Entrada: ${rutaEntrada}`);
  
  // Procesar según el modo
  let edicion: EdicionExtraida | null = null;
  
  if (modo === 'carpeta') {
    edicion = await procesarCarpetaPartida(rutaEntrada);
  } else {
    edicion = await procesarPdfCompleto(rutaEntrada);
  }
  
  if (!edicion) {
    console.error('❌ Error: No se pudo procesar la revista');
    process.exit(1);
  }
  
  // Generar prompts
  const directorioSalida = './output/revistas';
  generarPromptsParaEdicion(edicion, directorioSalida);
  
  // Mostrar resumen
  console.log('\n' + '='.repeat(50));
  console.log('✅ REVISTA PROCESADA EXITOSAMENTE');
  console.log('='.repeat(50));
  console.log(`   Edición: R${edicion.info.numeroEdicion}`);
  console.log(`   Fecha: ${edicion.info.fechaPublicacion}`);
  console.log(`   Páginas: ${edicion.paginas.length}`);
  console.log(`   Caracteres: ${edicion.totalCaracteres.toLocaleString()}`);
  console.log(`\n📁 Archivos generados en: ./output/revistas/R${edicion.info.numeroEdicion}/`);
  console.log('\n📋 Próximos pasos:');
  console.log('   1. Abre los archivos .txt en ChatGPT/Claude/Gemini');
  console.log('   2. Copia cada prompt y pega en el LLM');
  console.log('   3. Guarda las respuestas JSON en respuestas/');
  console.log('   4. Procesa la siguiente revista mientras trabajas con los LLMs\n');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});





