'use client';

/**
 * ADIS AI - Tu Asistente de Búsqueda Personalizada
 * 
 * Componente mejorado con UX "Wow":
 * - Cero jerga técnica (adiós RAG/Semántica explícita)
 * - Tarjetas interactivas
 * - Animaciones fluidas
 * - Manejo robusto de errores y keys
 */

import React, { useState, useRef, useEffect } from 'react';
import { Adiso } from '@/types';
import { FaPaperPlane, FaSpinner, FaSearch, FaImage, FaMapMarkerAlt, FaTag } from 'react-icons/fa';
import { hybridSearch } from '@/actions/ai-search';
import Link from 'next/link';
import { nanoid } from 'nanoid';

interface Mensaje {
  id: string;
  tipo: 'usuario' | 'asistente';
  contenido: string;
  timestamp: Date;
  resultados?: Adiso[];
  component?: React.ReactNode;
}

interface ChatbotIAProps {
  onPublicar?: (adiso: Adiso) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export default function ChatbotIANew({ onPublicar, onError, onSuccess }: ChatbotIAProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: 'welcome-msg',
      tipo: 'asistente',
      contenido: '¡Hola! Soy tu asistente personal de ADIS 🤖\n\nEstoy aquí para ayudarte a encontrar exactamente lo que buscas o a publicar tus anuncios en segundos.\n\nSimplemente dime qué necesitas o sube una foto.',
      timestamp: new Date()
    }
  ]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const agregarMensaje = (tipo: 'usuario' | 'asistente', contenido: string, resultados?: Adiso[], component?: React.ReactNode) => {
    const nuevoMensaje: Mensaje = {
      id: nanoid(),
      tipo,
      contenido,
      timestamp: new Date(),
      resultados,
      component
    };
    setMensajes(prev => [...prev, nuevoMensaje]);
  };

  const procesarBusqueda = async (query: string) => {
    try {
      agregarMensaje('asistente', '🔍 Buscando las mejores opciones para ti...');

      const resultados = await hybridSearch({
        query,
        maxResults: 10
      });

      if (resultados.length > 0) {
        agregarMensaje(
          'asistente',
          `✨ He encontrado ${resultados.length} coincidencias que te pueden interesar:`,
          resultados.map(r => r.adiso)
        );
      } else {
        agregarMensaje('asistente', '🤔 No encontré nada exacto con esa descripción. ¿Podrías darme más detalles o intentar con otras palabras?');
      }
    } catch (error: any) {
      console.error("Error búsqueda:", error);
      agregarMensaje('asistente', `Ups, tuve un pequeño problema buscando. Inténtalo de nuevo por favor.`);
      onError?.(error.message);
    }
  };

  const procesarImagen = async (imageDataUrl: string, descripcion: string) => {
    try {
      agregarMensaje('asistente', '👀 Analizando tu imagen...');

      // Placeholder for Vision API implementation
      agregarMensaje('asistente', '¡Qué buena foto! 📸\n\nPara completar tu publicación con "Snap & Sell", necesito que esta función esté conectada a mi sistema de visión. \n\nPor ahora, ¿te gustaría que busque algo similar a lo que hay en la foto?');

    } catch (error: any) {
      agregarMensaje('asistente', `No pude procesar la imagen correctamente.`);
      onError?.(error.message);
    }
  };

  const procesarMensaje = async (texto: string) => {
    setProcesando(true);
    // Use nanoid for temporary key if needed, or just let re-render handle it
    agregarMensaje('usuario', imageUrl ? '📸 [Imagen] ' + texto : texto);

    try {
      if (imageUrl) {
        await procesarImagen(imageUrl, texto);
        setImageUrl('');
      } else {
        // Detectar intención simple
        const textoLower = texto.toLowerCase();

        // Simple logic to route to search or general chat
        // In a real agent, this would be determined by an LLM router
        const esBusqueda =
          textoLower.includes('busco') ||
          textoLower.includes('busca') ||
          textoLower.includes('encontrar') ||
          textoLower.includes('necesito') ||
          textoLower.includes('quiero') ||
          textoLower.includes('alquiler') ||
          textoLower.includes('venta') ||
          textoLower.includes('empleo') ||
          textoLower.includes('comprar');

        if (esBusqueda) {
          await procesarBusqueda(texto);
        } else if (textoLower.includes('publicar') || textoLower.includes('vender')) {
          agregarMensaje('asistente', '📸 ¡Entendido! Para publicar rápido, haz clic en el icono de cámara y sube una foto.\n\nYo me encargaré de crear el título y la descripción por ti.');
        } else if (textoLower.includes('hola') || textoLower.includes('gracias')) {
          agregarMensaje('asistente', '¡Hola! ¿En qué puedo ayudarte hoy? Puedes buscar "departamento en Cusco" o "trabajo de medio tiempo".');
        } else {
          // Default to search if unsure, asking clarification often frustrates users
          await procesarBusqueda(texto);
        }
      }
    } catch (error: any) {
      agregarMensaje('asistente', `Lo siento, hubo un error técnico.`);
    } finally {
      setProcesando(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((inputMensaje.trim() || imageUrl) && !procesando) {
      const texto = inputMensaje.trim() || 'Analiza esto';
      setInputMensaje('');
      procesarMensaje(texto);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError?.('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onError?.('La imagen es muy grande. Intenta con una menor a 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
      setInputMensaje('Quiero vender esto');
      inputRef.current?.focus();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* Header Premium */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        background: 'rgba(255,255,255,0.8)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        backdropFilter: 'blur(10px)',
        zIndex: 10
      }}>
        <div style={{
          position: 'relative',
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.2rem',
          boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)'
        }}>
          <span role="img" aria-label="bot">✨</span>
          <div style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '12px',
            height: '12px',
            background: '#22c55e',
            border: '2px solid white',
            borderRadius: '50%'
          }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, color: '#1f2937', fontSize: '1rem', letterSpacing: '-0.025em' }}>
            ADIS AI
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>
            Tu asistente de búsqueda personalizada con IA
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        scrollBehavior: 'smooth'
      }}>
        {mensajes.map((mensaje) => (
          <div key={mensaje.id} style={{
            display: 'flex',
            justifyContent: mensaje.tipo === 'usuario' ? 'flex-end' : 'flex-start',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            {mensaje.tipo === 'asistente' && (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366f1',
                fontSize: '0.9rem',
                marginRight: '0.75rem',
                flexShrink: 0,
                border: '1px solid white',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
              }}>
                🤖
              </div>
            )}

            <div style={{ maxWidth: '85%', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                padding: '1rem',
                borderRadius: mensaje.tipo === 'usuario' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                background: mensaje.tipo === 'usuario'
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : 'white',
                color: mensaje.tipo === 'usuario' ? 'white' : '#374151',
                boxShadow: mensaje.tipo === 'usuario'
                  ? '0 4px 12px rgba(99, 102, 241, 0.25)'
                  : '0 2px 8px rgba(0,0,0,0.04)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                fontSize: '0.95rem',
                border: mensaje.tipo === 'asistente' ? '1px solid rgba(0,0,0,0.03)' : 'none'
              }}>
                {mensaje.contenido}
              </div>

              {/* Resultados Interactivos */}
              {mensaje.resultados && mensaje.resultados.length > 0 && (
                <div style={{
                  marginTop: '1rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {mensaje.resultados.slice(0, 5).map((adiso) => (
                    <Link
                      href={`/${adiso.categoria || 'anuncio'}/${adiso.id}`}
                      key={adiso.id}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="ad-card-hover" style={{
                        padding: '0.875rem',
                        background: 'white',
                        borderRadius: '1rem',
                        border: '1px solid rgba(0,0,0,0.06)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem', color: '#111827', lineHeight: 1.4 }}>
                          {adiso.titulo}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            background: '#f3f4f6',
                            color: '#4b5563',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <FaTag size={8} /> {adiso.categoria || 'General'}
                          </span>
                          {adiso.ubicacion && (
                            <span style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              background: '#eff6ff',
                              color: '#3b82f6',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <FaMapMarkerAlt size={8} /> {typeof adiso.ubicacion === 'string' ? adiso.ubicacion : 'Ver mapa'}
                            </span>
                          )}
                        </div>

                        {adiso.descripcion && (
                          <div style={{ fontSize: '0.8rem', color: '#6b7280', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {adiso.descripcion}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={mensajesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)', background: 'white' }}>
        {imageUrl && (
          <div style={{ marginBottom: '0.75rem', padding: '0.5rem', background: '#f9fafb', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #e5e7eb' }}>
            <img src={imageUrl} alt="Preview" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block' }}>Imagen adjuntada</span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Lista para analizar</span>
            </div>
            <button
              onClick={() => setImageUrl('')}
              style={{
                width: '24px', height: '24px', borderRadius: '50%', background: '#e5e7eb',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#6b7280'
              }}
            >✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ position: 'relative', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              ref={inputRef}
              type="text"
              value={inputMensaje}
              onChange={(e) => setInputMensaje(e.target.value)}
              placeholder="Escribe lo que buscas..."
              disabled={procesando}
              style={{
                width: '100%',
                padding: '1rem 3rem 1rem 1.25rem',
                border: '1px solid #e5e7eb',
                borderRadius: '1.5rem',
                backgroundColor: '#f9fafb',
                color: '#1f2937',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.2s',
                boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={procesando}
              title="Adjuntar imagen"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '0.5rem',
                border: 'none',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                color: '#9ca3af',
                cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#6366f1'}
              onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              <FaImage size={18} />
            </button>
          </div>

          <button
            type="submit"
            disabled={(!inputMensaje.trim() && !imageUrl) || procesando}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: 'none',
              background: procesando || (!inputMensaje.trim() && !imageUrl)
                ? '#e5e7eb'
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              cursor: procesando ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => !procesando && (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => !procesando && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {procesando ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaPaperPlane size={18} />}
          </button>
        </form>

        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            'Departamento en Cusco',
            'Trabajo de ventas',
            'Alquiler de local',
            'Comprar auto'
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => { setInputMensaje(`Busco ${suggestion.toLowerCase()}`); inputRef.current?.focus(); }}
              style={{
                padding: '0.4rem 0.8rem',
                border: '1px solid #f3f4f6',
                borderRadius: '0.75rem',
                backgroundColor: 'white',
                color: '#6b7280',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#c7d2fe';
                e.currentTarget.style.color = '#4f46e5';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#f3f4f6';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              <FaSearch size={10} />
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ad-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.06) !important;
          border-color: #c7d2fe !important;
        }
      `}</style>
    </div>
  );
}
