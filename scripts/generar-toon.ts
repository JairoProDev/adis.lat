/**
 * Script para generar datos TOON (Token Oriented Object Notation) de anuncios
 * 
 * TOON es un formato optimizado para búsquedas semánticas del chatbot
 * 
 * Uso:
 *   npx ts-node scripts/generar-toon.ts [--adiso-id ID_ESPECIFICO] [--todos]
 */

import { supabase } from '@/lib/supabase';
import { Adiso } from '@/types';

interface TokenToon {
  tipo: 'entidad' | 'atributo' | 'valor' | 'relacion';
  valor: string;
  contexto?: string;
  peso?: number;
}

// Diccionario de sinónimos y variantes por categoría
const SINONIMOS_CATEGORIA: Record<string, string[]> = {
  empleos: ['trabajo', 'empleo', 'vacante', 'puesto', 'oportunidad laboral', 'busco trabajo', 'necesito trabajo'],
  inmuebles: ['casa', 'departamento', 'alquiler', 'venta', 'propiedad', 'terreno', 'lote', 'inmueble'],
  vehiculos: ['auto', 'carro', 'moto', 'vehículo', 'camioneta', 'bus', 'combis', 'taxi'],
  servicios: ['servicio', 'reparación', 'instalación', 'mantenimiento', 'limpieza', 'diseño', 'construcción'],
  productos: ['venta', 'compro', 'vendo', 'producto', 'artículo', 'oferta', 'descuento'],
  eventos: ['evento', 'fiesta', 'celebración', 'concierto', 'show', 'festival', 'feria'],
  negocios: ['negocio', 'empresa', 'comercio', 'tienda', 'local', 'franquicia', 'inversión'],
  comunidad: ['comunidad', 'ayuda', 'donación', 'voluntario', 'asociación', 'club', 'grupo']
};

// Palabras clave importantes por contexto
const PALABRAS_CLAVE_IMPORTANTES = [
  'urgente', 'oferta', 'descuento', 'promoción', 'nuevo', 'usado', 'original', 'garantía',
  'entrega', 'domicilio', 'instalación', 'reparación', 'mantenimiento', 'servicio', 'profesional',
  'experiencia', 'certificado', 'licencia', 'disponible', 'inmediato', 'rápido', 'calidad'
];

