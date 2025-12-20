/**
 * Draft Listing Card - "Snap & Sell" Component
 *
 * This component displays AI-generated listing details from image analysis
 * and allows the user to edit and publish with one click.
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Categoria } from '@/types';

export interface DraftListingData {
  imageUrl: string;
  categoria: Categoria;
  titulo: string;
  descripcion: string;
  precio?: number;
  precioMin?: number;
  precioMax?: number;
  condicion?: string;
  tags?: string[];
  confidence?: 'baja' | 'media' | 'alta';
  similarListings?: number;
}

export interface DraftListingCardProps {
  data: DraftListingData;
  onPublish?: (editedData: DraftListingData) => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

export function DraftListingCard({
  data,
  onPublish,
  onEdit,
  onCancel,
}: DraftListingCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(data);
  const [isPublished, setIsPublished] = useState(false);

  const handlePublish = () => {
    if (onPublish) {
      onPublish(editedData);
    } else {
      // Simulate publication for demo
      setIsPublished(true);
      console.log('Publish data:', editedData);
    }
  };

  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'alta':
        return '#10b981';
      case 'media':
        return '#f59e0b';
      case 'baja':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getConfidenceText = (confidence?: string) => {
    switch (confidence) {
      case 'alta':
        return 'Alta confianza';
      case 'media':
        return 'Confianza media';
      case 'baja':
        return 'Poca información de mercado';
      default:
        return '';
    }
  };

  if (isPublished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '16px',
          padding: '2px',
          marginTop: '12px',
          marginBottom: '12px',
        }}
      >
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '14px',
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '8px'
          }}>
            ¡Aviso Publicado!
          </h3>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginBottom: '20px'
          }}>
            Tu aviso "{editedData.titulo}" ya está visible para miles de usuarios.
          </p>
          <button
            onClick={() => window.open('/mis-avisos', '_blank')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent-color)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Ver mi aviso
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '2px',
        marginTop: '12px',
        marginBottom: '12px',
      }}
    >
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '14px',
        padding: '20px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
        }}>
          <span style={{ fontSize: '24px' }}>✨</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              ¡Listo! Aquí está tu aviso
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}>
              Revisa y publica con un clic
            </div>
          </div>
        </div>

        {/* Image */}
        {data.imageUrl && (
          <div style={{
            width: '100%',
            height: '200px',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '16px',
            position: 'relative',
          }}>
            <img
              src={data.imageUrl}
              alt="Preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        )}

        {/* Editable Fields */}
        <div style={{ marginBottom: '16px' }}>
          {/* Title */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: '6px',
            }}>
              TÍTULO
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedData.titulo}
                onChange={(e) => setEditedData({ ...editedData, titulo: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                }}
              />
            ) : (
              <div style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}>
                {editedData.titulo}
              </div>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: '6px',
            }}>
              DESCRIPCIÓN
            </label>
            {isEditing ? (
              <textarea
                value={editedData.descripcion}
                onChange={(e) => setEditedData({ ...editedData, descripcion: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            ) : (
              <div style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}>
                {editedData.descripcion}
              </div>
            )}
          </div>

          {/* Price */}
          {editedData.precio && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: '6px',
              }}>
                PRECIO SUGERIDO
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedData.precio}
                    onChange={(e) => setEditedData({ ...editedData, precio: parseInt(e.target.value) })}
                    style={{
                      width: '120px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '18px',
                      fontWeight: 700,
                    }}
                  />
                ) : (
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: 'var(--accent-color)',
                  }}>
                    S/ {editedData.precio.toLocaleString()}
                  </div>
                )}

                {data.precioMin && data.precioMax && !isEditing && (
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                  }}>
                    Rango: S/ {data.precioMin} - S/ {data.precioMax}
                  </div>
                )}
              </div>

              {/* Confidence Badge */}
              {data.confidence && !isEditing && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '8px',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: getConfidenceColor(data.confidence) + '20',
                  color: getConfidenceColor(data.confidence),
                  fontSize: '11px',
                  fontWeight: 600,
                }}>
                  <span>📊</span>
                  <span>{getConfidenceText(data.confidence)}</span>
                  {data.similarListings && data.similarListings > 0 && (
                    <span style={{ opacity: 0.8 }}>
                      • {data.similarListings} anuncios similares
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {data.tags && data.tags.length > 0 && !isEditing && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: '6px',
              }}>
                ETIQUETAS
              </label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
              }}>
                {data.tags.slice(0, 5).map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '20px',
        }}>
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancelar edición
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  handlePublish();
                }}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                }}
              >
                Guardar y Publicar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ✏️ Editar
              </button>
              <button
                onClick={handlePublish}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                ✨ Publicar Ahora
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
