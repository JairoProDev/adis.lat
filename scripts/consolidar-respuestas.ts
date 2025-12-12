/**
 * Script para Consolidar Respuestas de los LLMs
 * 
 * Lee todos los archivos JSON de respuestas y los consolida
 * en un formato listo para cargar a la base de datos.
 * 
 * Uso:
 *   npx ts-node scripts/consolidar-respuestas.ts <directorio-prompts> [salida]
 */

import * as fs from 'fs';
import * as path from 'path';

interface Contacto {
  tipo: 'telefono' | 'whatsapp' | 'email';
  valor: string;
  principal?: boolean;
  etiqueta?: string;
}

interface AnuncioExtraido {
  titulo: string;
  descripcion: string;
  categoria: string;
  contactos: Contacto[];
  ubicacion: string;
  tamaño_visual: string;
  precio?: string;
  fecha_publicacion?: string;
}

interface RespuestaLLM {
  edicion: string;
  pagina: number;
  fecha_publicacion: string;
  anuncios: AnuncioExtraido[];
}

interface AnuncioConsolidado extends AnuncioExtraido {
  id: string;
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

/**
 * Genera un ID único para el anuncio
 */
function generarId(edicion: string, pagina: number, index: number): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `rn-${edicion}-${pagina}-${index}-${timestamp}${random}`;
}

/**
 * Normaliza un número de teléfono
 */
function normalizarTelefono(numero: string): string {
  // Eliminar todo excepto números
  let normalizado = numero.replace(/\D/g, '');

  // Si empieza con 51 (código de Perú) y tiene más de 9 dígitos, quitar el 51
  if (normalizado.startsWith('51') && normalizado.length > 9) {
    normalizado = normalizado.substring(2);
  }

  return normalizado;
}

/**
 * Valida y limpia un anuncio
 */
function validarAnuncio(anuncio: AnuncioExtraido): AnuncioExtraido | null {
  // Validar campos requeridos
  if (!anuncio.titulo || anuncio.titulo.trim().length < 3) {
    return null;
  }

  if (!anuncio.descripcion || anuncio.descripcion.trim().length < 10) {
    return null;
  }

  // Normalizar contactos
  const contactosValidos: Contacto[] = [];
  if (anuncio.contactos && Array.isArray(anuncio.contactos)) {
    for (const contacto of anuncio.contactos) {
      if (contacto.valor) {
        const valorNormalizado = contacto.tipo === 'email'
          ? contacto.valor.toLowerCase().trim()
          : normalizarTelefono(contacto.valor);

        if (valorNormalizado.length >= 6) {
          contactosValidos.push({
            ...contacto,
            valor: valorNormalizado
          });
        }
      }
    }
  }

  // Normalizar categoría
  const categoriasValidas = ['empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad'];
  let categoria = (anuncio.categoria || 'servicios').toLowerCase().trim();
  if (!categoriasValidas.includes(categoria)) {
    categoria = 'servicios'; // Default
  }

  // Normalizar tamaño
  const tamañosValidos = ['miniatura', 'pequeño', 'mediano', 'grande', 'gigante'];
  let tamaño = (anuncio.tamaño_visual || 'pequeño').toLowerCase().trim();
  if (!tamañosValidos.includes(tamaño)) {
    tamaño = 'pequeño';
  }

  return {
    ...anuncio,
    titulo: anuncio.titulo.trim().substring(0, 100),
    descripcion: anuncio.descripcion.trim().substring(0, 2000),
    categoria,
    contactos: contactosValidos,
    ubicacion: anuncio.ubicacion || 'Cusco, Cusco, Cusco',
    tamaño_visual: tamaño,
    precio: anuncio.precio || undefined
  };
}

/**
 * Lee y procesa un archivo JSON de respuesta
 */
function procesarArchivoRespuesta(rutaArchivo: string): RespuestaLLM | null {
  try {
    const contenido = fs.readFileSync(rutaArchivo, 'utf-8');

    // Intentar parsear el JSON
    // A veces los LLMs agregan texto antes/después del JSON
    let json = contenido.trim();

    // Buscar el inicio y fin del JSON
    const inicioJson = json.indexOf('{');
    const finJson = json.lastIndexOf('}');

    if (inicioJson !== -1 && finJson !== -1 && finJson > inicioJson) {
      json = json.substring(inicioJson, finJson + 1);
    }

    const respuesta: RespuestaLLM = JSON.parse(json);

    // Validar estructura
    if (!respuesta.anuncios || !Array.isArray(respuesta.anuncios)) {
      console.warn(`   ⚠ Archivo sin anuncios válidos: ${path.basename(rutaArchivo)}`);
      return null;
    }

    return respuesta;
  } catch (error: any) {
    console.warn(`   ⚠ Error al procesar ${path.basename(rutaArchivo)}: ${error.message}`);
    return null;
  }
}

