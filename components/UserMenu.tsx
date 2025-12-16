'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import AuthModal from './AuthModal';
import FavoritosList from './FavoritosList';
import LocationPrompt from './LocationPrompt';
import ConvertirAnunciante from './ConvertirAnunciante';
import UserProfile from './UserProfile';
import { IconClose } from './Icons';
import { FaChartLine } from 'react-icons/fa';
import { useTranslation } from '@/hooks/useTranslation';

interface UserMenuProps {
  onProgressClick?: () => void;
}

export default function UserMenu({ onProgressClick }: UserMenuProps) {
  const { user, signOut, refreshProfile } = useAuth();
  const { profile, isAnunciante, isVerificado } = useUser();
  const { t } = useTranslation();
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [mostrarAuthModal, setMostrarAuthModal] = useState(false);
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false);
  const [mostrarLocationPrompt, setMostrarLocationPrompt] = useState(false);
  const [mostrarConvertirAnunciante, setMostrarConvertirAnunciante] = useState(false);
  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMostrarMenu(false);
      }
    };

    if (mostrarMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarMenu]);

  const handleSignOut = async () => {
    await signOut();
    setMostrarMenu(false);
  };

  const nombreCompleto = profile
    ? `${profile.nombre || ''} ${profile.apellido || ''}`.trim() || profile.email || 'Usuario'
    : user?.email || 'Usuario';

  const iniciales = nombreCompleto
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  if (!user) {
    return (
      <>
        <button
          onClick={() => setMostrarAuthModal(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold shadow-sm transition-colors text-sm"
        >
          Ingresar
        </button>
        <AuthModal abierto={mostrarAuthModal} onCerrar={() => setMostrarAuthModal(false)} />
      </>
    );
  }

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setMostrarMenu(!mostrarMenu)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem',
          border: '1px solid var(--border-color)',
          borderRadius: '50%',
          cursor: 'pointer',
          width: '40px',
          height: '40px',
          justifyContent: 'center',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          backgroundColor: profile?.avatar_url ? 'transparent' : 'var(--bg-secondary)'
        }}
        aria-label="Menú de usuario"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={nombreCompleto}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <span>{iniciales}</span>
        )}
      </button>

      {mostrarMenu && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            right: 0,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            minWidth: '200px',
            zIndex: 1000,
            padding: '0.5rem'
          }}
        >
          {/* Header del menú */}
          <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {nombreCompleto}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {user.email}
            </div>
            {isVerificado && (
              <div style={{ fontSize: '0.7rem', color: '#22c55e', marginTop: '0.25rem' }}>
                ✓ Verificado
              </div>
            )}
            {isAnunciante && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-primary)', marginTop: '0.25rem', fontWeight: 600 }}>
                📢 Anunciante
              </div>
            )}
          </div>

          {/* Opciones del menú */}
          <div style={{ padding: '0.25rem' }}>
            <button
              onClick={() => {
                setMostrarMenu(false);
                setMostrarPerfil(true);
              }}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              👤 Mi Perfil
            </button>
            <button
              onClick={() => {
                setMostrarMenu(false);
                setMostrarFavoritos(true);
              }}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ⭐ Favoritos
            </button>
            {onProgressClick && (
              <button
                onClick={() => {
                  setMostrarMenu(false);
                  onProgressClick();
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <FaChartLine size={14} aria-hidden="true" />
                {t('header.progress')}
              </button>
            )}
            <button
              onClick={() => {
                setMostrarMenu(false);
                // TODO: Navegar a configuración
              }}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ⚙️ Configuración
            </button>
            {!isAnunciante && (
              <button
                onClick={() => {
                  setMostrarMenu(false);
                  setMostrarConvertirAnunciante(true);
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  borderRadius: '4px',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                📢 Convertirse en Anunciante
              </button>
            )}
            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.5rem 0' }} />
            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '0.875rem',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
      <FavoritosList abierto={mostrarFavoritos} onCerrar={() => setMostrarFavoritos(false)} />
      <LocationPrompt
        abierto={mostrarLocationPrompt}
        onCerrar={() => setMostrarLocationPrompt(false)}
        onAceptar={() => {
          // Refrescar perfil después de guardar ubicación
          refreshProfile();
        }}
      />
      <ConvertirAnunciante
        abierto={mostrarConvertirAnunciante}
        onCerrar={() => setMostrarConvertirAnunciante(false)}
        onExito={() => {
          // Mostrar mensaje de éxito o actualizar UI
        }}
      />
      <UserProfile
        abierto={mostrarPerfil}
        onCerrar={() => setMostrarPerfil(false)}
      />
    </div>
  );
}

