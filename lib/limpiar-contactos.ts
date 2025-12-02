/**
 * Funciones para limpiar información de contacto de las descripciones
 * 
 * CRÍTICO: Las descripciones NO deben contener números de teléfono, emails o WhatsApp.
 * Los contactos solo se almacenan en contactos_multiples y se muestran a través de botones.
 */

import { ContactoMultiple } from '@/types';

/**
 * Extrae y elimina números de teléfono de un texto
 * 
 * @param texto - Texto del que extraer números
 * @returns Array de números encontrados (normalizados)
 */
export function extraerNumerosTelefono(texto: string): string[] {
  if (!texto || typeof texto !== 'string') {
    return [];
  }
  
  // Patrones para números de teléfono peruanos
  // Formato: 9 dígitos (celular) o 7-8 dígitos (fijo)
  // Puede tener prefijos: +51, 51, 0, código de área (084, etc.)
  const patrones = [
    // Celular: 9 dígitos empezando con 9
    /\b9\d{8}\b/g,
    // Con espacios: 9XX XXX XXX
    /\b9\d{2}\s+\d{3}\s+\d{3}\b/g,
    // Con guiones: 9XX-XXX-XXX
    /\b9\d{2}[-]\d{3}[-]\d{3}\b/g,
    // Con código de área: (084) 9XX-XXX-XXX
    /\(?\d{3}\)?\s*9\d{2}[-]?\d{3}[-]?\d{3}\b/g,
    // Formato: Cel. 9XX-XXX-XXX o Cel 9XX XXX XXX
    /(?:Cel|Cel\.|Celular|Telf|Telf\.|Tel|Tel\.)\s*:?\s*9\d{2}[-]?\s?\d{3}[-]?\s?\d{3}\b/gi,
    // Formato: 984 977 831
    /\b\d{3}\s+\d{3}\s+\d{3}\b/g,
  ];
  
  const numerosEncontrados: Set<string> = new Set();
  
  patrones.forEach(patron => {
    const matches = texto.match(patron);
    if (matches) {
      matches.forEach(match => {
        // Extraer solo los dígitos
        const numero = match.replace(/\D/g, '');
        // Normalizar: si tiene código de país (51), quitarlo
        let numeroNormalizado = numero;
        if (numero.startsWith('51') && numero.length > 9) {
          numeroNormalizado = numero.substring(2);
        }
        // Si tiene código de área al inicio (084, etc.), quitarlo si es celular
        if (numeroNormalizado.length > 9 && numeroNormalizado.startsWith('0')) {
          numeroNormalizado = numeroNormalizado.substring(1);
        }
        // Validar que sea un número válido (9 dígitos para celular, 7-8 para fijo)
        if (numeroNormalizado.length >= 7 && numeroNormalizado.length <= 9) {
          numerosEncontrados.add(numeroNormalizado);
        }
      });
    }
  });
  
  return Array.from(numerosEncontrados);
}

/**
 * Extrae y elimina emails de un texto
 * 
 * @param texto - Texto del que extraer emails
 * @returns Array de emails encontrados
 */
export function extraerEmails(texto: string): string[] {
  if (!texto || typeof texto !== 'string') {
    return [];
  }
  
  // Patrón para emails
  const patronEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  
  const emails = texto.match(patronEmail) || [];
  return emails.map(email => email.toLowerCase().trim());
}

/**
 * Identifica si un número es WhatsApp (por menciones explícitas o contexto)
 * 
 * @param texto - Texto donde buscar
 * @param numero - Número a verificar
 * @returns true si parece ser WhatsApp
 */
export function esWhatsApp(texto: string, numero: string): boolean {
  if (!texto || !numero) {
    return false;
  }
  
  const textoLower = texto.toLowerCase();
  
  // Buscar menciones explícitas de WhatsApp cerca del número
  const patronesWhatsApp = [
    new RegExp(`(?:whatsapp|wa|wapp|w\.?a\.?|watsap)\\s*:?\\s*${numero.replace(/\D/g, '')}`, 'gi'),
    new RegExp(`${numero.replace(/\D/g, '')}\\s*(?:whatsapp|wa|wapp|w\.?a\.?|watsap)`, 'gi'),
    /whatsapp/gi,
    /\bwa\s*:?\s*\d+/gi,
  ];
  
  return patronesWhatsApp.some(patron => patron.test(texto));
}

/**
 * Limpia todos los números de teléfono de un texto
 * 
 * @param texto - Texto a limpiar
 * @returns Texto sin números de teléfono
 */
export function limpiarNumerosTelefono(texto: string): string {
  if (!texto || typeof texto !== 'string') {
    return texto;
  }
  
  let textoLimpio = texto;
  
  // Patrones para eliminar números de teléfono
  const patrones = [
    // Cel. 9XX-XXX-XXX o Cel 9XX XXX XXX
    /(?:Cel|Cel\.|Celular|Telf|Telf\.|Tel|Tel\.)\s*:?\s*9\d{2}[-]?\s?\d{3}[-]?\s?\d{3}\b/gi,
    // (084) 9XX-XXX-XXX
    /\(?\d{3}\)?\s*9\d{2}[-]?\d{3}[-]?\d{3}\b/g,
    // 9XX XXX XXX o 9XX-XXX-XXX
    /\b9\d{2}[-]?\s?\d{3}[-]?\s?\d{3}\b/g,
    // 9 dígitos seguidos
    /\b9\d{8}\b/g,
    // Formato con espacios: XXX XXX XXX
    /\b\d{3}\s+\d{3}\s+\d{3}\b/g,
  ];
  
  patrones.forEach(patron => {
    textoLimpio = textoLimpio.replace(patron, '');
  });
  
  // Limpiar espacios múltiples resultantes
  textoLimpio = textoLimpio.replace(/\s+/g, ' ').trim();
  
  return textoLimpio;
}

