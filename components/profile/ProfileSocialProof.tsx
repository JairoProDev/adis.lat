'use client';

import { useEffect, useState } from 'react';
import type { SocialInsight } from '@buscadis/profile-engine';
import { cn } from '@/lib/utils';

interface ProfileSocialProofProps {
  insights: SocialInsight[];
  intervalMs?: number;
  className?: string;
}

export default function ProfileSocialProof({
  insights,
  intervalMs = 3000,
  className,
}: ProfileSocialProofProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (insights.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % insights.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [insights.length, intervalMs]);

  if (!insights.length) return null;

  const current = insights[index];

  return (
    <div
      className={cn(
        'max-w-6xl mx-auto px-4 print:hidden',
        className
      )}
    >
      <div className="flex items-center gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 px-3 py-2.5 shadow-sm">
        <div className="flex -space-x-2">
          {insights.slice(0, 3).map((ins) => (
            <div
              key={ins.id}
              className="w-8 h-8 rounded-full border-2 border-[var(--bg-primary)] bg-[var(--bg-secondary)] overflow-hidden flex items-center justify-center text-xs font-bold text-[var(--text-tertiary)]"
            >
              {ins.avatarUrl ? (
                <img src={ins.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                ins.userName.charAt(0).toUpperCase()
              )}
            </div>
          ))}
        </div>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] m-0 min-w-0 transition-opacity duration-300">
          <span className="font-semibold text-[var(--text-primary)]">{current.userName}</span>{' '}
          {current.action}
        </p>
      </div>
    </div>
  );
}
