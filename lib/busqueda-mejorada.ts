import { supabase } from './supabase';
import { Adiso, Categoria } from '@/types';
import { AnalisisBusqueda } from './chatbot-nlu';

/**
 * Resultado de búsqueda con score de relevancia
 */
interface ResultadoConScore {
    adiso: Adiso;
    score: number;
}

/**
 * Calcula días desde una fecha
 */
function diasDesde(fecha: string): number {
    const fechaObj = new Date(fecha);
    const ahora = new Date();
    const diff = ahora.getTime() - fechaObj.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calcula score de relevancia para un aviso
 */
function calcularScore(adiso: Adiso, analisis: AnalisisBusqueda): number {
    let score = 0;
    const tituloLower = adiso.titulo.toLowerCase();
    const descripcionLower = (adiso.descripcion || '').toLowerCase();
    const textoCompleto = `${tituloLower} ${descripcionLower}`;

    // 1. Coincidencia de términos en título (peso alto)
    for (const termino of analisis.terminos) {
        if (tituloLower.includes(termino)) {
            score += 10;
        }
    }

    // 2. Coincidencia de términos en descripción (peso medio)
    for (const termino of analisis.terminos) {
        if (descripcionLower.includes(termino)) {
            score += 5;
        }
    }

    // 3. Coincidencia de sinónimos (peso bajo)
    const terminosOriginales = new Set(analisis.terminos);
    for (const termino of analisis.terminosExpandidos) {
        if (!terminosOriginales.has(termino) && textoCompleto.includes(termino)) {
            score += 2;
        }
    }

    // 4. Coincidencia exacta de categoría (peso alto)
    if (analisis.categoria && adiso.categoria === analisis.categoria) {
        score += 15;
    }

    // 5. Coincidencia de ubicación (peso medio)
    if (analisis.ubicacion) {
        const ubicacionAdiso = typeof adiso.ubicacion === 'string'
            ? adiso.ubicacion.toLowerCase()
            : `${adiso.ubicacion.distrito || ''} ${adiso.ubicacion.provincia || ''}`.toLowerCase();

        if (ubicacionAdiso.includes(analisis.ubicacion.toLowerCase())) {
            score += 8;
        }
    }

    // 6. Bonus por avisos recientes (decae con el tiempo)
    const dias = diasDesde(adiso.fechaPublicacion);
    if (dias < 7) score += 5;
    else if (dias < 30) score += 3;
    else if (dias < 90) score += 1;

    // 7. Bonus por avisos activos
    if (adiso.estaActivo) {
        score += 3;
    }

    // 8. Penalización por avisos históricos (menos relevantes)
    if (adiso.esHistorico) {
        score -= 5;
    }

    return score;
}

/**
 * Rankea resultados por relevancia
 */
function rankearResultados(resultados: Adiso[], analisis: AnalisisBusqueda): Adiso[] {
    const conScore: ResultadoConScore[] = resultados.map(adiso => ({
        adiso,
        score: calcularScore(adiso, analisis)
    }));

    // Ordenar por score descendente
    conScore.sort((a, b) => b.score - a.score);

    // Filtrar resultados con score muy bajo (probablemente irrelevantes)
    const filtrados = conScore.filter(r => r.score > 5);

    return filtrados.map(r => r.adiso);
}

/**
 * Busca avisos con análisis mejorado
 */
export async function buscarMejorada(analisis: AnalisisBusqueda, limite: number = 20): Promise<Adiso[]> {
    if (!supabase) {
        throw new Error('Supabase no está configurado');
    }

    try {
        // Construir query base
        let query = supabase
            .from('adisos')
            .select('*');

        // Filtrar por categoría si se detectó
        if (analisis.categoria) {
            query = query.eq('categoria', analisis.categoria);
        }

        // Filtrar por ubicación si se detectó
        if (analisis.ubicacion) {
            query = query.ilike('ubicacion', `%${analisis.ubicacion}%`);
        }

        // Priorizar avisos activos pero incluir históricos si no hay suficientes
        // Primero intentar solo activos
        let queryActivos = query.eq('esta_activo', true);

        // Buscar por términos si hay
        if (analisis.terminos.length > 0) {
            // Construir condición OR para buscar en título o descripción
            const condiciones = analisis.terminosExpandidos.map(termino =>
                `titulo.ilike.%${termino}%,descripcion.ilike.%${termino}%`
            ).join(',');

            queryActivos = queryActivos.or(condiciones);
        }

        // Ejecutar búsqueda
        const { data: resultadosActivos, error } = await queryActivos.limit(limite * 2);

        if (error) {
            console.error('Error en búsqueda mejorada:', error);
            throw error;
        }

        let resultados = resultadosActivos || [];

        // Si no hay suficientes resultados activos, buscar en históricos
        if (resultados.length < 5) {
            let queryHistoricos = query.eq('esta_activo', false);

            if (analisis.terminos.length > 0) {
                const condiciones = analisis.terminosExpandidos.map(termino =>
                    `titulo.ilike.%${termino}%,descripcion.ilike.%${termino}%`
                ).join(',');

                queryHistoricos = queryHistoricos.or(condiciones);
            }

            const { data: resultadosHistoricos } = await queryHistoricos.limit(10);

            if (resultadosHistoricos) {
                resultados = [...resultados, ...resultadosHistoricos];
            }
        }

        // Convertir de DB a Adiso
        const { dbToAdiso } = await import('./supabase');
        const adisos = resultados.map(dbToAdiso);

        // Rankear por relevancia
        const rankeados = rankearResultados(adisos, analisis);

        // Retornar top resultados
        return rankeados.slice(0, limite);

    } catch (error: any) {
        console.error('Error en búsqueda mejorada:', error);
        throw error;
    }
}

/**
 * Genera respuesta descriptiva de los resultados
 */
export function generarRespuestaBusqueda(
    resultados: Adiso[],
    analisis: AnalisisBusqueda
): string {
    if (resultados.length === 0) {
        let mensaje = 'No encontré resultados';

        if (analisis.categoria) {
            mensaje += ` en la categoría ${analisis.categoria}`;
        }

        if (analisis.ubicacion) {
            mensaje += ` en ${analisis.ubicacion}`;
        }

        mensaje += '. ¿Puedes intentar con otros términos o ser menos específico?';

        return mensaje;
    }

    let mensaje = `Encontré ${resultados.length} resultado${resultados.length !== 1 ? 's' : ''}`;

    if (analisis.categoria) {
        mensaje += ` en ${analisis.categoria}`;
    }

    if (analisis.ubicacion) {
        mensaje += ` en ${analisis.ubicacion}`;
    }

    if (analisis.terminos.length > 0) {
        mensaje += ` relacionados con: ${analisis.terminos.slice(0, 3).join(', ')}`;
    }

    mensaje += '. Aquí están los más relevantes:';

    return mensaje;
}
