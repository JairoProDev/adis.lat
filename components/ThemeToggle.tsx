'use client';

import { useEffect, useState } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [mounted, setMounted] = useState(false);

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
  };

  if (!mounted) {
    return null; // Evitar flash de contenido incorrecto
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
    }}>
      <button
        onClick={() => handleThemeChange('light')}
        aria-label="Modo claro"
        style={{
          padding: '0.5rem',
          border: 'none',
          background: theme === 'light' ? 'var(--text-primary)' : 'transparent',
          color: theme === 'light' ? 'var(--bg-primary)' : 'var(--text-secondary)',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (theme !== 'light') {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
          }
        }}
        onMouseLeave={(e) => {
          if (theme !== 'light') {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <FaSun size={16} aria-hidden="true" />
      </button>
      <button
        onClick={() => handleThemeChange('auto')}
        aria-label="Modo automático"
        style={{
          padding: '0.5rem',
          border: 'none',
          background: theme === 'auto' ? 'var(--text-primary)' : 'transparent',
          color: theme === 'auto' ? 'var(--bg-primary)' : 'var(--text-secondary)',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
        onMouseEnter={(e) => {
          if (theme !== 'auto') {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
          }
        }}
        onMouseLeave={(e) => {
          if (theme !== 'auto') {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        A
      </button>
      <button
        onClick={() => handleThemeChange('dark')}
        aria-label="Modo oscuro"
        style={{
          padding: '0.5rem',
          border: 'none',
          background: theme === 'dark' ? 'var(--text-primary)' : 'transparent',
          color: theme === 'dark' ? 'var(--bg-primary)' : 'var(--text-secondary)',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (theme !== 'dark') {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
          }
        }}
        onMouseLeave={(e) => {
          if (theme !== 'dark') {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <FaMoon size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

