'use client';

import React, { useState, useEffect } from 'react';
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
  IconGratuitos,
  IconLocation,
  IconGlobe,
  IconRobot,
  IconSearch
} from './Icons';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  onChangelogClick?: () => void;
  seccionActiva?: SeccionSidebar;
  onSeccionChange?: (seccion: SeccionSidebar) => void;
  onToggleLeftSidebar?: () => void;
  ubicacion?: string;
  onUbicacionClick?: () => void;
}

export default function Header({
  onChangelogClick,
  seccionActiva,
  onSeccionChange,
  onToggleLeftSidebar,
  ubicacion = 'Perú',
  onUbicacionClick
}: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    setMounted(true);
  }, []);

  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<SeccionSidebar | null>(null);
  const { user } = useAuth();
  const isAuthenticated = !!user;

  if (!mounted) return null;

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
      {/* LEFT: Logo + Location */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        minWidth: isDesktop ? '340px' : 'auto',
        gap: '12px'
      }}>
        <button
          onClick={onToggleLeftSidebar}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '10px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          className="hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          <FaBars size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a href="/" style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px'
          }}>
            <div style={{
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img
                src="/logo.png"
                alt="Buscadis"
                style={{
                  height: '100%',
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector('.logo-fallback')) {
                    const span = document.createElement('span');
                    span.className = 'logo-fallback';
                    span.innerText = 'ADIS.LAT';
                    span.style.fontWeight = '900';
                    span.style.fontSize = '1.2rem';
                    span.style.color = 'var(--brand-blue)';
                    span.style.letterSpacing = '-0.5px';
                    parent.appendChild(span);
                  }
                }}
              />
            </div>
          </a>

          {/* Separator */}
          {isDesktop && <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />}

          {onUbicacionClick && (
            <button
              onClick={onUbicacionClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: '1px solid transparent',
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: '8px',
                transition: 'all 0.2s',
                maxWidth: isDesktop ? '160px' : '120px',
                textAlign: 'left',
                outline: 'none'
              }}
              className="hover:bg-gray-100 dark:hover:bg-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700"
            >
              <div style={{
                color: 'var(--brand-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconLocation size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: '10px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: '1'
                }}>
                  Cerca de
                </span>
                <span style={{
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%'
                }}>
                  {ubicacion}
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* CENTER: Navigation (Desktop Only) */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', height: '100%' }}>
        {isDesktop && (
          <div style={{ display: 'flex', gap: '8px', height: '100%' }}>
            {[
              { id: 'feed', icon: IconGlobe, label: 'Feed', href: '/feed' },
              { id: 'adiso', icon: IconSearch, label: 'Buscar', href: '/' },
              { id: 'publicar', icon: IconMegaphone, label: 'Publicar', href: '/publicar' },
              { id: 'mapa', icon: IconMap, label: 'Mapa' },
              { id: 'chatbot', icon: IconRobot, label: 'Asistente', href: '/chat' },
            ].map((item) => {
              const Icon = item.icon;
              // Check if active based on prop OR current path (for href items)
              const isPathActive = typeof window !== 'undefined' && item.href && window.location.pathname === item.href;
              const isSectionActive = seccionActiva === item.id || (item.id === 'adiso' && seccionActiva === 'adiso'); // Maintain 'adiso' logic

              // Helper logic: 'adiso' corresponds to 'Buscar'/'Inicio' in terms of active section
              const isActive = (isPathActive && item.href !== '/') || (item.id === 'adiso' && window.location.pathname === '/' && seccionActiva !== 'mapa' && seccionActiva !== 'publicar') || (seccionActiva === item.id);

              const isHovered = hoveredItem === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.href) {
                      window.location.href = item.href;
                    } else if (onSeccionChange) {
                      onSeccionChange(item.id as SeccionSidebar);
                    }
                  }}
                  onMouseEnter={() => setHoveredItem(item.id as SeccionSidebar)}
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
                  <span style={{
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
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: isActive ? 600 : 500,
                    opacity: isActive || isHovered ? 1 : 0.8
                  }}>
                    {item.label}
                  </span>

                  {/* Active Indicator Line */}
                  <span style={{
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

                  {/* Hover background effect (subtle) */}
                  <span style={{
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
