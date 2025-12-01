'use client';

import { FaChartLine } from 'react-icons/fa';
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
  
  return (
    <header style={{
      backgroundColor: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-color)',
      padding: isDesktop ? '0.75rem 1.5rem' : '0.75rem 1rem',
      paddingRight: isDesktop ? 'calc(1.5rem + 80px)' : '1rem', // Espacio para sidebar minimizado (60px + margen)
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto',
        gap: '1rem'
      }}>
        <h1 style={{
          fontSize: isDesktop ? '1.375rem' : '1.25rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.025em',
          margin: 0,
          lineHeight: 1.2,
          flexShrink: 0
        }}>
          {t('header.title')}
        </h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexShrink: 0
        }}>
          <UserMenu />
          <LanguageSelector />
          <ThemeToggle />
          {onChangelogClick && (
            <button
              onClick={onChangelogClick}
              aria-label={t('header.progress')}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
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
