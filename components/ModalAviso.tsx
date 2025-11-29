'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Aviso } from '@/types';
import { formatFecha, getWhatsAppUrl, copiarLink, compartirNativo } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  IconClose,
  IconArrowLeft,
  IconArrowRight,
  IconCopy,
  IconShare,
  IconWhatsApp,
  IconCheck,
  IconLocation,
  IconCalendar,
  IconEmpleos,
  IconInmuebles,
  IconVehiculos,
  IconServicios,
  IconProductos,
  IconEventos,
  IconNegocios,
  IconComunidad
} from './Icons';
import { Categoria } from '@/types';

interface ModalAvisoProps {
  aviso: Aviso;
  onCerrar: () => void;
  onAnterior: () => void;
  onSiguiente: () => void;
  puedeAnterior: boolean;
  puedeSiguiente: boolean;
}

export default function ModalAviso({
  aviso,
  onCerrar,
  onAnterior,
  onSiguiente,
  puedeAnterior,
  puedeSiguiente
}: ModalAvisoProps) {
  const [copiado, setCopiado] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const minSwipeDistance = 50;

  const getCategoriaIcon = (categoria: Categoria) => {
    const iconMap: Record<Categoria, React.ComponentType> = {
      empleos: IconEmpleos,
      inmuebles: IconInmuebles,
      vehiculos: IconVehiculos,
      servicios: IconServicios,
      productos: IconProductos,
      eventos: IconEventos,
      negocios: IconNegocios,
      comunidad: IconComunidad,
    };
    return iconMap[categoria];
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCerrar();
      } else if (e.key === 'ArrowLeft' && puedeAnterior) {
        onAnterior();
      } else if (e.key === 'ArrowRight' && puedeSiguiente) {
        onSiguiente();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCerrar, onAnterior, onSiguiente, puedeAnterior, puedeSiguiente]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && puedeSiguiente) {
      onSiguiente();
    } else if (isRightSwipe && puedeAnterior) {
      onAnterior();
    }
  };

  const handleCopiarLink = async () => {
    await copiarLink(aviso.id);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleCompartir = async () => {
    await compartirNativo(aviso.id, aviso.titulo);
  };

  const handleContactar = () => {
    window.open(getWhatsAppUrl(aviso.contacto, aviso.titulo, aviso.categoria, aviso.id), '_blank');
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: isDesktop ? 'auto' : 0,
    width: isDesktop ? '420px' : '100%',
    backgroundColor: isDesktop ? 'transparent' : 'rgba(0, 0, 0, 0.3)',
    zIndex: 1500,
    display: 'flex',
    alignItems: isDesktop ? 'stretch' : 'flex-end',
    justifyContent: isDesktop ? 'flex-end' : 'center',
    pointerEvents: 'none'
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-primary)',
    borderRadius: isDesktop ? '0' : '16px 16px 0 0',
    padding: '1.5rem',
    paddingBottom: (puedeAnterior || puedeSiguiente) ? '5rem' : '1.5rem',
    width: isDesktop ? '420px' : '100%',
    maxWidth: isDesktop ? '90vw' : '100%',
    maxHeight: isDesktop ? '100vh' : '85vh',
    overflowY: 'auto' as const,
    position: 'relative',
    boxShadow: isDesktop ? '-4px 0 20px var(--shadow)' : '0 -4px 20px var(--shadow)',
    ...(isDesktop && { borderLeft: '1px solid var(--border-color)' })
  };

  return (
    <div
      style={overlayStyle}
      onClick={isDesktop ? undefined : onCerrar}
    >
      <div
        ref={modalRef}
        style={{ ...modalContentStyle, pointerEvents: 'auto' }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <button
          onClick={onCerrar}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: '0.5rem',
            lineHeight: 1,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <IconClose />
        </button>

        <div style={{ marginBottom: '1rem' }}>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)',
              textTransform: 'capitalize',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            {React.createElement(getCategoriaIcon(aviso.categoria))}
            {aviso.categoria}
          </div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            lineHeight: 1.3,
            paddingRight: '2.5rem'
          }}>
            {aviso.titulo}
          </h2>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginBottom: '1rem',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap'
          }}>
            {aviso.descripcion}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <IconLocation />
              <span>
                <strong style={{ color: 'var(--text-primary)' }}>Ubicación:</strong> {aviso.ubicacion}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <IconCalendar />
              <span>
                <strong style={{ color: 'var(--text-primary)' }}>Publicado:</strong>{' '}
                {formatFecha(aviso.fechaPublicacion, aviso.horaPublicacion)}
              </span>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <button
            onClick={handleContactar}
            style={{
              width: '100%',
              padding: '0.875rem',
              fontSize: '1rem',
              fontWeight: 600,
              backgroundColor: '#25D366',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <IconWhatsApp />
            Contactar por WhatsApp
          </button>
          <div style={{
            display: 'flex',
            gap: '0.75rem'
          }}>
            <button
              onClick={handleCopiarLink}
              style={{
                flex: 1,
                padding: '0.75rem',
                fontSize: '0.875rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
              }}
            >
              {copiado ? <IconCheck /> : <IconCopy />}
              {copiado ? 'Copiado' : 'Copiar link'}
            </button>
            <button
              onClick={handleCompartir}
              style={{
                flex: 1,
                padding: '0.75rem',
                fontSize: '0.875rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
              }}
            >
              <IconShare />
              Compartir
            </button>
          </div>
        </div>

        {/* Botones de navegación abajo */}
        {(puedeAnterior || puedeSiguiente) && (
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1.5rem',
            right: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
            zIndex: 10
          }}>
            <button
              onClick={onAnterior}
              disabled={!puedeAnterior}
              style={{
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '50%',
                backgroundColor: puedeAnterior ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                color: puedeAnterior ? 'var(--text-primary)' : 'var(--text-tertiary)',
                cursor: puedeAnterior ? 'pointer' : 'not-allowed',
                opacity: puedeAnterior ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (puedeAnterior) {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (puedeAnterior) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                }
              }}
            >
              <IconArrowLeft />
            </button>
            <button
              onClick={onSiguiente}
              disabled={!puedeSiguiente}
              style={{
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '50%',
                backgroundColor: puedeSiguiente ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                color: puedeSiguiente ? 'var(--text-primary)' : 'var(--text-tertiary)',
                cursor: puedeSiguiente ? 'pointer' : 'not-allowed',
                opacity: puedeSiguiente ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (puedeSiguiente) {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (puedeSiguiente) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                }
              }}
            >
              <IconArrowRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
