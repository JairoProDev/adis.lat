'use client';

import { useState } from 'react';
import { FaTimes, FaRocket, FaCheckCircle, FaBug, FaStar, FaCog, FaMobile, FaDesktop } from 'react-icons/fa';

interface ChangelogEntry {
  version: string;
  date: string;
  type: 'feature' | 'improvement' | 'fix' | 'ui';
  title: string;
  description: string;
  items: string[];
}

const changelogData: ChangelogEntry[] = [
  {
    version: '1.3.0',
    date: '2024-12-29',
    type: 'feature',
    title: 'Sistema de Notificaciones y Validación Avanzada',
    description: 'Implementación de sistema de notificaciones toast y validación en tiempo real del formulario',
    items: [
      'Sistema de notificaciones toast profesional (reemplazo de alerts)',
      'Validación en tiempo real con mensajes de error inline',
      'Contadores de caracteres visibles en todos los campos',
      'Formato automático de teléfono mientras se escribe',
      'Límites de caracteres: Título (100), Descripción (1000), Ubicación (100)',
      'Validación de formato de teléfono (mínimo 8 dígitos)',
    ]
  },
  {
    version: '1.2.0',
    date: '2024-12-29',
    type: 'feature',
    title: 'Ordenamiento y Contador de Resultados',
    description: 'Nuevas funcionalidades para mejorar la experiencia de búsqueda',
    items: [
      'Ordenamiento por fecha: Más recientes / Más antiguos',
      'Contador de resultados con información contextual',
      'Debounce en búsqueda (300ms) para mejor rendimiento',
      'Interfaz unificada para contador y ordenamiento',
    ]
  },
  {
    version: '1.1.0',
    date: '2024-12-29',
    type: 'ui',
    title: 'Iconografía Profesional',
    description: 'Actualización completa del sistema de iconos',
    items: [
      'Migración a react-icons con Font Awesome',
      'Iconos únicos y reconocibles para cada categoría',
      'Iconos en todos los campos del formulario',
      'Iconos de navegación, acciones y estados',
      'Diseño consistente en toda la aplicación',
    ]
  },
  {
    version: '1.0.0',
    date: '2024-12-28',
    type: 'feature',
    title: 'Lanzamiento Inicial - MVP Completo',
    description: 'Primera versión funcional de buscadis.com',
    items: [
      'Sistema de publicación de avisos con categorías',
      'Búsqueda en tiempo real por título, descripción y ubicación',
      'Filtrado por categorías (8 categorías disponibles)',
      'Vista modal responsive (mobile y desktop)',
      'Navegación entre avisos con teclado, botones y swipe',
      'Compartir por WhatsApp con mensaje personalizado',
      'Compartir nativo y copiar link',
      'Integración con Supabase para persistencia de datos',
      'Sistema de cache local para carga instantánea',
      'Carga optimista para mejor UX',
      'Diseño minimalista en escala de grises',
      'Responsive design (2 columnas mobile, 4 desktop)',
    ]
  }
];

interface ChangelogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Changelog({ isOpen, onClose }: ChangelogProps) {
  if (!isOpen) return null;

  const getTypeIcon = (type: ChangelogEntry['type']) => {
    switch (type) {
      case 'feature':
        return <FaRocket size={18} color="#3b82f6" />;
      case 'improvement':
        return <FaStar size={18} color="#10b981" />;
      case 'fix':
        return <FaBug size={18} color="#ef4444" />;
      case 'ui':
        return <FaCog size={18} color="#f59e0b" />;
      default:
        return <FaCheckCircle size={18} color="#6b7280" />;
    }
  };

  const getTypeLabel = (type: ChangelogEntry['type']) => {
    switch (type) {
      case 'feature':
        return 'Nueva Funcionalidad';
      case 'improvement':
        return 'Mejora';
      case 'fix':
        return 'Corrección';
      case 'ui':
        return 'Interfaz';
      default:
        return 'Actualización';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '2rem 2rem 1rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--bg-primary)',
          zIndex: 10
        }}>
          <div>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.25rem'
            }}>
              Changelog
            </h2>
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)'
            }}>
              Historial de actualizaciones y mejoras
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '2rem' }}>
          {changelogData.map((entry, index) => (
            <div
              key={index}
              style={{
                marginBottom: index < changelogData.length - 1 ? '3rem' : '0',
                paddingBottom: index < changelogData.length - 1 ? '3rem' : '0',
                borderBottom: index < changelogData.length - 1 ? '1px solid var(--border-color)' : 'none'
              }}
            >
              {/* Version Header */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                  flexShrink: 0
                }}>
                  {getTypeIcon(entry.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}>
                      {entry.title}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      fontWeight: 500
                    }}>
                      v{entry.version}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)'
                    }}>
                      {getTypeLabel(entry.type)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem'
                  }}>
                    {new Date(entry.date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    marginBottom: '1rem'
                  }}>
                    {entry.description}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                marginLeft: '3rem'
              }}>
                {entry.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem',
                      paddingLeft: '1.5rem',
                      position: 'relative',
                      lineHeight: 1.6
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      color: 'var(--text-tertiary)'
                    }}>
                      •
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem 2rem',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            ¿Tienes sugerencias? Contáctanos a través de la plataforma
          </p>
        </div>
      </div>
    </div>
  );
}

