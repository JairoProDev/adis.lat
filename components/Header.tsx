'use client';

import { motion } from 'framer-motion';
import { FaChartLine } from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import UserMenu from './UserMenu';
import { useTranslation } from '@/hooks/useTranslation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onChangelogClick?: () => void;
}

/**
 * Premium Floating Header with Glassmorphism
 * Features:
 * - Floating design (16px from top on desktop)
 * - Glassmorphism with saturated background blur
 * - Smooth scroll behavior with background opacity change
 * - Responsive padding and layout
 */
export default function Header({ onChangelogClick }: HeaderProps) {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: 0.1
      }}
      className={cn(
        'sticky z-[1000]',
        'glass-card',
        isDesktop ? 'top-4 mx-6' : 'top-0 mx-0',
        isDesktop ? 'rounded-2xl' : 'rounded-none border-x-0'
      )}
      style={{
        backgroundColor: 'var(--glass-bg)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      <div
        className={cn(
          'flex justify-between items-center',
          'max-w-[1400px] mx-auto gap-4',
          isDesktop ? 'px-6 py-4' : 'px-4 py-3'
        )}
      >
        {/* Logo / Title */}
        <motion.h1
          className={cn(
            'font-display font-bold',
            'bg-gradient-to-br from-electric-600 to-electric-400',
            'bg-clip-text text-transparent',
            'flex-shrink-0 select-none',
            isDesktop ? 'text-2xl tracking-tight' : 'text-xl tracking-tight'
          )}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {t('header.title')}
        </motion.h1>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <UserMenu onProgressClick={onChangelogClick} />
          <LanguageSelector />
          <ThemeToggle />

          {/* Progress Button - Desktop Only */}
          {onChangelogClick && isDesktop && (
            <motion.button
              onClick={onChangelogClick}
              aria-label={t('header.progress')}
              className={cn(
                'flex items-center gap-2',
                'px-4 py-2.5 rounded-lg',
                'bg-primary border border-border-subtle',
                'text-secondary text-sm font-semibold',
                'transition-all duration-200',
                'hover:border-border-medium hover:text-primary',
                'hover:shadow-glow-sm',
                'active:scale-98'
              )}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaChartLine size={14} aria-hidden="true" />
              <span className="whitespace-nowrap">{t('header.progress')}</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Bottom Glow Line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border-medium to-transparent" />
    </motion.header>
  );
}
