import { createClient } from '@supabase/supabase-js';
import { Aviso } from '@/types';

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

// Función para convertir de la base de datos a Aviso
function dbToAviso(row: any): Aviso {
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

// Función para convertir de Aviso a la base de datos
function avisoToDb(aviso: Aviso): any {
  // Convertir array de imágenes a JSON
  const imagenesUrlsJson = aviso.imagenesUrls && aviso.imagenesUrls.length > 0
    ? JSON.stringify(aviso.imagenesUrls)
    : null;

  return {
    id: aviso.id,
    categoria: aviso.categoria,
    titulo: aviso.titulo,
    descripcion: aviso.descripcion,
    contacto: aviso.contacto,
    ubicacion: aviso.ubicacion,
    fecha_publicacion: aviso.fechaPublicacion,
    hora_publicacion: aviso.horaPublicacion,
    tamaño: aviso.tamaño || 'miniatura',
    imagenes_urls: imagenesUrlsJson,
    // Mantener imagen_url para compatibilidad
    imagen_url: aviso.imagenUrl || aviso.imagenesUrls?.[0] || null
  };
}

export async function getAvisosFromSupabase(): Promise<Aviso[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    const { data, error } = await supabase
      .from('avisos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error al obtener avisos:', error);
      throw error;
    }

    return data ? data.map(dbToAviso) : [];
  } catch (error: any) {
    // Si es un error de RLS, dar mensaje más claro
    if (error?.code === 'PGRST301' || error?.message?.includes('permission denied')) {
      throw new Error('Las políticas de seguridad no están configuradas. Ejecuta el SQL de seguridad en Supabase.');
    }
    throw error;
  }
}

export async function getAvisoByIdFromSupabase(id: string): Promise<Aviso | null> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    const { data, error } = await supabase
      .from('avisos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró el registro
        return null;
      }
      console.error('Error al obtener aviso:', error);
      throw error;
    }

    return data ? dbToAviso(data) : null;
  } catch (error: any) {
    if (error?.code === 'PGRST301' || error?.message?.includes('permission denied')) {
      throw new Error('Las políticas de seguridad no están configuradas.');
    }
    throw error;
  }
}

export async function createAvisoInSupabase(aviso: Aviso): Promise<Aviso> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    // Verificar si el aviso ya existe
    const { data: existing } = await supabase
      .from('avisos')
      .select('*')
      .eq('id', aviso.id)
      .single();

    // Si existe, actualizarlo en lugar de crear uno nuevo
    if (existing) {
      return await updateAvisoInSupabase(aviso);
    }

    const { data, error } = await supabase
      .from('avisos')
      .insert(avisoToDb(aviso))
      .select()
      .single();

    if (error) {
      console.error('Error al crear aviso:', error);
      
      // Errores comunes con mensajes más claros
      if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
        throw new Error('No tienes permiso para crear avisos. Verifica las políticas de seguridad en Supabase.');
      }
      
      if (error.code === '23505') {
        // Si es duplicado, intentar actualizar
        return await updateAvisoInSupabase(aviso);
      }
      
      throw error;
    }

    if (!data) {
      throw new Error('No se recibió respuesta al crear el aviso');
    }

    return dbToAviso(data);
  } catch (error: any) {
    throw error;
  }
}

export async function updateAvisoInSupabase(aviso: Aviso): Promise<Aviso> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    const { data, error } = await supabase
      .from('avisos')
      .update(avisoToDb(aviso))
      .eq('id', aviso.id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar aviso:', error);
      
      // Errores comunes con mensajes más claros
      if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
        throw new Error('No tienes permiso para actualizar avisos. Verifica las políticas de seguridad en Supabase.');
      }
      
      if (error.code === 'PGRST116') {
        throw new Error('Aviso no encontrado.');
      }
      
      throw error;
    }

    if (!data) {
      throw new Error('No se recibió respuesta al actualizar el aviso');
    }

    return dbToAviso(data);
  } catch (error: any) {
    throw error;
  }
}
