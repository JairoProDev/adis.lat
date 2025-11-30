import { createClient } from '@supabase/supabase-js';
import { Adiso, AdisoGratuito } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Faltan las variables de entorno de Supabase. Usando localStorage.');
}

// Crear cliente solo si tenemos las credenciales
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      }
    })
  : null;

// Función para convertir de la base de datos a Adiso
function dbToAdiso(row: any): Adiso {
  // Soporte para múltiples imágenes (array JSON) o imagen única (string)
  let imagenesUrls: string[] | undefined;
  if (row.imagenes_urls) {
    // Si es un array JSON
    try {
      imagenesUrls = typeof row.imagenes_urls === 'string' 
        ? JSON.parse(row.imagenes_urls) 
        : row.imagenes_urls;
    } catch {
      imagenesUrls = undefined;
    }
  } else if (row.imagen_url) {
    // Compatibilidad hacia atrás: imagen única
    imagenesUrls = [row.imagen_url];
  }

  return {
    id: row.id,
    categoria: row.categoria,
    titulo: row.titulo,
    descripcion: row.descripcion,
    contacto: row.contacto,
    ubicacion: row.ubicacion,
    fechaPublicacion: row.fecha_publicacion,
    horaPublicacion: row.hora_publicacion,
    tamaño: row.tamaño || 'miniatura',
    imagenesUrls,
    // Compatibilidad hacia atrás
    imagenUrl: imagenesUrls?.[0]
  };
}

// Función para convertir de Adiso a la base de datos
function adisoToDb(adiso: Adiso): any {
  // Convertir array de imágenes a JSON
  const imagenesUrlsJson = adiso.imagenesUrls && adiso.imagenesUrls.length > 0
    ? JSON.stringify(adiso.imagenesUrls)
    : null;

  const dbData: any = {
    id: adiso.id,
    categoria: adiso.categoria,
    titulo: adiso.titulo,
    descripcion: adiso.descripcion,
    contacto: adiso.contacto,
    ubicacion: adiso.ubicacion,
    fecha_publicacion: adiso.fechaPublicacion,
    hora_publicacion: adiso.horaPublicacion,
    imagenes_urls: imagenesUrlsJson,
    // Mantener imagen_url para compatibilidad
    imagen_url: adiso.imagenUrl || adiso.imagenesUrls?.[0] || null
  };

  // Solo incluir tamaño si existe (para evitar errores si la columna no existe en la BD)
  if (adiso.tamaño !== undefined) {
    dbData.tamaño = adiso.tamaño;
  }

  return dbData;
}

export async function getAdisosFromSupabase(): Promise<Adiso[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    const { data, error } = await supabase
      .from('adisos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error al obtener adisos:', error);
      throw error;
    }

    return data ? data.map(dbToAdiso) : [];
  } catch (error: any) {
    // Si es un error de RLS, dar mensaje más claro
    if (error?.code === 'PGRST301' || error?.message?.includes('permission denied')) {
      throw new Error('Las políticas de seguridad no están configuradas. Ejecuta el SQL de seguridad en Supabase.');
    }
    throw error;
  }
}

export async function getAdisoByIdFromSupabase(id: string): Promise<Adiso | null> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    const { data, error } = await supabase
      .from('adisos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró el registro
        return null;
      }
      console.error('Error al obtener adiso:', error);
      throw error;
    }

    return data ? dbToAdiso(data) : null;
  } catch (error: any) {
    if (error?.code === 'PGRST301' || error?.message?.includes('permission denied')) {
      throw new Error('Las políticas de seguridad no están configuradas.');
    }
    throw error;
  }
}

export async function createAdisoInSupabase(adiso: Adiso): Promise<Adiso> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    // Verificar si el adiso ya existe
    const { data: existing } = await supabase
      .from('adisos')
      .select('*')
      .eq('id', adiso.id)
      .single();

    // Si existe, actualizarlo en lugar de crear uno nuevo
    if (existing) {
      return await updateAdisoInSupabase(adiso);
    }

    const { data, error } = await supabase
      .from('adisos')
      .insert(adisoToDb(adiso))
      .select()
      .single();

    if (error) {
      console.error('Error al crear adiso:', error);
      
      // Errores comunes con mensajes más claros
      if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
        throw new Error('No tienes permiso para crear adisos. Verifica las políticas de seguridad en Supabase.');
      }
      
      if (error.code === '23505') {
        // Si es duplicado, intentar actualizar
        return await updateAdisoInSupabase(adiso);
      }
      
      throw error;
    }

    if (!data) {
      throw new Error('No se recibió respuesta al crear el adiso');
    }

    return dbToAdiso(data);
  } catch (error: any) {
    throw error;
  }
}

export async function updateAdisoInSupabase(adiso: Adiso): Promise<Adiso> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    const { data, error } = await supabase
      .from('adisos')
      .update(adisoToDb(adiso))
      .eq('id', adiso.id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar adiso:', error);
      
      // Errores comunes con mensajes más claros
      if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
        throw new Error('No tienes permiso para actualizar adisos. Verifica las políticas de seguridad en Supabase.');
      }
      
      if (error.code === 'PGRST116') {
        throw new Error('Adiso no encontrado.');
      }
      
      throw error;
    }

    if (!data) {
      throw new Error('No se recibió respuesta al actualizar el adiso');
    }

    return dbToAdiso(data);
  } catch (error: any) {
    throw error;
  }
}

// Funciones para adisos gratuitos

// Función para convertir de la base de datos a AdisoGratuito
function dbToAdisoGratuito(row: any): AdisoGratuito {
  return {
    id: row.id,
    categoria: row.categoria,
    titulo: row.titulo,
    contacto: row.contacto,
    fechaCreacion: row.fecha_creacion,
    fechaExpiracion: row.fecha_expiracion
  };
}

// Función para convertir de AdisoGratuito a la base de datos
function adisoGratuitoToDb(adiso: AdisoGratuito): any {
  return {
    id: adiso.id,
    categoria: adiso.categoria,
    titulo: adiso.titulo,
    contacto: adiso.contacto,
    fecha_creacion: adiso.fechaCreacion,
    fecha_expiracion: adiso.fechaExpiracion
  };
}

export async function getAdisosGratuitosFromSupabase(): Promise<AdisoGratuito[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    // Solo obtener adisos que no han expirado
    const ahora = new Date().toISOString();
    const { data, error } = await supabase
      .from('adisos_gratuitos')
      .select('*')
      .gt('fecha_expiracion', ahora)
      .order('fecha_creacion', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error al obtener adisos gratuitos:', error);
      throw error;
    }

    return data ? data.map(dbToAdisoGratuito) : [];
  } catch (error: any) {
    if (error?.code === 'PGRST301' || error?.message?.includes('permission denied')) {
      throw new Error('Las políticas de seguridad no están configuradas. Ejecuta el SQL de seguridad en Supabase.');
    }
    throw error;
  }
}

export async function createAdisoGratuitoInSupabase(adiso: AdisoGratuito): Promise<AdisoGratuito> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    const { data, error } = await supabase
      .from('adisos_gratuitos')
      .insert(adisoGratuitoToDb(adiso))
      .select()
      .single();

    if (error) {
      console.error('Error al crear adiso gratuito:', error);
      
      if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
        throw new Error('No tienes permiso para crear adisos gratuitos. Verifica las políticas de seguridad en Supabase.');
      }
      
      throw error;
    }

    if (!data) {
      throw new Error('No se recibió respuesta al crear el adiso gratuito');
    }

    return dbToAdisoGratuito(data);
  } catch (error: any) {
    throw error;
  }
}
