import type { ProfileStyleSchema, StyleSkinTokens, ComponentStyleOverride } from '../types/style';
import type { ProfileComponentId } from '../types/layout';
import { getStyleSkin } from '../registry/skins';

export interface ResolvedProfileStyle {
  skin: StyleSkinTokens;
  componentStyles: Partial<Record<ProfileComponentId, ComponentStyleOverride>>;
}

export function mergeProfileStyle(saved?: ProfileStyleSchema | null, skinId?: string): ResolvedProfileStyle {
  const id = saved?.skinId || skinId || 'buscadis_default';
  const skin = getStyleSkin(id);
  return {
    skin,
    componentStyles: saved?.overrides ?? {},
  };
}

export function skinToCssVars(skin: StyleSkinTokens): Record<string, string> {
  const radius =
    skin.radius === 'sharp' ? '0.375rem' : skin.radius === 'pill' ? '1.5rem' : '0.75rem';
  return {
    '--pe-accent': skin.color,
    '--pe-radius': radius,
    '--pe-density': skin.density === 'compact' ? '0.75rem' : '1rem',
  };
}
