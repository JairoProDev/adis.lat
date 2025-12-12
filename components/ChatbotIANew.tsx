'use client';

/**
 * ADIS AI - Chatbot Mejorado con RAG y Generative UI
 *
 * Este componente integra las nuevas capacidades de ADIS AI
 * manteniendo el diseño existente del sitio.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Adiso } from '@/types';
import { FaPaperPlane, FaSpinner, FaSearch, FaImage } from 'react-icons/fa';
import { hybridSearch } from '@/actions/ai-search';
import { snapAndSell } from '@/actions/ai-vision';

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
      id: '1',
      tipo: 'asistente',
      contenido: '¡Hola! Soy ADIS AI 🤖\n\nAhora tengo superpoderes:\n• 🔍 Búsqueda semántica inteligente\n• 📸 Snap & Sell (sube foto y publico por ti)\n• 💬 Entiendo contexto y sinónimos\n\n¿Qué necesitas?',
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
      id: Date.now().toString(),
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
      agregarMensaje('asistente', '🔍 Buscando con IA semántica...');

      const resultados = await hybridSearch({
        query,
        maxResults: 10
      });

      if (resultados.length > 0) {
        agregarMensaje(
          'asistente',
          `✨ Encontré ${resultados.length} ${resultados.length === 1 ? 'resultado' : 'resultados'} usando búsqueda semántica:\n\n(Los resultados están ordenados por relevancia)`,
          resultados.map(r => r.adiso)
        );
      } else {
        agregarMensaje('asistente', '😕 No encontré resultados exactos, pero puedo ayudarte a buscar de otra forma. ¿Puedes darme más detalles?');
      }
    } catch (error: any) {
      agregarMensaje('asistente', `❌ Error en la búsqueda: ${error.message}`);
      onError?.(error.message);
    }
  };

  const procesarImagen = async (imageDataUrl: string, descripcion: string) => {
    try {
      agregarMensaje('asistente', '📸 Analizando tu imagen con GPT-4o Vision...');

      // Por ahora, mostrar mensaje de que necesita implementación completa
      agregarMensaje('asistente', '⚠️ Snap & Sell requiere configuración adicional:\n\n1. Subir imagen a Supabase Storage\n2. Obtener URL pública\n3. Llamar a snapAndSell(url)\n\nPor ahora, puedes usar la búsqueda semántica. ¡Es muy potente! 💪');

    } catch (error: any) {
      agregarMensaje('asistente', `❌ Error: ${error.message}`);
      onError?.(error.message);
    }
  };

  const procesarMensaje = async (texto: string) => {
    setProcesando(true);
    agregarMensaje('usuario', imageUrl ? '📸 [Imagen] ' + texto : texto);

    try {
      if (imageUrl) {
        await procesarImagen(imageUrl, texto);
        setImageUrl('');
      } else {
        // Detectar intención simple
        const textoLower = texto.toLowerCase();
        const esBusqueda =
          textoLower.includes('busco') ||
          textoLower.includes('busca') ||
          textoLower.includes('encontrar') ||
          textoLower.includes('necesito') ||
          textoLower.includes('quiero') ||
          textoLower.includes('hay');

        if (esBusqueda) {
          await procesarBusqueda(texto);
        } else if (textoLower.includes('publicar') || textoLower.includes('vender')) {
          agregarMensaje('asistente', '📸 ¡Perfecto! Para publicar rápido, haz clic en el botón de imagen 📷 y sube una foto de lo que quieres vender.\n\nYo me encargaré del resto: título, descripción, categoría y precio sugerido. Todo automático! ✨');
        } else {
          agregarMensaje('asistente', 'Puedo ayudarte con:\n\n🔍 Búsqueda inteligente: "Busco trabajo de cocinero"\n📸 Publicar con foto: Click en 📷\n\n¿Qué prefieres?');
        }
      }
    } catch (error: any) {
      agregarMensaje('asistente', `❌ Error: ${error.message}`);
      onError?.(error.message);
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
      onError?.('Selecciona una imagen válida (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onError?.('Imagen muy grande. Máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
      setInputMensaje('Quiero vender esto');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* Header con nuevo diseño */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
        }}>
          AI
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            ADIS AI
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Búsqueda Semántica • RAG • GPT-4o
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {mensajes.map((mensaje) => (
          <div key={mensaje.id} style={{ display: 'flex', justifyContent: mensaje.tipo === 'usuario' ? 'flex-end' : 'flex-start' }}>
            {mensaje.tipo === 'asistente' && (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                marginRight: '0.5rem',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
              }}>
                AI
              </div>
            )}
            <div style={{ maxWidth: '85%' }}>
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: mensaje.tipo === 'usuario' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                background: mensaje.tipo === 'usuario'
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'var(--bg-secondary)',
                color: mensaje.tipo === 'usuario' ? 'white' : 'var(--text-primary)',
                boxShadow: mensaje.tipo === 'usuario'
                  ? '0 2px 8px rgba(102, 126, 234, 0.3)'
                  : '0 2px 6px rgba(0,0,0,0.08)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6
              }}>
                {mensaje.contenido}
              </div>

              {/* Resultados */}
              {mensaje.resultados && mensaje.resultados.length > 0 && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {mensaje.resultados.slice(0, 5).map((adiso) => (
                    <div key={adiso.id} style={{
                      padding: '0.75rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        {adiso.titulo}
                      </div>
                      {adiso.descripcion && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {adiso.descripcion.substring(0, 100)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={mensajesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        {imageUrl && (
          <div style={{ marginBottom: '0.5rem', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src={imageUrl} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
            <span style={{ fontSize: '0.75rem', flex: 1 }}>📸 Imagen lista</span>
            <button onClick={() => setImageUrl('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputMensaje}
            onChange={(e) => setInputMensaje(e.target.value)}
            placeholder="Ej: Busco departamento en Cusco..."
            disabled={procesando}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '1px solid var(--border-color)',
              borderRadius: '1.5rem',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={procesando}
            title="Snap & Sell - Sube una foto"
            style={{
              padding: '0.75rem',
              border: 'none',
              borderRadius: '1.5rem',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <FaImage />
          </button>
          <button
            type="submit"
            disabled={(!inputMensaje.trim() && !imageUrl) || procesando}
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none',
              borderRadius: '1.5rem',
              background: procesando || (!inputMensaje.trim() && !imageUrl)
                ? 'var(--border-color)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              cursor: procesando ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          >
            {procesando ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaPaperPlane />}
          </button>
        </form>
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => { setInputMensaje('Busco trabajo de cocinero'); inputRef.current?.focus(); }} style={{
            padding: '0.4rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '1rem',
            backgroundColor: 'var(--bg-primary)', fontSize: '0.75rem', cursor: 'pointer'
          }}>
            <FaSearch size={10} style={{ marginRight: '0.25rem' }} />
            Ejemplo búsqueda
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
