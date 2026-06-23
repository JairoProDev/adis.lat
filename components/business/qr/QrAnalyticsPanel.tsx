'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface QrAnalyticsPanelProps {
  slug: string;
  isPro: boolean;
}

interface Stats {
  scanCount: number;
  periodScans: number;
  byDay: { date: string; count: number }[];
  byDevice: { device: string; count: number }[];
  whatsappClicks: number;
}

export default function QrAnalyticsPanel({ slug, isPro }: QrAnalyticsPanelProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    void (async () => {
      try {
        const headers: HeadersInit = { credentials: 'include' } as HeadersInit;
        const h: Record<string, string> = {};
        if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`;
        const res = await fetch(`/api/business/${encodeURIComponent(slug)}/qr-analytics?days=7`, {
          credentials: 'include',
          headers: h,
        });
        if (res.ok) setStats(await res.json());
      } catch {
        /* offline */
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, session?.access_token]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        Cargando estadísticas…
      </div>
    );
  }

  if (!stats) return null;

  const maxDay = Math.max(1, ...stats.byDay.map((d) => d.count));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Escaneos QR</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{stats.scanCount}</p>
        <p className="text-xs text-slate-500">{stats.periodScans} esta semana</p>
      </div>

      {stats.byDay.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-600 mb-2">Últimos 7 días</p>
          <div className="flex items-end gap-1 h-16">
            {stats.byDay.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-blue-500 rounded-t-sm min-h-[4px] transition-all"
                  style={{ height: `${Math.max(8, (d.count / maxDay) * 48)}px` }}
                  title={`${d.date}: ${d.count}`}
                />
                <span className="text-[9px] text-slate-400">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isPro && stats.byDevice.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-600 mb-2">Dispositivos</p>
          <div className="space-y-1">
            {stats.byDevice.map((d) => (
              <div key={d.device} className="flex justify-between text-xs text-slate-600">
                <span className="capitalize">{d.device}</span>
                <span className="font-bold">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isPro && (
        <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
          <span className="font-bold text-slate-800">Funnel: </span>
          {stats.periodScans} escaneos → {stats.whatsappClicks} clics WhatsApp
        </div>
      )}

      {!isPro && (
        <p className="text-[11px] text-slate-400">
          Actualiza a Pro para ver desglose por dispositivo y funnel completo.
        </p>
      )}
    </div>
  );
}
