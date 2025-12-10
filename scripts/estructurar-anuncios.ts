/**
 * Script para Estructurar Anuncios (Paso 2 del proceso)
 * 
 * Lee texto crudo y separa correctamente los anuncios individuales
 * Usa análisis inteligente mejorado para identificar separadores
 * 
 * Uso:
 *   npx tsx scripts/estructurar-anuncios.ts --revista R2538 [--usar-llm]
 */

import * as fs from 'fs';
import * as path from 'path';
import { AnuncioExtraido, Categoria, TamañoPaquete, ContactoMultiple } from '@/types';
import { limpiarContactosDeDescripcion, extraerNumerosTelefono, extraerEmails, esWhatsApp } from '@/lib/limpiar-contactos';
import { parsearUbicacionCusco } from '@/lib/geocoding';
import { detectarTamañoVisual } from '@/lib/detectar-tamaño';

interface InfoRevista {
  edicion: string;
  fechaPublicacion: string;
  totalPaginas: number;
  totalCaracteres: number;
  esPdfCompleto: boolean;
  fechaProcesamiento: string;
}

interface AnuncioEstructurado {
  titulo: string;
  descripcion: string;
  contactos: ContactoMultiple[];
  ubicacionTexto: string;
  categoria: Categoria;
  tamaño: TamañoPaquete;
  precio?: string;
  pagina: number;
  numeroAnuncio: number; // Número del anuncio en la página
}

/**
 * Filtra información de la revista (headers, footers, etc.)
 */
function filtrarInfoRevista(texto: string): string {
  const patronesRevista = [
    /Precio\s+S\/\.?\s*\d+\.\d+\s*vía\s+aérea/gi,
    /Edición\s+Regional[^\n]*/gi,
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
    /^\d+\s*$/gm, // Números solos (páginas)
    /^\s*[escu]{1,10}\s*$/gmi, // Letras sueltas como "e s c u c h a n o s"
  ];
  
  let textoLimpio = texto;
  patronesRevista.forEach(patron => {
    textoLimpio = textoLimpio.replace(patron, '');
  });
  
  return textoLimpio;
}

/**
 * Normaliza contactos
 */
