/**
 * Script Principal de Procesamiento y Carga Directa
 * 
 * Procesa texto crudo de revistas, extrae anuncios con IA, limpia contactos,
 * parsea ubicaciones, detecta tamaños y carga directamente a Supabase.
 * 
 * Uso:
 *   npx tsx scripts/procesar-y-cargar-directo.ts [--revista R2538] [--todas] [--resumir]
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Importar función de conversión de supabase.ts
import { adisoToDb } from '@/lib/supabase';
import { Adiso, Categoria, TamañoPaquete, ContactoMultiple, UbicacionDetallada } from '@/types';
import { limpiarContactosDeDescripcion, extraerNumerosTelefono, extraerEmails, esWhatsApp } from '@/lib/limpiar-contactos';
import { parsearUbicacionCusco } from '@/lib/geocoding';
import { detectarTamañoVisual } from '@/lib/detectar-tamaño';
import { validarAnuncio, validarYNormalizarAnuncio } from '@/lib/validar-anuncio';

// Cargar variables de entorno
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Faltan variables de entorno de Supabase');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
  process.exit(1);
}

console.log(`🔗 Conectando a Supabase: ${supabaseUrl.substring(0, 30)}...`);

// Configurar fetch con timeout más largo y reintentos
const customFetch = async (url: string, options: any = {}) => {
  const maxRetries = 3;
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 segundos
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      lastError = error;
      if (error.name === 'AbortError' || error.message?.includes('timeout') || error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
        if (attempt < maxRetries) {
          console.log(`  ⚠️ Intento ${attempt} falló, reintentando en ${2 * attempt}s...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Backoff exponencial
          continue;
        }
        throw new Error(`Timeout después de ${maxRetries} intentos: La conexión a Supabase tardó más de 120 segundos`);
      }
      throw error;
    }
  }
  
  throw lastError;
};

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  global: {
    fetch: customFetch
  }
});

// Mapeo de tamaño a días de expiración
const DIAS_EXPIRACION: Record<TamañoPaquete, number> = {
  miniatura: 7,
  pequeño: 14,
  mediano: 21,
  grande: 30,
  gigante: 45
};

// Interfaces
interface InfoRevista {
  edicion: string;
  fechaPublicacion: string;
  totalPaginas: number;
  totalCaracteres: number;
  esPdfCompleto: boolean;
  fechaProcesamiento: string;
}

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

interface AnuncioExtraido {
  titulo: string;
  descripcion: string;
  contactos: ContactoMultiple[];
  ubicacionTexto: string;
  categoria: Categoria;
  tamaño?: TamañoPaquete;
  precio?: string;
}

/**
 * Calcula fecha de expiración basada en fecha de publicación y tamaño
 */
function calcularFechaExpiracion(fechaPublicacion: string, tamaño: TamañoPaquete): string {
  const fecha = new Date(fechaPublicacion);
  const dias = DIAS_EXPIRACION[tamaño] || 14;
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString();
}

/**
 * Normaliza contactos extraídos del texto
 */
function normalizarContactos(texto: string): ContactoMultiple[] {
  const contactos: ContactoMultiple[] = [];
  
  // Extraer números de teléfono
  const numeros = extraerNumerosTelefono(texto);
  numeros.forEach((numero, index) => {
    const esWhats = esWhatsApp(texto, numero);
    contactos.push({
      tipo: esWhats ? 'whatsapp' : 'telefono',
      valor: numero,
      principal: index === 0,
      etiqueta: esWhats ? 'WhatsApp' : 'Teléfono'
    });
  });
  
  // Extraer emails
  const emails = extraerEmails(texto);
  emails.forEach((email, index) => {
    contactos.push({
      tipo: 'email',
      valor: email,
      principal: numeros.length === 0 && index === 0,
      etiqueta: 'Email'
    });
  });
  
  return contactos;
}

/**
 * Detecta categoría de un anuncio basado en palabras clave
 */
