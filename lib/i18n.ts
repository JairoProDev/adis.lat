// Utilidades para i18n del lado del cliente
import { Locale } from '@/i18n';

let messages: Record<string, any> = {};
let currentLocale: Locale = 'es';

export async function loadMessages(locale: Locale): Promise<void> {
  try {
    const module = await import(`@/messages/${locale}.json`);
    messages = module.default || module;
    currentLocale = locale;
  } catch (error) {
    console.error(`Error loading messages for locale ${locale}:`, error);
    // Fallback a español
    if (locale !== 'es') {
      const module = await import('@/messages/es.json');
      messages = module.default || module;
      currentLocale = 'es';
    }
  }
}

export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = messages;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Devolver la clave si no se encuentra la traducción
    }
  }
  
  if (typeof value !== 'string') {
    return key;
  }
  
  // Reemplazar parámetros
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }
  
  return value;
}

export function getCurrentLocale(): Locale {
  return currentLocale;
}

export function setCurrentLocale(locale: Locale): void {
  currentLocale = locale;
}















