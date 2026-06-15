'use client';

import { useState } from 'react';
import { Story, StoryMetrics, StoryPromotionTier, STORY_TIERS } from '@/types';
import StoryMetricsPanel from './StoryMetricsPanel';

interface StoryArchiveGridProps {
  stories: Story[];
  token?: string;
  onRefresh: () => void;
}

export default function StoryArchiveGrid({ stories, token, onRefresh }: StoryArchiveGridProps) {
  const [metricsStoryId, setMetricsStoryId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<StoryMetrics | null>(null);
  const [reactivating, setReactivating] = useState<string | null>(null);

  const loadMetrics = async (storyId: string) => {
    const res = await fetch(`/api/stories/${storyId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      const data = (await res.json()) as { metrics: StoryMetrics };
      setMetrics(data.metrics);
      setMetricsStoryId(storyId);
    }
  };

  const handleReactivate = async (story: Story, tier: StoryPromotionTier) => {
    if (!token) return;
    setReactivating(story.id);
    try {
      const res = await fetch(`/api/stories/${story.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier }),
      });
      const data = (await res.json()) as { status?: string; checkoutUrl?: string; error?: string };
      if (data.status === 'checkout' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      if (!res.ok) {
        alert(data.error || 'No se pudo republicar');
        return;
      }
      onRefresh();
    } finally {
      setReactivating(null);
    }
  };

  const handleDelete = async (storyId: string) => {
    if (!token || !confirm('¿Eliminar esta historia del archivo?')) return;
    await fetch(`/api/stories/${storyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    onRefresh();
  };

  if (stories.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)] text-center py-8">
        Aún no tienes historias archivadas. Las historias expiradas aparecerán aquí.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {stories.map((story) => (
          <div
            key={story.id}
            className="relative rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-secondary)]"
          >
            <div className="aspect-[9/16] bg-black">
              {story.media_type === 'video' ? (
                <video src={story.media_url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={story.media_url} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="p-2 space-y-1">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                {story.caption || 'Sin título'}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">
                {STORY_TIERS[story.promotion_tier].nombre} · {story.status}
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                <button
                  type="button"
                  disabled={reactivating === story.id}
                  onClick={() => handleReactivate(story, 'gratis')}
                  className="text-[10px] px-2 py-1 rounded-full bg-[var(--brand-blue)] text-white"
                >
                  1h gratis
                </button>
                <button
                  type="button"
                  disabled={reactivating === story.id}
                  onClick={() => handleReactivate(story, 'destacada')}
                  className="text-[10px] px-2 py-1 rounded-full bg-[var(--brand-yellow)] text-black"
                >
                  S/5
                </button>
                <button
                  type="button"
                  onClick={() => loadMetrics(story.id)}
                  className="text-[10px] px-2 py-1 rounded-full border border-[var(--border-color)]"
                >
                  Stats
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(story.id)}
                  className="text-[10px] px-2 py-1 rounded-full text-red-500"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {metricsStoryId && metrics && (
        <StoryMetricsPanel
          story={stories.find((s) => s.id === metricsStoryId)!}
          metrics={metrics}
          onClose={() => {
            setMetricsStoryId(null);
            setMetrics(null);
          }}
        />
      )}
    </>
  );
}