function generarTOON(adiso: Adiso): string {
  const tokens: TokenToon[] = [];
  
  // Entidad principal
  tokens.push({
    tipo: 'entidad',
    valor: 'anuncio',
    peso: 10
  });
  
  // Categoría con sinónimos
  tokens.push({
    tipo: 'atributo',
    valor: 'categoria',
    contexto: adiso.categoria,
    peso: 9
  });
  tokens.push({
    tipo: 'valor',
    valor: adiso.categoria,
    contexto: 'categoria',
    peso: 8
  });
  
  // Agregar sinónimos de la categoría
  const sinonimos = SINONIMOS_CATEGORIA[adiso.categoria] || [];
  sinonimos.forEach(sinonimo => {
    tokens.push({
      tipo: 'valor',
      valor: sinonimo,
      contexto: 'categoria_sinonimo',
      peso: 6
    });
  });
  
  // Título (palabras clave con normalización)
  const palabrasTitulo = adiso.titulo.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes para búsquedas
    .split(/\s+/)
    .filter(p => p.length > 2)
    .filter(p => !['el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'en', 'con', 'por', 'para'].includes(p))
    .slice(0, 15); // Aumentado a 15 palabras clave
  
  palabrasTitulo.forEach(palabra => {
    tokens.push({
      tipo: 'valor',
      valor: palabra,
      contexto: 'titulo',
      peso: 8
    });
    
    // Agregar variantes sin tildes y con tildes
    const conTilde = palabra.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (conTilde !== palabra) {
      tokens.push({
        tipo: 'valor',
        valor: conTilde,
        contexto: 'titulo_variante',
        peso: 7
      });
    }
  });
  
  // Descripción (extraer palabras clave importantes con contexto semántico)
  const textoDescripcion = adiso.descripcion
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ');
  
  const palabrasDescripcion = textoDescripcion
    .split(/\s+/)
    .filter(p => p.length > 3)
    .filter(p => !['para', 'con', 'del', 'las', 'los', 'una', 'uno', 'este', 'esta', 'que', 'por', 'son', 'son', 'tiene', 'tiene'].includes(p));
  
  // Identificar palabras clave importantes
  const palabrasImportantes = palabrasDescripcion.filter(p => 
    PALABRAS_CLAVE_IMPORTANTES.some(kw => p.includes(kw) || kw.includes(p))
  );
  
  palabrasImportantes.forEach(palabra => {
    tokens.push({
      tipo: 'valor',
      valor: palabra,
      contexto: 'descripcion_importante',
      peso: 7
    });
  });
  
  // Agregar otras palabras clave de descripción (máximo 25)
  palabrasDescripcion
    .filter(p => !palabrasImportantes.includes(p))
    .slice(0, 25)
    .forEach(palabra => {
      tokens.push({
        tipo: 'valor',
        valor: palabra,
        contexto: 'descripcion',
        peso: 5
      });
    });
  
  // Ubicación detallada con contexto geográfico
  if (typeof adiso.ubicacion === 'string') {
    const ubicacionTokens = adiso.ubicacion.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[,\s]+/)
      .filter(t => t.length > 2);
    
    ubicacionTokens.forEach(token => {
      tokens.push({
        tipo: 'valor',
        valor: token,
        contexto: 'ubicacion',
        peso: 6
      });
    });
  } else if (adiso.ubicacion && typeof adiso.ubicacion === 'object') {
    const ubi = adiso.ubicacion as any;
    
    // Distrito (más importante)
    if (ubi.distrito) {
      const distritoNorm = ubi.distrito.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      tokens.push({
        tipo: 'valor',
        valor: distritoNorm,
        contexto: 'distrito',
        peso: 8
      });
      
      // Agregar variantes comunes del distrito
      if (distritoNorm.includes('wanchaq')) {
        tokens.push({ tipo: 'valor', valor: 'wanchaq', contexto: 'distrito_variante', peso: 7 });
        tokens.push({ tipo: 'valor', valor: 'wanchaq', contexto: 'distrito_variante', peso: 7 });
      }
      if (distritoNorm.includes('san sebastian')) {
        tokens.push({ tipo: 'valor', valor: 'san sebastian', contexto: 'distrito_variante', peso: 7 });
      }
      if (distritoNorm.includes('san jeronimo')) {
        tokens.push({ tipo: 'valor', valor: 'san jerónimo', contexto: 'distrito_variante', peso: 7 });
      }
    }
    
    // Provincia
    if (ubi.provincia) {
      tokens.push({
        tipo: 'valor',
        valor: ubi.provincia.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
        contexto: 'provincia',
        peso: 6
      });
    }
    
    // Departamento
    if (ubi.departamento) {
      tokens.push({
        tipo: 'valor',
        valor: ubi.departamento.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
        contexto: 'departamento',
        peso: 6
      });
    }
    
    // Dirección específica (si existe)
    if (ubi.direccion) {
      const direccionTokens = ubi.direccion.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .split(/\s+/)
        .filter(t => t.length > 2 && !['calle', 'av', 'avenida', 'jr', 'jiron'].includes(t))
        .slice(0, 5);
      
      direccionTokens.forEach(token => {
        tokens.push({
          tipo: 'valor',
          valor: token,
          contexto: 'direccion',
          peso: 5
        });
      });
    }
    
    // Referencias geográficas comunes
    tokens.push({
      tipo: 'valor',
      valor: 'cusco',
      contexto: 'ciudad',
      peso: 7
    });
  }
  
  // Contactos (solo tipo, no valores por privacidad)
  if (adiso.contactosMultiples && adiso.contactosMultiples.length > 0) {
    adiso.contactosMultiples.forEach(contacto => {
      tokens.push({
        tipo: 'atributo',
        valor: `contacto_${contacto.tipo}`,
        peso: 3
      });
      
      // Agregar sinónimos de tipo de contacto
      if (contacto.tipo === 'whatsapp') {
        tokens.push({ tipo: 'valor', valor: 'wa', contexto: 'contacto_sinonimo', peso: 2 });
        tokens.push({ tipo: 'valor', valor: 'wapp', contexto: 'contacto_sinonimo', peso: 2 });
      }
    });
  }
  
  // Tamaño con sinónimos
  if (adiso.tamaño) {
    tokens.push({
      tipo: 'atributo',
      valor: 'tamaño',
      contexto: adiso.tamaño,
      peso: 4
    });
    
    // Sinónimos de tamaño
    const sinonimosTamaño: Record<string, string[]> = {
      miniatura: ['pequeño', 'compacto', 'básico'],
      pequeño: ['mediano', 'estándar', 'normal'],
      mediano: ['grande', 'amplio', 'extendido'],
      grande: ['extra grande', 'muy grande', 'extenso'],
      gigante: ['extra grande', 'máximo', 'premium']
    };
    
    const sinonimos = sinonimosTamaño[adiso.tamaño] || [];
    sinonimos.forEach(sinonimo => {
      tokens.push({
        tipo: 'valor',
        valor: sinonimo,
        contexto: 'tamaño_sinonimo',
        peso: 3
      });
    });
  }
  
  // Fecha con contexto temporal
  if (adiso.fechaPublicacion) {
    const fecha = new Date(adiso.fechaPublicacion);
    const año = fecha.getFullYear();
    const mes = fecha.getMonth() + 1;
    const dia = fecha.getDate();
    
    tokens.push({
      tipo: 'valor',
      valor: año.toString(),
      contexto: 'año',
      peso: 4
    });
    tokens.push({
      tipo: 'valor',
      valor: mes.toString(),
      contexto: 'mes',
      peso: 3
    });
    tokens.push({
      tipo: 'valor',
      valor: `${año}-${mes.toString().padStart(2, '0')}`,
      contexto: 'fecha_periodo',
      peso: 3
    });
    
    // Contexto temporal (reciente, antiguo, histórico)
    const ahora = new Date();
    const diasDiferencia = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasDiferencia < 30) {
      tokens.push({ tipo: 'valor', valor: 'reciente', contexto: 'temporal', peso: 3 });
    } else if (diasDiferencia > 365) {
      tokens.push({ tipo: 'valor', valor: 'histórico', contexto: 'temporal', peso: 3 });
    } else {
      tokens.push({ tipo: 'valor', valor: 'antiguo', contexto: 'temporal', peso: 2 });
    }
  }
  
  // Estado del anuncio
  if (adiso.esHistorico) {
    tokens.push({
      tipo: 'atributo',
      valor: 'historico',
      peso: 3
    });
  }
  
  if (adiso.estaActivo !== undefined) {
    tokens.push({
      tipo: 'atributo',
      valor: adiso.estaActivo ? 'activo' : 'inactivo',
      peso: 3
    });
  }
  
  // Fuente original
  if (adiso.fuenteOriginal) {
    tokens.push({
      tipo: 'atributo',
      valor: 'fuente',
      contexto: adiso.fuenteOriginal,
      peso: 2
    });
  }
  
  // Convertir a formato TOON string optimizado
  // Formato: tipo:valor:contexto:peso|tipo:valor:contexto:peso|...
  // Eliminar duplicados y ordenar por peso
  const tokensUnicos = new Map<string, TokenToon>();
  
  tokens.forEach(token => {
    const clave = `${token.tipo}:${token.valor}:${token.contexto || ''}`;
    const existente = tokensUnicos.get(clave);
    
    if (!existente || (token.peso || 0) > (existente.peso || 0)) {
      tokensUnicos.set(clave, token);
    }
  });
  
  const toonString = Array.from(tokensUnicos.values())
    .sort((a, b) => (b.peso || 0) - (a.peso || 0)) // Ordenar por peso descendente
    .map(t => `${t.tipo}:${t.valor}${t.contexto ? ':' + t.contexto : ''}${t.peso ? ':' + t.peso : ''}`)
    .join('|');
  
  return toonString;
}

