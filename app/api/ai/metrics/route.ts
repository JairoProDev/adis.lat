import { NextResponse } from 'next/server';
import { getAIEvents, summarizeAIEvents } from '@/lib/ai/observability';
import { getAIBudgetStatus } from '@/lib/ai/cost-governance';

export async function GET() {
  const summary = summarizeAIEvents();
  const budget = getAIBudgetStatus();
  const recentEvents = getAIEvents(100);

  return NextResponse.json({
    summary,
    budget,
    recentEvents,
  });
}
