'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
import NotificationsPopover from './NotificationsPopover';
import MessagesPopover from './MessagesPopover';
import { useUI } from '@/contexts/UIContext';
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
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      if (window.innerWidth >= 768) {
        setHeaderVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (currentScrollY < 60) {
        setHeaderVisible(true);
      } else if (delta > 4) {
        setHeaderVisible(false);
      } else if (delta < -4) {
        setHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [activePopover, setActivePopover] = useState<'notifications' | 'messages' | null>(null);
  const [hoveredItem, setHoveredItem] = useState<SeccionSidebar | null>(null);
  const { user } = useAuth();
  const { openChat } = useUI();
  const isAuthenticated = !!user;

  if (!mounted) return null;

  return (
    <header style={{
      backgroundColor: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-color)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      height: '72px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      padding: '0 1rem',
      transform: headerVisible ? 'translateY(0)' : 'translateY(-100%)',
      transition: 'transform 0.3s ease',
    }}>
      {/* LEFT: Logo + Location */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        minWidth: isDesktop ? '340px' : 'auto',
        gap: '12px'
      }}>


        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: !isDesktop ? 'pointer' : 'default'
        }}
          onClick={() => {
            if (!isDesktop && onUbicacionClick) {
              onUbicacionClick();
            }
          }}
        >
          <a href={isDesktop ? "/" : undefined}
            onClick={(e) => {
              if (!isDesktop) {
                e.preventDefault();
              }
            }}
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px'
            }}>
            <div style={{
              height: isDesktop ? '42px' : '50px',
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
                    span.style.fontSize = isDesktop ? '1.2rem' : '1.4rem';
                    span.style.color = 'var(--brand-blue)';
                    span.style.letterSpacing = '-0.5px';
                    parent.appendChild(span);
                  }
                }}
              />
            </div>
          </a>

          {/* Separator - Desktop only */}
          {isDesktop && onUbicacionClick && <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />}

          {/* Location Button - Desktop only */}
          {isDesktop && onUbicacionClick && (
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
                maxWidth: '160px',
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
              { id: 'mapa', icon: IconMap, label: 'Mapa', href: '/mapa' },
              { id: 'chatbot', icon: IconRobot, label: 'Asistente', href: '/chat' },
            ].map((item) => {
              const Icon = item.icon;
              // Simple active check based on current path
              const isActive = (typeof window !== 'undefined' && (
                (item.href === '/' && window.location.pathname === '/' && !window.location.search.includes('seccion=')) ||
                (item.href !== '/' && window.location.pathname.startsWith(item.href || ''))
              ));

              const isHovered = hoveredItem === item.id;

              return (
                <Link
                  href={item.href || '#'}
                  key={item.id}
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
                    textDecoration: 'none'
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
                </Link>
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
            <div className="relative">
              <button
                onClick={() => setActivePopover(activePopover === 'notifications' ? null : 'notifications')}
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: activePopover === 'notifications' ? 'var(--bg-secondary-hover)' : 'var(--bg-secondary)',
                  color: activePopover === 'notifications' ? 'var(--brand-blue)' : 'var(--text-primary)',
                  border: 'none',
                  cursor: 'pointer'
                }}
                className="hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors hover:text-[var(--brand-blue)]"
              >
                <FaBell size={18} />
              </button>
              {activePopover === 'notifications' && (
                <NotificationsPopover onClose={() => setActivePopover(null)} />
              )}
            </div>

            {/* Messages */}
            <div className="relative">
              <button
                onClick={() => setActivePopover(activePopover === 'messages' ? null : 'messages')}
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: activePopover === 'messages' ? 'var(--bg-secondary-hover)' : 'var(--bg-secondary)',
                  color: activePopover === 'messages' ? 'var(--brand-blue)' : 'var(--text-primary)',
                  border: 'none',
                  cursor: 'pointer'
                }}
                className="hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors hover:text-[var(--brand-blue)]"
              >
                <FaFacebookMessenger size={18} />
              </button>
              {activePopover === 'messages' && (
                <MessagesPopover
                  onClose={() => setActivePopover(null)}
                  onOpenConversation={(id) => {
                    setActivePopover(null);
                    openChat(id);
                  }}
                />
              )}
            </div>
          </>
        )}

        {/* User Profile (Desktop & Mobile) */}
        <UserMenu
          onProgressClick={onChangelogClick}
          onSidebarToggle={onToggleLeftSidebar}
        />
      </div>
    </header>
  );
}