async function generarTOONParaAnuncio(adisoId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  // Obtener anuncio
  const { data: adisoData, error: fetchError } = await supabase
    .from('adisos')
    .select('*')
    .eq('id', adisoId)
    .single();
  
  if (fetchError || !adisoData) {
    throw new Error(`Anuncio no encontrado: ${adisoId}`);
  }
  
  // Convertir a Adiso
  const { dbToAdiso } = await import('@/lib/supabase');
  const adiso = dbToAdiso(adisoData);
  
  // Generar TOON
  const contenidoToon = generarTOON(adiso);
  
  // Insertar o actualizar en BD
  const { error: upsertError } = await supabase
    .from('datos_toon_anuncios')
    .upsert({
      adiso_id: adisoId,
      contenido_toon: contenidoToon,
      fecha_actualizacion: new Date().toISOString()
    }, {
      onConflict: 'adiso_id'
    });
  
  if (upsertError) {
    throw new Error(`Error al guardar TOON: ${upsertError.message}`);
  }
}

async function generarTOONParaTodos(): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  console.log('Obteniendo todos los anuncios...');
  
  // Obtener todos los anuncios en batches
  let offset = 0;
  const limit = 1000;
  let totalProcesados = 0;
  
  while (true) {
    const { data: adisosData, error } = await supabase
      .from('adisos')
      .select('*')
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw new Error(`Error al obtener anuncios: ${error.message}`);
    }
    
    if (!adisosData || adisosData.length === 0) {
      break;
    }
    
    console.log(`Procesando batch: ${offset + 1} - ${offset + adisosData.length}`);
    
    const { dbToAdiso } = await import('../lib/supabase');
    
    for (const adisoData of adisosData) {
      try {
        const adiso = dbToAdiso(adisoData);
        const contenidoToon = generarTOON(adiso);
        
        await supabase
          .from('datos_toon_anuncios')
          .upsert({
            adiso_id: adiso.id,
            contenido_toon: contenidoToon,
            fecha_actualizacion: new Date().toISOString()
          }, {
            onConflict: 'adiso_id'
          });
        
        totalProcesados++;
        
        if (totalProcesados % 100 === 0) {
          console.log(`  Procesados: ${totalProcesados}`);
        }
      } catch (error: any) {
        console.error(`  Error al procesar ${adisoData.id}:`, error.message);
      }
    }
    
    if (adisosData.length < limit) {
      break;
    }
    
    offset += limit;
  }
  
  console.log(`Total procesado: ${totalProcesados} anuncios`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Error: Variables de entorno de Supabase no configuradas');
    process.exit(1);
  }
  
  const adisoIdIndex = args.indexOf('--adiso-id');
  const todos = args.includes('--todos');
  
  try {
    if (adisoIdIndex >= 0 && args[adisoIdIndex + 1]) {
      const adisoId = args[adisoIdIndex + 1];
      console.log(`Generando TOON para anuncio: ${adisoId}`);
      await generarTOONParaAnuncio(adisoId);
      console.log('✓ TOON generado exitosamente');
    } else if (todos) {
      console.log('Generando TOON para todos los anuncios...');
      await generarTOONParaTodos();
      console.log('✓ Proceso completado');
    } else {
      console.error('Uso: npx ts-node scripts/generar-toon.ts [--adiso-id ID] [--todos]');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { generarTOON, generarTOONParaAnuncio, generarTOONParaTodos };

