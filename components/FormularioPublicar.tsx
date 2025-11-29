'use client';

import React, { useState, FormEvent, useRef } from 'react';
import { Aviso, AvisoFormData, Categoria } from '@/types';
import { saveAviso } from '@/lib/storage';
import { LIMITS, formatPhoneNumber, validatePhoneNumber, generarIdUnico } from '@/lib/utils';
import {
  IconEmpleos,
  IconInmuebles,
  IconVehiculos,
  IconServicios,
  IconProductos,
  IconEventos,
  IconNegocios,
  IconComunidad,
  IconTitle,
  IconDescription,
  IconLocation,
  IconPhone,
  IconMegaphone
} from './Icons';
import { FaImage, FaTrash, FaPlus } from 'react-icons/fa';

interface FormularioPublicarProps {
  onPublicar: (aviso: Aviso) => void;
  onCerrar: () => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

interface ImagenPreview {
  file: File;
  preview: string; // URL local del preview
}

const CATEGORIAS: Categoria[] = [
  'empleos',
  'inmuebles',
  'vehiculos',
  'servicios',
  'productos',
  'eventos',
  'negocios',
  'comunidad'
];

const CATEGORIA_PLACEHOLDERS: Record<Categoria, string> = {
  empleos: 'Ej: Busco desarrollador web full-time',
  inmuebles: 'Ej: Vendo departamento 2 habitaciones',
  vehiculos: 'Ej: Vendo auto 2020 en excelente estado',
  servicios: 'Ej: Ofrezco servicios de plomería',
  productos: 'Ej: Vendo bicicleta en buen estado',
  eventos: 'Ej: Concierto de rock este sábado',
  negocios: 'Ej: Oportunidad de negocio rentable',
  comunidad: 'Ej: Busco compañero de piso'
};

const getCategoriaIcon = (categoria: Categoria): React.ComponentType<{ size?: number; color?: string }> => {
  const iconMap: Record<Categoria, React.ComponentType<{ size?: number; color?: string }>> = {
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

export default function FormularioPublicar({ onPublicar, onCerrar, onError, onSuccess }: FormularioPublicarProps) {
  const [formData, setFormData] = useState<AvisoFormData>({
    categoria: 'empleos',
    titulo: '',
    descripcion: '',
    contacto: '',
    ubicacion: ''
  });
  const [imagenesPreviews, setImagenesPreviews] = useState<ImagenPreview[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof AvisoFormData, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AvisoFormData, string>> = {};
    
    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es requerido';
    } else if (formData.titulo.length > LIMITS.TITULO_MAX) {
      newErrors.titulo = `El título no puede exceder ${LIMITS.TITULO_MAX} caracteres`;
    }
    
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    } else if (formData.descripcion.length > LIMITS.DESCRIPCION_MAX) {
      newErrors.descripcion = `La descripción no puede exceder ${LIMITS.DESCRIPCION_MAX} caracteres`;
    }
    
    if (!formData.contacto.trim()) {
      newErrors.contacto = 'El número de contacto es requerido';
    } else if (!validatePhoneNumber(formData.contacto)) {
      newErrors.contacto = 'Ingresa un número de teléfono válido (mínimo 8 dígitos)';
    }
    
    if (!formData.ubicacion.trim()) {
      newErrors.ubicacion = 'La ubicación es requerida';
    } else if (formData.ubicacion.length > LIMITS.UBICACION_MAX) {
      newErrors.ubicacion = `La ubicación no puede exceder ${LIMITS.UBICACION_MAX} caracteres`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const nuevasImagenes: ImagenPreview[] = [];

    files.forEach((file) => {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        onError?.('Una o más imágenes son demasiado grandes. Máximo 5MB por imagen.');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        onError?.('Por favor selecciona solo imágenes válidas.');
        return;
      }

      // Crear preview local inmediatamente
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview: ImagenPreview = {
          file,
          preview: reader.result as string
        };
        setImagenesPreviews(prev => [...prev, preview]);
      };
      reader.readAsDataURL(file);
    });

    // Limpiar input para permitir seleccionar la misma imagen de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImagenesPreviews(prev => {
      const nuevas = [...prev];
      // Revocar URL del preview para liberar memoria
      URL.revokeObjectURL(nuevas[index].preview);
      nuevas.splice(index, 1);
      return nuevas;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (enviando) return;
    
    if (!validateForm()) {
      onError?.('Por favor corrige los errores en el formulario');
      return;
    }

    setEnviando(true);

    try {
      const ahora = new Date();
      const fecha = ahora.toISOString().split('T')[0];
      const hora = ahora.toTimeString().split(' ')[0].substring(0, 5);

      // Generar ID único y amigable
      const idUnico = generarIdUnico();

      // Crear aviso INMEDIATAMENTE con previews locales
      // Las imágenes se mostrarán desde el preview local mientras se suben en background
      const previewsUrls = imagenesPreviews.map(img => img.preview);
      
      const nuevoAviso: Aviso = {
        id: idUnico,
        categoria: formData.categoria,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        contacto: formData.contacto,
        ubicacion: formData.ubicacion,
        imagenesUrls: previewsUrls, // Usar previews locales inmediatamente
        fechaPublicacion: fecha,
        horaPublicacion: hora
      };

      // PUBLICAR INMEDIATAMENTE (sin esperar nada)
      setEnviando(false);
      onPublicar(nuevoAviso);
      onSuccess?.('¡Aviso publicado con éxito!');
      
      // Guardar en background (sin esperar)
      saveAviso(nuevoAviso).catch(error => {
        console.error('Error al guardar:', error);
      });

      // Subir imágenes en background y actualizar el aviso cuando terminen
      if (imagenesPreviews.length > 0) {
        (async () => {
          const urlsSubidas: string[] = [];
          
          // Subir todas las imágenes en paralelo
          const uploadPromises = imagenesPreviews.map(async (imgPreview) => {
            try {
              const formDataUpload = new FormData();
              formDataUpload.append('image', imgPreview.file);
              formDataUpload.append('bucket', 'avisos-images');
              
              const uploadResponse = await fetch('/api/upload-image', {
                method: 'POST',
                body: formDataUpload
              });

              if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                return uploadData.url;
              } else {
                console.warn('Error al subir una imagen');
                return null;
              }
            } catch (err) {
              console.warn('Error al subir imagen:', err);
              return null;
            }
          });

          const resultados = await Promise.all(uploadPromises);
          urlsSubidas.push(...resultados.filter((url): url is string => url !== null));

          // Actualizar el aviso con las URLs reales de Supabase
          if (urlsSubidas.length > 0) {
            const avisoActualizado: Aviso = {
              ...nuevoAviso,
              imagenesUrls: urlsSubidas
            };
            
            // Actualizar en el estado local
            onPublicar(avisoActualizado);
            
            // Guardar actualización en background
            saveAviso(avisoActualizado).catch(error => {
              console.error('Error al actualizar con imágenes:', error);
            });
          }
        })();
      }
    } catch (error) {
      console.error('Error al publicar:', error);
      onError?.('Hubo un error al publicar el aviso. Por favor intenta nuevamente.');
      setEnviando(false);
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem'
      }}
      onClick={onCerrar}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '12px',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            Publicar aviso
          </h2>
          <button
            onClick={onCerrar}
            style={{
              fontSize: '1.5rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: '0.25rem',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              {(() => {
                const IconComponent = getCategoriaIcon(formData.categoria);
                return <IconComponent size={16} />;
              })()}
              Categoría
            </label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value as Categoria })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              <IconTitle />
              Título
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= LIMITS.TITULO_MAX) {
                  setFormData({ ...formData, titulo: value });
                  if (errors.titulo) {
                    setErrors({ ...errors, titulo: undefined });
                  }
                }
              }}
              required
              placeholder={CATEGORIA_PLACEHOLDERS[formData.categoria]}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: `1px solid ${errors.titulo ? '#ef4444' : 'var(--border-color)'}`,
                borderRadius: '8px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              {errors.titulo && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.titulo}</span>
              )}
              <span style={{ 
                fontSize: '0.75rem', 
                color: formData.titulo.length > LIMITS.TITULO_MAX * 0.9 ? '#f59e0b' : 'var(--text-tertiary)',
                marginLeft: 'auto'
              }}>
                {formData.titulo.length}/{LIMITS.TITULO_MAX}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              <IconDescription />
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= LIMITS.DESCRIPCION_MAX) {
                  setFormData({ ...formData, descripcion: value });
                  if (errors.descripcion) {
                    setErrors({ ...errors, descripcion: undefined });
                  }
                }
              }}
              required
              placeholder="Describe tu aviso..."
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: `1px solid ${errors.descripcion ? '#ef4444' : 'var(--border-color)'}`,
                borderRadius: '8px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              {errors.descripcion && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.descripcion}</span>
              )}
              <span style={{ 
                fontSize: '0.75rem', 
                color: formData.descripcion.length > LIMITS.DESCRIPCION_MAX * 0.9 ? '#f59e0b' : 'var(--text-tertiary)',
                marginLeft: 'auto'
              }}>
                {formData.descripcion.length}/{LIMITS.DESCRIPCION_MAX}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              <IconLocation />
              Ubicación
            </label>
            <input
              type="text"
              value={formData.ubicacion}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= LIMITS.UBICACION_MAX) {
                  setFormData({ ...formData, ubicacion: value });
                  if (errors.ubicacion) {
                    setErrors({ ...errors, ubicacion: undefined });
                  }
                }
              }}
              required
              placeholder="Ej: Ciudad, Barrio"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: `1px solid ${errors.ubicacion ? '#ef4444' : 'var(--border-color)'}`,
                borderRadius: '8px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              {errors.ubicacion && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.ubicacion}</span>
              )}
              <span style={{ 
                fontSize: '0.75rem', 
                color: formData.ubicacion.length > LIMITS.UBICACION_MAX * 0.9 ? '#f59e0b' : 'var(--text-tertiary)',
                marginLeft: 'auto'
              }}>
                {formData.ubicacion.length}/{LIMITS.UBICACION_MAX}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              <IconPhone />
              Número de contacto (WhatsApp)
            </label>
            <input
              type="tel"
              value={formData.contacto}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                setFormData({ ...formData, contacto: formatted });
                if (errors.contacto) {
                  setErrors({ ...errors, contacto: undefined });
                }
              }}
              required
              placeholder="+51 987 654 321"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: `1px solid ${errors.contacto ? '#ef4444' : 'var(--border-color)'}`,
                borderRadius: '8px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
            <div style={{ marginTop: '0.25rem' }}>
              {errors.contacto ? (
                <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.contacto}</span>
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Este número no se mostrará públicamente
                </span>
              )}
            </div>
          </div>

          {/* Input de múltiples imágenes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              <FaImage size={16} />
              Imágenes del aviso (opcional, máx. 5MB cada una)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              style={{ display: 'none' }}
              id="aviso-images-input"
            />
            <label
              htmlFor="aviso-images-input"
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
                transition: 'all 0.2s',
                justifyContent: 'center'
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
              <FaPlus size={16} />
              Agregar imágenes
            </label>
            
            {imagenesPreviews.length > 0 && (
              <div style={{
                marginTop: '0.75rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: '0.75rem'
              }}>
                {imagenesPreviews.map((imgPreview, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <img
                      src={imgPreview.preview}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      style={{
                        position: 'absolute',
                        top: '0.25rem',
                        right: '0.25rem',
                        background: 'rgba(0, 0, 0, 0.7)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        padding: 0
                      }}
                    >
                      <FaTrash size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem'
          }}>
            <button
              type="button"
              onClick={onCerrar}
              style={{
                flex: 1,
                padding: '0.75rem',
                fontSize: '1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              style={{
                flex: 1,
                padding: '0.75rem',
                fontSize: '1rem',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-primary)',
                cursor: enviando ? 'not-allowed' : 'pointer',
                opacity: enviando ? 0.6 : 1,
                pointerEvents: enviando ? 'none' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <IconMegaphone />
              {enviando ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
