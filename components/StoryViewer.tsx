'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import { useFavoritos } from '@/contexts/FavoritosContext';
import { StoryGroup, STORY_TIERS, Adiso } from '@/types';
import {
  registerStoryView,
  markStorySeen,
  recordStoryInteraction,
} from '@/lib/stories';
import { getAdisoById } from '@/lib/storage';
import { getWhatsAppUrl } from '@/lib/utils';
import { STORY_OBJECTIVES as OBJECTIVE_CONFIG } from '@/lib/stories/config';
import { IconClose } from '@/components/Icons';

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
}

const STORY_DURATION_MS = 5000;

export default function StoryViewer({ groups, initialGroupIndex, onClose }: StoryViewerProps) {
  const { user, session } = useAuth();
  const { openAuthModal, openChat } = useUI();
  const { isFavorite, toggleFavorite } = useFavoritos();

  const [pos, setPos] = useState({ g: initialGroupIndex, s: 0 });
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [linkedAdiso, setLinkedAdiso] = useState<Adiso | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | undefined>(undefined);

  const group = groups[pos.g];
  const story = group?.stories[pos.s];
  const objectiveConfig = story ? OBJECTIVE_CONFIG[story.objective] : null;

  const goNext = () => {
    const grp = groups[pos.g];
    if (pos.s + 1 < grp.stories.length) {
      setPos({ g: pos.g, s: pos.s + 1 });
    } else if (pos.g + 1 < groups.length) {
      setPos({ g: pos.g + 1, s: 0 });
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (pos.s > 0) {
      setPos({ g: pos.g, s: pos.s - 1 });
    } else if (pos.g > 0) {
      setPos({ g: pos.g - 1, s: groups[pos.g - 1].stories.length - 1 });
    }
  };

  useEffect(() => {
    if (!story) return;
    markStorySeen(story.id);
    if (user?.id) registerStoryView(story.id, user.id);
    recordStoryInteraction(story.id, 'view', session?.access_token);
    setSheetOpen(false);
    setFavorited(story.adiso_id ? isFavorite(story.adiso_id) : false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, user?.id]);

  useEffect(() => {
    if (!story?.adiso_id) {
      setLinkedAdiso(null);
      return;
    }
    getAdisoById(story.adiso_id).then(setLinkedAdiso);
  }, [story?.adiso_id]);

  useEffect(() => {
    if (!story || story.media_type === 'video' || paused || sheetOpen) return;

    setProgress(0);
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(1, elapsed / STORY_DURATION_MS);
      setProgress(pct);
      if (pct >= 1) goNext();
      else rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos.g, pos.s, paused, sheetOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos]);

  useEffect(() => {
    if (story?.media_type === 'video' && videoRef.current) {
      if (paused || sheetOpen) videoRef.current.pause();
      else videoRef.current.play().catch(() => {});
    }
  }, [paused, sheetOpen, story]);

  const requireAuth = () => {
    if (!user) {
      openAuthModal();
      return false;
    }
    return true;
  };

  const handleWhatsApp = async () => {
    const contacto = linkedAdiso?.contacto;
    if (!contacto) return;
    await recordStoryInteraction(story!.id, 'whatsapp_click', session?.access_token);
    window.open(
      getWhatsAppUrl(contacto, linkedAdiso!.titulo, linkedAdiso!.categoria, linkedAdiso!.id),
      '_blank'
    );
  };

  const handleChat = async () => {
    if (!requireAuth() || !story) return;
    setChatLoading(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          recipientId: story.user_id,
          storyId: story.id,
          initialMessage: `Vi tu historia sobre ${story.caption || 'tu publicación'}`,
        }),
      });
      const data = (await res.json()) as { conversationId?: string; error?: string };
      if (data.conversationId) {
        await recordStoryInteraction(story.id, 'chat_open', session?.access_token);
        openChat(data.conversationId);
      }
    } finally {
      setChatLoading(false);
    }
  };

  const handleViewAdiso = async () => {
    if (!story) return;
    await recordStoryInteraction(story.id, 'cta_click', session?.access_token);
    const url = story.cta_url || (story.adiso_id ? `/?adiso=${story.adiso_id}` : null);
    if (url) window.open(url, '_blank');
  };

  const handleFavorite = async () => {
    if (!requireAuth() || !story) return;
    if (story.adiso_id) {
      const nowFav = await toggleFavorite(story.adiso_id);
      setFavorited(nowFav);
    } else {
      const result = await recordStoryInteraction(story.id, 'favorite', session?.access_token, {
        toggleFavorite: true,
      });
      if (result && 'favorited' in result) setFavorited(Boolean(result.favorited));
    }
  };

  const handleShare = async () => {
    if (!story) return;
    await recordStoryInteraction(story.id, 'share', session?.access_token);
    const url = `${window.location.origin}/?story=${story.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: story.caption || 'Historia en Buscadis', url });
        return;
      } catch {
        // user cancelled
      }
    }
    await navigator.clipboard.writeText(url).catch(() => {});
  };

  if (!story || !group) return null;

  const highlightContact = story.objective === 'contactos';
  const highlightCta = story.objective === 'ventas' || story.objective === 'clicks';

  return createPortal(
    <div className="fixed inset-0 z-[10002] bg-black flex items-center justify-center">
      <motion.div
        className="relative w-full h-full max-w-[480px] mx-auto"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.6}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100) onClose();
          else if (info.offset.y < -80) setSheetOpen(true);
        }}
      >
        <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
          {group.stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white"
                style={{
                  width: i < pos.s ? '100%' : i === pos.s ? `${progress * 100}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-6 left-2 right-2 z-20 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
              {group.vendedor?.avatarUrl && (
                <img src={group.vendedor.avatarUrl} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <span className="text-sm font-semibold truncate drop-shadow">
              {group.vendedor?.nombre || 'Usuario'}
            </span>
            {story.promotion_tier !== 'gratis' && (
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[var(--brand-yellow)] text-black">
                {STORY_TIERS[story.promotion_tier].nombre}
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} className="min-w-[40px] min-h-[40px] flex items-center justify-center text-white" aria-label="Cerrar">
            <IconClose size={22} />
          </button>
        </div>

        <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black">
          {story.media_type === 'video' ? (
            <video
              ref={videoRef}
              src={story.media_url}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (v.duration) setProgress(v.currentTime / v.duration);
              }}
              onEnded={goNext}
            />
          ) : (
            <img src={story.media_url} alt={story.caption || ''} className="w-full h-full object-contain" />
          )}
        </div>

        {/* CTAs sticky footer */}
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pb-6 pt-16">
          {objectiveConfig && (
            <p className="text-[11px] text-white/70 mb-2 text-center">
              Objetivo: {objectiveConfig.label}
            </p>
          )}
          {story.caption && (
            <p className="text-sm text-white mb-3 line-clamp-2 drop-shadow">{story.caption}</p>
          )}
          <div className="flex flex-wrap gap-2 justify-center">
            {(story.adiso_id || story.cta_url) && (
              <button
                type="button"
                onClick={handleViewAdiso}
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  highlightCta ? 'bg-[var(--brand-yellow)] text-black' : 'bg-white/20 text-white'
                }`}
              >
                Ver aviso
              </button>
            )}
            {linkedAdiso?.contacto && (
              <button
                type="button"
                onClick={handleWhatsApp}
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  highlightContact ? 'bg-[#25D366] text-white' : 'bg-white/20 text-white'
                }`}
              >
                WhatsApp
              </button>
            )}
            <button
              type="button"
              onClick={handleChat}
              disabled={chatLoading}
              className={`px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-60 ${
                highlightContact ? 'bg-[var(--brand-blue)] text-white' : 'bg-white/20 text-white'
              }`}
            >
              {chatLoading ? '…' : 'Chat'}
            </button>
            <button
              type="button"
              onClick={handleFavorite}
              className={`px-3 py-2 rounded-full text-sm ${favorited ? 'bg-red-500 text-white' : 'bg-white/20 text-white'}`}
              aria-label="Guardar"
            >
              {favorited ? '♥' : '♡'}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-2 rounded-full text-sm bg-white/20 text-white"
              aria-label="Compartir"
            >
              ↗
            </button>
          </div>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="w-full mt-3 text-center text-xs text-white/60"
          >
            Desliza arriba para más detalles ↑
          </button>
        </div>

        <div className="absolute inset-0 flex z-10 pointer-events-none">
          <div className="flex-1 pointer-events-auto" onClick={goPrev} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} />
          <div className="flex-1 pointer-events-auto" onClick={goNext} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} />
        </div>

        <AnimatePresence>
          {sheetOpen && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="absolute bottom-0 left-0 right-0 z-40 max-h-[55%] rounded-t-2xl bg-[var(--bg-primary)] p-4 overflow-y-auto"
            >
              <div className="w-10 h-1 rounded-full bg-[var(--border-color)] mx-auto mb-4" />
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                {linkedAdiso?.titulo || story.caption || 'Detalle'}
              </h3>
              {linkedAdiso?.descripcion && (
                <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-4">
                  {linkedAdiso.descripcion}
                </p>
              )}
              <div className="flex flex-col gap-2">
                {(story.adiso_id || story.cta_url) && (
                  <button type="button" onClick={handleViewAdiso} className="w-full py-2.5 rounded-xl bg-[var(--brand-blue)] text-white font-semibold text-sm">
                    Ver aviso completo
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {linkedAdiso?.contacto && (
                    <button type="button" onClick={handleWhatsApp} className="py-2.5 rounded-xl bg-[#25D366] text-white font-semibold text-sm">
                      WhatsApp
                    </button>
                  )}
                  <button type="button" onClick={handleChat} className="py-2.5 rounded-xl bg-[var(--brand-blue)] text-white font-semibold text-sm">
                    Chat
                  </button>
                </div>
              </div>
              <button type="button" onClick={() => setSheetOpen(false)} className="w-full mt-3 text-sm text-[var(--text-secondary)]">
                Cerrar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>,
    document.body
  );
}