function detectarCategoria(titulo: string, descripcion: string): Categoria {
  const texto = `${titulo} ${descripcion}`.toLowerCase();
  
  // Palabras clave por categoría
  const keywords: Record<Categoria, string[]> = {
    empleos: ['trabajo', 'empleo', 'busco', 'necesito', 'vacante', 'puesto', 'sueldo', 'salario', 'contrato', 'cv', 'curriculum'],
    inmuebles: ['casa', 'departamento', 'alquiler', 'venta', 'terreno', 'lote', 'inmueble', 'propiedad', 'habitación', 'cuarto'],
    vehiculos: ['auto', 'carro', 'moto', 'vehículo', 'camioneta', 'bus', 'combis', 'taxi', 'placa', 'kilometraje'],
    servicios: ['servicio', 'reparación', 'instalación', 'mantenimiento', 'limpieza', 'diseño', 'construcción', 'plomería', 'electricidad'],
    productos: ['venta', 'compro', 'vendo', 'producto', 'artículo', 'mercancía', 'oferta', 'descuento', 'precio'],
    eventos: ['evento', 'fiesta', 'celebración', 'concierto', 'show', 'festival', 'feria', 'exposición'],
    negocios: ['negocio', 'empresa', 'comercio', 'tienda', 'local', 'franquicia', 'inversión', 'socio'],
    comunidad: ['comunidad', 'ayuda', 'donación', 'voluntario', 'asociación', 'club', 'grupo']
  };
  
  // Contar coincidencias por categoría
  let mejorCategoria: Categoria = 'productos'; // Default
  let mejorPuntuacion = 0;
  
  for (const [categoria, palabras] of Object.entries(keywords)) {
    const puntuacion = palabras.reduce((acc, palabra) => {
      return acc + (texto.includes(palabra) ? 1 : 0);
    }, 0);
    
    if (puntuacion > mejorPuntuacion) {
      mejorPuntuacion = puntuacion;
      mejorCategoria = categoria as Categoria;
    }
  }
  
  return mejorCategoria;
}

/**
 * Filtra información de la revista (headers, footers, etc.) que no son anuncios
 */
function filtrarInfoRevista(texto: string): string {
  // Patrones de información de la revista a eliminar
  const patronesRevista = [
    /Precio\s+S\/\.?\s*\d+\.\d+\s*vía\s+aérea/gi,
    /Edición\s+Regional\s+Cusco[^\n]*/gi,
    /RuedadeNegocios/gi,
    /Encuentranos\s+en:/gi,
    /Www\.ruedadenegocios\.com\.pe/gi,
    /Oficina\s+(?:Wanchaq|San\s+Sebastián|Cusco):[^\n]*/gi,
    /Año:\s*\d+\s*\/\s*Edición:\s*\d+[^\n]*/gi,
    /Cusco,\s*del\s+\d+\s+al\s+\d+\s+de\s+\w+\s+del\s+\d+/gi,
    /LA\s+RADIO\s*\d+\.\d+\s*FM/gi,
    /Buscanos\s+como/gi,
    /Más\s+cerca\s+a\s+ti/gi,
    /Rueda\s+de\s+negocios/gi,
  ];
  
  let textoLimpio = texto;
  patronesRevista.forEach(patron => {
    textoLimpio = textoLimpio.replace(patron, '');
  });
  
  return textoLimpio;
}

/**
 * Detecta separadores de anuncios en el texto
 */
function detectarSeparadoresAnuncios(texto: string): number[] {
  const separadores: number[] = [0]; // Inicio del texto
  const lineas = texto.split('\n');
  
  for (let i = 1; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    const lineaAnterior = lineas[i - 1].trim();
    
    // Separador: línea en blanco seguida de título en mayúsculas
    if (lineaAnterior === '' && linea.length > 5 && linea === linea.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(linea)) {
      separadores.push(i);
      continue;
    }
    
    // Separador: línea con solo números de teléfono (contacto al inicio de anuncio)
    if (/^(?:Cel|Cel\.|Telf|Telf\.|Tel|Tel\.|WhatsApp|WA)\s*:?\s*\d+/.test(linea) && lineaAnterior === '') {
      separadores.push(i);
      continue;
    }
    
    // Separador: patrón de anuncio nuevo (título destacado después de espacio)
    if (lineaAnterior === '' && /^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{10,}$/.test(linea)) {
      separadores.push(i);
      continue;
    }
    
    // Separador: múltiples líneas en blanco (2+)
    if (lineaAnterior === '' && linea === '' && i > 1 && lineas[i - 2].trim() !== '') {
      separadores.push(i);
      continue;
    }
  }
  
  separadores.push(lineas.length); // Fin del texto
  return separadores;
}

