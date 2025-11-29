export type Categoria = 
  | 'empleos'
  | 'inmuebles'
  | 'vehiculos'
  | 'servicios'
  | 'productos'
  | 'eventos'
  | 'negocios'
  | 'comunidad';

export interface Aviso {
  id: string;
  categoria: Categoria;
  titulo: string;
  descripcion: string;
  contacto: string;
  ubicacion: string;
  fechaPublicacion: string;
  horaPublicacion: string;
  imagenesUrls?: string[]; // URLs de las imágenes del aviso (opcional, múltiples)
  // Mantener imagenUrl para compatibilidad hacia atrás
  imagenUrl?: string;
}

export interface AvisoFormData {
  categoria: Categoria;
  titulo: string;
  descripcion: string;
  contacto: string;
  ubicacion: string;
  imagenes?: File[]; // Archivos de imagen (opcional, múltiples)
}