function normalizarContactos(texto: string): ContactoMultiple[] {
  const contactos: ContactoMultiple[] = [];
  
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
 * Detecta categoría
 */
function detectarCategoria(titulo: string, descripcion: string): Categoria {
  const texto = `${titulo} ${descripcion}`.toLowerCase();
  
  const keywords: Record<Categoria, string[]> = {
    empleos: ['trabajo', 'empleo', 'busco', 'necesito', 'vacante', 'puesto', 'sueldo', 'requiere', 'personal', 'entrevista', 'cv', 'curriculum'],
    inmuebles: ['casa', 'departamento', 'alquiler', 'venta', 'terreno', 'lote', 'inmueble', 'propiedad', 'habitación', 'cuarto', 'local', 'oficina'],
    vehiculos: ['auto', 'carro', 'moto', 'vehículo', 'camioneta', 'bus', 'combis', 'taxi', 'placa', 'kilometraje'],
    servicios: ['servicio', 'reparación', 'instalación', 'mantenimiento', 'limpieza', 'diseño', 'construcción', 'plomería', 'electricidad'],
    productos: ['venta', 'compro', 'vendo', 'producto', 'artículo', 'mercancía', 'oferta', 'descuento', 'precio'],
    eventos: ['evento', 'fiesta', 'celebración', 'concierto', 'show', 'festival', 'feria', 'exposición'],
    negocios: ['negocio', 'empresa', 'comercio', 'tienda', 'local', 'franquicia', 'inversión', 'socio', 'traspaso'],
    comunidad: ['comunidad', 'ayuda', 'donación', 'voluntario', 'asociación', 'club', 'grupo']
  };
  
  let mejorCategoria: Categoria = 'productos';
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
 * Detecta separadores de anuncios mejorado
 */
function detectarSeparadoresAnuncios(texto: string): number[] {
  const separadores: number[] = [0];
  const lineas = texto.split('\n');
  
  for (let i = 1; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    const lineaAnterior = lineas[i - 1].trim();
    const lineaSiguiente = i < lineas.length - 1 ? lineas[i + 1].trim() : '';
    
    // Separador: Línea en blanco seguida de título en mayúsculas (anuncio nuevo)
    if (lineaAnterior === '' && 
        linea.length > 5 && 
        linea === linea.toUpperCase() && 
        /[A-ZÁÉÍÓÚÑ]/.test(linea) &&
        !/^\d+\.?\d*$/.test(linea) && // No es solo un número
        !/^S\/\.?\s*\d+/.test(linea)) { // No es un precio
      separadores.push(i);
      continue;
    }
    
    // Separador: Patrón "Razón", "Informes", "Llamar" seguido de contacto (fin de anuncio anterior)
    if ((/^(?:Razón|Informes?|Llamar|Cel|Cel\.|Telf|Telf\.|Tel|Tel\.|WhatsApp|WA)\s*:?\s*\d+/.test(linea) ||
         /^(?:Razón|Informes?|Llamar)\s+(?:a\s+los?\s+)?(?:Cel|Cel\.|Telf|Telf\.|Tel|Tel\.|WhatsApp|WA)/.test(linea)) &&
        lineaAnterior !== '' && 
        lineaSiguiente !== '' &&
        !/^(?:Razón|Informes?|Llamar)/.test(lineaSiguiente)) {
      // El siguiente anuncio empieza después de este contacto
      if (i < lineas.length - 1 && lineas[i + 1].trim() !== '') {
        separadores.push(i + 1);
        i++; // Saltar la línea de contacto
      }
      continue;
    }
    
    // Separador: Múltiples líneas en blanco (2+)
    if (lineaAnterior === '' && 
        linea === '' && 
        i > 1 && 
        lineas[i - 2].trim() !== '' &&
        i < lineas.length - 1 &&
        lineas[i + 1].trim() !== '') {
      separadores.push(i + 1);
      continue;
    }
    
    // Separador: Título destacado después de espacio (patrones comunes)
    if (lineaAnterior === '' && 
        /^(?:VENTA|ALQUILO|SE\s+ALQUILA|POR\s+OCASIÓN|REQUIERE|BUSCO|OFERTA|OFERTA|SE\s+VENDE)/i.test(linea) &&
        linea.length > 10) {
      separadores.push(i);
      continue;
    }
  }
  
  separadores.push(lineas.length);
  return separadores;
}

/**
 * Extrae título de un bloque de texto
 */
function extraerTitulo(bloqueLineas: string[]): { titulo: string; inicioDescripcion: number } {
  // Buscar título en las primeras líneas
  for (let i = 0; i < Math.min(5, bloqueLineas.length); i++) {
    const linea = bloqueLineas[i].trim();
    
    // Título: línea en mayúsculas con más de 5 caracteres
    if (linea.length > 5 && 
        linea === linea.toUpperCase() && 
        /[A-ZÁÉÍÓÚÑ]/.test(linea) &&
        !/^\d+\.?\d*$/.test(linea) &&
        !/^S\/\.?\s*\d+/.test(linea)) {
      return { titulo: linea.substring(0, 100), inicioDescripcion: i + 1 };
    }
    
    // Título: patrón común de anuncios
    if (/^(?:VENTA|ALQUILO|SE\s+ALQUILA|POR\s+OCASIÓN|REQUIERE|BUSCO|OFERTA|SE\s+VENDE)/i.test(linea) &&
        linea.length > 10 && 
        linea.length < 100) {
      return { titulo: linea.substring(0, 100), inicioDescripcion: i + 1 };
    }
  }
  
  // Si no se encuentra, usar primera línea válida
  for (let i = 0; i < bloqueLineas.length; i++) {
    const linea = bloqueLineas[i].trim();
    if (linea.length > 5 && 
        !/^\d+\.?\d*$/.test(linea) &&
        !/^S\/\.?\s*\d+/.test(linea)) {
      return { titulo: linea.substring(0, 100), inicioDescripcion: i + 1 };
    }
  }
  
  // Último recurso: primeras palabras
  const primeraLinea = bloqueLineas[0]?.trim() || '';
  if (primeraLinea.length > 0) {
    const palabras = primeraLinea.split(/\s+/).slice(0, 8).join(' ');
    return { titulo: palabras.substring(0, 100), inicioDescripcion: 1 };
  }
  
  return { titulo: 'Anuncio', inicioDescripcion: 0 };
}

/**
 * Extrae anuncios de una página mejorado
 */
function extraerAnunciosDePagina(textoPagina: string, numeroPagina: number): AnuncioEstructurado[] {
  const anuncios: AnuncioEstructurado[] = [];
  
  if (!textoPagina || textoPagina.trim().length < 20) {
    return anuncios;
  }
  
  // 1. Filtrar información de la revista
  let textoLimpio = filtrarInfoRevista(textoPagina);
  
  // 2. Detectar separadores
  const separadores = detectarSeparadoresAnuncios(textoLimpio);
  const lineas = textoLimpio.split('\n');
  
  // 3. Procesar cada bloque entre separadores
  for (let i = 0; i < separadores.length - 1; i++) {
    const inicio = separadores[i];
    const fin = separadores[i + 1];
    const bloqueLineas = lineas.slice(inicio, fin)
      .map(l => l.trim())
      .filter(l => l.length > 0 && !/^\d+\.?\d*$/.test(l)); // Filtrar números solos
    
    if (bloqueLineas.length === 0) {
      continue;
    }
    
    const bloqueTexto = bloqueLineas.join('\n').trim();
    
    // Validar tamaño mínimo
    if (bloqueTexto.length < 30) {
      continue;
    }
    
    // Extraer contactos para validar que es un anuncio
    const contactos = normalizarContactos(bloqueTexto);
    if (contactos.length === 0) {
      continue; // Sin contactos, no es un anuncio válido
    }
    
    // Extraer título
    const { titulo, inicioDescripcion } = extraerTitulo(bloqueLineas);
    const descripcionLineas = bloqueLineas.slice(inicioDescripcion);
    let descripcion = descripcionLineas.join(' ').trim();
    
    // Limpiar descripción de contactos repetidos al final
    descripcion = descripcion.replace(/^(?:Razón|Informes?|Llamar)\s+(?:a\s+los?\s+)?(?:Cel|Cel\.|Telf|Telf\.|Tel|Tel\.|WhatsApp|WA)\s*:?\s*\d+[^\n]*$/gmi, '');
    descripcion = descripcion.trim();
    
    if (descripcion.length < 10) {
      continue;
    }
    
    // Detectar categoría
    const categoria = detectarCategoria(titulo, descripcion);
    
    // Detectar tamaño (usar solo el texto del anuncio, no toda la página)
    const tamaño = detectarTamañoVisual(bloqueTexto, titulo);
    
    // Extraer precio
    const precioMatch = bloqueTexto.match(/(?:S\/\.?|soles?|precio|desde|a\s+más)\s*:?\s*(\d+(?:\.\d+)?)/i);
    const precio = precioMatch ? precioMatch[1] : undefined;
    
    anuncios.push({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      contactos,
      ubicacionTexto: bloqueTexto,
      categoria,
      tamaño,
      precio,
      pagina: numeroPagina,
      numeroAnuncio: anuncios.length + 1
    });
  }
  
  return anuncios;
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
📋 ESTRUCTURADOR DE ANUNCIOS (Paso 2)
${'='.repeat(50)}

Uso:
  npx tsx scripts/estructurar-anuncios.ts --revista <codigo> [opciones]

Opciones:
  --revista <codigo>  Código de la revista (ej: R2538)
  --usar-llm          Usar LLM externo para mejor extracción (requiere API keys)
  --help              Mostrar ayuda

Ejemplo:
  npx tsx scripts/estructurar-anuncios.ts --revista R2538
    `);
    process.exit(0);
  }
  
  const revistaIndex = args.indexOf('--revista');
  const codigoRevista = revistaIndex >= 0 && args[revistaIndex + 1] ? args[revistaIndex + 1] : null;
  
  if (!codigoRevista) {
    console.error('❌ Debes especificar --revista <codigo>');
    process.exit(1);
  }
  
  const rutaRevista = path.join(process.cwd(), 'output', 'revistas', codigoRevista);
  const rutaTexto = path.join(rutaRevista, 'texto-crudo.txt');
  const rutaInfo = path.join(rutaRevista, 'info.json');
  const rutaSalida = path.join(rutaRevista, 'anuncios-estructurados.json');
  
  if (!fs.existsSync(rutaTexto)) {
    console.error(`❌ No se encuentra texto-crudo.txt en ${rutaRevista}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(rutaInfo)) {
    console.error(`❌ No se encuentra info.json en ${rutaRevista}`);
    process.exit(1);
  }
  
  const infoRevista: InfoRevista = JSON.parse(fs.readFileSync(rutaInfo, 'utf-8'));
  const textoCrudo = fs.readFileSync(rutaTexto, 'utf-8');
  
  // Dividir por páginas
  const paginas = textoCrudo.split(/=== PÁGINA \d+ ===/).filter(p => p.trim().length > 0);
  
  console.log(`📚 Estructurando anuncios de revista: ${codigoRevista}`);
  console.log(`📄 ${paginas.length} páginas encontradas\n`);
  
  const todosAnuncios: AnuncioEstructurado[] = [];
  
  for (let i = 0; i < paginas.length; i++) {
    const numeroPagina = i + 1;
    const textoPagina = paginas[i];
    
    const anuncios = extraerAnunciosDePagina(textoPagina, numeroPagina);
    todosAnuncios.push(...anuncios);
    
    process.stdout.write(`\r  ✓ Página ${numeroPagina}/${paginas.length} - ${anuncios.length} anuncios extraídos (Total: ${todosAnuncios.length})`);
  }
  
  console.log(`\n\n📊 Total anuncios estructurados: ${todosAnuncios.length}`);
  
  // Guardar resultado
  const resultado = {
    revista: codigoRevista,
    fechaEstructuracion: new Date().toISOString(),
    totalAnuncios: todosAnuncios.length,
    anuncios: todosAnuncios
  };
  
  fs.writeFileSync(rutaSalida, JSON.stringify(resultado, null, 2), 'utf-8');
  console.log(`💾 Guardado en: ${rutaSalida}\n`);
  
  // Estadísticas
  const porCategoria: Record<string, number> = {};
  const porTamaño: Record<string, number> = {};
  
  todosAnuncios.forEach(anuncio => {
    porCategoria[anuncio.categoria] = (porCategoria[anuncio.categoria] || 0) + 1;
    porTamaño[anuncio.tamaño] = (porTamaño[anuncio.tamaño] || 0) + 1;
  });
  
  console.log('📈 Estadísticas:');
  console.log('   Por categoría:', porCategoria);
  console.log('   Por tamaño:', porTamaño);
}

if (require.main === module) {
  main().catch(console.error);
}

export { extraerAnunciosDePagina, AnuncioEstructurado };