/**
 * Analiza una página de texto y extrae anuncios individuales
 * 
 * Esta función usa análisis inteligente para identificar anuncios separados
 */
function extraerAnunciosDePagina(textoPagina: string, numeroPagina: number): AnuncioExtraido[] {
  const anuncios: AnuncioExtraido[] = [];
  
  if (!textoPagina || textoPagina.trim().length < 20) {
    return anuncios; // Página muy corta, probablemente no tiene anuncios
  }
  
  // 1. Filtrar información de la revista
  let textoLimpio = filtrarInfoRevista(textoPagina);
  
  // 2. Detectar separadores de anuncios
  const separadores = detectarSeparadoresAnuncios(textoLimpio);
  const lineas = textoLimpio.split('\n');
  
  // 3. Extraer cada anuncio entre separadores
  for (let i = 0; i < separadores.length - 1; i++) {
    const inicio = separadores[i];
    const fin = separadores[i + 1];
    const bloqueLineas = lineas.slice(inicio, fin).map(l => l.trim()).filter(l => l.length > 0);
    
    if (bloqueLineas.length === 0) {
      continue;
    }
    
    const bloqueTexto = bloqueLineas.join('\n').trim();
    
    // Validar que el bloque tiene contenido suficiente
    if (bloqueTexto.length < 30) {
      continue;
    }
    
    // Extraer contactos primero para validar que es un anuncio
    const contactos = normalizarContactos(bloqueTexto);
    
    // Si no hay contactos, probablemente no es un anuncio válido
    if (contactos.length === 0) {
      continue;
    }
    
    // Extraer título (primera línea en mayúsculas o primera línea destacada)
    let titulo = '';
    let descripcion = '';
    
    // Buscar título en las primeras líneas
    for (let j = 0; j < Math.min(5, bloqueLineas.length); j++) {
      const linea = bloqueLineas[j];
      
      // Título: línea en mayúsculas con más de 5 caracteres
      if (!titulo && linea.length > 5 && linea === linea.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(linea)) {
        titulo = linea.substring(0, 100);
        descripcion = bloqueLineas.slice(j + 1).join(' ').trim();
        break;
      }
      
      // Título: línea que parece título (palabras en mayúsculas al inicio)
      if (!titulo && /^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]{5,}$/.test(linea) && linea.length < 80) {
        // Verificar que no es solo un número o precio
        if (!/^\d+\.?\d*$/.test(linea) && !/^S\/\.?\s*\d+/.test(linea)) {
          titulo = linea.substring(0, 100);
          descripcion = bloqueLineas.slice(j + 1).join(' ').trim();
          break;
        }
      }
    }
    
    // Si no se encontró título, usar primera línea como título
    if (!titulo && bloqueLineas.length > 0) {
      const primeraLinea = bloqueLineas[0];
      // Evitar usar números o precios como título
      if (!/^\d+\.?\d*$/.test(primeraLinea) && !/^S\/\.?\s*\d+/.test(primeraLinea)) {
        titulo = primeraLinea.substring(0, 100);
        descripcion = bloqueLineas.slice(1).join(' ').trim();
      } else {
        // Si la primera línea es un número, buscar la siguiente línea válida
        if (bloqueLineas.length > 1) {
          titulo = bloqueLineas[1].substring(0, 100);
          descripcion = bloqueLineas.slice(2).join(' ').trim();
        } else {
          continue; // Bloque inválido
        }
      }
    }
    
    // Si aún no hay título, usar las primeras palabras del bloque
    if (!titulo) {
      const palabras = bloqueTexto.split(/\s+/).slice(0, 10).join(' ');
      titulo = palabras.substring(0, 100);
      descripcion = bloqueTexto.substring(palabras.length).trim();
    }
    
    // Limpiar descripción de información redundante
    descripcion = descripcion
      .replace(/^(?:Cel|Cel\.|Telf|Telf\.|Tel|Tel\.|WhatsApp|WA)\s*:?\s*\d+[^\n]*/gmi, '') // Contactos al inicio
      .replace(/\n{3,}/g, '\n\n') // Múltiples saltos de línea
      .trim();
    
    // Validar que tenemos contenido mínimo
    if (titulo.length < 3 || descripcion.length < 10) {
      continue;
    }
    
    // Extraer ubicación
    const ubicacionTexto = bloqueTexto;
    
    // Detectar categoría
    const categoria = detectarCategoria(titulo, descripcion);
    
    // Detectar tamaño visual (usar solo el texto del anuncio, no toda la página)
    const tamaño = detectarTamañoVisual(bloqueTexto, titulo);
    
    // Extraer precio si existe
    const precioMatch = bloqueTexto.match(/(?:S\/\.?|soles?|precio|desde|a\s+más)\s*:?\s*(\d+(?:\.\d+)?)/i);
    const precio = precioMatch ? precioMatch[1] : undefined;
    
    anuncios.push({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      contactos,
      ubicacionTexto,
      categoria,
      tamaño,
      precio
    });
  }
  
  return anuncios;
}

