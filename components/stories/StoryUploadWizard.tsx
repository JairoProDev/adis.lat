'use client';

import { useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import {
  Categoria,
  StoryObjective,
  StoryPromotionTier,
  STORY_TIERS,
} from '@/types';
import { STORY_OBJECTIVES } from '@/lib/stories/config';
import { getCategoriaLabel } from '@/lib/adiso-display';
import { IconClose, IconImage, IconVideo, IconChevronLeft } from '@/components/Icons';

interface StoryUploadWizardProps {
  onClose: () => void;
  onPublished: () => void;
}

const CATEGORIAS: Categoria[] = [
  'empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad',
];

const STEPS = ['Media', 'Detalle', 'Alcance'] as const;

export default function StoryUploadWizard({ onClose, onPublished }: StoryUploadWizardProps) {
  const { user, session } = useAuth();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [categoria, setCategoria] = useState<Categoria | ''>('');
  const [objective, setObjective] = useState<StoryObjective>('contactos');
  const [tier, setTier] = useState<StoryPromotionTier>('gratis');
  const [publishing, setPublishing] = useState(false);

  const handleFileSelected = (selected: File | null | undefined) => {
    if (!selected) return;
    if (!selected.type.startsWith('image/') && !selected.type.startsWith('video/')) {
      toastError('Selecciona una imagen o un video.');
      return;
    }
    if (selected.size > 25 * 1024 * 1024) {
      toastError('El archivo supera 25 MB.');
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const canNext = () => {
    if (step === 0) return Boolean(file);
    if (step === 1) return true;
    return true;
  };

  const handlePublish = async () => {
    if (!user?.id || !file) return;
    const token = session?.access_token;
    if (!token) {
      toastError('Inicia sesión para publicar.');
      return;
    }

    setPublishing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', caption.trim());
      if (categoria) formData.append('categoria', categoria);
      formData.append('tier', tier);
      formData.append('objective', objective);

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = (await res.json()) as {
        error?: string;
        status?: string;
        checkoutUrl?: string;
      };

      if (!res.ok) {
        toastError(data.error || 'No se pudo publicar.');
        return;
      }

      if (data.status === 'checkout' && data.checkoutUrl) {
        success('Redirigiendo al pago…');
        window.location.href = data.checkoutUrl;
        return;
      }

      success('¡Historia publicada!');
      onPublished();
    } catch {
      toastError('Error al publicar.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div
      className="bg-[var(--bg-primary)] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 relative"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="p-1 text-[var(--text-secondary)]" aria-label="Atrás">
              <IconChevronLeft size={18} />
            </button>
          )}
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nueva historia</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[var(--text-secondary)]">
          <IconClose size={18} />
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mb-4">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? 'bg-[var(--brand-blue)]' : 'bg-[var(--border-color)]'}`} />
            <span className="text-[10px] text-[var(--text-secondary)] mt-1 block text-center">{label}</span>
          </div>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => handleFileSelected(e.target.files?.[0])}
      />

      {step === 0 && (
        <>
          {previewUrl ? (
            <div className="relative w-full aspect-[9/16] max-h-[320px] mx-auto rounded-xl overflow-hidden bg-black mb-4">
              {file?.type.startsWith('video/') ? (
                <video src={previewUrl} className="w-full h-full object-contain" controls />
              ) : (
                <img src={previewUrl} alt="Vista previa" className="w-full h-full object-contain" />
              )}
              <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 text-xs font-medium px-3 py-1.5 rounded-full bg-black/60 text-white">
                Cambiar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[9/16] max-h-[320px] mx-auto rounded-xl border-2 border-dashed border-[var(--border-color)] flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)] mb-4"
            >
              <div className="flex gap-3"><IconImage size={28} /><IconVideo size={28} /></div>
              <span className="text-sm">Arrastra o toca para elegir foto/video</span>
            </button>
          )}
        </>
      )}

      {step === 1 && (
        <div className="space-y-3 mb-4">
          <p className="text-sm font-medium text-[var(--text-primary)]">Objetivo de campaña</p>
          <div className="grid gap-2">
            {(Object.keys(STORY_OBJECTIVES) as StoryObjective[]).map((obj) => {
              const info = STORY_OBJECTIVES[obj];
              return (
                <button
                  key={obj}
                  type="button"
                  onClick={() => setObjective(obj)}
                  className={`rounded-xl border p-3 text-left ${objective === obj ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.08)]' : 'border-[var(--border-color)]'}`}
                >
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{info.label}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{info.description}</p>
                </button>
              );
            })}
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Texto de la historia (opcional)…"
            maxLength={150}
            rows={2}
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] p-2.5 text-sm resize-none"
          />
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Categoria | '')}
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] p-2.5 text-sm"
          >
            <option value="">Sin categoría</option>
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat}>{getCategoriaLabel(cat)}</option>
            ))}
          </select>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium text-[var(--text-primary)]">Alcance y visibilidad</p>
          {(Object.keys(STORY_TIERS) as StoryPromotionTier[]).map((tierId) => {
            const info = STORY_TIERS[tierId];
            return (
              <button
                key={tierId}
                type="button"
                onClick={() => setTier(tierId)}
                className={`w-full flex items-center justify-between gap-3 rounded-xl border p-3 text-left ${tier === tierId ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.08)]' : 'border-[var(--border-color)]'}`}
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{info.nombre}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{info.descripcion}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{info.duracionHoras}h en el carril</p>
                </div>
                <span className="text-sm font-semibold text-[var(--brand-blue)]">
                  {info.precio === 0 ? 'Gratis' : `S/ ${info.precio}`}
                </span>
              </button>
            );
          })}
          {previewUrl && (
            <div className="mt-3 flex justify-center">
              <div className="w-[72px] h-[128px] rounded-lg overflow-hidden border border-[var(--border-color)]">
                <img src={previewUrl} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {step < 2 ? (
          <button
            type="button"
            disabled={!canNext()}
            onClick={() => setStep(step + 1)}
            className="flex-1 py-3 rounded-full bg-[var(--brand-blue)] text-white font-semibold disabled:opacity-50"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            disabled={!file || publishing}
            className="flex-1 py-3 rounded-full bg-[var(--brand-blue)] text-white font-semibold disabled:opacity-50"
          >
            {publishing ? 'Publicando…' : tier === 'gratis' ? 'Publicar gratis' : `Pagar S/ ${STORY_TIERS[tier].precio}`}
          </button>
        )}
      </div>
    </div>
  );
}
