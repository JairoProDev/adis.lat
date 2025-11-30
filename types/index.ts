export type Categoria = 
  | 'empleos'
  | 'inmuebles'
  | 'vehiculos'
  | 'servicios'
  | 'productos'
  | 'eventos'
  | 'negocios'
  | 'comunidad';

export type TamañoPaquete = 'miniatura' | 'pequeño' | 'mediano' | 'grande' | 'gigante';

export interface PaqueteInfo {
  tamaño: TamañoPaquete;
  precio: number;
  nombre: string;
  columnas: number; // En desktop (base 4 columnas)
  filas: number; // En desktop
  maxImagenes: number;
  descripcion: string;
}

export const PAQUETES: Record<TamañoPaquete, PaqueteInfo> = {
  miniatura: {
    tamaño: 'miniatura',
    precio: 15,
    nombre: 'Miniatura',
    columnas: 1,
    filas: 1,
    maxImagenes: 0,
    descripcion: '1x1 - Sin imagen'
  },
  pequeño: {
    tamaño: 'pequeño',
    precio: 25,
    nombre: 'Pequeño',
    columnas: 1,
    filas: 2,
    maxImagenes: 1,
    descripcion: '1x2 - 1 imagen'
  },
  mediano: {
    tamaño: 'mediano',
    precio: 45,
    nombre: 'Mediano',
    columnas: 2,
    filas: 2,
    maxImagenes: 3,
    descripcion: '2x2 - 3 imágenes'
  },
  grande: {
    tamaño: 'grande',
    precio: 85,
    nombre: 'Grande',
    columnas: 2,
    filas: 4,
    maxImagenes: 5,
    descripcion: '2x4 - 5 imágenes'
  },
  gigante: {
    tamaño: 'gigante',
    precio: 125,
    nombre: 'Gigante',
    columnas: 2,
    filas: 6,
    maxImagenes: 10,
    descripcion: '2x6 - 10 imágenes'
  }
};

export interface Adiso {
  id: string;
  categoria: Categoria;
  titulo: string;
  descripcion: string;
  contacto: string;
  ubicacion: string;
  fechaPublicacion: string;
  horaPublicacion: string;
  tamaño?: TamañoPaquete; // Tamaño del paquete seleccionado
  imagenesUrls?: string[]; // URLs de las imágenes del adiso (opcional, múltiples)
  // Mantener imagenUrl para compatibilidad hacia atrás
  imagenUrl?: string;
  esGratuito?: boolean; // Indica si es un adiso gratuito
}

export interface AdisoGratuito {
  id: string;
  categoria: Categoria;
  titulo: string; // Máximo 30 caracteres
  contacto: string;
  fechaCreacion: string;
  fechaExpiracion: string; // 1 día después de fechaCreacion
}

export interface AdisoFormData {
  categoria: Categoria;
  titulo: string;
  descripcion: string;
  contacto: string;
  ubicacion: string;
  tamaño?: TamañoPaquete; // Tamaño del paquete seleccionado
  imagenes?: File[]; // Archivos de imagen (opcional, múltiples)
}

