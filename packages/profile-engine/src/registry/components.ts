import type { ProfileComponentId } from '../types/layout';

export interface ComponentMeta {
  id: ProfileComponentId;
  label: string;
  description: string;
  group: 'chrome' | 'identity' | 'social' | 'content' | 'commerce';
  optional: boolean;
}

export const PROFILE_COMPONENTS: ComponentMeta[] = [
  { id: 'profile_chrome', label: 'Barra superior', description: 'Navegación, URL y menú', group: 'chrome', optional: false },
  { id: 'profile_hero', label: 'Banner y avatar', description: 'Portada con avatar superpuesto', group: 'identity', optional: false },
  { id: 'profile_metrics', label: 'Métricas', description: 'Estadísticas destacadas', group: 'identity', optional: true },
  { id: 'profile_identity', label: 'Nombre y ubicación', description: 'Identidad y calificación', group: 'identity', optional: false },
  { id: 'profile_social_strip', label: 'Redes sociales', description: 'Enlaces a redes y web', group: 'social', optional: true },
  { id: 'profile_bio', label: 'Bio', description: 'Descripción expandible', group: 'social', optional: true },
  { id: 'profile_hashtags', label: 'Etiquetas', description: 'Hashtags y keywords', group: 'social', optional: true },
  { id: 'profile_social_proof', label: 'Prueba social', description: 'Actividad de otros usuarios', group: 'social', optional: true },
  { id: 'profile_story_highlights', label: 'Destacados', description: 'Historias destacadas', group: 'social', optional: true },
  { id: 'profile_sections', label: 'Secciones', description: 'Pestañas de contenido', group: 'content', optional: false },
  { id: 'profile_search', label: 'Buscador', description: 'Búsqueda y vista', group: 'content', optional: true },
  { id: 'profile_content', label: 'Contenido', description: 'Grid o lista de items', group: 'content', optional: false },
  { id: 'profile_sticky_cta', label: 'Barra inferior', description: 'CTAs fijos', group: 'commerce', optional: true },
];

export const METRIC_LABELS: Record<string, string> = {
  interactions: 'Interacciones',
  sales: 'Ventas',
  clients: 'Clientes',
  followers: 'Seguidores',
  content_count: 'Contenido',
  reviews: 'Reseñas',
  views: 'Visitas',
  products: 'Productos',
};

export function getComponentMeta(id: ProfileComponentId): ComponentMeta | undefined {
  return PROFILE_COMPONENTS.find((c) => c.id === id);
}
