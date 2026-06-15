import { supabaseAdmin } from '@/lib/supabase-admin';
import { InterestedUserPreview } from '@/lib/matching/score';

const MAX_OPPORTUNITIES_PER_DAY = 3;

export async function userAcceptsOpportunities(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('user_preferences')
    .select('oportunidades_personalizadas, notificaciones_push')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) return true;
  const prefs = data as { oportunidades_personalizadas?: boolean; notificaciones_push?: boolean };
  return prefs.oportunidades_personalizadas !== false && prefs.notificaciones_push !== false;
}

export async function countTodayOpportunities(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count } = await supabaseAdmin
    .from('campaign_deliveries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString());

  return count || 0;
}

export async function filterEligibleRecipients(
  interested: InterestedUserPreview[],
  minScore = 0.15
): Promise<InterestedUserPreview[]> {
  const eligible: InterestedUserPreview[] = [];

  for (const user of interested) {
    if (user.matchScore < minScore) continue;
    const accepts = await userAcceptsOpportunities(user.userId);
    if (!accepts) continue;
    const todayCount = await countTodayOpportunities(user.userId);
    if (todayCount >= MAX_OPPORTUNITIES_PER_DAY) continue;
    eligible.push(user);
  }

  return eligible;
}

export function buildOpportunityCopy(adisoTitle: string, matchReason?: string): { title: string; body: string } {
  return {
    title: '¡Encontramos lo que buscabas!',
    body: matchReason
      ? `${adisoTitle} — ${matchReason}`
      : `Nueva oportunidad: ${adisoTitle}. Coincide con tus intereses.`,
  };
}
