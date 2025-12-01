import { Adiso, Categoria, UserPreferences, Profile } from '@/types';

/**
 * Calcula un score de relevancia para un adiso basado en las preferencias del usuario
 */
export function calcularScoreRelevancia(
  adiso: Adiso,
  preferences: UserPreferences | null,
  profile: Profile | null
): number {
  let score = 0;

  // Si no hay preferencias, retornar score base
  if (!preferences && !profile) {
    return 0;
  }

  // Preferencia por categorías favoritas (+50 puntos)
  if (preferences?.categorias_favoritas.includes(adiso.categoria)) {
    score += 50;
  }

  // Preferencia por ubicación cercana (+30 puntos si está cerca)
  if (profile?.latitud && profile?.longitud && adiso.ubicacion) {
    // Aquí podrías calcular distancia real, por ahora solo verificamos si hay ubicación
    score += 10;
  }

  // Preferencia por adisos recientes (+20 puntos si es de hoy)
  const fechaAdiso = new Date(`${adiso.fechaPublicacion}T${adiso.horaPublicacion || '00:00'}`);
  const hoy = new Date();
  const diasDiferencia = Math.floor((hoy.getTime() - fechaAdiso.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diasDiferencia === 0) {
    score += 20;
  } else if (diasDiferencia <= 3) {
    score += 10;
  } else if (diasDiferencia <= 7) {
    score += 5;
  }

  // Preferencia por adisos con imágenes (+10 puntos)
  if (adiso.imagenesUrls && adiso.imagenesUrls.length > 0) {
    score += 10;
  }

  // Preferencia por adisos de mayor tamaño (más información) (+5 puntos)
  if (adiso.tamaño && ['mediano', 'grande', 'gigante'].includes(adiso.tamaño)) {
    score += 5;
  }

  return score;
}

/**
 * Ordena adisos por relevancia personalizada
 */
export function ordenarPorRelevancia(
  adisos: Adiso[],
  preferences: UserPreferences | null,
  profile: Profile | null
): Adiso[] {
  return [...adisos].sort((a, b) => {
    const scoreA = calcularScoreRelevancia(a, preferences, profile);
    const scoreB = calcularScoreRelevancia(b, preferences, profile);
    
    // Ordenar por score descendente
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    
    // Si tienen el mismo score, ordenar por fecha (más recientes primero)
    const fechaA = new Date(`${a.fechaPublicacion}T${a.horaPublicacion || '00:00'}`).getTime();
    const fechaB = new Date(`${b.fechaPublicacion}T${b.horaPublicacion || '00:00'}`).getTime();
    return fechaB - fechaA;
  });
}

/**
 * Filtra adisos por preferencias del usuario
 */
export function filtrarPorPreferencias(
  adisos: Adiso[],
  preferences: UserPreferences | null
): Adiso[] {
  if (!preferences || preferences.categorias_favoritas.length === 0) {
    return adisos;
  }

  // Si tiene categorías favoritas, priorizar esas pero no excluir otras
  return adisos;
}

/**
 * Obtiene recomendaciones personalizadas para un usuario
 */
export function obtenerRecomendaciones(
  adisos: Adiso[],
  preferences: UserPreferences | null,
  profile: Profile | null,
  limite: number = 10
): Adiso[] {
  // Filtrar por preferencias
  let filtrados = filtrarPorPreferencias(adisos, preferences);
  
  // Ordenar por relevancia
  filtrados = ordenarPorRelevancia(filtrados, preferences, profile);
  
  // Limitar resultados
  return filtrados.slice(0, limite);
}



