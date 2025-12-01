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

// ============================================
// TIPOS DE AUTENTICACIÓN Y USUARIOS
// ============================================

export type RolUsuario = 'usuario' | 'anunciante' | 'admin';
export type Genero = 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir';
export type TemaPreferencia = 'light' | 'dark' | 'auto';
export type DisponibilidadProfesional = 'disponible' | 'busco_empleo' | 'no_disponible';
export type TipoVerificacion = 'identidad' | 'telefono' | 'email' | 'negocio';
export type EstadoVerificacion = 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';
export type TipoEventoAnalytics = 'busqueda' | 'click' | 'favorito' | 'contacto' | 'publicacion' | 'visualizacion';

export interface Profile {
  id: string;
  email?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  avatar_url?: string;
  ubicacion?: string;
  latitud?: number;
  longitud?: number;
  rol: RolUsuario;
  es_verificado: boolean;
  fecha_verificacion?: string;
  fecha_nacimiento?: string;
  genero?: Genero;
  bio?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface Favorito {
  id: string;
  user_id: string;
  adiso_id: string;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  categorias_favoritas: Categoria[];
  notificaciones_email: boolean;
  notificaciones_push: boolean;
  idioma: string;
  tema: TemaPreferencia;
  radio_busqueda_km: number;
  created_at: string;
  updated_at: string;
}

export interface Verificacion {
  id: string;
  user_id: string;
  tipo: TipoVerificacion;
  estado: EstadoVerificacion;
  documento_url?: string;
  datos_verificacion?: Record<string, any>;
  motivo_rechazo?: string;
  revisado_por?: string;
  fecha_revision?: string;
  created_at: string;
  updated_at: string;
}

export interface Educacion {
  institucion: string;
  titulo: string;
  año_inicio?: number;
  año_fin?: number;
  descripcion?: string;
}

export interface ExperienciaLaboral {
  empresa: string;
  puesto: string;
  año_inicio?: number;
  año_fin?: number;
  descripcion?: string;
  actual: boolean;
}

export interface Certificacion {
  nombre: string;
  institucion: string;
  año?: number;
  url?: string;
}

export interface PerfilProfesional {
  id: string;
  user_id: string;
  titulo_profesional?: string;
  experiencia_anos?: number;
  habilidades: string[];
  educacion: Educacion[];
  experiencia_laboral: ExperienciaLaboral[];
  certificaciones: Certificacion[];
  idiomas: string[];
  disponibilidad?: DisponibilidadProfesional;
  salario_esperado_min?: number;
  salario_esperado_max?: number;
  cv_url?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  created_at: string;
  updated_at: string;
}

export interface HorarioAtencion {
  dia: string; // 'lunes', 'martes', etc.
  abierto: boolean;
  hora_apertura?: string;
  hora_cierre?: string;
}

export interface RedesSociales {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
}

export interface PerfilNegocio {
  id: string;
  user_id: string;
  nombre_negocio: string;
  descripcion?: string;
  categoria?: string;
  telefono?: string;
  email?: string;
  website?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  horario_atencion?: HorarioAtencion[];
  redes_sociales: RedesSociales;
  imagenes: string[];
  logo_url?: string;
  es_verificado: boolean;
  rating_promedio: number;
  total_calificaciones: number;
  created_at: string;
  updated_at: string;
}

export interface UserAnalytics {
  id: string;
  user_id?: string;
  evento: string;
  tipo_evento: TipoEventoAnalytics;
  datos: Record<string, any>;
  created_at: string;
}
