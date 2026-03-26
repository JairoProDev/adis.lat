import { NextResponse } from 'next/server';
import { DEFAULT_EVAL_SET, evaluateIntent, summarizeEvaluation } from '@/lib/ai/evaluation';
import { AIIntent } from '@/lib/ai/contracts';

function lightweightDetectIntent(msg: string): AIIntent {
  const t = msg.toLowerCase();
  if (/(publicar|vender)/.test(t)) return 'publish';
  if (/(hola|ayuda)/.test(t)) return 'help';
  if (t.length > 3) return 'search';
  return 'other';
}

export async function GET() {
  const results = DEFAULT_EVAL_SET.map((sample) =>
    evaluateIntent(sample, lightweightDetectIntent(sample.query))
  );
  const summary = summarizeEvaluation(results);
  return NextResponse.json({ summary, results });
}
