/**
 * Script para Generar Prompts Listos para LLMs
 * 
 * Lee el JSON de texto extraído y genera archivos de texto listos
 * para copiar y pegar en ChatGPT, Claude y Gemini.
 * 
 * Divide el trabajo en 3 partes para procesamiento paralelo.
 * 
 * Uso:
 *   npx ts-node scripts/generar-prompts-llm.ts <ruta-json-extraido> [salida]
 */

import * as fs from 'fs';
import * as path from 'path';

interface PaginaExtraida {
  edicion: string;
  pagina: number;
  texto: string;
  archivo: string;
  caracteres: number;
}

interface EdicionExtraida {
  info: {
    numeroEdicion: string;
    fechaInicio: string;
    fechaFin: string;
    mes: string;
    año: number;
    fechaPublicacion: string;
  };
  paginas: PaginaExtraida[];
  totalPaginas: number;
}

interface ResultadoExtraccion {
  ediciones: EdicionExtraida[];
}

// Prompt base para extracción
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
 * Divide un array en N partes aproximadamente iguales
 */
function dividirEnPartes<T>(array: T[], partes: number): T[][] {
  const resultado: T[][] = [];
  const tamañoParte = Math.ceil(array.length / partes);
  
  for (let i = 0; i < partes; i++) {
    const inicio = i * tamañoParte;
    const fin = Math.min((i + 1) * tamañoParte, array.length);
    if (inicio < array.length) {
      resultado.push(array.slice(inicio, fin));
    }
  }
  
  return resultado;
}

/**
 * Genera el prompt completo para una página
 */
function generarPromptPagina(edicion: EdicionExtraida, pagina: PaginaExtraida): string {
  let prompt = PROMPT_BASE
    .replace('[EDICION]', edicion.info.numeroEdicion)
    .replace('[PAGINA]', pagina.pagina.toString())
    .replace('[FECHA]', edicion.info.fechaPublicacion);
  
  prompt += pagina.texto;
  prompt += '\n\nIMPORTANTE: Responde SOLO con JSON válido, sin texto adicional.';
  
  return prompt;
}

/**
 * Genera archivos de prompts divididos para 3 LLMs
 */
