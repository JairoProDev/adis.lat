import { z } from 'zod';

// Schema de validación para adisos
export const adisoSchema = z.object({
  id: z.string().min(1, 'ID es requerido'),
  categoria: z.enum([
    'empleos',
    'inmuebles',
    'vehiculos',
    'servicios',
    'productos',
    'eventos',
    'negocios',
    'comunidad'
  ]),
  titulo: z.string()
    .min(1, 'El título es requerido')
    .max(100, 'El título no puede exceder 100 caracteres')
    .trim(),
  descripcion: z.string()
    .max(2000, 'La descripción no puede exceder 2000 caracteres')
    .optional()
    .nullable(),
  contacto: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Número de contacto inválido')
    .min(9, 'El número de contacto debe tener al menos 9 dígitos'),
  ubicacion: z.string()
    .min(1, 'La ubicación es requerida')
    .max(100, 'La ubicación no puede exceder 100 caracteres')
    .trim(),
  tamaño: z.enum(['miniatura', 'pequeño', 'mediano', 'grande', 'gigante']).optional(),
  imagenUrl: z.string().url().optional().nullable(),
  imagenesUrls: z.array(z.string().url()).optional().nullable(),
  fechaPublicacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  horaPublicacion: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
});

// Schema para adisos gratuitos (más restrictivo)
export const adisoGratuitoSchema = z.object({
  titulo: z.string()
    .min(1, 'El título es requerido')
    .max(30, 'El título no puede exceder 30 caracteres')
    .trim(),
  categoria: z.enum([
    'empleos',
    'inmuebles',
    'vehiculos',
    'servicios',
    'productos',
    'eventos',
    'negocios',
    'comunidad'
  ]),
  contacto: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Número de contacto inválido')
    .min(9, 'El número de contacto debe tener al menos 9 dígitos'),
});

// Schema para crear adiso (sin validar campos generados automáticamente)
export const createAdisoSchema = adisoSchema.omit({
  id: true,
  fechaPublicacion: true,
  horaPublicacion: true,
}).extend({
  fechaPublicacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  horaPublicacion: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

// Schema para crear adiso gratuito
export const createAdisoGratuitoSchema = adisoGratuitoSchema;

// Funciones de sanitización
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Múltiples espacios a uno
    .replace(/[<>]/g, ''); // Remover < y >
}

// Función para sanitizar HTML (prevenir XSS)
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // En el servidor, usar una sanitización básica
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  // En el cliente, usar DOMPurify si está disponible
  // Por ahora, usar sanitización básica
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

// Validar tamaño de imagen
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Tipo de archivo no permitido. Use JPEG, PNG o WebP' };
  }
  
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'El archivo es demasiado grande. Máximo 5MB' };
  }
  
  return { valid: true };
}

// Validar URL
export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
