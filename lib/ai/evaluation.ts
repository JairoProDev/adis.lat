import { AIIntent } from './contracts';

export interface EvaluationSample {
  id: string;
  query: string;
  expectedIntent: AIIntent;
  expectedMinResults?: number;
}

export interface EvaluationResult {
  sampleId: string;
  passed: boolean;
  detectedIntent: AIIntent;
  totalResults: number;
  notes?: string;
}

export const DEFAULT_EVAL_SET: EvaluationSample[] = [
  { id: 'q1', query: 'busco trabajo de cocinero en cusco', expectedIntent: 'search', expectedMinResults: 1 },
  { id: 'q2', query: 'quiero publicar mi laptop', expectedIntent: 'publish' },
  { id: 'q3', query: 'hola, ayudame', expectedIntent: 'help' },
];

export function evaluateIntent(sample: EvaluationSample, detected: AIIntent): EvaluationResult {
  return {
    sampleId: sample.id,
    detectedIntent: detected,
    totalResults: 0,
    passed: sample.expectedIntent === detected,
    notes: sample.expectedIntent === detected ? 'ok' : `expected ${sample.expectedIntent}`,
  };
}

export function summarizeEvaluation(results: EvaluationResult[]) {
  const passed = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passed,
    passRate: results.length ? passed / results.length : 0,
  };
}
