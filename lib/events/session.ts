const SESSION_KEY = 'buscadis_session_id';
const ANONYMOUS_KEY = 'buscadis_anonymous_id';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateId();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return generateId();
  }
}

export function getAnonymousId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem(ANONYMOUS_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(ANONYMOUS_KEY, id);
    }
    return id;
  } catch {
    return generateId();
  }
}
