import { Categoria } from '@/types';

/**
 * Palabras de relleno que no aportan valor a la búsqueda
 */
const STOP_WORDS = new Set([
    'quiero', 'busco', 'necesito', 'me', 'interesa', 'un', 'una', 'el', 'la',
    'en', 'de', 'para', 'por', 'con', 'sin', 'sobre', 'entre', 'hasta',
    'desde', 'hacia', 'que', 'como', 'donde', 'cuando', 'cual', 'cuales',
    'hay', 'tiene', 'tengo', 'ver', 'dame', 'muestra', 'muéstrame'
]);

/**
 * Diccionario de sinónimos para mejorar búsquedas
 */
const SINONIMOS: Record<string, string[]> = {
    'casa': ['vivienda', 'hogar', 'residencia', 'inmueble'],
    'departamento': ['depa', 'flat', 'apartamento', 'piso'],
    'habitación': ['cuarto', 'dormitorio', 'pieza', 'recámara'],
    'barato': ['económico', 'accesible', 'bajo costo', 'módico'],
    'caro': ['costoso', 'elevado', 'alto precio'],
    'nuevo': ['reciente', 'estreno', 'flamante'],
    'usado': ['segunda mano', 'ocasión'],
    'trabajo': ['empleo', 'chamba', 'labor', 'puesto'],
    'auto': ['carro', 'vehículo', 'automóvil'],
    'moto': ['motocicleta', 'scooter']
};

/**
 * Patrones de ubicación comunes en Cusco
 */
const UBICACIONES_CUSCO = [
    'Cusco', 'Wanchaq', 'Wánchaq', 'San Sebastián', 'San Jerónimo', 'Santiago',
    'Centro', 'Plaza de Armas', 'Magisterio', 'Larapa', 'Ttio',
    'Lucrepata', 'Marcavalle', 'Huancaro', 'Oropesa', 'Saylla',
    'Poroy', 'Chinchero', 'Urubamba', 'Calca'
];

/**
 * Mapeo de palabras clave a categorías
 */
const PALABRAS_CATEGORIA: Record<string, Categoria> = {
    // Empleos
    'empleo': 'empleos',
    'trabajo': 'empleos',
    'trabajar': 'empleos',
    'chamba': 'empleos',
    'vacante': 'empleos',
    'puesto': 'empleos',
    'personal': 'empleos',
    'contratar': 'empleos',
    'solicita': 'empleos',
    'requiere': 'empleos',

    // Inmuebles
    'inmueble': 'inmuebles',
    'casa': 'inmuebles',
    'departamento': 'inmuebles',
    'terreno': 'inmuebles',
    'alquiler': 'inmuebles',
    'alquilo': 'inmuebles',
    'vendo': 'inmuebles',
    'local': 'inmuebles',
    'oficina': 'inmuebles',
    'habitación': 'inmuebles',
    'cuarto': 'inmuebles',

    // Vehículos
    'vehículo': 'vehiculos',
    'vehiculo': 'vehiculos',
    'auto': 'vehiculos',
    'carro': 'vehiculos',
    'moto': 'vehiculos',
    'camioneta': 'vehiculos',

    // Servicios
    'servicio': 'servicios',
    'reparación': 'servicios',
    'mantenimiento': 'servicios',
    'limpieza': 'servicios',
    'plomero': 'servicios',
    'electricista': 'servicios',

    // Productos
    'producto': 'productos',
    'venta': 'productos',
    'compra': 'productos',
    'mueble': 'productos',
    'electrodoméstico': 'productos',

    // Eventos
    'evento': 'eventos',
    'fiesta': 'eventos',
    'celebración': 'eventos',
    'concierto': 'eventos',

    // Negocios
    'negocio': 'negocios',
    'empresa': 'negocios',
    'franquicia': 'negocios',
    'socio': 'negocios'
};

/**
 * Resultado del análisis de búsqueda
 */
export interface AnalisisBusqueda {
    terminos: string[];
    terminosExpandidos: string[]; // Incluye sinónimos
    categoria?: Categoria;
    ubicacion?: string;
    filtros: {
        precioMin?: number;
        precioMax?: number;
        habitaciones?: number;
    };
    confianza: number; // 0-1, qué tan seguro está del análisis
}

/**
 * Normaliza texto: minúsculas, sin acentos, sin caracteres especiales
 */
function normalizarTexto(texto: string): string {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9\s]/g, ' ') // Solo letras, números y espacios
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim();
}

/**
 * Detecta la categoría del mensaje
 */
function detectarCategoria(texto: string): Categoria | undefined {
    const textoNorm = normalizarTexto(texto);
    const palabras = textoNorm.split(' ');

    // Contar coincidencias por categoría
    const conteo: Partial<Record<Categoria, number>> = {};

    for (const palabra of palabras) {
        const categoria = PALABRAS_CATEGORIA[palabra];
        if (categoria) {
            conteo[categoria] = (conteo[categoria] || 0) + 1;
        }
    }

    // Retornar la categoría con más coincidencias
    const categorias = Object.entries(conteo);
    if (categorias.length === 0) return undefined;

    categorias.sort((a, b) => b[1] - a[1]);
    return categorias[0][0] as Categoria;
}

