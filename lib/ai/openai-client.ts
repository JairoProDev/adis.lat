/**
 * OpenAI Client Configuration
 *
 * This module provides a centralized OpenAI client instance
 * and utility functions for AI operations.
 */

import { openai as vercelOpenAI } from '@ai-sdk/openai';
import OpenAI from 'openai';

// Validate API key
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

/**
 * OpenAI client for direct API calls
 * Use this for embeddings, moderation, etc.
 */
export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Vercel AI SDK OpenAI provider
 * Use this for generateText, streamUI, generateObject
 */
export const openai = vercelOpenAI;

/**
 * Model configurations
 */
export const AI_MODELS = {
  // Primary reasoning model (expensive but powerful)
  REASONING: 'gpt-4o',

  // Fast routing model (cheap and quick)
  ROUTER: 'gpt-4o-mini',

  // Embedding model (for vector search)
  EMBEDDING: 'text-embedding-3-small',

  // Vision model (for image analysis)
  VISION: 'gpt-4o',
} as const;

/**
 * Cost tracking (per 1M tokens)
 */
export const AI_COSTS = {
  'gpt-4o': { input: 5.0, output: 15.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'text-embedding-3-small': { input: 0.02, output: 0 },
} as const;

/**
 * Token limits
 */
export const TOKEN_LIMITS = {
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'text-embedding-3-small': 8191,
} as const;

/**
 * Estimate cost of an AI operation
 */
export function estimateCost(
  model: keyof typeof AI_COSTS,
  inputTokens: number,
  outputTokens: number = 0
): number {
  const costs = AI_COSTS[model];
  const inputCost = (inputTokens / 1_000_000) * costs.input;
  const outputCost = (outputTokens / 1_000_000) * costs.output;
  return inputCost + outputCost;
}

/**
 * Simple token counter (approximation)
 * More accurate: use tiktoken library
 */
export function estimateTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}
