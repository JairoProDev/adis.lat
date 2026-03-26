import { Categoria } from '@/types';

export interface ChatSessionState {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  turns: Array<{ role: 'user' | 'assistant'; content: string; at: string }>;
  context: {
    lastIntent?: string;
    preferredCategory?: Categoria;
    preferredLocation?: string;
  };
}

const sessions = new Map<string, ChatSessionState>();
const MAX_TURNS = 20;

export function getOrCreateSession(sessionId?: string): ChatSessionState {
  const id = sessionId || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const existing = sessions.get(id);
  if (existing) return existing;

  const now = new Date().toISOString();
  const state: ChatSessionState = {
    sessionId: id,
    createdAt: now,
    updatedAt: now,
    turns: [],
    context: {},
  };
  sessions.set(id, state);
  return state;
}

export function appendTurn(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): ChatSessionState {
  const state = getOrCreateSession(sessionId);
  state.turns.push({ role, content, at: new Date().toISOString() });
  if (state.turns.length > MAX_TURNS) {
    state.turns = state.turns.slice(-MAX_TURNS);
  }
  state.updatedAt = new Date().toISOString();
  sessions.set(sessionId, state);
  return state;
}