/**
 * Convierte un anuncio extraído a formato Adiso para la BD
 */
function convertirAAdiso(
  anuncio: AnuncioExtraido,
  infoRevista: InfoRevista,
  numeroPagina: number
): Adiso | null {
  // Limpiar descripción de contactos
  const descripcionLimpia = limpiarContactosDeDescripcion(
    anuncio.descripcion,
    anuncio.contactos
  );
  
  // Parsear ubicación
  const ubicacionDetallada = parsearUbicacionCusco(anuncio.ubicacionTexto);
  
  if (!ubicacionDetallada) {
    console.warn(`  ⚠️ No se pudo parsear ubicación: ${anuncio.ubicacionTexto.substring(0, 50)}`);
    // Usar Cusco como default
    const ubicacionDefault: UbicacionDetallada = {
      pais: 'Perú',
      departamento: 'Cusco',
      provincia: 'Cusco',
      distrito: 'Cusco',
      latitud: -13.5319,
      longitud: -71.9675
    };
    return convertirAAdisoConUbicacion(anuncio, infoRevista, numeroPagina, descripcionLimpia, ubicacionDefault);
  }
  
  return convertirAAdisoConUbicacion(anuncio, infoRevista, numeroPagina, descripcionLimpia, ubicacionDetallada);
}

function convertirAAdisoConUbicacion(
  anuncio: AnuncioExtraido,
  infoRevista: InfoRevista,
  numeroPagina: number,
  descripcionLimpia: string,
  ubicacion: UbicacionDetallada
): Adiso | null {
  // Obtener contacto principal
  const contactoPrincipal = anuncio.contactos.find(c => c.principal) || anuncio.contactos[0];
  const contactoString = contactoPrincipal?.valor || '';
  
  // Calcular fecha de expiración
  const tamaño = anuncio.tamaño || 'pequeño';
  const fechaExpiracion = calcularFechaExpiracion(infoRevista.fechaPublicacion, tamaño);
  
  // Generar ID único
  const id = `${infoRevista.edicion}-${numeroPagina}-${uuidv4().substring(0, 8)}`;
  
  const adiso: Adiso = {
    id,
    categoria: anuncio.categoria,
    titulo: anuncio.titulo.substring(0, 100),
    descripcion: descripcionLimpia.substring(0, 2000),
    contacto: contactoString,
    ubicacion,
    fechaPublicacion: infoRevista.fechaPublicacion,
    horaPublicacion: '00:00',
    tamaño,
    esHistorico: true,
    estaActivo: false, // Todos los históricos inician como inactivos
    fuenteOriginal: 'rueda_negocios',
    edicionNumero: infoRevista.edicion,
    fechaPublicacionOriginal: infoRevista.fechaPublicacion,
    contactosMultiples: anuncio.contactos.length > 0 ? anuncio.contactos : undefined,
    fechaExpiracion
  };
  
  // Validar anuncio
  const validacion = validarAnuncio(adiso);
  if (!validacion.valido) {
    console.warn(`  ⚠️ Anuncio inválido: ${validacion.errores.join(', ')}`);
    return null;
  }
  
  return validarYNormalizarAnuncio(adiso);
}

/**
 * Carga anuncios a Supabase en chunks
 */
