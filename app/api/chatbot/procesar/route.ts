import { NextRequest, NextResponse } from 'next/server';
import { buscarEnTOON } from '@/lib/busqueda-toon';
import { Categoria } from '@/types';

interface DatosPublicacion {
  categoria?: Categoria;
  titulo?: string;
  descripcion?: string;
  contacto?: string;
  ubicacion?: string;
  tamaño?: string;
}

// Detectar intención del mensaje
function detectarIntencion(mensaje: string): 'buscar' | 'publicar' | 'cancelar' | 'otro' {
  const texto = mensaje.toLowerCase().trim();
  
  // Palabras clave para cancelar
  if (texto.includes('cancelar') || texto.includes('cancel') || texto.includes('no quiero') || texto.includes('olvídalo')) {
    return 'cancelar';
  }
  
  // Palabras clave para publicar
  const palabrasPublicar = ['publicar', 'publica', 'crear', 'nuevo adiso', 'nuevo anuncio', 'quiero publicar', 'necesito publicar', 'agregar'];
  if (palabrasPublicar.some(palabra => texto.includes(palabra))) {
    return 'publicar';
  }
  
  // Palabras clave para buscar
  const palabrasBuscar = ['buscar', 'busca', 'encontrar', 'necesito', 'quiero', 'tengo', 'hay', 'muéstrame', 'dame', 'ver'];
  if (palabrasBuscar.some(palabra => texto.includes(palabra)) || texto.includes('?')) {
    return 'buscar';
  }
  
  return 'otro';
}

// Extraer categoría del mensaje
function extraerCategoria(mensaje: string): Categoria | null {
  const texto = mensaje.toLowerCase();
  const categorias: Record<string, Categoria> = {
    'empleo': 'empleos',
    'trabajo': 'empleos',
    'trabajar': 'empleos',
    'inmueble': 'inmuebles',
    'casa': 'inmuebles',
    'departamento': 'inmuebles',
    'terreno': 'inmuebles',
    'alquiler': 'inmuebles',
    'vehículo': 'vehiculos',
    'vehiculo': 'vehiculos',
    'auto': 'vehiculos',
    'carro': 'vehiculos',
    'moto': 'vehiculos',
    'servicio': 'servicios',
    'producto': 'productos',
    'evento': 'eventos',
    'negocio': 'negocios',
    'comunidad': 'comunidad'
  };
  
  for (const [palabra, categoria] of Object.entries(categorias)) {
    if (texto.includes(palabra)) {
      return categoria;
    }
  }
  
  return null;
}

