'use client';

import { useState, useRef, useEffect } from 'react';
import { Locale, locales, localeNames, localeFlags } from '@/i18n';
import { useTranslation } from '@/hooks/useTranslation';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function LanguageSelector() {
  const { locale, changeLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');

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
          gap: '0.75rem',
          padding: '0.6rem 0.8rem',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          width: '100%',
          justifyContent: 'space-between',
          boxShadow: isOpen ? '0 0 0 2px var(--brand-blue-alpha)' : 'none',
        }}
        className="hover:border-blue-400"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-primary)',
            fontSize: '1rem'
          }}>
            {localeFlags[locale]}
          </div>
          <span style={{ fontWeight: 600 }}>{isMobile ? locale.toUpperCase() : localeNames[locale]}</span>
        </div>
        <span style={{
          fontSize: '0.7rem',
          opacity: 0.5,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '110%',
            left: 0,
            right: 0,
            marginBottom: '0.5rem',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'slideUp 0.2s ease-out'
          }}
        >
          {locales.map((loc) => {
            const isSelected = locale === loc;
            return (
              <button
                key={loc}
                onClick={() => handleLocaleChange(loc)}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  textAlign: 'left',
                  border: 'none',
                  backgroundColor: isSelected ? 'var(--brand-blue)' : 'transparent',
                  color: isSelected ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: isSelected ? 600 : 500,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{localeFlags[loc]}</span>
                <span>{localeNames[loc]}</span>
                {isSelected && <span style={{ marginLeft: 'auto', fontSize: '10px' }}>●</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

