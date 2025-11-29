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
  imagenUrl?: string; // URL de la imagen del aviso (opcional)
}

export interface AvisoFormData {
  categoria: Categoria;
  titulo: string;
  descripcion: string;
  contacto: string;
  ubicacion: string;
  imagenUrl?: string; // URL de la imagen (opcional)
}