async function cargarAnuncios(
  anuncios: Adiso[],
  chunkSize: number = 500
): Promise<{ exitosos: number; errores: number; erroresDetalle: string[] }> {
  let exitosos = 0;
  let errores = 0;
  const erroresDetalle: string[] = [];
  
  // Dividir en chunks
  const chunks: Adiso[][] = [];
  for (let i = 0; i < anuncios.length; i += chunkSize) {
    chunks.push(anuncios.slice(i, i + chunkSize));
  }
  
  console.log(`  📦 Cargando ${anuncios.length} anuncios en ${chunks.length} chunks...`);
  
  // Usar inserción individual para evitar timeouts en conexiones lentas (WSL2)
  // Batch es más eficiente pero falla con timeouts en este entorno
  const usarInsercionIndividual = true; // Siempre usar inserción individual para evitar timeouts
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    try {
      // Convertir a formato de BD usando la función exportada
      const chunkDb = chunk.map(adiso => adisoToDb(adiso));
      
      if (usarInsercionIndividual) {
        // Insertar uno por uno solo para grupos muy pequeños (evita timeouts en conexiones lentas)
        let exitososChunk = 0;
        let erroresChunk = 0;
        
        for (const anuncioDb of chunkDb) {
          try {
            const { error } = await supabase
              .from('adisos')
              .upsert(anuncioDb, {
                onConflict: 'id',
                ignoreDuplicates: false
              });
            
            if (error) {
              erroresChunk++;
              erroresDetalle.push(`Anuncio ${anuncioDb.id}: ${error.message}`);
            } else {
              exitososChunk++;
            }
            
            // Pequeña pausa entre inserciones para no sobrecargar
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (error: any) {
            erroresChunk++;
            erroresDetalle.push(`Anuncio ${anuncioDb.id}: ${error.message}`);
          }
        }
        
        exitosos += exitososChunk;
        errores += erroresChunk;
        process.stdout.write(`\r    ✓ ${Math.min((i + 1) * chunkSize, anuncios.length)}/${anuncios.length} anuncios cargados (${exitososChunk} exitosos, ${erroresChunk} errores)`);
      } else {
        // Insertar en batch
        const { data, error } = await supabase
          .from('adisos')
          .upsert(chunkDb, {
            onConflict: 'id',
            ignoreDuplicates: false
          });
        
        if (error) {
          errores += chunk.length;
          const errorMsg = `Chunk ${i + 1}: ${error.message}${error.code ? ` (Code: ${error.code})` : ''}${error.details ? ` - ${error.details}` : ''}`;
          erroresDetalle.push(errorMsg);
          console.error(`  ❌ Error en chunk ${i + 1}: ${error.message}${error.code ? ` (${error.code})` : ''}`);
          if (error.details) {
            console.error(`     Detalles: ${error.details}`);
          }
          if (error.hint) {
            console.error(`     Hint: ${error.hint}`);
          }
        } else {
          exitosos += chunk.length;
          process.stdout.write(`\r    ✓ ${Math.min((i + 1) * chunkSize, anuncios.length)}/${anuncios.length} anuncios cargados`);
        }
      }
    } catch (error: any) {
      errores += chunk.length;
      const errorMsg = error.message || String(error);
      erroresDetalle.push(`Chunk ${i + 1}: ${errorMsg}`);
      console.error(`  ❌ Error en chunk ${i + 1}: ${errorMsg}`);
      
      // Mostrar más detalles del error si está disponible
      if (error.cause) {
        console.error(`     Causa: ${error.cause}`);
      }
      if (error.stack) {
        console.error(`     Stack: ${error.stack.split('\n')[0]}`);
      }
    }
  }
  
  console.log('');
  
  return { exitosos, errores, erroresDetalle };
}

/**
 * Lee y guarda progreso de procesamiento
 */
function leerProgreso(): ProgresoProcesamiento {
  const rutaProgreso = path.join(process.cwd(), 'output', 'progreso-procesamiento.json');
  
  if (fs.existsSync(rutaProgreso)) {
    try {
      const contenido = fs.readFileSync(rutaProgreso, 'utf-8');
      return JSON.parse(contenido);
    } catch (error) {
      console.warn('⚠️ Error al leer progreso, iniciando nuevo');
    }
  }
  
  return {
    fechaInicio: new Date().toISOString(),
    ultimaActualizacion: new Date().toISOString(),
    revistas: {},
    estadisticas: {
      totalRevistas: 0,
      revistasCompletadas: 0,
      totalAnuncios: 0,
      totalCargados: 0,
      totalErrores: 0
    }
  };
}

