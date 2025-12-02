/**
 * Script para Separar Anuncios de una Página
 * 
 * Analiza el texto crudo de una página y separa cada anuncio individual,
 * ignorando metadatos de la revista.
 * 
 * Uso:
 *   npx tsx scripts/separar-anuncios-pagina.ts --pagina 6 --revista R2538
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Filtra metadatos de la revista
 */
function filtrarMetadatosRevista(texto: string): string {
  // Primero, eliminar cualquier prompt de LLM que pueda quedar (más agresivo)
  // Eliminar todo desde "Eres un experto" hasta "TEXTO DE LA PÁGINA A PROCESAR:"
  texto = texto.replace(/^Eres un experto[\s\S]*?TEXTO DE LA PÁGINA A PROCESAR:\s*\n\n?/i, '');
  texto = texto.replace(/^TEXTO DE LA PÁGINA A PROCESAR:\s*\n\n?/i, '');
  texto = texto.replace(/^REGLAS CRÍTICAS:[\s\S]*?(?=\n\n|\n[A-Z]|$)/gmi, '');
  texto = texto.replace(/^IMPORTANTE: Responde SOLO con JSON válido[^\n]*$/gmi, '');
  // Eliminar líneas que son solo formato JSON de ejemplo
  texto = texto.replace(/^\s*\{[\s\S]*?"anuncios":\s*\[[\s\S]*?\]\s*\}\s*$/gm, '');
  
  // Patrones de metadatos a eliminar
  const patrones = [
    // Números de página solos
    /^\d+\s*$/gm,
    // Metadatos de la revista
    /^28 años uniendo los Agentes Económicos de la Región$/gmi,
    /^Revista: Publicación Lunes y Jueves, venta diaria$/gmi,
    /^RN Radio \d+\.\d+ FM de \d+ a \d+ a\.m\.$/gmi,
    /^LA RADIO$/gmi,
    /^\d+\.\d+$/gm, // Solo números como "96.1"
    /^FM$/gmi,
    /^Cusco, del \d+ al \d+ de \w+ del \d+–Edición Nº \d+$/gmi,
    /^R$/gm, // R sola
    // Precios de la revista
    /^Precio S\/\.$/gmi,
    /^\d+\.\d+ vía aérea$/gmi,
    /^Edición Regional Cusco, Abancay, Sicuani, Quillabamba$/gmi,
    /^RuedadeNegocios$/gmi,
    /^Encuentranos en:$/gmi,
    /^Www\.ruedadenegocios\.com\.pe$/gmi,
    /^Oficina (?:Wanchaq|San Sebastián|Cusco):[^\n]*$/gmi,
    /^Año: \d+ \/ Edición: \d+ \/ Cusco, del \d+ al \d+ de \w+ del \d+$/gmi,
    /^[escu]{1,10}\s*$/gmi, // Letras sueltas como "e s c u c h a n o s"
    /^Buscanos como$/gmi,
    /^Más cerca a ti$/gmi,
    /^Rueda de negocios$/gmi,
  ];
  
  let textoLimpio = texto;
  patrones.forEach(patron => {
    textoLimpio = textoLimpio.replace(patron, '');
  });
  
  // Limpiar líneas vacías múltiples
  textoLimpio = textoLimpio.replace(/\n{3,}/g, '\n\n');
  
  return textoLimpio.trim();
}

/**
 * Detecta separadores de anuncios
 * Un anuncio termina cuando encuentra un patrón de contacto seguido de un nuevo anuncio
 */
