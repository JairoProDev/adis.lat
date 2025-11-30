import { z } from 'zod';
import { Categoria, TamañoPaquete } from '@/types';

// Límites de validación
export const LIMITS = {
  TITULO_MIN: 3,
  TITULO_MAX: 200,
  DESCRIPCION_MIN: 10,
  DESCRIPCION_MAX: 5000,
  UBICACION_MIN: 2,
  UBICACION_MAX: 200,
  CONTACTO_MIN: 8,
  CONTACTO_MAX: 20,
  IMAGEN_SIZE_MAX: 5 * 1024 * 1024, // 5MB
  IMAGEN_DIMENSION_MAX: 4096, // 4096px
} as const;

// Validación de categoría
const categoriaSchema = z.enum([
  'empleos',
  'inmuebles',
  'vehiculos',
  'servicios',
  'productos',
  'eventos',
  'negocios',
  'comunidad'
]);

// Validación de tamaño de paquete
const tamañoPaqueteSchema = z.enum([
  'miniatura',
  'pequeño',
  'mediano',
  'grande',
  'gigante'
]);

// Validación de teléfono (permite números, +, espacios, guiones)
const telefonoSchema = z.string()
  .min(LIMITS.CONTACTO_MIN, `El contacto debe tener al menos ${LIMITS.CONTACTO_MIN} caracteres`)
  .max(LIMITS.CONTACTO_MAX, `El contacto no puede exceder ${LIMITS.CONTACTO_MAX} caracteres`)
  .regex(/^[\d\s\+\-\(\)]+$/, 'El contacto solo puede contener números, espacios, +, -, ( y )');

// Schema para crear adiso
export const createAdisoSchema = z.object({
  categoria: categoriaSchema,
  titulo: z.string()
    .min(LIMITS.TITULO_MIN, `El título debe tener al menos ${LIMITS.TITULO_MIN} caracteres`)
    .max(LIMITS.TITULO_MAX, `El título no puede exceder ${LIMITS.TITULO_MAX} caracteres`)
    .trim(),
  descripcion: z.string()
    .min(LIMITS.DESCRIPCION_MIN, `La descripción debe tener al menos ${LIMITS.DESCRIPCION_MIN} caracteres`)
    .max(LIMITS.DESCRIPCION_MAX, `La descripción no puede exceder ${LIMITS.DESCRIPCION_MAX} caracteres`)
    .trim(),
  contacto: telefonoSchema,
  ubicacion: z.string()
    .min(LIMITS.UBICACION_MIN, `La ubicación debe tener al menos ${LIMITS.UBICACION_MIN} caracteres`)
    .max(LIMITS.UBICACION_MAX, `La ubicación no puede exceder ${LIMITS.UBICACION_MAX} caracteres`)
    .trim(),
  tamaño: tamañoPaqueteSchema.optional().default('miniatura'),
  imagenesUrls: z.array(z.string().url()).optional(),
  imagenUrl: z.string().url().optional(),
  esGratuito: z.boolean().optional().default(false),
  id: z.string().optional(),
  fechaPublicacion: z.string().optional(),
  horaPublicacion: z.string().optional(),
}).strict();

// Schema para adiso gratuito (más restrictivo)
export const createAdisoGratuitoSchema = z.object({
  categoria: categoriaSchema,
  titulo: z.string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(30, 'El título no puede exceder 30 caracteres')
    .trim(),
  contacto: telefonoSchema,
}).strict();

// Schema para actualizar adiso
export const updateAdisoSchema = createAdisoSchema.partial().required({ id: true });

// Función para sanitizar HTML (prevenir XSS)
export function sanitizeHtml(html: string): string {
  // Remover tags HTML peligrosos y sus atributos
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '');
}

// Función para sanitizar texto plano
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // Remover < y >
    .trim();
}

// Validación de tipo MIME de imagen
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
] as const;

export function isValidImageType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType as typeof ALLOWED_IMAGE_TYPES[number]);
}

// Validación de tamaño de archivo
export function isValidImageSize(size: number): boolean {
  return size > 0 && size <= LIMITS.IMAGEN_SIZE_MAX;
}

