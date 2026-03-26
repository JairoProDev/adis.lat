import { AIEventName } from './contracts';

type Level = 'info' | 'warn' | 'error';

export interface AIEvent {
  name: AIEventName;
  level?: Level;
  timestamp: string;
  sessionId?: string;
  userId?: string;
  route?: string;
  intent?: string;
  tool?: string;
  latencyMs?: number;
  costUsd?: number;
  status?: 'ok' | 'error';
  metadata?: Record<string, unknown>;
}

const MAX_BUFFER = 500;
const eventBuffer: AIEvent[] = [];

export function trackAIEvent(event: Omit<AIEvent, 'timestamp'>): void {
  const complete: AIEvent = {
    level: 'info',
    ...event,
    timestamp: new Date().toISOString(),
  };

  eventBuffer.push(complete);
  if (eventBuffer.length > MAX_BUFFER) {
    eventBuffer.shift();
  }

  const log = complete.level === 'error' ? console.error : console.log;
  log('[AI_EVENT]', complete.name, {
    sessionId: complete.sessionId,
    intent: complete.intent,
    tool: complete.tool,
    latencyMs: complete.latencyMs,
    status: complete.status,
  });
}

export function getAIEvents(limit = 100): AIEvent[] {
  return eventBuffer.slice(-Math.max(1, limit));
}

export function summarizeAIEvents() {
  const events = getAIEvents(500);
  const total = events.length;
  const errors = events.filter((e) => e.level === 'error').length;
  const avgLatency =
    events.filter((e) => typeof e.latencyMs === 'number').reduce((acc, e) => acc + (e.latencyMs || 0), 0) /
    Math.max(1, events.filter((e) => typeof e.latencyMs === 'number').length);

  return {
    totalEvents: total,
    errorRate: total ? errors / total : 0,
    avgLatencyMs: Number.isFinite(avgLatency) ? Math.round(avgLatency) : 0,
  };
}
