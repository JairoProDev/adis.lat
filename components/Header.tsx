'use client';

import { useState } from 'react';
import {
  FaBars,
  FaBell,
  FaFacebookMessenger,
  FaCog,
  FaChartLine
} from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import UserMenu from './UserMenu';
import { useTranslation } from '@/hooks/useTranslation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SeccionSidebar } from './SidebarDesktop';
import {
  IconAdiso,
  IconMap,
  IconMegaphone,
  IconStore,
  IconGratuitos
} from './Icons';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  onChangelogClick?: () => void;
  seccionActiva?: SeccionSidebar;
  onSeccionChange?: (seccion: SeccionSidebar) => void;
  onToggleLeftSidebar?: () => void;
}

export default function Header({
  onChangelogClick,
  seccionActiva,
  onSeccionChange,
  onToggleLeftSidebar
}: HeaderProps) {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<SeccionSidebar | null>(null);
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const navItems = [
    { id: 'adiso' as SeccionSidebar, icon: IconAdiso, label: 'Inicio' },
    { id: 'gratuitos' as SeccionSidebar, icon: IconGratuitos, label: 'Gratuitos' },
    { id: 'publicar' as SeccionSidebar, icon: IconMegaphone, label: 'Publicar' },
    { id: 'mapa' as SeccionSidebar, icon: IconMap, label: 'Mapa' },
    { id: 'negocio' as SeccionSidebar, icon: IconStore, label: 'Negocio' },
  ];

  return (
    <header style={{
      backgroundColor: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-color)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      height: '72px', // Increased height for labels
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      padding: '0 1rem',
    }}>
      {/* LEFT: Hamburger + Logo */}
      <div style={{ display: 'flex', alignItems: 'center', minWidth: isDesktop ? '280px' : 'auto' }}>
        <button
          onClick={onToggleLeftSidebar}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            color: 'var(--text-secondary)',
            marginRight: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <FaBars size={22} />
        </button>

        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            fontWeight: 900,
            fontSize: '28px',
            color: 'var(--brand-blue)',
            letterSpacing: '-1px'
          }}>
            Buscadis
          </span>
        </a>
      </div>

      {/* CENTER: Navigation (Desktop Only) */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', height: '100%' }}>
        {isDesktop && onSeccionChange && (
          <div style={{ display: 'flex', gap: '8px', height: '100%' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = seccionActiva === item.id;
              const isHovered = hoveredItem === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'negocio') {
                      window.location.href = '/mi-negocio';
                      return;
                    }
                    onSeccionChange(item.id);
                  }}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    height: '100%',
                    padding: '0 24px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isActive ? 'var(--brand-blue)' : (isHovered ? 'var(--brand-blue)' : 'var(--text-secondary)'),
                    transition: 'all 0.2s ease',
                  }}
                  className="group"
                >
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '28px',
                    marginBottom: '2px',
                    transition: 'transform 0.2s',
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)'
                  }}>
                    <Icon size={24} color={isActive || isHovered ? 'var(--brand-blue)' : undefined} />
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: isActive ? 600 : 500,
                    opacity: isActive || isHovered ? 1 : 0.8
                  }}>
                    {item.label}
                  </span>

                  {/* Active Indicator Line */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    backgroundColor: 'var(--brand-blue)',
                    opacity: isActive ? 1 : 0,
                    transition: 'opacity 0.2s',
                    borderTopLeftRadius: '3px',
                    borderTopRightRadius: '3px'
                  }} />

                  {/* Hover background effect (optional, subtle) */}
                  <div style={{
                    position: 'absolute',
                    inset: '4px',
                    backgroundColor: isHovered && !isActive ? 'var(--hover-bg)' : 'transparent',
                    borderRadius: '8px',
                    zIndex: -1,
                    transition: 'background-color 0.2s'
                  }} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: isDesktop ? '280px' : 'auto', gap: '8px' }}>
        {isAuthenticated && ( // Only show these actions if logged in
          <>
            {/* Helper Action: Changelog */}
            {onChangelogClick && isDesktop && (
              <button
                onClick={onChangelogClick}
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  cursor: 'pointer'
                }}
                className="hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors hover:text-[var(--brand-blue)]"
                title={t('header.progress')}
              >
                <FaChartLine size={18} />
              </button>
            )}

            {/* Notifications */}
            <button
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer'
              }}
              className="hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors hover:text-[var(--brand-blue)]"
            >
              <FaBell size={18} />
            </button>

            {/* Messages */}
            <button
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer'
              }}
              className="hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors hover:text-[var(--brand-blue)]"
            >
              <FaFacebookMessenger size={18} />
            </button>
          </>
        )}

        {/* User Profile - Will handle Login button internally if no user */}
        <UserMenu
          onProgressClick={onChangelogClick}
          showExtras={false} // Pass prop to control extras visibility from UserMenu if needed, but doing it here is cleaner if we had access to auth state.
        // However, UserMenu handles auth state internally. We can modify UserMenu to accept children or expose state,
        // OR we just import useAuth here. Let's import useAuth in the file header first.
        />

        {/* Mobile Settings Toggle */}
        {!isDesktop && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMobileSettings(!showMobileSettings)}
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <FaCog size={18} />
            </button>
            {showMobileSettings && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setShowMobileSettings(false)} />
                <div style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  background: 'var(--bg-primary)',
                  padding: '1rem',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 999,
                  border: '1px solid var(--border-color)',
                  minWidth: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <LanguageSelector />
                  <ThemeToggle />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
