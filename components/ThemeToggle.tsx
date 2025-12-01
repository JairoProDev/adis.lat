'use client';

import { useEffect, useState, useRef } from 'react';
import { FaSun, FaMoon, FaDesktop } from 'react-icons/fa';

const themeOptions = [
  { value: 'light' as const, label: 'Claro', icon: FaSun },
  { value: 'auto' as const, label: 'Automático', icon: FaDesktop },
  { value: 'dark' as const, label: 'Oscuro', icon: FaMoon },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Leer preferencia guardada
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Detectar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme('auto');
      applyTheme('auto');
    }

    // Escuchar cambios en la preferencia del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null || 'auto';
      if (currentTheme === 'auto') {
        applyTheme('auto');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

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

  const applyTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    const root = document.documentElement;
    root.classList.remove('light-mode', 'dark-mode');

    if (newTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark-mode');
      } else {
        root.classList.add('light-mode');
      }
    } else if (newTheme === 'dark') {
      root.classList.add('dark-mode');
    } else {
      root.classList.add('light-mode');
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    setIsOpen(false);
  };

  if (!mounted) {
    return null; // Evitar flash de contenido incorrecto
  }

  const currentOption = themeOptions.find(opt => opt.value === theme) || themeOptions[1];
  const CurrentIcon = currentOption.icon;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Cambiar tema"
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
        <CurrentIcon size={14} aria-hidden="true" />
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
          {themeOptions.map((option) => {
            const OptionIcon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => handleThemeChange(option.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  border: 'none',
                  backgroundColor: theme === option.value ? 'var(--text-primary)' : 'transparent',
                  color: theme === option.value ? 'var(--bg-primary)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.875rem',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (theme !== option.value) {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (theme !== option.value) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <OptionIcon size={14} aria-hidden="true" />
                <span>{option.label}</span>
                {theme === option.value && <span style={{ marginLeft: 'auto' }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

