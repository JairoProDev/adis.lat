'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface ProfileAnalyticsWidgetProps {
  businessProfileId?: string;
}

export default function ProfileAnalyticsWidget({ businessProfileId }: ProfileAnalyticsWidgetProps) {
  const [stats, setStats] = useState({ views: 0, whatsapp: 0, qrScans: 0 });
  const { session } = useAuth();

  useEffect(() => {
    if (!businessProfileId) return;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    void (async () => {
      try {
        const { data } = await supabase!
          .from('page_analytics')
          .select('event_type')
          .eq('business_profile_id', businessProfileId)
          .gte('created_at', weekAgo.toISOString());
        const rows = data || [];
        setStats({
          views: rows.filter((r) => r.event_type === 'page_view' || r.event_type === 'profile_view').length,
          whatsapp: rows.filter((r) => r.event_type === 'whatsapp_click').length,
          qrScans: rows.filter((r) => r.event_type === 'qr_scan').length,
        });
      } catch {
        /* RLS or offline */
      }
    })();
  }, [businessProfileId]);

  useEffect(() => {
    if (!businessProfileId || !session?.access_token) return;
    void (async () => {
      try {
        const { data: bp } = await supabase!
          .from('business_profiles')
          .select('slug')
          .eq('id', businessProfileId)
          .maybeSingle();
        if (!bp?.slug) return;
        const res = await fetch(
          `/api/business/${encodeURIComponent(bp.slug)}/qr-analytics?days=7`,
          {
            credentials: 'include',
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setStats((s) => ({ ...s, qrScans: data.periodScans ?? s.qrScans }));
        }
      } catch {
        /* */
      }
    })();
  }, [businessProfileId, session?.access_token]);

  if (!businessProfileId) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
      <span className="font-bold text-slate-800">Esta semana: </span>
      {stats.views} visitas · {stats.qrScans} escaneos QR · {stats.whatsapp} clics WhatsApp
    </div>
  );
}
