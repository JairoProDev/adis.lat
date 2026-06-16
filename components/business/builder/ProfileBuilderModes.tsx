'use client';

import { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BusinessProfile, ProfileBlock, ProfileThemePreset } from '@/types/business';
import { DEFAULT_PROFILE_BLOCKS, PROFILE_THEME_PRESETS } from '@/lib/business/profile-blocks';
import TemplateGallery from './TemplateGallery';
import BlockInspector from './BlockInspector';
import CustomBlocksEditor from './CustomBlocksEditor';
import BusinessProfileChatEditor from './BusinessProfileChatEditor';
import BusinessProfileShell from '@/components/business/public/BusinessProfileShell';
import { cn } from '@/lib/utils';
import { trackBlockReordered, trackThemeChanged, trackBuilderModeChanged } from '@/lib/business/profile-analytics';
import { BLOCK_LABELS } from './BlockInspector';

type BuilderMode = 'form' | 'chat' | 'visual';

interface ProfileBuilderModesProps {
  profile: Partial<BusinessProfile>;
  onUpdate: (patch: Partial<BusinessProfile>) => void;
  adisos?: import('@/types').Adiso[];
  recommendedTemplateId?: string;
}

function SortableBlockRow({
  block,
  selected,
  onSelect,
  onToggle,
}: {
  block: ProfileBlock;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-xl border p-2 text-sm cursor-pointer',
        selected ? 'border-[var(--brand-color)] bg-[var(--brand-color)]/5' : 'border-slate-100'
      )}
      onClick={onSelect}
    >
      <button
        type="button"
        className="px-2 text-slate-400 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </button>
      <span className="flex-1 font-medium">{BLOCK_LABELS[block.type] || block.type}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={cn(
          'text-xs font-bold px-2 py-1 rounded-lg',
          block.visible ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
        )}
      >
        {block.visible ? 'Visible' : 'Oculto'}
      </button>
    </div>
  );
}

export default function ProfileBuilderModes({
  profile,
  onUpdate,
  adisos = [],
  recommendedTemplateId,
}: ProfileBuilderModesProps) {
  const [mode, setMode] = useState<BuilderMode>('form');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const undoSnapshot = useRef<Partial<BusinessProfile> | null>(null);

  const blocks = profile.profile_blocks?.length ? profile.profile_blocks : DEFAULT_PROFILE_BLOCKS;
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const switchMode = (m: BuilderMode) => {
    setMode(m);
    trackBuilderModeChanged(m, profile.id);
  };

  const setTheme = (preset: ProfileThemePreset) => {
    undoSnapshot.current = { ...profile };
    const theme = PROFILE_THEME_PRESETS[preset];
    onUpdate({
      theme_preset: preset,
      theme_color: theme.color,
      theme_mode: theme.mode,
    });
    trackThemeChanged(preset, profile.id);
  };

  const toggleBlock = (id: string) => {
    const next = blocks.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b));
    onUpdate({ profile_blocks: next });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const heroIdx = blocks.findIndex((b) => b.type === 'hero');
    if (blocks[oldIndex].type === 'hero' && newIndex !== heroIdx) return;
    undoSnapshot.current = { profile_blocks: blocks };
    const next = arrayMove(blocks, oldIndex, newIndex);
    onUpdate({ profile_blocks: next });
    trackBlockReordered(String(active.id), profile.id);
  };

  const updateBlockConfig = (config: Record<string, unknown>) => {
    if (!selectedBlock) return;
    const next = blocks.map((b) =>
      b.id === selectedBlock.id ? { ...b, config } : b
    );
    onUpdate({ profile_blocks: next });
  };

  const handleUndo = useCallback(() => {
    if (undoSnapshot.current) {
      onUpdate(undoSnapshot.current);
      undoSnapshot.current = null;
    }
  }, [onUpdate]);

  const paletteTypes: ProfileBlock['type'][] = ['text', 'embed', 'cta'];

  const addBlockFromPalette = (type: ProfileBlock['type']) => {
    if (type === 'catalog' && blocks.some((b) => b.type === 'catalog')) return;
    const id = `${type}-${Date.now()}`;
    onUpdate({
      profile_blocks: [...blocks, { id, type, visible: true, config: {} }],
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex gap-2">
        {(['form', 'chat', 'visual'] as BuilderMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={cn(
              'flex-1 rounded-xl py-2 text-xs font-bold capitalize',
              mode === m ? 'bg-[var(--brand-color)] text-white' : 'bg-slate-100 text-slate-600'
            )}
          >
            {m === 'form' ? 'Formulario' : m === 'chat' ? 'Chat IA' : 'Visual'}
          </button>
        ))}
      </div>

      {mode === 'form' && (
        <TemplateGallery
          profile={profile}
          onUpdate={onUpdate}
          recommendedTemplateId={recommendedTemplateId}
          onUndo={handleUndo}
          canUndo={Boolean(undoSnapshot.current)}
        />
      )}

      {mode === 'chat' && (
        <BusinessProfileChatEditor profile={profile} onUpdate={onUpdate} />
      )}

      {mode === 'visual' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase">Bloques activos</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {blocks.map((block) => (
                    <SortableBlockRow
                      key={block.id}
                      block={block}
                      selected={selectedBlockId === block.id}
                      onSelect={() => setSelectedBlockId(block.id)}
                      onToggle={() => toggleBlock(block.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <p className="text-xs font-bold text-slate-500 uppercase mt-4">Agregar bloque</p>
            <div className="flex flex-wrap gap-2">
              {paletteTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addBlockFromPalette(t)}
                  className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-100"
                >
                  + {BLOCK_LABELS[t]}
                </button>
              ))}
            </div>
            <BlockInspector block={selectedBlock} onUpdateConfig={updateBlockConfig} />
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Enlaces (custom_blocks)</p>
              <CustomBlocksEditor
                blocks={profile.custom_blocks || []}
                onChange={(custom_blocks) => onUpdate({ custom_blocks })}
              />
            </div>
          </div>
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
            <p className="text-xs font-bold text-slate-400 text-center py-2 border-b">Preview móvil</p>
            <div className="w-[375px] max-w-full mx-auto h-[600px] overflow-y-auto bg-white shadow-inner">
              <BusinessProfileShell
                profile={profile}
                adisos={adisos.slice(0, 8)}
                isPreview
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Tema curado</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(PROFILE_THEME_PRESETS) as ProfileThemePreset[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTheme(key)}
              className={cn(
                'flex items-center gap-2 rounded-xl border p-2 text-left text-sm font-medium',
                profile.theme_preset === key ? 'border-[var(--brand-color)]' : 'border-slate-100'
              )}
            >
              <span
                className="w-6 h-6 rounded-full border border-white shadow"
                style={{ background: PROFILE_THEME_PRESETS[key].color }}
              />
              {PROFILE_THEME_PRESETS[key].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
