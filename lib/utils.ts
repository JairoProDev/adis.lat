import { nanoid } from 'nanoid';

export const formatFecha = (fecha: string, hora: string): string => {
  const date = new Date(`${fecha}T${hora}`);
  
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getWhatsAppUrl = (contacto: string, titulo: string, categoria: string, id: string): string => {
  const url = `${window.location.origin}/?aviso=${id}`;
  const mensajeBase = `Hola, vi tu aviso de ${categoria} "${titulo}" en ${url} y me interesa. ¿Podrías brindarme más información, por favor?`;
  const mensaje = encodeURIComponent(mensajeBase);
  const numero = contacto.replace(/\D/g, ''); // Solo números
  return `https://wa.me/${numero}?text=${mensaje}`;
};

export const copiarLink = (id: string): Promise<void> => {
  const url = `${window.location.origin}/?aviso=${id}`;
  return navigator.clipboard.writeText(url);
};

export const compartirNativo = async (id: string, titulo: string): Promise<void> => {
  const url = `${window.location.origin}/?aviso=${id}`;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: titulo,
        text: `Mira este aviso: ${titulo}`,
        url: url
      });
    } catch (err) {
      // Usuario canceló o error
      console.log('Error al compartir:', err);
    }
  } else {
    // Fallback: copiar al portapapeles
    await copiarLink(id);
  }
};

// Validación y formateo de teléfono
export const formatPhoneNumber = (value: string): string => {
  // Remover todo excepto números, + y espacios
  const cleaned = value.replace(/[^\d+\s]/g, '');
  
  // Si empieza con +, mantenerlo
  if (cleaned.startsWith('+')) {
    // Formato: +XX XXX XXX XXX
    const numbers = cleaned.replace(/\D/g, '').slice(1); // Quitar el +
    if (numbers.length <= 3) {
      return `+${numbers}`;
    } else if (numbers.length <= 6) {
      return `+${numbers.slice(0, 3)} ${numbers.slice(3)}`;
    } else if (numbers.length <= 9) {
      return `+${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6)}`;
    } else {
      return `+${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 9)} ${numbers.slice(9, 12)}`;
    }
  } else {
    // Formato sin +: XXX XXX XXX
    const numbers = cleaned.replace(/\D/g, '');
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6)}`;
    } else {
      return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 9)} ${numbers.slice(9, 12)}`;
    }
  }
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Remover espacios y validar
  const cleaned = phone.replace(/\s/g, '');
  // Debe tener al menos 8 dígitos (con o sin código de país)
  const digits = cleaned.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
};

// Límites de caracteres
export const LIMITS = {
  TITULO_MAX: 100,
  DESCRIPCION_MAX: 1000,
  UBICACION_MAX: 100,
};

// Generar ID único y amigable usando NanoID
export const generarIdUnico = (): string => {
  // Usar NanoID con tamaño personalizado (10 caracteres = ~73 años antes de colisión al 1% con 1000 IDs/día)
  // URL-safe, más corto y legible que UUID o timestamp+random
  // Ejemplo: "V1StGXR8_Z" (10 caracteres) vs "1764436785116-tjrfgcu9g" (25 caracteres)
  return nanoid(10);
};

