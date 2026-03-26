export const AI_FLAGS = {
  unifiedChat: process.env.NEXT_PUBLIC_AI_UNIFIED_CHAT !== 'false',
  enableVision: process.env.NEXT_PUBLIC_AI_ENABLE_VISION !== 'false',
  enableRecommendations:
    process.env.NEXT_PUBLIC_AI_ENABLE_RECOMMENDATIONS !== 'false',
  allowLegacyChatFallback:
    process.env.NEXT_PUBLIC_AI_LEGACY_FALLBACK !== 'false',
} as const;

export function isAIEnabled(flag: keyof typeof AI_FLAGS): boolean {
  return AI_FLAGS[flag];
}
