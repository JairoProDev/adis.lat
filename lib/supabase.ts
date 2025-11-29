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
  return {
    id: row.id,
    categoria: row.categoria,
    titulo: row.titulo,
    descripcion: row.descripcion,
    contacto: row.contacto,
    ubicacion: row.ubicacion,
    fechaPublicacion: row.fecha_publicacion,
    horaPublicacion: row.hora_publicacion,
    imagenUrl: row.imagen_url || undefined
  };
}

// Función para convertir de Aviso a la base de datos
function avisoToDb(aviso: Aviso): any {
  return {
    id: aviso.id,
    categoria: aviso.categoria,
    titulo: aviso.titulo,
    descripcion: aviso.descripcion,
    contacto: aviso.contacto,
    ubicacion: aviso.ubicacion,
    fecha_publicacion: aviso.fechaPublicacion,
    hora_publicacion: aviso.horaPublicacion,
    imagen_url: aviso.imagenUrl || null
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
        throw new Error('Este aviso ya existe (ID duplicado).');
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