/**
 * Detecta la ubicación en el mensaje
 */
function detectarUbicacion(texto: string): string | undefined {
    const textoNorm = normalizarTexto(texto);

    for (const ubicacion of UBICACIONES_CUSCO) {
        const ubicacionNorm = normalizarTexto(ubicacion);
        if (textoNorm.includes(ubicacionNorm)) {
            return ubicacion;
        }
    }

    return undefined;
}

/**
 * Detecta filtros numéricos (precio, habitaciones)
 */
function detectarFiltros(texto: string): AnalisisBusqueda['filtros'] {
    const filtros: AnalisisBusqueda['filtros'] = {};

    // Detectar habitaciones
    const habitacionesMatch = texto.match(/(\d+)\s*(habitacion|dormitorio|cuarto|recamara)/i);
    if (habitacionesMatch) {
        filtros.habitaciones = parseInt(habitacionesMatch[1]);
    }

    // Detectar precio (S/. o soles)
    const precioMatch = texto.match(/(?:s\/\.?|soles?)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (precioMatch) {
        const precio = parseFloat(precioMatch[1].replace(/,/g, ''));
        filtros.precioMax = precio;
    }

    // Detectar rango de precio
    const rangoMatch = texto.match(/(?:s\/\.?|soles?)\s*(\d+)\s*(?:a|hasta|-)\s*(\d+)/i);
    if (rangoMatch) {
        filtros.precioMin = parseInt(rangoMatch[1]);
        filtros.precioMax = parseInt(rangoMatch[2]);
    }

    return filtros;
}

/**
 * Expande términos con sinónimos
 */
function expandirConSinonimos(terminos: string[]): string[] {
    const expandidos = new Set<string>(terminos);

    for (const termino of terminos) {
        // Buscar si el término tiene sinónimos
        for (const [palabra, sinonimos] of Object.entries(SINONIMOS)) {
            if (termino === palabra || sinonimos.includes(termino)) {
                expandidos.add(palabra);
                sinonimos.forEach(s => expandidos.add(s));
            }
        }
    }

    return Array.from(expandidos);
}

/**
 * Extrae términos de búsqueda relevantes del mensaje
 */
function extraerTerminos(texto: string, categoria?: Categoria): string[] {
    const textoNorm = normalizarTexto(texto);
    const palabras = textoNorm.split(' ');

    // Filtrar stop words y palabras muy cortas
    const terminos = palabras.filter(palabra =>
        palabra.length > 2 && !STOP_WORDS.has(palabra)
    );

    // Si detectamos categoría, remover palabras de categoría de los términos
    if (categoria) {
        const palabrasCategoria = Object.entries(PALABRAS_CATEGORIA)
            .filter(([_, cat]) => cat === categoria)
            .map(([palabra]) => palabra);

        return terminos.filter(t => !palabrasCategoria.includes(t));
    }

    return terminos;
}

/**
 * Analiza un mensaje de búsqueda y extrae información estructurada
 */
export function analizarBusqueda(mensaje: string): AnalisisBusqueda {
    // Detectar categoría
    const categoria = detectarCategoria(mensaje);

    // Detectar ubicación
    const ubicacion = detectarUbicacion(mensaje);

    // Detectar filtros
    const filtros = detectarFiltros(mensaje);

    // Extraer términos relevantes
    const terminos = extraerTerminos(mensaje, categoria);

    // Expandir con sinónimos
    const terminosExpandidos = expandirConSinonimos(terminos);

    // Calcular confianza
    let confianza = 0.5; // Base
    if (categoria) confianza += 0.2;
    if (ubicacion) confianza += 0.15;
    if (terminos.length > 0) confianza += 0.15;
    if (Object.keys(filtros).length > 0) confianza += 0.1;

    return {
        terminos,
        terminosExpandidos,
        categoria,
        ubicacion,
        filtros,
        confianza: Math.min(confianza, 1)
    };
}

/**
 * Genera una descripción legible del análisis
 */
export function describirAnalisis(analisis: AnalisisBusqueda): string {
    const partes: string[] = [];

    if (analisis.categoria) {
        partes.push(`Categoría: ${analisis.categoria}`);
    }

    if (analisis.ubicacion) {
        partes.push(`Ubicación: ${analisis.ubicacion}`);
    }

    if (analisis.terminos.length > 0) {
        partes.push(`Buscando: ${analisis.terminos.join(', ')}`);
    }

    if (analisis.filtros.habitaciones) {
        partes.push(`${analisis.filtros.habitaciones} habitaciones`);
    }

    if (analisis.filtros.precioMin && analisis.filtros.precioMax) {
        partes.push(`Precio: S/. ${analisis.filtros.precioMin} - ${analisis.filtros.precioMax}`);
    } else if (analisis.filtros.precioMax) {
        partes.push(`Hasta S/. ${analisis.filtros.precioMax}`);
    }

    return partes.join(' | ');
}