function guardarProgreso(progreso: ProgresoProcesamiento): void {
  const rutaProgreso = path.join(process.cwd(), 'output', 'progreso-procesamiento.json');
  const directorio = path.dirname(rutaProgreso);
  
  if (!fs.existsSync(directorio)) {
    fs.mkdirSync(directorio, { recursive: true });
  }
  
  progreso.ultimaActualizacion = new Date().toISOString();
  fs.writeFileSync(rutaProgreso, JSON.stringify(progreso, null, 2), 'utf-8');
}

/**
 * Procesa una revista completa
 * 
 * OPCIONES:
 * 1. Si existe anuncios-estructurados.json, lo usa directamente (proceso de 3 pasos)
 * 2. Si no existe, extrae y estructura en el mismo paso (proceso directo)
 */
async function procesarRevista(codigoRevista: string, resumir: boolean = false): Promise<void> {
  console.log(`\n📚 Procesando revista: ${codigoRevista}`);
  
  const rutaRevista = path.join(process.cwd(), 'output', 'revistas', codigoRevista);
  const rutaTexto = path.join(rutaRevista, 'texto-crudo.txt');
  const rutaInfo = path.join(rutaRevista, 'info.json');
  const rutaEstructurados = path.join(rutaRevista, 'anuncios-estructurados.json');
  
  if (!fs.existsSync(rutaTexto)) {
    console.error(`  ❌ No se encuentra texto-crudo.txt en ${rutaRevista}`);
    return;
  }
  
  if (!fs.existsSync(rutaInfo)) {
    console.error(`  ❌ No se encuentra info.json en ${rutaRevista}`);
    return;
  }
  
  // Leer info de la revista
  const infoRevista: InfoRevista = JSON.parse(fs.readFileSync(rutaInfo, 'utf-8'));
  
  let anunciosExtraidos: Adiso[] = [];
  const errores: string[] = [];
  
  // OPCIÓN 1: Usar anuncios ya estructurados (proceso de 3 pasos)
  if (fs.existsSync(rutaEstructurados)) {
    console.log(`  📋 Usando anuncios ya estructurados...`);
    const estructurados = JSON.parse(fs.readFileSync(rutaEstructurados, 'utf-8'));
    
    for (const anuncioEstructurado of estructurados.anuncios || []) {
      const anuncioExtraido: AnuncioExtraido = {
        titulo: anuncioEstructurado.titulo,
        descripcion: anuncioEstructurado.descripcion,
        contactos: anuncioEstructurado.contactos,
        ubicacionTexto: anuncioEstructurado.ubicacionTexto,
        categoria: anuncioEstructurado.categoria,
        tamaño: anuncioEstructurado.tamaño,
        precio: anuncioEstructurado.precio
      };
      
      const adiso = convertirAAdiso(anuncioExtraido, infoRevista, anuncioEstructurado.pagina);
      if (adiso) {
        anunciosExtraidos.push(adiso);
      } else {
        errores.push(`Anuncio ${anuncioEstructurado.numeroAnuncio} página ${anuncioEstructurado.pagina}: Inválido`);
      }
    }
    
    console.log(`  📊 ${anunciosExtraidos.length} anuncios listos para cargar`);
  } else {
    // OPCIÓN 2: Extraer y estructurar en el mismo paso (proceso directo)
    console.log(`  📄 Extrayendo y estructurando anuncios...`);
    
    const textoCrudo = fs.readFileSync(rutaTexto, 'utf-8');
    const paginas = textoCrudo.split(/=== PÁGINA \d+ ===/).filter(p => p.trim().length > 0);
    
    console.log(`  📄 ${paginas.length} páginas encontradas`);
    
    for (let i = 0; i < paginas.length; i++) {
      const numeroPagina = i + 1;
      const textoPagina = paginas[i];
      
      if (resumir && numeroPagina % 5 !== 0 && numeroPagina !== 1) {
        continue;
      }
      
      try {
        const anunciosPagina = extraerAnunciosDePagina(textoPagina, numeroPagina);
        
        for (const anuncioExtraido of anunciosPagina) {
          const adiso = convertirAAdiso(anuncioExtraido, infoRevista, numeroPagina);
          
          if (adiso) {
            anunciosExtraidos.push(adiso);
          } else {
            errores.push(`Página ${numeroPagina}: Anuncio inválido`);
          }
        }
        
        if (!resumir || numeroPagina % 10 === 0) {
          process.stdout.write(`\r  ✓ Página ${numeroPagina}/${paginas.length} - ${anunciosExtraidos.length} anuncios extraídos`);
        }
      } catch (error: any) {
        errores.push(`Página ${numeroPagina}: ${error.message}`);
        console.error(`\n  ❌ Error en página ${numeroPagina}: ${error.message}`);
      }
    }
    
    console.log(`\n  📊 Total anuncios extraídos: ${anunciosExtraidos.length}`);
  }
  
  // Cargar a Supabase
  if (anunciosExtraidos.length > 0) {
    console.log(`  📤 Cargando a Supabase...`);
    const resultado = await cargarAnuncios(anunciosExtraidos, 500);
    
    console.log(`  ✅ Cargados: ${resultado.exitosos}, Errores: ${resultado.errores}`);
    
    if (resultado.erroresDetalle.length > 0) {
      errores.push(...resultado.erroresDetalle);
    }
    
    // Actualizar progreso
    const progreso = leerProgreso();
    progreso.revistas[codigoRevista] = {
      estado: 'completada',
      paginasProcesadas: infoRevista.totalPaginas,
      anunciosExtraidos: anunciosExtraidos.length,
      anunciosCargados: resultado.exitosos,
      errores: errores.length > 0 ? errores : undefined,
      fechaCompletado: new Date().toISOString()
    };
    progreso.estadisticas.totalAnuncios += anunciosExtraidos.length;
    progreso.estadisticas.totalCargados += resultado.exitosos;
    progreso.estadisticas.totalErrores += resultado.errores;
    progreso.estadisticas.revistasCompletadas += 1;
    guardarProgreso(progreso);
  }
  
  console.log(`  ✅ Revista ${codigoRevista} procesada\n`);
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
📚 PROCESADOR Y CARGADOR DIRECTO DE REVISTAS
${'='.repeat(50)}

Uso:
  npx tsx scripts/procesar-y-cargar-directo.ts [opciones]

Opciones:
  --revista <codigo>  Procesar una revista específica (ej: R2538)
  --todas            Procesar todas las revistas encontradas
  --resumir          Modo resumen (solo cada 5 páginas, para pruebas)
  --help             Mostrar ayuda

Ejemplos:
  npx tsx scripts/procesar-y-cargar-directo.ts --revista R2538
  npx tsx scripts/procesar-y-cargar-directo.ts --revista R2538 --resumir
  npx tsx scripts/procesar-y-cargar-directo.ts --todas
    `);
    process.exit(0);
  }
  
  const revistaIndex = args.indexOf('--revista');
  const codigoRevista = revistaIndex >= 0 && args[revistaIndex + 1] ? args[revistaIndex + 1] : null;
  const todas = args.includes('--todas');
  const resumir = args.includes('--resumir');
  
  const rutaRevistas = path.join(process.cwd(), 'output', 'revistas');
  
  if (!fs.existsSync(rutaRevistas)) {
    console.error(`❌ No se encuentra el directorio de revistas: ${rutaRevistas}`);
    process.exit(1);
  }
  
  if (codigoRevista) {
    // Procesar una revista específica
    await procesarRevista(codigoRevista, resumir);
  } else if (todas) {
    // Procesar todas las revistas
    const revistas = fs.readdirSync(rutaRevistas).filter(d => {
      const ruta = path.join(rutaRevistas, d);
      return fs.statSync(ruta).isDirectory() && fs.existsSync(path.join(ruta, 'texto-crudo.txt'));
    });
    
    console.log(`📚 Encontradas ${revistas.length} revistas para procesar\n`);
    
    for (const revista of revistas) {
      await procesarRevista(revista, resumir);
    }
    
    const progreso = leerProgreso();
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 RESUMEN FINAL`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Revistas procesadas: ${progreso.estadisticas.revistasCompletadas}/${progreso.estadisticas.totalRevistas}`);
    console.log(`Anuncios extraídos: ${progreso.estadisticas.totalAnuncios}`);
    console.log(`Anuncios cargados: ${progreso.estadisticas.totalCargados}`);
    console.log(`Errores: ${progreso.estadisticas.totalErrores}`);
  } else {
    console.error('❌ Debes especificar --revista <codigo> o --todas');
    process.exit(1);
  }
}

// Ejecutar
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

export { procesarRevista, extraerAnunciosDePagina };