function generarPromptsDivididos(
  resultado: ResultadoExtraccion, 
  directorioSalida: string
): void {
  // Crear todas las páginas como lista plana
  const todasLasPaginas: { edicion: EdicionExtraida; pagina: PaginaExtraida }[] = [];
  
  for (const edicion of resultado.ediciones) {
    for (const pagina of edicion.paginas) {
      if (pagina.texto.trim().length > 50) { // Solo páginas con contenido significativo
        todasLasPaginas.push({ edicion, pagina });
      }
    }
  }
  
  console.log(`📊 Total de páginas con contenido: ${todasLasPaginas.length}`);
  
  // Dividir en 3 partes para ChatGPT, Claude y Gemini
  const partes = dividirEnPartes(todasLasPaginas, 3);
  const llms = ['chatgpt', 'claude', 'gemini'];
  
  // Crear directorios
  for (const llm of llms) {
    const dir = path.join(directorioSalida, llm);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Generar archivos de prompts
  for (let i = 0; i < partes.length; i++) {
    const llm = llms[i];
    const paginas = partes[i];
    const dirLlm = path.join(directorioSalida, llm);
    
    console.log(`\n📁 Generando prompts para ${llm.toUpperCase()}: ${paginas.length} páginas`);
    
    // Crear archivo índice para este LLM
    let indice = `# Prompts para ${llm.toUpperCase()}\n\n`;
    indice += `Total de páginas a procesar: ${paginas.length}\n\n`;
    indice += `## Lista de archivos:\n\n`;
    
    for (let j = 0; j < paginas.length; j++) {
      const { edicion, pagina } = paginas[j];
      const nombreArchivo = `R${edicion.info.numeroEdicion}_pag${pagina.pagina.toString().padStart(2, '0')}.txt`;
      const rutaArchivo = path.join(dirLlm, nombreArchivo);
      
      // Generar prompt
      const prompt = generarPromptPagina(edicion, pagina);
      
      // Guardar prompt
      fs.writeFileSync(rutaArchivo, prompt, 'utf-8');
      
      indice += `${j + 1}. ${nombreArchivo} (${pagina.caracteres} caracteres)\n`;
      
      process.stdout.write(`\r   ✓ Generados ${j + 1}/${paginas.length} prompts`);
    }
    
    // Guardar índice
    fs.writeFileSync(path.join(dirLlm, 'INDICE.md'), indice, 'utf-8');
    console.log('');
  }
  
  // Crear archivo de instrucciones generales
  const instrucciones = `
# 📚 INSTRUCCIONES PARA PROCESAR ANUNCIOS

## Distribución del trabajo:

- **ChatGPT (GPT-5 High)**: Carpeta \`chatgpt/\` - ${partes[0]?.length || 0} páginas
- **Claude (Opus 4.5)**: Carpeta \`claude/\` - ${partes[1]?.length || 0} páginas
- **Gemini (3 Pro)**: Carpeta \`gemini/\` - ${partes[2]?.length || 0} páginas

## Proceso para cada LLM:

1. **Abre el LLM** (ChatGPT/Claude/Gemini)
2. **Abre cada archivo .txt** de la carpeta correspondiente
3. **Copia TODO el contenido** del archivo
4. **Pégalo en el LLM** y envía
5. **Copia la respuesta JSON** del LLM
6. **Guarda la respuesta** en la carpeta \`respuestas/\` con el mismo nombre pero extensión \`.json\`

## Tips para mejor rendimiento:

### ChatGPT (GPT-5 High):
- Usa la versión web o API
- Puedes procesar varios prompts en una conversación
- Ideal para JSON estructurado

### Claude (Opus 4.5):
- Muy preciso en extracción
- Bueno con textos largos
- Puede procesar múltiples páginas juntas

### Gemini (3 Pro):
- Rápido para volumen
- Bueno con contexto
- Puede procesar en batches

## Estructura de respuestas esperada:

Guarda cada respuesta JSON en:
\`respuestas/{llm}/R{edicion}_pag{pagina}.json\`

Ejemplo:
\`respuestas/chatgpt/R2538_pag01.json\`

## Una vez terminado:

Ejecuta el script de consolidación:
\`\`\`bash
npx ts-node scripts/consolidar-respuestas.ts ./output/prompts
\`\`\`

Esto combinará todas las respuestas en un archivo final listo para cargar a la base de datos.
`;
  
  fs.writeFileSync(path.join(directorioSalida, 'INSTRUCCIONES.md'), instrucciones, 'utf-8');
  
  // Crear carpetas para respuestas
  for (const llm of llms) {
    const dirRespuestas = path.join(directorioSalida, 'respuestas', llm);
    if (!fs.existsSync(dirRespuestas)) {
      fs.mkdirSync(dirRespuestas, { recursive: true });
    }
  }
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(`
📝 GENERADOR DE PROMPTS PARA LLMs
${'='.repeat(50)}

Uso:
  npx ts-node scripts/generar-prompts-llm.ts <json-extraido> [salida]

Ejemplo:
  npx ts-node scripts/generar-prompts-llm.ts ./output/texto-extraido/texto-extraido.json ./output/prompts

Esto generará prompts divididos en 3 carpetas:
  - chatgpt/ - Para procesar en ChatGPT
  - claude/  - Para procesar en Claude
  - gemini/  - Para procesar en Gemini
    `);
    process.exit(0);
  }
  
  const rutaJson = args[0];
  const directorioSalida = args[1] || './output/prompts';
  
  if (!fs.existsSync(rutaJson)) {
    console.error(`❌ Error: No se encuentra el archivo: ${rutaJson}`);
    process.exit(1);
  }
  
  console.log('🚀 GENERANDO PROMPTS PARA LLMs');
  console.log('='.repeat(50));
  console.log(`   Entrada: ${rutaJson}`);
  console.log(`   Salida: ${directorioSalida}`);
  
  // Leer JSON de texto extraído
  const contenido = fs.readFileSync(rutaJson, 'utf-8');
  const resultado: ResultadoExtraccion = JSON.parse(contenido);
  
  console.log(`\n📚 Ediciones encontradas: ${resultado.ediciones.length}`);
  
  // Generar prompts
  generarPromptsDivididos(resultado, directorioSalida);
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ PROMPTS GENERADOS EXITOSAMENTE');
  console.log('='.repeat(50));
  console.log(`\n📁 Revisa las carpetas en: ${directorioSalida}`);
  console.log('📖 Lee INSTRUCCIONES.md para el proceso completo\n');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});









