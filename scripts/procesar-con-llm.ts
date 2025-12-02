/**
 * Script para procesar texto extraído de PDFs con LLM
 * 
 * Uso:
 *   npx ts-node scripts/procesar-con-llm.ts <ruta-json-texto> [ruta-salida-json] [--provider openai|anthropic|google]
 * 
 * Requiere variables de entorno:
 *   - OPENAI_API_KEY (si usas OpenAI)
 *   - ANTHROPIC_API_KEY (si usas Anthropic)
 *   - GOOGLE_API_KEY (si usas Google)
 */

import * as fs from 'fs';
import * as path from 'path';
import { PaginaExtraida } from './extraer-texto-pdfs';

interface AnuncioExtraido {
  titulo: string;
  descripcion: string;
  categoria: string;
  contactos: Array<{
    tipo: 'telefono' | 'whatsapp' | 'email';
    valor: string;
    principal?: boolean;
    etiqueta?: string;
  }>;
  ubicacion: string;
  tamaño_visual: 'miniatura' | 'pequeño' | 'mediano' | 'grande' | 'gigante';
  precio?: string;
  fecha_publicacion?: string;
}

interface ResultadoProcesamiento {
  edicion: string;
  pagina: number;
  anuncios: AnuncioExtraido[];
  archivo: string;
  error?: string;
}

async function llamarLLM(texto: string, provider: string = 'openai'): Promise<string> {
  const promptPath = path.join(__dirname, 'prompt-extraccion-llm.md');
  let promptBase = fs.readFileSync(promptPath, 'utf-8');
  
  // Reemplazar placeholder con el texto real
  promptBase = promptBase.replace('[TEXTO_DE_LA_PAGINA_AQUI]', texto);

  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`] || 
                 process.env[`${provider}_API_KEY`];
  
  if (!apiKey) {
    throw new Error(`API Key no encontrada para ${provider}. Configura ${provider.toUpperCase()}_API_KEY`);
  }

  try {
    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // o 'gpt-4' para mejor calidad
          messages: [
            { role: 'system', content: 'Eres un experto en extraer información estructurada de anuncios clasificados. Responde SOLO con JSON válido.' },
            { role: 'user', content: promptBase }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } else if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: [
            { role: 'user', content: promptBase }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${error}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } else if (provider === 'google') {
      // Google Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: promptBase
            }]
          }]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google API error: ${error}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error(`Provider no soportado: ${provider}`);
    }
  } catch (error: any) {
    console.error(`Error al llamar LLM (${provider}):`, error.message);
    throw error;
  }
}

function parsearRespuestaLLM(respuesta: string): AnuncioExtraido[] {
  try {
    // Limpiar respuesta (puede tener markdown code blocks)
    let jsonStr = respuesta.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(jsonStr);
    
    if (parsed.anuncios && Array.isArray(parsed.anuncios)) {
      return parsed.anuncios;
    }
    
    throw new Error('Formato de respuesta inválido: no se encontró array "anuncios"');
  } catch (error: any) {
    console.error('Error al parsear respuesta:', error.message);
    console.error('Respuesta recibida:', respuesta.substring(0, 500));
    throw error;
  }
}

async function procesarPagina(
  pagina: PaginaExtraida, 
  provider: string,
  retries: number = 3
): Promise<ResultadoProcesamiento> {
  for (let intento = 1; intento <= retries; intento++) {
    try {
      console.log(`  Procesando con ${provider} (intento ${intento}/${retries})...`);
      
      const respuesta = await llamarLLM(pagina.texto, provider);
      const anuncios = parsearRespuestaLLM(respuesta);
      
      return {
        edicion: pagina.edicion,
        pagina: pagina.pagina,
        anuncios,
        archivo: pagina.archivo
      };
    } catch (error: any) {
      console.error(`  ✗ Error en intento ${intento}:`, error.message);
      
      if (intento === retries) {
        return {
          edicion: pagina.edicion,
          pagina: pagina.pagina,
          anuncios: [],
          archivo: pagina.archivo,
          error: error.message
        };
      }
      
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 2000 * intento));
    }
  }
  
  // No debería llegar aquí, pero por seguridad
  return {
    edicion: pagina.edicion,
    pagina: pagina.pagina,
    anuncios: [],
    archivo: pagina.archivo,
    error: 'Error después de todos los reintentos'
  };
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Uso: npx ts-node scripts/procesar-con-llm.ts <ruta-json-texto> [ruta-salida-json] [--provider openai|anthropic|google]');
    process.exit(1);
  }

  const rutaEntrada = args[0];
  const rutaSalida = args[1] || path.join(process.cwd(), 'anuncios-procesados.json');
  const providerIndex = args.indexOf('--provider');
  const provider = providerIndex >= 0 && args[providerIndex + 1] 
    ? args[providerIndex + 1] 
    : 'openai';

  console.log('=== Procesamiento con LLM ===');
  console.log(`Archivo entrada: ${rutaEntrada}`);
  console.log(`Archivo salida: ${rutaSalida}`);
  console.log(`Provider: ${provider}`);
  console.log('');

  if (!fs.existsSync(rutaEntrada)) {
    console.error(`Error: El archivo ${rutaEntrada} no existe`);
    process.exit(1);
  }

  try {
    const paginas: PaginaExtraida[] = JSON.parse(fs.readFileSync(rutaEntrada, 'utf-8'));
    console.log(`Cargadas ${paginas.length} páginas para procesar`);
    console.log('');

    const resultados: ResultadoProcesamiento[] = [];
    
    for (let i = 0; i < paginas.length; i++) {
      const pagina = paginas[i];
      console.log(`Procesando página ${i + 1}/${paginas.length}: ${pagina.archivo} (Edición ${pagina.edicion}, Página ${pagina.pagina})`);
      
      const resultado = await procesarPagina(pagina, provider);
      resultados.push(resultado);
      
      if (resultado.anuncios.length > 0) {
        console.log(`  ✓ Extraídos ${resultado.anuncios.length} anuncios`);
      } else if (resultado.error) {
        console.log(`  ✗ Error: ${resultado.error}`);
      } else {
        console.log(`  ⚠ No se encontraron anuncios`);
      }
      
      // Pequeña pausa para no saturar la API
      if (i < paginas.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Guardar resultados
    const directorioSalida = path.dirname(rutaSalida);
    if (!fs.existsSync(directorioSalida)) {
      fs.mkdirSync(directorioSalida, { recursive: true });
    }
    
    fs.writeFileSync(rutaSalida, JSON.stringify(resultados, null, 2), 'utf-8');
    
    const totalAnuncios = resultados.reduce((sum, r) => sum + r.anuncios.length, 0);
    const totalErrores = resultados.filter(r => r.error).length;
    
    console.log('');
    console.log('=== Resumen ===');
    console.log(`✓ Páginas procesadas: ${resultados.length}`);
    console.log(`✓ Anuncios extraídos: ${totalAnuncios}`);
    console.log(`✗ Errores: ${totalErrores}`);
    console.log(`✓ Resultados guardados en: ${rutaSalida}`);
  } catch (error: any) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { procesarPagina, llamarLLM, parsearRespuestaLLM, AnuncioExtraido, ResultadoProcesamiento };




