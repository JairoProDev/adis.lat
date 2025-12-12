/**
 * Módulo de Parseo de Ubicaciones de Cusco
 * 
 * SIN APIs de geocodificación de pago.
 * Solo extrae información del texto y mapea a distritos conocidos.
 * Usa coordenadas aproximadas del centro del distrito.
 */

import { UbicacionDetallada } from '@/types';
import { 
  buscarDistritoEnTexto, 
  obtenerDistritoCusco, 
  normalizarNombreDistrito,
  obtenerCoordenadasDistrito 
} from './cusco-ubicaciones';

/**
 * Extrae dirección específica (calle, avenida, número) de un texto
 * 
 * @param texto - Texto donde buscar dirección
 * @returns Dirección extraída o null
 */
function extraerDireccionEspecifica(texto: string): string | null {
  if (!texto || typeof texto !== 'string') {
    return null;
  }
  
  // Patrones comunes de direcciones en Cusco
  const patronesDireccion = [
    // Av. Nombre, Calle Nombre, Jr. Nombre
    /(?:Av\.?|Avenida|Calle|Jr\.?|Jirón|Pasaje|Psje\.?|Prolongación|Prol\.?)\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ\s]+(?:\s+(?:N°?|Nº|#)\s*\d+)?/g,
    // Urb. Nombre, Residencial Nombre
    /(?:Urb\.?|Urbanización|Residencial|Res\.?)\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ\s]+/g,
    // Edificio Nombre
    /Edificio\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ\s]+/g,
    // Mz. X Lote Y
    /(?:Mz\.?|Manzana)\s+[A-Z0-9]+\s+(?:Lote|Lt\.?)\s+[A-Z0-9]+/g,
  ];
  
  const direcciones: string[] = [];
  
  patronesDireccion.forEach(patron => {
    const matches = texto.match(patron);
    if (matches) {
      direcciones.push(...matches.map(m => m.trim()));
    }
  });
  
  // Si hay múltiples direcciones, tomar la más completa
  if (direcciones.length > 0) {
    // Ordenar por longitud (más completa primero)
    direcciones.sort((a, b) => b.length - a.length);
    return direcciones[0];
  }
  
  return null;
}

/**
 * Extrae referencias comunes mencionadas en el texto
 * 
 * @param texto - Texto donde buscar referencias
 * @returns Array de referencias encontradas
 */
function extraerReferencias(texto: string): string[] {
  if (!texto || typeof texto !== 'string') {
    return [];
  }
  
  const referencias: string[] = [];
  const textoLower = texto.toLowerCase();
  
  // Patrones de referencias comunes
  const patronesReferencia = [
    /(?:frente\s+a|altura\s+de|costado\s+de|detrás\s+de|cerca\s+de|al\s+lado\s+de)\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ\s]+)/gi,
    /(?:paradero|ref\.|referencia)\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ\s]+)/gi,
  ];
  
  patronesReferencia.forEach(patron => {
    const matches = texto.matchAll(patron);
    for (const match of matches) {
      if (match[1]) {
        referencias.push(match[1].trim());
      }
    }
  });
  
  return referencias;
}

/**
 * Parsea una ubicación de Cusco desde texto
 * 
 * Extrae distrito, dirección específica y referencias.
 * NO usa APIs de geocodificación de pago.
 * Usa coordenadas aproximadas del centro del distrito.
 * 
 * @param texto - Texto donde buscar información de ubicación
 * @returns UbicacionDetallada o null si no se puede determinar
 */