/**
 * Limpia todos los emails de un texto
 * 
 * @param texto - Texto a limpiar
 * @returns Texto sin emails
 */
export function limpiarEmails(texto: string): string {
  if (!texto || typeof texto !== 'string') {
    return texto;
  }
  
  const patronEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  
  let textoLimpio = texto.replace(patronEmail, '');
  
  // Limpiar referencias comunes a emails
  textoLimpio = textoLimpio.replace(/(?:email|e-mail|correo|mail)\s*:?\s*/gi, '');
  
  // Limpiar espacios múltiples
  textoLimpio = textoLimpio.replace(/\s+/g, ' ').trim();
  
  return textoLimpio;
}

/**
 * Limpia menciones de WhatsApp de un texto
 * 
 * @param texto - Texto a limpiar
 * @returns Texto sin menciones de WhatsApp
 */
export function limpiarMencionesWhatsApp(texto: string): string {
  if (!texto || typeof texto !== 'string') {
    return texto;
  }
  
  let textoLimpio = texto;
  
  // Patrones para eliminar menciones de WhatsApp
  const patrones = [
    /(?:whatsapp|wa|wapp|w\.?a\.?|watsap)\s*:?\s*\d+/gi,
    /\d+\s*(?:whatsapp|wa|wapp|w\.?a\.?|watsap)/gi,
    /(?:reservar|contactar|llamar|escribir)\s+(?:al|por|via)\s+(?:whatsapp|wa|wapp)/gi,
  ];
  
  patrones.forEach(patron => {
    textoLimpio = textoLimpio.replace(patron, '');
  });
  
  // Limpiar espacios múltiples
  textoLimpio = textoLimpio.replace(/\s+/g, ' ').trim();
  
  return textoLimpio;
}

/**
 * Limpia TODA la información de contacto de una descripción
 * 
 * @param descripcion - Descripción a limpiar
 * @param contactos - Array de contactos ya extraídos (para referencia)
 * @returns Descripción limpia sin información de contacto
 */
export function limpiarContactosDeDescripcion(
  descripcion: string,
  contactos?: ContactoMultiple[]
): string {
  if (!descripcion || typeof descripcion !== 'string') {
    return descripcion || '';
  }
  
  let descripcionLimpia = descripcion;
  
  // 1. Limpiar números de teléfono
  descripcionLimpia = limpiarNumerosTelefono(descripcionLimpia);
  
  // 2. Limpiar emails
  descripcionLimpia = limpiarEmails(descripcionLimpia);
  
  // 3. Limpiar menciones de WhatsApp
  descripcionLimpia = limpiarMencionesWhatsApp(descripcionLimpia);
  
  // 4. Si tenemos contactos extraídos, eliminar referencias específicas
  if (contactos && Array.isArray(contactos)) {
    contactos.forEach(contacto => {
      const valor = Array.isArray(contacto) ? contacto[0] : contacto;
      if (typeof valor === 'string') {
        // Eliminar el valor del contacto si aparece en el texto
        const valorNormalizado = valor.replace(/\D/g, ''); // Solo dígitos
        if (valorNormalizado.length > 0) {
          const patron = new RegExp(valorNormalizado.replace(/(\d)/g, '[$1\\s-]?'), 'gi');
          descripcionLimpia = descripcionLimpia.replace(patron, '');
        }
        // También eliminar el valor completo si es email
        if (valor.includes('@')) {
          descripcionLimpia = descripcionLimpia.replace(new RegExp(valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
        }
      }
    });
  }
  
  // 5. Limpiar frases comunes relacionadas con contacto
  const frasesContacto = [
    /informes?\s*(?:al|a|por|via|llamar|contactar|escribir)/gi,
    /razón\s*(?:al|a|por|via|llamar|contactar|escribir)/gi,
    /contacto\s*:?/gi,
    /llamar\s*(?:al|a)/gi,
    /escribir\s*(?:al|a)/gi,
    /celular\s*:?/gi,
    /teléfono\s*:?/gi,
    /telf\s*:?/gi,
  ];
  
  frasesContacto.forEach(patron => {
    descripcionLimpia = descripcionLimpia.replace(patron, '');
  });
  
  // 6. Limpiar espacios múltiples y líneas vacías
  descripcionLimpia = descripcionLimpia
    .replace(/\s+/g, ' ') // Múltiples espacios a uno
    .replace(/\n\s*\n/g, '\n') // Múltiples saltos de línea a uno
    .trim();
  
  return descripcionLimpia;
}

/**
 * Valida que una descripción no contenga información de contacto
 * 
 * @param descripcion - Descripción a validar
 * @returns true si la descripción está limpia (sin contactos)
 */
export function validarDescripcionSinContactos(descripcion: string): boolean {
  if (!descripcion) {
    return true;
  }
  
  const numeros = extraerNumerosTelefono(descripcion);
  const emails = extraerEmails(descripcion);
  
  // Si encuentra números o emails, la descripción no está limpia
  return numeros.length === 0 && emails.length === 0;
}




