import type { ProfileLayoutSchema, ComponentSlot } from '../types/layout';

export interface StructureTemplate {
  id: string;
  label: string;
  description: string;
  slots: Omit<ComponentSlot, 'id'>[];
}

const slot = (
  component: ComponentSlot['component'],
  order: number,
  opts?: Partial<ComponentSlot>
): Omit<ComponentSlot, 'id'> => ({
  component,
  visible: true,
  order,
  ...opts,
});

export const STRUCTURE_TEMPLATES: StructureTemplate[] = [
  {
    id: 'social_wireframe_v1',
    label: 'Perfil social',
    description: 'Layout estilo red social con banner superpuesto',
    slots: [
      slot('profile_chrome', 0),
      slot('profile_hero', 1, { variant: 'overlap_square' }),
      slot('profile_metrics', 2, { config: { keys: ['interactions', 'sales', 'clients'] } }),
      slot('profile_identity', 3),
      slot('profile_social_strip', 4),
      slot('profile_bio', 5),
      slot('profile_hashtags', 6),
      slot('profile_social_proof', 7),
      slot('profile_story_highlights', 8),
      slot('profile_sections', 9),
      slot('profile_search', 10),
      slot('profile_content', 11),
      slot('profile_sticky_cta', 12),
    ],
  },
  {
    id: 'minimal_identity',
    label: 'Identidad mínima',
    description: 'Sin métricas ni prueba social',
    slots: [
      slot('profile_chrome', 0),
      slot('profile_hero', 1, { variant: 'overlap_square' }),
      slot('profile_identity', 2),
      slot('profile_social_strip', 3),
      slot('profile_bio', 4),
      slot('profile_sections', 5),
      slot('profile_content', 6),
      slot('profile_sticky_cta', 7),
    ],
  },
];

export function getStructureTemplate(id: string): StructureTemplate {
  return STRUCTURE_TEMPLATES.find((t) => t.id === id) ?? STRUCTURE_TEMPLATES[0];
}

export function buildDefaultLayout(templateId = 'social_wireframe_v1'): ProfileLayoutSchema {
  const template = getStructureTemplate(templateId);
  return {
    structureTemplateId: template.id,
    styleSkinId: 'buscadis_default',
    background: { type: 'color', value: 'var(--bg-secondary)' },
    slots: template.slots.map((s, i) => ({
      ...s,
      id: `${s.component}-${i}`,
    })),
  };
}
