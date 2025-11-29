'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes, FaRocket, FaCheckCircle, FaBug, FaStar, FaCog, FaLightbulb, FaExclamationTriangle, FaArrowLeft, FaHeart } from 'react-icons/fa';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { enviarFeedbackInmediato, enviarFeedbacksAAPI } from '@/lib/feedback';

interface ProgresoEntry {
  version: string;
  date: string;
  time: string;
  type: 'feature' | 'improvement' | 'fix' | 'ui';
  title: string;
  description: string;
  userBenefits: string[];
  technicalDetails: string[];
  impact: 'major' | 'minor' | 'patch';
}

const progresoData: ProgresoEntry[] = [
  {
    version: '1.3.0',
    date: '2025-11-29',
    time: '09:48',
    type: 'feature',
    title: 'Sistema de Notificaciones y Validación Avanzada',
    description: 'Implementación de sistema de notificaciones toast y validación en tiempo real del formulario',
    userBenefits: [
      'Notificaciones elegantes en lugar de ventanas emergentes molestas',
      'Validación instantánea mientras escribes (sin esperar a enviar)',
      'Contadores visibles para saber cuántos caracteres puedes usar',
      'Formato automático del teléfono para evitar errores',
      'Mensajes claros cuando algo está mal',
    ],
    technicalDetails: [
      'Sistema de notificaciones toast profesional (reemplazo de alerts)',
      'Validación en tiempo real con mensajes de error inline',
      'Contadores de caracteres visibles en todos los campos',
      'Formato automático de teléfono mientras se escribe',
      'Límites de caracteres: Título (100), Descripción (1000), Ubicación (100)',
      'Validación de formato de teléfono (mínimo 8 dígitos)',
    ],
    impact: 'major'
  },
  {
    version: '1.2.0',
    date: '2025-11-29',
    time: '08:30',
    type: 'feature',
    title: 'Ordenamiento y Contador de Resultados',
    description: 'Nuevas funcionalidades para mejorar la experiencia de búsqueda',
    userBenefits: [
      'Ordena los avisos como prefieras (más nuevos o más antiguos)',
      'Ve cuántos avisos encontraste de un vistazo',
      'Búsqueda más rápida y fluida',
    ],
    technicalDetails: [
      'Ordenamiento por fecha: Más recientes / Más antiguos',
      'Contador de resultados con información contextual',
      'Debounce en búsqueda (300ms) para mejor rendimiento',
      'Interfaz unificada para contador y ordenamiento',
    ],
    impact: 'minor'
  },
  {
    version: '1.1.0',
    date: '2025-11-29',
    time: '07:15',
    type: 'ui',
    title: 'Iconografía Profesional',
    description: 'Actualización completa del sistema de iconos',
    userBenefits: [
      'Iconos más claros y fáciles de reconocer',
      'Diseño más profesional y moderno',
      'Mejor identificación visual de cada categoría',
    ],
    technicalDetails: [
      'Migración a react-icons con Font Awesome',
      'Iconos únicos y reconocibles para cada categoría',
      'Iconos en todos los campos del formulario',
      'Iconos de navegación, acciones y estados',
      'Diseño consistente en toda la aplicación',
    ],
    impact: 'minor'
  },
  {
    version: '1.0.1',
    date: '2025-11-29',
    time: '06:45',
    type: 'fix',
    title: 'Corrección de Ordenamiento',
    description: 'Arreglo del sistema de ordenamiento que no funcionaba correctamente',
    userBenefits: [
      'El ordenamiento ahora funciona correctamente',
    ],
    technicalDetails: [
      'Corrección de lógica de ordenamiento en useEffect',
      'Aplicación correcta de sort antes de mostrar resultados',
    ],
    impact: 'patch'
  },
  {
    version: '1.0.0',
    date: '2025-11-28',
    time: '16:00',
    type: 'feature',
    title: 'Lanzamiento Inicial - MVP Completo',
    description: 'Primera versión funcional de buscadis.com',
    userBenefits: [
      'Publica tus avisos de forma rápida y sencilla',
      'Busca entre todos los avisos en tiempo real',
      'Filtra por categoría para encontrar exactamente lo que buscas',
      'Navega entre avisos fácilmente (teclado, botones o deslizando)',
      'Comparte avisos por WhatsApp con un solo clic',
      'Diseño limpio y fácil de usar',
      'Funciona perfecto en móvil y computadora',
    ],
    technicalDetails: [
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
    ],
    impact: 'major'
  }
];

