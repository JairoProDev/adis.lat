'use client';

import { useState, useRef, useEffect } from 'react';
import { Locale, locales, localeNames, localeFlags } from '@/i18n';
import { useTranslation } from '@/hooks/useTranslation';

export default function LanguageSelector() {
  const { locale, changeLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLocaleChange = async (newLocale: Locale) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }
    await changeLocale(newLocale);
    setIsOpen(false);
    // Recargar la página para aplicar cambios en todo el sitio
    // Esto es necesario porque algunos componentes no están usando useTranslation
    window.location.reload();
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Seleccionar idioma"
        aria-expanded={isOpen}
        aria-haspopup="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
        }}
      >
        <span>{localeFlags[locale]}</span>
        <span>{localeNames[locale]}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.5rem',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px var(--shadow)',
            zIndex: 1000,
            minWidth: '150px',
            overflow: 'hidden',
          }}
        >
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                textAlign: 'left',
                border: 'none',
                backgroundColor: locale === loc ? 'var(--text-primary)' : 'transparent',
                color: locale === loc ? 'var(--bg-primary)' : 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.875rem',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (locale !== loc) {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (locale !== loc) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span>{localeFlags[loc]}</span>
              <span>{localeNames[loc]}</span>
              {locale === loc && <span style={{ marginLeft: 'auto' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