function detectarSeparadoresAnuncios(texto: string): number[] {
  const separadores: number[] = [0]; // Inicio
  const lineas = texto.split('\n');
  
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    const lineaAnterior = i > 0 ? lineas[i - 1].trim() : '';
    const lineaSiguiente = i < lineas.length - 1 ? lineas[i + 1].trim() : '';
    
    // Patrón 1: Línea que termina con "Razón" seguida de contacto
    if (/Razón\s+(?:a\s+los?\s+)?(?:al\s+)?(?:Cel|Cel\.|Cels|Cels\.|Telf|Telf\.|Tel|Tel\.|WhatsApp|WA)\s*:?\s*\d+/.test(linea)) {
      // Buscar en las siguientes 1-5 líneas si hay un nuevo anuncio
      let encontroNuevoAnuncio = false;
      for (let j = i + 1; j < Math.min(i + 6, lineas.length); j++) {
        const lineaFutura = lineas[j].trim();
        if (lineaFutura === '') continue; // Saltar líneas vacías
        
        // REGLA CRÍTICA: Si la línea empieza con "Por [motivo/emergencia/ocasión/viaje]" (con o sin dos puntos) después de un contacto, ES NUEVO ANUNCIO
        // Esto es porque cada anuncio que empieza con "Por motivo/emergencia/ocasión/viaje" es independiente
        if (/^Por\s+(?:emergencia|motivo|ocasión|viaje)[\s:]/i.test(lineaFutura)) {
          separadores.push(j);
          i = j - 1;
          encontroNuevoAnuncio = true;
          break;
        }
        
        // Patrones que indican inicio de nuevo anuncio (más específicos)
        const esInicioAnuncio = 
          // Título en mayúsculas
          (lineaFutura.length > 10 && 
           lineaFutura === lineaFutura.toUpperCase() && 
           /[A-ZÁÉÍÓÚÑ]/.test(lineaFutura) &&
           !/^(?:Razón|Informes?|Llamar|Cel|Cel\.|Telf|Telf\.|RN|LA|FM)/.test(lineaFutura)) ||
          // Patrones comunes de inicio de anuncio
          /^(?:Venta|Alquilo|Se\s+alquila|Remato|VENDO|SE\s+VENDE|OCASIÓN|¡REMATO|TERRENO|En\s+Oropesa|Gran\s+Remate|Lotes|Ocasión|A\s+solo)/i.test(lineaFutura);
        
        if (esInicioAnuncio) {
          separadores.push(j);
          i = j - 1; // Ajustar índice
          encontroNuevoAnuncio = true;
          break;
        } else if (lineaFutura.length > 5 && !/^(?:Razón|Informes?|Llamar|Cel|Cel\.|Telf|Telf\.)/.test(lineaFutura)) {
          // Si hay contenido pero no es inicio de anuncio ni contacto, puede ser continuación
          // Verificar si la siguiente línea es un nuevo anuncio
          if (j < lineas.length - 1) {
            const siguiente = lineas[j + 1].trim();
            if (siguiente && /^(?:Por\s+(?:emergencia|motivo|ocasión|viaje)[\s:]+|Venta|Alquilo|Se\s+alquila|Remato|VENDO|SE\s+VENDE|OCASIÓN|¡REMATO|TERRENO|En\s+Oropesa|Gran\s+Remate|Lotes|Ocasión|A\s+solo)/i.test(siguiente)) {
              separadores.push(j + 1);
              i = j; // Ajustar índice
              encontroNuevoAnuncio = true;
              break;
            }
          }
          // Si no, es continuación del anuncio actual
          break;
        }
      }
      if (encontroNuevoAnuncio) continue;
    }
    
    // Patrón 2: "Informes" o "Llamar" seguido de contacto, y siguiente línea es nuevo anuncio
    if (/^(?:Informes?|Llamar)\s+(?:a\s+los?\s+)?(?:al\s+)?(?:Cel|Cel\.|Cels|Cels\.|Telf|Telf\.|Tel|Tel\.|WhatsApp|WA)\s*:?\s*\d+/.test(linea)) {
      // Buscar en las siguientes líneas si hay un nuevo anuncio
      for (let j = i + 1; j < Math.min(i + 6, lineas.length); j++) {
        const lineaFutura = lineas[j].trim();
        if (lineaFutura === '') continue;
        
        const esInicioAnuncio = 
          (lineaFutura.length > 10 && 
           lineaFutura === lineaFutura.toUpperCase() && 
           /[A-ZÁÉÍÓÚÑ]/.test(lineaFutura) &&
           !/^(?:Razón|Informes?|Llamar|Cel|Cel\.|Telf|Telf\.|RN|LA|FM)/.test(lineaFutura)) ||
          /^(?:Venta|Alquilo|Se\s+alquila|Por\s+(?:emergencia|motivo|ocasión|viaje)|Remato|VENDO|SE\s+VENDE|OCASIÓN|¡REMATO|TERRENO|En\s+Oropesa|Gran\s+Remate|Lotes|Ocasión|A\s+solo)/i.test(lineaFutura);
        
        if (esInicioAnuncio) {
          separadores.push(j);
          i = j - 1;
          break;
        } else if (lineaFutura.length > 5 && !/^(?:Razón|Informes?|Llamar|Cel|Cel\.|Telf|Telf\.)/.test(lineaFutura)) {
          break;
        }
      }
      continue;
    }
    
    // Patrón 3: Múltiples líneas en blanco (2+) seguido de título en mayúsculas
    if (lineaAnterior === '' && 
        linea === '' && 
        i > 1 && 
        lineas[i - 2].trim() !== '' &&
        lineaSiguiente &&
        lineaSiguiente.length > 10 &&
        (lineaSiguiente === lineaSiguiente.toUpperCase() || 
         /^(?:Venta|Alquilo|Se\s+alquila|Por|Remato|VENDO|SE\s+VENDE|OCASIÓN)/i.test(lineaSiguiente))) {
      separadores.push(i + 1);
      continue;
    }
    
    // Patrón 4: Título destacado en mayúsculas después de espacio
    if (lineaAnterior === '' && 
        linea.length > 10 &&
        linea === linea.toUpperCase() &&
        /[A-ZÁÉÍÓÚÑ]/.test(linea) &&
        !/^(?:Razón|Informes?|Llamar|Cel|Cel\.|Telf|Telf\.)/.test(linea) &&
        !/^\d+\.?\d*$/.test(linea) &&
        !/^S\/\.?\s*\d+/.test(linea)) {
      // Verificar que no es continuación del anuncio anterior
      if (i > 0 && separadores[separadores.length - 1] < i - 3) {
        separadores.push(i);
        continue;
      }
    }
  }
  
  separadores.push(lineas.length); // Fin
  return separadores;
}

