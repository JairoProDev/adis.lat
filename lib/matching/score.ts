export interface MatchWeights {
  semantic: number;
  category: number;
  demand: number;
  keyword: number;
  geo: number;
  engagement: number;
  negativePenalty: number;
}

export const DEFAULT_MATCH_WEIGHTS: MatchWeights = {
  semantic: 0.4,
  category: 0.2,
  demand: 0.2,
  keyword: 0.1,
  geo: 0.05,
  engagement: 0.05,
  negativePenalty: 0.3,
};

export function compositeMatchScore(parts: {
  semantic?: number;
  category?: number;
  demand?: number;
  keyword?: number;
  geo?: number;
  engagement?: number;
  negative?: number;
}): number {
  const w = DEFAULT_MATCH_WEIGHTS;
  const raw =
    (parts.semantic || 0) * w.semantic +
    (parts.category || 0) * w.category +
    (parts.demand || 0) * w.demand +
    (parts.keyword || 0) * w.keyword +
    (parts.geo || 0) * w.geo +
    (parts.engagement || 0) * w.engagement -
    (parts.negative || 0) * w.negativePenalty;
  return Math.min(1, Math.max(0, raw));
}

export interface InterestedUserPreview {
  userId: string;
  matchScore: number;
  matchReasons: string[];
  lastActiveAt?: string;
  locationHint?: string;
  queryHint?: string;
}

export function anonymizeInterestedUser(
  row: {
    user_id: string;
    match_score: number;
    match_reasons: string[] | null;
    last_active_at?: string;
  },
  index: number
): InterestedUserPreview {
  const reasons = (row.match_reasons || []).filter(Boolean);
  return {
    userId: row.user_id,
    matchScore: row.match_score,
    matchReasons: reasons,
    lastActiveAt: row.last_active_at,
    locationHint: `Usuario #${index + 1}`,
    queryHint: reasons[0] || 'Interés detectado',
  };
}