export function parsearUbicacionCusco(texto: string): UbicacionDetallada | null {
  if (!texto || typeof texto !== 'string') {
    return null;
  }
  
  // 1. Buscar distrito en el texto
  const distrito = buscarDistritoEnTexto(texto);
  
  if (!distrito) {
    // Si no se encuentra distrito, intentar normalizar el texto completo
    const textoNormalizado = normalizarNombreDistrito(texto);
    if (textoNormalizado) {
      const distritoEncontrado = obtenerDistritoCusco(textoNormalizado);
      if (distritoEncontrado) {
        return {
          pais: 'Perú',
          departamento: 'Cusco',
          provincia: distritoEncontrado.provincia,
          distrito: distritoEncontrado.nombre,
          direccion: extraerDireccionEspecifica(texto) || undefined,
          latitud: distritoEncontrado.coordenadas.lat,
          longitud: distritoEncontrado.coordenadas.lng
        };
      }
    }
    
    // Si aún no se encuentra, usar Cusco como default (99.99% de los casos)
    return {
      pais: 'Perú',
      departamento: 'Cusco',
      provincia: 'Cusco',
      distrito: 'Cusco',
      direccion: extraerDireccionEspecifica(texto) || undefined,
      latitud: -13.5319,
      longitud: -71.9675
    };
  }
  
  // 2. Extraer dirección específica si existe
  const direccion = extraerDireccionEspecifica(texto);
  
  // 3. Construir ubicación detallada
  const ubicacion: UbicacionDetallada = {
    pais: 'Perú',
    departamento: 'Cusco',
    provincia: distrito.provincia,
    distrito: distrito.nombre,
    latitud: distrito.coordenadas.lat,
    longitud: distrito.coordenadas.lng
  };
  
  // Agregar dirección específica si existe
  if (direccion) {
    ubicacion.direccion = direccion;
  }
  
  return ubicacion;
}

/**
 * Normaliza el nombre de un distrito, mapeando variantes ortográficas
 * 
 * @param nombre - Nombre del distrito (puede tener variantes)
 * @returns Nombre canónico del distrito o null
 */
export function normalizarNombreDistritoCusco(nombre: string): string | null {
  return normalizarNombreDistrito(nombre);
}

/**
 * Obtiene coordenadas aproximadas de un distrito
 * 
 * @param nombreDistrito - Nombre del distrito
 * @returns Coordenadas del centro del distrito o null
 */
export function obtenerCoordenadasAproximadas(nombreDistrito: string): { lat: number; lng: number } | null {
  return obtenerCoordenadasDistrito(nombreDistrito);
}

/**
 * Valida si una ubicación es válida para Cusco
 * 
 * @param ubicacion - Ubicación a validar
 * @returns true si la ubicación es válida
 */
export function validarUbicacionCusco(ubicacion: UbicacionDetallada): boolean {
  if (!ubicacion) {
    return false;
  }
  
  // Debe ser de Cusco
  if (ubicacion.departamento !== 'Cusco') {
    return false;
  }
  
  // Debe tener distrito reconocido
  if (!ubicacion.distrito) {
    return false;
  }
  
  const distritoValido = obtenerDistritoCusco(ubicacion.distrito);
  if (!distritoValido) {
    return false;
  }
  
  // Validar coordenadas están en rango aproximado de Cusco
  if (ubicacion.latitud && ubicacion.longitud) {
    // Rango aproximado de Cusco: lat -13.0 a -14.0, lng -71.0 a -73.0
    if (ubicacion.latitud < -14.0 || ubicacion.latitud > -13.0) {
      return false;
    }
    if (ubicacion.longitud < -73.0 || ubicacion.longitud > -71.0) {
      return false;
    }
  }
  
  return true;
}

/**
 * Mejora una ubicación existente con información adicional del texto
 * 
 * @param ubicacion - Ubicación base
 * @param texto - Texto adicional para extraer información
 * @returns Ubicación mejorada
 */
export function mejorarUbicacionConTexto(
  ubicacion: UbicacionDetallada,
  texto: string
): UbicacionDetallada {
  if (!texto || !ubicacion) {
    return ubicacion;
  }
  
  const ubicacionMejorada = { ...ubicacion };
  
  // Si no tiene dirección, intentar extraerla
  if (!ubicacionMejorada.direccion) {
    const direccion = extraerDireccionEspecifica(texto);
    if (direccion) {
      ubicacionMejorada.direccion = direccion;
    }
  }
  
  return ubicacionMejorada;
}