// Extraer información de publicación del mensaje
function extraerDatosPublicacion(mensaje: string, datosActuales: DatosPublicacion, pasoActual?: string): DatosPublicacion {
  const texto = mensaje.toLowerCase();
  const nuevosDatos: DatosPublicacion = { ...datosActuales };
  
  // Si hay un paso actual, procesar según ese paso
  if (pasoActual === 'categoria') {
    const categoria = extraerCategoria(mensaje);
    if (categoria) {
      nuevosDatos.categoria = categoria;
    }
  } else if (pasoActual === 'titulo') {
    // El mensaje completo es el título (limitar a 50 caracteres)
    nuevosDatos.titulo = mensaje.substring(0, 50).trim();
  } else if (pasoActual === 'descripcion') {
    // El mensaje completo es la descripción
    nuevosDatos.descripcion = mensaje.trim();
  } else if (pasoActual === 'contacto') {
    // Extraer contacto (números de teléfono)
    const telefonoRegex = /(\+?51)?[\s-]?9\d{8}|\d{9}/;
    const telefonoMatch = mensaje.match(telefonoRegex);
    if (telefonoMatch) {
      nuevosDatos.contacto = telefonoMatch[0].replace(/\s/g, '');
    } else {
      // Si no hay número, usar el mensaje completo como contacto
      nuevosDatos.contacto = mensaje.trim();
    }
  } else {
    // Extracción automática sin paso específico
    // Extraer categoría
    if (!nuevosDatos.categoria) {
      const categoria = extraerCategoria(mensaje);
      if (categoria) {
        nuevosDatos.categoria = categoria;
      }
    }
    
    // Extraer título (si el mensaje parece un título)
    if (!nuevosDatos.titulo && mensaje.length > 5 && mensaje.length < 100) {
      // Si no tiene signos de interrogación y parece descriptivo
      if (!mensaje.includes('?') && !mensaje.includes('cómo') && !mensaje.includes('qué') && !mensaje.includes('cuál')) {
        nuevosDatos.titulo = mensaje.substring(0, 50).trim();
      }
    }
    
    // Extraer contacto (números de teléfono)
    if (!nuevosDatos.contacto) {
      const telefonoRegex = /(\+?51)?[\s-]?9\d{8}|\d{9}/;
      const telefonoMatch = mensaje.match(telefonoRegex);
      if (telefonoMatch) {
        nuevosDatos.contacto = telefonoMatch[0].replace(/\s/g, '');
      }
    }
    
    // Extraer ubicación
    if (!nuevosDatos.ubicacion) {
      const ubicaciones = ['cusco', 'lima', 'arequipa', 'trujillo', 'chiclayo', 'iquitos', 'piura', 'cajamarca', 'cusco', 'cusco'];
      for (const ubicacion of ubicaciones) {
        if (texto.includes(ubicacion)) {
          nuevosDatos.ubicacion = ubicacion.charAt(0).toUpperCase() + ubicacion.slice(1);
          break;
        }
      }
    }
  }
  
  return nuevosDatos;
}

