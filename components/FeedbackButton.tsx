'use client';

import { useState, useRef } from 'react';
import { FaLightbulb, FaExclamationTriangle, FaTimes, FaCheckCircle, FaCommentDots, FaImage, FaTrash } from 'react-icons/fa';
import { enviarFeedbackInmediato } from '@/lib/feedback';
import { useToast } from '@/hooks/useToast';

interface FeedbackButtonProps {
  variant?: 'floating';
}

export default function FeedbackButton({ variant = 'floating' }: FeedbackButtonProps) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [texto, setTexto] = useState('');
  const [tipoSeleccionado, setTipoSeleccionado] = useState<'sugerencia' | 'problema'>('sugerencia');
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [enviado, setEnviado] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: errorToast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      errorToast('La imagen es demasiado grande. Máximo 5MB.');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      errorToast('Por favor selecciona una imagen válida.');
      return;
    }

    setImagenFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagenPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagenPreview(null);
    setImagenFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!texto.trim()) return;

    setEnviado(true);
    
    // Subir imagen si existe
    let imagenUrl: string | undefined = undefined;
    if (imagenFile) {
      try {
        const formData = new FormData();
        formData.append('image', imagenFile);
        
        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imagenUrl = uploadData.url;
        } else {
          console.warn('Error al subir imagen, continuando sin imagen');
        }
      } catch (err) {
        console.warn('Error al subir imagen:', err);
      }
    }
    
    // Intentar enviar inmediatamente
    const enviado = await enviarFeedbackInmediato({
      tipo: tipoSeleccionado,
      texto: texto.trim(),
      imagenUrl
    });

    if (enviado) {
      success('¡Gracias por tu feedback! Lo revisaremos pronto.');
    } else {
      success('¡Gracias por tu feedback! Se guardó localmente y se enviará pronto.');
    }
    
    setTimeout(() => {
      setMostrarModal(false);
      setTexto('');
      setImagenPreview(null);
      setImagenFile(null);
      setEnviado(false);
      setTipoSeleccionado('sugerencia');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 1500);
  };

  const getButtonStyle = () => {
    return {
      padding: '0.75rem 1rem',
      borderRadius: '50px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 999,
      position: 'fixed' as const,
      bottom: '1rem',
      left: '1rem',
      backgroundColor: 'var(--text-primary)',
      color: 'var(--bg-primary)'
    };
  };

  return (
    <>
      <button
        onClick={() => setMostrarModal(true)}
        style={getButtonStyle()}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <FaCommentDots size={14} />
        Feedback
      </button>

      {mostrarModal && (
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
          onClick={() => !enviado && setMostrarModal(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '12px',
              padding: '2rem',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!enviado ? (
              <>
                <button
                  onClick={() => setMostrarModal(false)}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
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

                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  {tipoSeleccionado === 'problema' 
                    ? '🚨 Reportar un problema' 
                    : '✨ Sugerir una mejora'}
                </h3>

                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '1.5rem',
                  lineHeight: 1.6
                }}>
                  {tipoSeleccionado === 'problema'
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
                      onClick={() => setTipoSeleccionado(t)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: `1px solid ${tipoSeleccionado === t ? 'var(--text-primary)' : 'var(--border-color)'}`,
                        backgroundColor: tipoSeleccionado === t ? 'var(--text-primary)' : 'var(--bg-primary)',
                        color: tipoSeleccionado === t ? 'var(--bg-primary)' : 'var(--text-primary)',
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
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder={
                    tipoSeleccionado === 'problema'
                      ? 'Describe el problema que encontraste...'
                      : 'Cuéntanos tu idea o sugerencia...'
                  }
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

                {/* Input de imagen */}
                <div style={{ marginBottom: '1rem' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                    id="feedback-image-input"
                  />
                  <label
                    htmlFor="feedback-image-input"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      border: '1px dashed var(--border-color)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--text-primary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <FaImage size={16} />
                    {imagenPreview ? 'Cambiar imagen' : 'Agregar captura de pantalla (opcional)'}
                  </label>
                  
                  {imagenPreview && (
                    <div style={{
                      marginTop: '0.75rem',
                      position: 'relative',
                      display: 'inline-block'
                    }}>
                      <img
                        src={imagenPreview}
                        alt="Preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '200px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)'
                        }}
                      />
                      <button
                        onClick={handleRemoveImage}
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          background: 'rgba(0, 0, 0, 0.7)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'white'
                        }}
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => setMostrarModal(false)}
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
                    onClick={handleSubmit}
                    disabled={!texto.trim()}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: texto.trim() ? 'var(--text-primary)' : 'var(--bg-secondary)',
                      color: texto.trim() ? 'var(--bg-primary)' : 'var(--text-tertiary)',
                      cursor: texto.trim() ? 'pointer' : 'not-allowed',
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
    </>
  );
}

