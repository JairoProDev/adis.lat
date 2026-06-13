// Lightweight keyword extraction used to build the user interest profile
// (categoria_signals / keyword_signals) from ad titles & descriptions.

const STOPWORDS = new Set([
  'de', 'la', 'el', 'en', 'y', 'a', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'con', 'por', 'para', 'del', 'al', 'que', 'se', 'su', 'sus', 'es', 'son',
  'lo', 'le', 'les', 'mi', 'tu', 'sin', 'sobre', 'entre', 'como', 'muy',
  'más', 'mas', 'pero', 'o', 'u', 'no', 'si', 'sí', 'esta', 'este', 'estos',
  'estas', 'ese', 'esa', 'esos', 'esas', 'todo', 'toda', 'todos', 'todas',
  'nuestro', 'nuestra', 'nuestros', 'nuestras', 'yo', 'tu', 'el', 'ella',
  'nos', 'ya', 'también', 'tambien', 'cada', 'desde', 'hasta', 'cuando',
  'donde', 'porque', 'soy', 'fue', 'ser', 'hay', 'me', 'te',
]);

function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Extracts up to `max` normalized, deduplicated keywords from free text
 * (ad title + description) for use as affinity signals.
 */
export function extractKeywords(text: string, max = 6): string[] {
  if (!text) return [];

  const words = stripAccents(text.toLowerCase())
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word));

  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const word of words) {
    if (seen.has(word)) continue;
    seen.add(word);
    keywords.push(word);
    if (keywords.length >= max) break;
  }

  return keywords;
}