/**
 * Consolida todas las respuestas de un directorio de LLM
 */
function consolidarDirectorioLLM(directorioRespuestas: string): AnuncioConsolidado[] {
  const anuncios: AnuncioConsolidado[] = [];

  if (!fs.existsSync(directorioRespuestas)) {
    return anuncios;
  }

  const archivos = fs.readdirSync(directorioRespuestas)
    .filter(f => f.endsWith('.json'))
    .sort();

  for (const archivo of archivos) {
    const rutaCompleta = path.join(directorioRespuestas, archivo);
    const respuesta = procesarArchivoRespuesta(rutaCompleta);

    if (respuesta && respuesta.anuncios) {
      for (let i = 0; i < respuesta.anuncios.length; i++) {
        const anuncioValidado = validarAnuncio(respuesta.anuncios[i]);

        if (anuncioValidado) {
          const anuncioConsolidado: AnuncioConsolidado = {
            ...anuncioValidado,
            id: generarId(respuesta.edicion, respuesta.pagina, i),
            edicion: respuesta.edicion,
            pagina: respuesta.pagina,
            fuente_original: 'rueda_negocios',
            fecha_publicacion_original: respuesta.fecha_publicacion,
            es_historico: true,
            esta_activo: false
          };

          anuncios.push(anuncioConsolidado);
        }
      }
    }
  }

  return anuncios;
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
📊 CONSOLIDADOR DE RESPUESTAS DE LLMs
${'='.repeat(50)}

Uso:
  npx ts-node scripts/consolidar-respuestas.ts <directorio-prompts> [salida]

Ejemplo:
  npx ts-node scripts/consolidar-respuestas.ts ./output/prompts ./output/anuncios-consolidados.json

Estructura esperada:
  directorio-prompts/
    respuestas/
      chatgpt/
        R2538_pag01.json
        R2538_pag02.json
        ...
      claude/
        ...
      gemini/
        ...
    `);
    process.exit(0);
  }

  const directorioPrompts = args[0];
  const archivoSalida = args[1] || './output/anuncios-consolidados.json';

  const directorioRespuestas = path.join(directorioPrompts, 'respuestas');

  if (!fs.existsSync(directorioRespuestas)) {
    console.error(`❌ Error: No se encuentra el directorio de respuestas: ${directorioRespuestas}`);
    console.error('   Asegúrate de haber guardado las respuestas de los LLMs ahí.');
    process.exit(1);
  }

  console.log('🔄 CONSOLIDANDO RESPUESTAS DE LLMs');
  console.log('='.repeat(50));

  const todosLosAnuncios: AnuncioConsolidado[] = [];
  const llms = ['chatgpt', 'claude', 'gemini'];

  for (const llm of llms) {
    const dirLlm = path.join(directorioRespuestas, llm);
    console.log(`\n📁 Procesando ${llm.toUpperCase()}...`);

    const anuncios = consolidarDirectorioLLM(dirLlm);
    console.log(`   ✓ ${anuncios.length} anuncios extraídos`);

    todosLosAnuncios.push(...anuncios);
  }

  // Calcular estadísticas
  const porCategoria: { [key: string]: number } = {};
  const porEdicion: { [key: string]: number } = {};

  for (const anuncio of todosLosAnuncios) {
    porCategoria[anuncio.categoria] = (porCategoria[anuncio.categoria] || 0) + 1;
    porEdicion[anuncio.edicion] = (porEdicion[anuncio.edicion] || 0) + 1;
  }

  // Crear resultado consolidado
  const resultado: ResultadoConsolidado = {
    fechaConsolidacion: new Date().toISOString(),
    totalAnuncios: todosLosAnuncios.length,
    porCategoria,
    porEdicion,
    anuncios: todosLosAnuncios
  };

  // Crear directorio de salida si no existe
  const dirSalida = path.dirname(archivoSalida);
  if (!fs.existsSync(dirSalida)) {
    fs.mkdirSync(dirSalida, { recursive: true });
  }

  // Guardar resultado
  fs.writeFileSync(archivoSalida, JSON.stringify(resultado, null, 2), 'utf-8');

  // Mostrar estadísticas
  console.log('\n' + '='.repeat(50));
  console.log('📊 ESTADÍSTICAS FINALES');
  console.log('='.repeat(50));
  console.log(`   Total de anuncios: ${resultado.totalAnuncios}`);
  console.log(`   Ediciones procesadas: ${Object.keys(porEdicion).length}`);
  console.log('\n   Por categoría:');
  for (const [cat, count] of Object.entries(porCategoria).sort((a, b) => b[1] - a[1])) {
    console.log(`     - ${cat}: ${count}`);
  }
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Resultado guardado en: ${archivoSalida}`);
  console.log('\n🚀 Siguiente paso: Cargar a la base de datos con:');
  console.log(`   npx ts-node scripts/cargar-anuncios-masivo.ts ${archivoSalida}`);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});









