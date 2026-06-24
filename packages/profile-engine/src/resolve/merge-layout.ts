import type { ProfileLayoutSchema, ComponentSlot } from '../types/layout';
import type { ProfileStyleSchema } from '../types/style';
import { buildDefaultLayout, getStructureTemplate } from '../registry/structures';

export function mergeProfileLayout(
  saved?: ProfileLayoutSchema | null,
  templateId = 'social_wireframe_v1'
): ProfileLayoutSchema {
  const defaults = buildDefaultLayout(templateId);
  if (!saved) return defaults;

  const template = getStructureTemplate(saved.structureTemplateId || templateId);
  const defaultByComponent = new Map(
    defaults.slots.map((s) => [s.component, s])
  );

  const mergedSlots: ComponentSlot[] = [];
  const seen = new Set<string>();

  if (Array.isArray(saved.slots) && saved.slots.length > 0) {
    for (const slot of saved.slots) {
      if (!slot?.component) continue;
      const def = defaultByComponent.get(slot.component);
      mergedSlots.push({
        id: slot.id || def?.id || `${slot.component}-${mergedSlots.length}`,
        component: slot.component,
        visible: slot.visible ?? def?.visible ?? true,
        order: slot.order ?? def?.order ?? mergedSlots.length,
        variant: slot.variant ?? def?.variant,
        config: { ...def?.config, ...slot.config },
      });
      seen.add(slot.component);
    }
  }

  for (const def of template.slots) {
    if (!seen.has(def.component)) {
      const d = defaultByComponent.get(def.component);
      if (d) mergedSlots.push({ ...d });
    }
  }

  mergedSlots.sort((a, b) => a.order - b.order);

  return {
    structureTemplateId: saved.structureTemplateId || defaults.structureTemplateId,
    styleSkinId: saved.styleSkinId || defaults.styleSkinId,
    background: saved.background || defaults.background,
    slots: mergedSlots,
  };
}

export function getVisibleSlots(layout: ProfileLayoutSchema): ComponentSlot[] {
  return layout.slots.filter((s) => s.visible).sort((a, b) => a.order - b.order);
}

export function isSlotVisible(layout: ProfileLayoutSchema, componentId: ComponentSlot['component']): boolean {
  const slot = layout.slots.find((s) => s.component === componentId);
  return slot?.visible ?? false;
}