export default function ProgresoPage() {
  const router = useRouter();
  const { toasts, removeToast, success } = useToast();
  
  // Enviar feedbacks pendientes periódicamente (cada 30 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      enviarFeedbacksAAPI();
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  const [mostrarFeedback, setMostrarFeedback] = useState(false);
  const [feedbackTipo, setFeedbackTipo] = useState<'sugerencia' | 'problema'>('sugerencia');
  const [feedbackTexto, setFeedbackTexto] = useState('');
  const [enviado, setEnviado] = useState(false);

  const getTypeIcon = (type: ProgresoEntry['type']) => {
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

  const getTypeLabel = (type: ProgresoEntry['type']) => {
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

  const getImpactBadge = (impact: ProgresoEntry['impact']) => {
    const styles = {
      major: { bg: '#3b82f6', label: 'Mayor' },
      minor: { bg: '#10b981', label: 'Menor' },
      patch: { bg: '#6b7280', label: 'Parche' }
    };
    const style = styles[impact];
    return (
      <span style={{
        fontSize: '0.75rem',
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        backgroundColor: style.bg,
        color: 'white',
        fontWeight: 500
      }}>
        {style.label}
      </span>
    );
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackTexto.trim()) return;
    
    setEnviado(true);
    
    // Intentar enviar inmediatamente
    const enviado = await enviarFeedbackInmediato({
      tipo: feedbackTipo,
      texto: feedbackTexto.trim()
    });

    if (enviado) {
      success('¡Gracias por tu feedback! Lo revisaremos pronto.');
    } else {
      success('¡Gracias por tu feedback! Se guardó localmente y se enviará pronto.');
    }
    
    setTimeout(() => {
      setFeedbackTexto('');
      setMostrarFeedback(false);
      setEnviado(false);
      setFeedbackTipo('sugerencia');
    }, 2000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)' }}>
      <Header />
      <main style={{
        flex: 1,
        padding: '2rem 1rem',
        maxWidth: '1000px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Header de la página */}
        <div style={{
          marginBottom: '3rem',
          textAlign: 'center'
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              background: 'none',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '0.5rem 1rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <FaArrowLeft size={14} />
            Volver al inicio
          </button>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            Nuestro Progreso
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Registro de nuestras mejoras continuas, avances e implementaciones. 
            Cada día trabajamos para hacer buscadis.com mejor para ti.
          </p>
        </div>

        {/* Botón de Feedback */}
        <div style={{
          marginBottom: '3rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setMostrarFeedback(true)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-primary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <FaLightbulb size={16} />
            Sugerir una mejora
          </button>
          <button
            onClick={() => {
              setFeedbackTipo('problema');
              setMostrarFeedback(true);
            }}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
            }}
          >
            <FaExclamationTriangle size={16} />
            Reportar un problema
          </button>
        </div>

        {/* Entradas de Progreso */}
        <div>
          {progresoData.map((entry, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem',
                border: '1px solid var(--border-color)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}
            >
              {/* Header de entrada */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  flexShrink: 0
                }}>
                  {getTypeIcon(entry.type)}
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <h2 style={{
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: 0
                    }}>
                      {entry.title}
                    </h2>
                    <span style={{
                      fontSize: '0.875rem',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontFamily: 'monospace'
                    }}>
                      v{entry.version}
                    </span>
                    {getImpactBadge(entry.impact)}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)'
                    }}>
                      {new Date(`${entry.date}T${entry.time}`).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} a las {entry.time}
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
                  <p style={{
                    fontSize: '0.9375rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    margin: 0
                  }}>
                    {entry.description}
                  </p>
                </div>
              </div>

              {/* Beneficios para el usuario */}
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                borderLeft: '4px solid #10b981'
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FaHeart size={14} color="#10b981" />
                  Beneficios para ti
                </h3>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {entry.userBenefits.map((benefit, i) => (
                    <li key={i} style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem',
                      paddingLeft: '1.5rem',
                      position: 'relative',
                      lineHeight: 1.6
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        color: '#10b981'
                      }}>
                        ✓
                      </span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Detalles técnicos */}
              <details style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1rem'
              }}>
                <summary style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}>
                  Detalles técnicos (para desarrolladores)
                </summary>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '1rem 0 0 0'
                }}>
                  {entry.technicalDetails.map((detail, i) => (
                    <li key={i} style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem',
                      paddingLeft: '1.5rem',
                      position: 'relative',
                      lineHeight: 1.6
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        color: 'var(--text-tertiary)'
                      }}>
                        •
                      </span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
      </main>

      {/* Modal de Feedback */}
      {mostrarFeedback && (
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
            padding: '1rem'
          }}
          onClick={() => !enviado && setMostrarFeedback(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '12px',
              padding: '2rem',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!enviado ? (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    {feedbackTipo === 'problema' ? '🚨 Reportar un problema' : '✨ Sugerir una mejora'}
                  </h3>
                  <button
                    onClick={() => setMostrarFeedback(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '1rem',
                  lineHeight: 1.6
                }}>
                  {feedbackTipo === 'problema'
                    ? 'Ayúdanos a mejorar reportando cualquier problema que encuentres.'
                    : 'Tu opinión es valiosa. ¿Qué te gustaría ver en la plataforma?'
                  }
                </p>

                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  {(['sugerencia', 'problema'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFeedbackTipo(t)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: `1px solid ${feedbackTipo === t ? 'var(--text-primary)' : 'var(--border-color)'}`,
                        backgroundColor: feedbackTipo === t ? 'var(--text-primary)' : 'var(--bg-primary)',
                        color: feedbackTipo === t ? 'var(--bg-primary)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        transition: 'all 0.2s'
                      }}
                    >
                      {t === 'sugerencia' ? '💡 Sugerencia' : '🚨 Problema'}
                    </button>
                  ))}
                </div>

                <textarea
                  value={feedbackTexto}
                  onChange={(e) => setFeedbackTexto(e.target.value)}
                  placeholder={feedbackTipo === 'problema' 
                    ? 'Describe el problema que encontraste...' 
                    : 'Cuéntanos tu sugerencia...'}
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    marginBottom: '1rem'
                  }}
                />
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => setMostrarFeedback(false)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={!feedbackTexto.trim()}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: feedbackTexto.trim() ? 'var(--text-primary)' : 'var(--bg-secondary)',
                      color: feedbackTexto.trim() ? 'var(--bg-primary)' : 'var(--text-tertiary)',
                      cursor: feedbackTexto.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    Enviar
                  </button>
                </div>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '2rem 0'
              }}>
                <FaCheckCircle size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  ¡Gracias!
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  Tu feedback ha sido guardado. Lo revisaremos pronto.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

