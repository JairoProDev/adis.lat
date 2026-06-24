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

const EMPTY_STATS: Stats = {
  scanCount: 0,
  periodScans: 0,
  byDay: [],
  byDevice: [],
  whatsappClicks: 0,
};

function buildEmptyWeek(): { date: string; count: number }[] {
  const days: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  return days;
}

const DEVICE_LABELS: Record<string, string> = {
  mobile: 'Móvil',
  desktop: 'Escritorio',
  tablet: 'Tablet',
  unknown: 'Otro',
};

export default function QrAnalyticsPanel({ slug, isPro }: QrAnalyticsPanelProps) {
  const [stats, setStats] = useState<Stats>({ ...EMPTY_STATS, byDay: buildEmptyWeek() });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
        const res = await fetch(`/api/business/${encodeURIComponent(slug)}/qr-analytics?days=7`, {
          credentials: 'include',
          headers,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (!cancelled) {
            setError(body.error || 'No se pudieron cargar las estadísticas');
            setStats({ ...EMPTY_STATS, byDay: buildEmptyWeek() });
          }
          return;
        }
        const data = (await res.json()) as Stats;
        if (!cancelled) {
          setStats({
            scanCount: data.scanCount ?? 0,
            periodScans: data.periodScans ?? 0,
            byDay: data.byDay?.length ? data.byDay : buildEmptyWeek(),
            byDevice: data.byDevice ?? [],
            whatsappClicks: data.whatsappClicks ?? 0,
          });
        }
      } catch {
        if (!cancelled) {
          setError('Error de conexión');
          setStats({ ...EMPTY_STATS, byDay: buildEmptyWeek() });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, session?.access_token, authLoading]);

  const maxDay = Math.max(1, ...stats.byDay.map((d) => d.count));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Escaneos QR</p>
        {loading ? (
          <p className="text-sm text-slate-400 mt-2">Cargando…</p>
        ) : (
          <>
            <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{stats.scanCount}</p>
            <p className="text-xs text-slate-500">
              {stats.periodScans} en los últimos 7 días
            </p>
          </>
        )}
      </div>

      <div>
        <p className="text-xs font-bold text-slate-600 mb-2">Últimos 7 días</p>
        <div className="flex items-end gap-1 h-20">
          {stats.byDay.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <span className="text-[9px] font-bold text-slate-500 tabular-nums">{d.count}</span>
              <div
                className="w-full bg-blue-500 rounded-t-sm transition-all"
                style={{
                  height: `${d.count === 0 ? 4 : Math.max(12, (d.count / maxDay) * 52)}px`,
                  opacity: d.count === 0 ? 0.2 : 1,
                }}
                title={`${d.date}: ${d.count}`}
              />
              <span className="text-[9px] text-slate-400">{d.date.slice(8)}</span>
            </div>
          ))}
        </div>
        {!loading && stats.periodScans === 0 && (
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Aún sin escaneos — comparte o imprime tu QR para empezar a medir.
          </p>
        )}
      </div>

      {isPro ? (
        <div>
          <p className="text-xs font-bold text-slate-600 mb-2">Dispositivos (7 días)</p>
          {stats.byDevice.length > 0 ? (
            <div className="space-y-1">
              {stats.byDevice.map((d) => (
                <div key={d.device} className="flex justify-between text-xs text-slate-600">
                  <span>{DEVICE_LABELS[d.device] || d.device}</span>
                  <span className="font-bold tabular-nums">{d.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">Sin datos de dispositivo todavía.</p>
          )}
          <div className="pt-3 mt-3 border-t border-slate-100 text-xs text-slate-600">
            <span className="font-bold text-slate-800">Funnel: </span>
            <span className="tabular-nums">
              {stats.periodScans} escaneos → {stats.whatsappClicks} clics WhatsApp
            </span>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-slate-400 rounded-lg bg-slate-50 px-3 py-2">
          Actualiza a Pro para ver desglose por dispositivo y funnel completo.
        </p>
      )}

      {error && (
        <p className="text-[11px] text-amber-700 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