/**
 * Separa anuncios de una página
 */
function separarAnuncios(textoPagina: string): string[] {
  // 1. Filtrar metadatos
  let textoLimpio = filtrarMetadatosRevista(textoPagina);
  
  // Eliminar cualquier línea que sea solo "TEXTO DE LA PÁGINA A PROCESAR:"
  textoLimpio = textoLimpio.replace(/^TEXTO DE LA PÁGINA A PROCESAR:\s*$/gmi, '');
  
  // 2. Detectar separadores
  const separadores = detectarSeparadoresAnuncios(textoLimpio);
  const lineas = textoLimpio.split('\n');
  
  // 3. Extraer cada anuncio
  const anuncios: string[] = [];
  
  for (let i = 0; i < separadores.length - 1; i++) {
    const inicio = separadores[i];
    const fin = separadores[i + 1];
    const bloqueLineas = lineas.slice(inicio, fin)
      .map(l => l.trim())
      .filter(l => l.length > 0);
    
    if (bloqueLineas.length === 0) {
      continue;
    }
    
    const bloqueTexto = bloqueLineas.join('\n').trim();
    
    // Validar que tiene contenido suficiente y al menos un contacto
    if (bloqueTexto.length < 30) {
      continue;
    }
    
    // Filtrar metadatos que quedaron
    if (/^(?:RN Radio|LA RADIO|FM|Cusco, del|28 años|Revista:)/i.test(bloqueTexto)) {
      continue; // Es metadato de la revista
    }
    
    // Verificar que tiene al menos un número de teléfono (contacto)
    const tieneContacto = /\d{9,}/.test(bloqueTexto) || 
                         /(?:Cel|Cel\.|Cels|Cels\.|Telf|Telf\.|Tel|Tel\.|WhatsApp|WA)\s*:?\s*\d+/.test(bloqueTexto);
    
    if (!tieneContacto) {
      continue; // No es un anuncio válido sin contacto
    }
    
    anuncios.push(bloqueTexto);
  }
  
  return anuncios;
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.length === 0) {
    console.log(`
📋 SEPARADOR DE ANUNCIOS POR PÁGINA
${'='.repeat(50)}

Uso:
  npx tsx scripts/separar-anuncios-pagina.ts --pagina <numero> --revista <codigo>

Opciones:
  --pagina <numero>    Número de página a procesar (requerido)
  --revista <codigo>    Código de la revista (ej: R2538) (requerido)
  --help               Mostrar esta ayuda

Ejemplo:
  npx tsx scripts/separar-anuncios-pagina.ts --pagina 6 --revista R2538
    `);
    process.exit(0);
  }
  
  // Parsear argumentos
  const paginaIndex = args.indexOf('--pagina');
  const numeroPagina = paginaIndex >= 0 && args[paginaIndex + 1] ? parseInt(args[paginaIndex + 1]) : null;
  
  const revistaIndex = args.indexOf('--revista');
  const codigoRevista = revistaIndex >= 0 && args[revistaIndex + 1] ? args[revistaIndex + 1] : null;
  
  if (!numeroPagina || !codigoRevista) {
    console.error('❌ Error: Debes especificar --pagina <numero> y --revista <codigo>');
    process.exit(1);
  }
  
  // Rutas
  const rutaRevista = path.join(process.cwd(), 'output', 'revistas', codigoRevista);
  const rutaTextoCrudo = path.join(rutaRevista, 'texto-crudo.txt');
  const rutaPagina = path.join(rutaRevista, `${codigoRevista}_pag${String(numeroPagina).padStart(2, '0')}.txt`);
  const rutaSalida = path.join(rutaRevista, `${codigoRevista}_pag${String(numeroPagina).padStart(2, '0')}_separados.txt`);
  
  // Leer texto de la página
  let textoPagina: string;
  
  if (fs.existsSync(rutaPagina)) {
    // Leer archivo de página individual
    textoPagina = fs.readFileSync(rutaPagina, 'utf-8');
    // Remover el prompt del inicio si existe (más agresivo)
    textoPagina = textoPagina.replace(/^Eres un experto[^\n]*\n\nTEXTO DE LA PÁGINA A PROCESAR:\n\n/s, '');
    textoPagina = textoPagina.replace(/^TEXTO DE LA PÁGINA A PROCESAR:\n\n/s, '');
    textoPagina = textoPagina.replace(/^IMPORTANTE: Responde SOLO con JSON válido[^\n]*$/gmi, '');
  } else if (fs.existsSync(rutaTextoCrudo)) {
    // Leer del texto crudo completo
    const textoCompleto = fs.readFileSync(rutaTextoCrudo, 'utf-8');
    const paginas = textoCompleto.split(/=== PÁGINA \d+ ===/);
    
    if (numeroPagina > paginas.length) {
      console.error(`❌ Error: La página ${numeroPagina} no existe. Total de páginas: ${paginas.length}`);
      process.exit(1);
    }
    
    textoPagina = paginas[numeroPagina].trim();
  } else {
    console.error(`❌ Error: No se encuentra texto-crudo.txt ni ${codigoRevista}_pag${String(numeroPagina).padStart(2, '0')}.txt`);
    process.exit(1);
  }
  
  console.log(`📄 Procesando página ${numeroPagina} de revista ${codigoRevista}...\n`);
  
  // Separar anuncios
  const anuncios = separarAnuncios(textoPagina);
  
  console.log(`✅ ${anuncios.length} anuncios separados encontrados\n`);
  
  // Guardar resultado
  const contenidoSalida = anuncios
    .map((anuncio, index) => {
      return `=== ANUNCIO ${index + 1} ===\n\n${anuncio}\n`;
    })
    .join('\n');
  
  fs.writeFileSync(rutaSalida, contenidoSalida, 'utf-8');
  
  console.log(`💾 Guardado en: ${rutaSalida}\n`);
  
  // Mostrar resumen
  console.log('📊 Resumen:');
  anuncios.forEach((anuncio, index) => {
    const lineas = anuncio.split('\n').filter(l => l.trim().length > 0);
    const primeraLinea = lineas[0]?.substring(0, 60) || '';
    console.log(`  ${index + 1}. ${primeraLinea}${primeraLinea.length >= 60 ? '...' : ''} (${lineas.length} líneas)`);
  });
  
  console.log(`\n✅ Proceso completado\n`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

