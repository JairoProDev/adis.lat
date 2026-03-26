import { estimateCost, estimateTokens } from './openai-client';

const DAILY_BUDGET_USD = Number(process.env.AI_DAILY_BUDGET_USD || '8');
let spentTodayUsd = 0;
let budgetDate = new Date().toISOString().slice(0, 10);

function ensureBudgetDate() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== budgetDate) {
    budgetDate = today;
    spentTodayUsd = 0;
  }
}

export function canSpendAI(estimatedUsd: number): boolean {
  ensureBudgetDate();
  return spentTodayUsd + estimatedUsd <= DAILY_BUDGET_USD;
}

export function reserveAIBudget(estimatedUsd: number): boolean {
  if (!canSpendAI(estimatedUsd)) return false;
  spentTodayUsd += estimatedUsd;
  return true;
}

export function getAIBudgetStatus() {
  ensureBudgetDate();
  return {
    date: budgetDate,
    dailyBudgetUsd: DAILY_BUDGET_USD,
    spentUsd: Number(spentTodayUsd.toFixed(4)),
    remainingUsd: Number(Math.max(0, DAILY_BUDGET_USD - spentTodayUsd).toFixed(4)),
  };
}

export function estimateChatTurnCost(inputText: string, outputText = ''): number {
  const inputTokens = estimateTokens(inputText);
  const outputTokens = estimateTokens(outputText);
  return estimateCost('gpt-4o-mini', inputTokens, outputTokens);
}
