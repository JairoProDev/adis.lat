'use client';

import { useState } from 'react';
import type { CustomBlock } from '@/types/business';
import { nanoid } from 'nanoid';
import { IconPlus, IconTrash } from '@/components/Icons';

interface CustomBlocksEditorProps {
  blocks: CustomBlock[];
  onChange: (blocks: CustomBlock[]) => void;
}

export default function CustomBlocksEditor({ blocks, onChange }: CustomBlocksEditorProps) {
  const [draft, setDraft] = useState<Partial<CustomBlock>>({ type: 'link', label: '', content: '' });

  const addBlock = () => {
    if (!draft.content?.trim()) return;
    onChange([
      ...blocks,
      {
        id: nanoid(8),
        type: (draft.type as CustomBlock['type']) || 'link',
        label: draft.label || 'Enlace',
        content: draft.content,
        sublabel: draft.sublabel,
      },
    ]);
    setDraft({ type: 'link', label: '', content: '' });
  };

  const remove = (id: string) => onChange(blocks.filter((b) => b.id !== id));

  const update = (id: string, patch: Partial<CustomBlock>) =>
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  return (
    <div className="space-y-3">
      {blocks.map((b) => (
        <div key={b.id} className="flex gap-2 items-start border border-slate-100 rounded-xl p-2">
          <div className="flex-1 space-y-1">
            <input
              className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1"
              value={b.label || ''}
              placeholder="Etiqueta"
              onChange={(e) => update(b.id, { label: e.target.value })}
            />
            <input
              className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1"
              value={b.content || ''}
              placeholder="URL o texto"
              onChange={(e) => update(b.id, { content: e.target.value })}
            />
          </div>
          <button type="button" onClick={() => remove(b.id)} className="text-red-400 p-1">
            <IconTrash size={16} />
          </button>
        </div>
      ))}
      <div className="border border-dashed border-slate-200 rounded-xl p-3 space-y-2">
        <select
          className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1"
          value={draft.type}
          onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as CustomBlock['type'] }))}
        >
          <option value="link">Enlace</option>
          <option value="text">Texto</option>
          <option value="image">Imagen</option>
        </select>
        <input
          className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1"
          placeholder="Etiqueta"
          value={draft.label || ''}
          onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
        />
        <input
          className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1"
          placeholder="URL o contenido"
          value={draft.content || ''}
          onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
        />
        <button
          type="button"
          onClick={addBlock}
          className="flex items-center gap-1 text-sm font-bold text-[var(--brand-color)]"
        >
          <IconPlus size={14} /> Agregar bloque
        </button>
      </div>
    </div>
  );
}
