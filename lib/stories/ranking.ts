import { Story, StoryGroup } from '@/types';
import { UserInterestProfile } from '@/lib/interactions';
import { STORY_TIER_ORDER } from '@/lib/stories/config';

export interface StoryRankingContext {
  seenStoryIds: Set<string>;
  serverSeenStoryIds?: Set<string>;
  interestProfile?: UserInterestProfile | null;
  favoriteAdisoIds?: Set<string>;
  hiddenSellerIds?: Set<string>;
}

function interestBoost(story: Story, profile?: UserInterestProfile | null): number {
  if (!profile) return 0;
  let boost = 0;
  if (story.categoria && profile.categoriaSignals[story.categoria]) {
    boost += profile.categoriaSignals[story.categoria] * 2;
  }
  const caption = (story.caption || '').toLowerCase();
  for (const [kw, score] of Object.entries(profile.keywordSignals || {})) {
    if (caption.includes(kw.toLowerCase())) {
      boost += score;
    }
  }
  return boost;
}

export function scoreStoryGroup(group: StoryGroup, ctx: StoryRankingContext): number {
  const topStory = group.stories[0];
  if (!topStory) return 0;

  let score = (3 - STORY_TIER_ORDER[group.topTier]) * 1000;

  const seenSet = ctx.serverSeenStoryIds?.size
    ? ctx.serverSeenStoryIds
    : ctx.seenStoryIds;

  const hasUnseen = group.stories.some((s) => !seenSet.has(s.id));
  if (hasUnseen) score += 500;

  score += interestBoost(topStory, ctx.interestProfile);

  if (topStory.adiso_id && ctx.favoriteAdisoIds?.has(topStory.adiso_id)) {
    score += 300;
  }

  if (ctx.hiddenSellerIds?.has(group.userId)) {
    score -= 2000;
  }

  const ageMs = Date.now() - new Date(topStory.created_at).getTime();
  const recencyBoost = Math.max(0, 200 - ageMs / (60 * 60 * 1000));
  score += recencyBoost;

  return score;
}

export function rankStoryGroups(
  groups: StoryGroup[],
  ctx: StoryRankingContext
): StoryGroup[] {
  return [...groups]
    .map((g) => ({
      ...g,
      relevanceScore: scoreStoryGroup(g, ctx),
      hasUnseen: g.stories.some((s) => {
        const seenSet = ctx.serverSeenStoryIds?.size
          ? ctx.serverSeenStoryIds
          : ctx.seenStoryIds;
        return !seenSet.has(s.id);
      }),
    }))
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
}
