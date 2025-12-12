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
      backgroundColor: 'color-mix(in srgb, var(--bg-primary) 95%, transparent)',
      borderBottom: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-sm)',
      padding: isDesktop ? '1rem 1.5rem' : '0.875rem 1rem',
      paddingRight: isDesktop ? 'calc(1.5rem + 80px)' : '1rem',
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
        <h1 style={{
          fontSize: isDesktop ? '1.5rem' : '1.375rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, var(--brand-blue) 0%, color-mix(in srgb, var(--brand-blue) 70%, var(--brand-yellow)) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.03em',
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
          <UserMenu onProgressClick={onChangelogClick} />
          <LanguageSelector />
          <ThemeToggle />
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