// Generar respuesta para publicación
function generarRespuestaPublicacion(datos: DatosPublicacion, paso: number): { respuesta: string; siguientePaso?: string; completo?: boolean } {
  if (!datos.categoria) {
    return {
      respuesta: '¡Perfecto! Vamos a publicar tu adiso. Te haré algunas preguntas rápidas.\n\n¿Qué categoría es? Puedes decir: empleos, inmuebles, vehículos, servicios, productos, eventos, negocios o comunidad.',
      siguientePaso: 'categoria'
    };
  }
  
  if (!datos.titulo) {
    const categoriaNombre: Record<Categoria, string> = {
      empleos: 'empleo',
      inmuebles: 'inmueble',
      vehiculos: 'vehículo',
      servicios: 'servicio',
      productos: 'producto',
      eventos: 'evento',
      negocios: 'negocio',
      comunidad: 'comunidad'
    };
    return {
      respuesta: `Excelente, categoría ${categoriaNombre[datos.categoria]} registrada. ✨\n\n¿Cuál es el título de tu adiso? (máximo 50 caracteres)\n\nEjemplo: "Departamento en alquiler en Cusco"`,
      siguientePaso: 'titulo'
    };
  }
  
  if (!datos.descripcion) {
    return {
      respuesta: `Título guardado: "${datos.titulo}" ✅\n\nAhora, ¿puedes darme una descripción más detallada? Cuéntame más sobre tu adiso.`,
      siguientePaso: 'descripcion'
    };
  }
  
  if (!datos.contacto) {
    return {
      respuesta: `Descripción guardada. 📝\n\nPor último, ¿cuál es tu número de contacto? (puede ser teléfono o WhatsApp)\n\nEjemplo: 987654321`,
      siguientePaso: 'contacto'
    };
  }
  
  // Si tiene lo básico, está completo
  return {
    respuesta: '¡Perfecto! ✅ Tengo toda la información:\n\n' +
      `• Categoría: ${datos.categoria}\n` +
      `• Título: ${datos.titulo}\n` +
      `• Descripción: ${datos.descripcion?.substring(0, 50)}...\n` +
      `• Contacto: ${datos.contacto}\n\n` +
      'Voy a publicar tu adiso ahora...',
    completo: true
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mensaje, datosPublicacion = {}, modoPublicacion = false } = body;
    
    if (!mensaje || typeof mensaje !== 'string') {
      return NextResponse.json(
        { error: 'Se requiere un mensaje válido' },
        { status: 400 }
      );
    }
    
    const intencion = detectarIntencion(mensaje);
    
    if (intencion === 'buscar' || (intencion === 'otro' && !modoPublicacion)) {
      // Procesar búsqueda
      try {
        const resultados = await buscarEnTOON(mensaje, 10);
        
        let respuesta = '';
        if (resultados.length > 0) {
          respuesta = `Encontré ${resultados.length} resultado${resultados.length !== 1 ? 's' : ''} relacionado${resultados.length !== 1 ? 's' : ''} con "${mensaje}". Aquí están:`;
        } else {
          respuesta = `No encontré resultados exactos para "${mensaje}". ¿Puedes ser más específico o intentar con otras palabras clave?`;
        }
        
        return NextResponse.json({
          intencion: 'buscar',
          respuesta,
          resultados: resultados.map(adiso => ({
            id: adiso.id,
            titulo: adiso.titulo,
            categoria: adiso.categoria,
            descripcion: adiso.descripcion?.substring(0, 200),
            ubicacion: typeof adiso.ubicacion === 'string' 
              ? adiso.ubicacion 
              : `${adiso.ubicacion.distrito || ''}, ${adiso.ubicacion.provincia || ''}`,
            fechaPublicacion: adiso.fechaPublicacion,
            estaActivo: adiso.estaActivo
          })),
          total: resultados.length
        });
      } catch (error: any) {
        console.error('Error en búsqueda:', error);
        return NextResponse.json({
          intencion: 'buscar',
          respuesta: 'Lo siento, hubo un error al buscar. Por favor intenta nuevamente con otras palabras.',
          resultados: [],
          total: 0
        });
      }
    }
    
    if (intencion === 'publicar' || modoPublicacion) {
      // Procesar publicación
      // Determinar el paso actual basado en qué datos faltan
      let pasoActual: string | undefined;
      if (!datosPublicacion.categoria) {
        pasoActual = 'categoria';
      } else if (!datosPublicacion.titulo) {
        pasoActual = 'titulo';
      } else if (!datosPublicacion.descripcion) {
        pasoActual = 'descripcion';
      } else if (!datosPublicacion.contacto) {
        pasoActual = 'contacto';
      }
      
      const datosExtraidos = extraerDatosPublicacion(mensaje, datosPublicacion, pasoActual);
      const pasoActualizado = Object.keys(datosExtraidos).filter(k => datosExtraidos[k as keyof DatosPublicacion]).length;
      const respuestaPublicacion = generarRespuestaPublicacion(datosExtraidos, pasoActualizado);
      
      return NextResponse.json({
        intencion: 'publicar',
        respuesta: respuestaPublicacion.respuesta,
        datosExtraidos,
        siguientePaso: respuestaPublicacion.siguientePaso,
        completo: respuestaPublicacion.completo
      });
    }
    
    if (intencion === 'cancelar') {
      return NextResponse.json({
        intencion: 'cancelar',
        respuesta: 'Publicación cancelada. ¿En qué más puedo ayudarte?'
      });
    }
    
    // Respuesta genérica
    return NextResponse.json({
      intencion: 'otro',
      respuesta: 'No estoy seguro de cómo ayudarte con eso. Puedo ayudarte a:\n\n• Buscar adisos: "Buscar departamentos en Cusco"\n• Publicar un adiso: "Quiero publicar un adiso"\n\n¿Qué te gustaría hacer?'
    });
    
  } catch (error: any) {
    console.error('Error en chatbot/procesar:', error);
    return NextResponse.json(
      { error: 'Error al procesar el mensaje', detalles: error.message },
      { status: 500 }
    );
  }
}

