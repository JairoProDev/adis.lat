import type { BusinessProfile, ProfileBlock } from '@/types/business';
import { getTemplateById, type PageTemplate } from './registry';
import { PROFILE_THEME_PRESETS } from '@/lib/business/profile-blocks';
import type { ProfileThemePreset } from '@/types/business';

export type ApplyTemplatePolicy = 'merge' | 'replace';

export interface ApplyTemplateOptions {
  templateId: string;
  policy?: ApplyTemplatePolicy;
  themePreset?: ProfileThemePreset;
}

const INDUSTRY_COPY: Record<string, { announcement?: string; textBlock?: string }> = {
  ferreteria: {
    announcement: '🛠 Stock permanente — consulta disponibilidad por WhatsApp',
    textBlock: 'Materiales de construcción y ferretería con entrega en la zona.',
  },
  restaurante: {
    announcement: '🍽 Abierto ahora — pide el menú del día',
    textBlock: 'Cocina casera con ingredientes frescos. Reserva tu mesa.',
  },
  belleza: {
    announcement: '✨ Promos de temporada — reserva tu cita',
    textBlock: 'Tratamientos de belleza y bienestar. Antes y después en nuestro catálogo.',
  },
  servicios: {
    announcement: '📋 Cotización sin compromiso',
    textBlock: 'Servicios profesionales con garantía. Portafolio y testimonios abajo.',
  },
};

function mergeBlocks(
  existing: ProfileBlock[] | undefined,
  template: PageTemplate,
  policy: ApplyTemplatePolicy
): ProfileBlock[] {
  if (policy === 'replace' || !existing?.length) {
    return template.defaultBlocks.map((b) => ({ ...b, config: { ...b.config } }));
  }
  const byType = new Map(existing.map((b) => [b.type, b]));
  return template.defaultBlocks.map((def) => {
    const saved = byType.get(def.type);
    return saved
      ? { ...def, ...saved, config: { ...def.config, ...saved.config } }
      : { ...def, config: { ...def.config } };
  });
}

export function applyTemplate(
  profile: Partial<BusinessProfile>,
  options: ApplyTemplateOptions
): Partial<BusinessProfile> {
  const template = getTemplateById(options.templateId);
  const policy = options.policy ?? 'merge';
  const themeKey = options.themePreset ?? template.suggestedTheme;
  const theme = PROFILE_THEME_PRESETS[themeKey];

  const patch: Partial<BusinessProfile> = {
    template_id: template.id,
    theme_preset: themeKey,
    theme_color: theme.color,
    theme_mode: theme.mode,
    profile_blocks: mergeBlocks(profile.profile_blocks, template, policy),
    template_applied_at: new Date().toISOString(),
  };

  if (template.industryPack && INDUSTRY_COPY[template.industryPack]) {
    const copy = INDUSTRY_COPY[template.industryPack];
    if (!profile.announcement_text && copy.announcement) {
      patch.announcement_text = copy.announcement;
      patch.announcement_active = true;
    }
    const textBlock = profile.profile_blocks?.find((b) => b.type === 'text');
    if (!textBlock && copy.textBlock) {
      patch.profile_blocks = [
        ...(patch.profile_blocks || []),
        { id: 'text-industry', type: 'text', visible: true, config: { markdown: copy.textBlock } },
      ];
    }
  }

  return patch;
}
