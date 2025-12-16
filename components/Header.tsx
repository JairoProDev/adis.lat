'use client';

import { useState } from 'react';
import { FaChartLine, FaCog } from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import UserMenu from './UserMenu';
import { useTranslation } from '@/hooks/useTranslation';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface HeaderProps {
  onChangelogClick?: () => void;
}

export default function Header({ onChangelogClick }: HeaderProps) {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  return (
    <header style={{
      backgroundColor: 'var(--bg-primary)', // Solid background for better contrast
      borderBottom: '1px solid var(--border-color)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)', // Sutil separación suggested by user
      padding: isDesktop ? '1rem 1.5rem' : '1rem 1.25rem', // increased padding
      paddingRight: isDesktop ? 'calc(var(--sidebar-width, 60px) + 1.5rem)' : '1.25rem',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto',
        gap: '1rem'
      }}>
        <a
          href="/"
          style={{
            textDecoration: 'none',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          <h1
            className="text-[#1e40af] dark:text-blue-400"
            style={{
              fontSize: isDesktop ? '1.75rem' : '1.5rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.2,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {t('header.title')}
          </h1>
        </a>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexShrink: 0
        }}>
          <UserMenu onProgressClick={onChangelogClick} />

          {isDesktop ? (
            <>
              <LanguageSelector />
              <ThemeToggle />
            </>
          ) : (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMobileSettings(!showMobileSettings)}
                className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                style={{
                  border: 'none',
                  borderRadius: '8px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <FaCog size={18} />
              </button>

              {showMobileSettings && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                    onClick={() => setShowMobileSettings(false)}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    marginTop: '0.5rem',
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border-color)',
                    padding: '0.75rem',
                    zIndex: 999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    minWidth: '160px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Idioma</span>
                      <LanguageSelector />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tema</span>
                      <ThemeToggle />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {onChangelogClick && isDesktop && (
            <button
              onClick={onChangelogClick}
              aria-label={t('header.progress')}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.625rem 1rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'nowrap',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                e.currentTarget.style.color = 'var(--accent-color)';
                e.currentTarget.style.borderColor = 'var(--accent-color)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <FaChartLine size={14} aria-hidden="true" />
              {t('header.progress')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
