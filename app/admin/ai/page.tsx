'use client';

import React from 'react';

interface MetricsResponse {
  summary: {
    totalEvents: number;
    errorRate: number;
    avgLatencyMs: number;
  };
  budget: {
    date: string;
    dailyBudgetUsd: number;
    spentUsd: number;
    remainingUsd: number;
  };
  recentEvents: Array<{
    name: string;
    timestamp: string;
    intent?: string;
    tool?: string;
    status?: string;
    latencyMs?: number;
  }>;
}

export default function AdminAIPage() {
  const [data, setData] = React.useState<MetricsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/ai/metrics');
        if (!res.ok) throw new Error('No se pudo cargar métricas');
        setData(await res.json());
      } catch (e: any) {
        setError(e?.message || 'Error cargando métricas');
      } finally {
        setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI Ops Dashboard</h1>
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {data && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-gray-500">Eventos</p>
              <p className="text-2xl font-semibold">{data.summary.totalEvents}</p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-gray-500">Error rate</p>
              <p className="text-2xl font-semibold">
                {(data.summary.errorRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-gray-500">Latencia promedio</p>
              <p className="text-2xl font-semibold">{data.summary.avgLatencyMs} ms</p>
            </div>
          </section>

          <section className="p-4 rounded-lg border mb-6">
            <h2 className="font-semibold mb-2">Budget diario ({data.budget.date})</h2>
            <p>Budget: ${data.budget.dailyBudgetUsd}</p>
            <p>Gastado: ${data.budget.spentUsd}</p>
            <p>Disponible: ${data.budget.remainingUsd}</p>
          </section>

          <section className="p-4 rounded-lg border">
            <h2 className="font-semibold mb-3">Eventos recientes</h2>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Timestamp</th>
                    <th className="py-2">Evento</th>
                    <th className="py-2">Intent</th>
                    <th className="py-2">Tool</th>
                    <th className="py-2">Estado</th>
                    <th className="py-2">Latencia</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentEvents.map((ev, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2">{new Date(ev.timestamp).toLocaleString()}</td>
                      <td className="py-2">{ev.name}</td>
                      <td className="py-2">{ev.intent || '-'}</td>
                      <td className="py-2">{ev.tool || '-'}</td>
                      <td className="py-2">{ev.status || '-'}</td>
                      <td className="py-2">{ev.latencyMs ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
