'use client';

import React, { useState, useEffect } from 'react';
import { AdisoGratuito, Categoria, Adiso } from '@/types';
import { IconWhatsApp, IconGratuitos } from './Icons';
import { getWhatsAppUrl, generarIdUnico } from '@/lib/utils';
import { fetchAdisosGratuitos, createAdisoGratuito } from '@/lib/api';
import { 
  IconEmpleos, 
  IconInmuebles, 
  IconVehiculos, 
  IconServicios, 
  IconProductos, 
  IconEventos, 
  IconNegocios, 
  IconComunidad 
} from './Icons';

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

interface AdisosGratuitosProps {
  onPublicarGratuito?: (adiso: AdisoGratuito) => void;
  todosLosAdisos?: Adiso[]; // Todos los adisos (gratuitos + de paga)
}

export default function AdisosGratuitos({ onPublicarGratuito, todosLosAdisos = [] }: AdisosGratuitosProps) {
  const [adisosGratuitos, setAdisosGratuitos] = useState<AdisoGratuito[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCargandoGratuitos, setErrorCargandoGratuitos] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    categoria: 'empleos' as Categoria,
    titulo: '',
    contacto: ''
  });

  useEffect(() => {
    const cargarAdisos = async () => {
      try {
        const adisos = await fetchAdisosGratuitos();
        setAdisosGratuitos(adisos);
        setErrorCargandoGratuitos(false);
      } catch (error: any) {
        console.error('Error al cargar adisos gratuitos:', error);
        // Si la tabla no existe aún (error 500/503), simplemente no mostrar error
        // Los adisos de paga se mostrarán de todas formas
        if (error?.message?.includes('Error al obtener adisos gratuitos')) {
          setErrorCargandoGratuitos(true);
        }
      } finally {
        setCargando(false);
      }
    };
    cargarAdisos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.titulo.trim().length === 0 || formData.titulo.length > 30) {
      return;
    }
    if (formData.contacto.trim().length === 0) {
      return;
    }

    try {
      const nuevoAdiso = await createAdisoGratuito({
        categoria: formData.categoria,
        titulo: formData.titulo.trim(),
        contacto: formData.contacto.trim()
      });

      setAdisosGratuitos(prev => [nuevoAdiso, ...prev]);
      setFormData({ categoria: 'empleos', titulo: '', contacto: '' });
      setMostrarFormulario(false);
      onPublicarGratuito?.(nuevoAdiso);
    } catch (error: any) {
      console.error('Error al publicar adiso gratuito:', error);
      alert(error.message || 'Error al publicar el adiso gratuito');
    }
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <IconGratuitos size={20} />
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Adisos Gratuitos
        </h2>
      </div>

      {/* Formulario simple */}
      {mostrarFormulario ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Categoría
            </label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value as Categoria })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            >
              <option value="empleos">Empleos</option>
              <option value="inmuebles">Inmuebles</option>
              <option value="vehiculos">Vehículos</option>
              <option value="servicios">Servicios</option>
              <option value="productos">Productos</option>
              <option value="eventos">Eventos</option>
              <option value="negocios">Negocios</option>
              <option value="comunidad">Comunidad</option>
            </select>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Título (máx. 30 caracteres)
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 30) {
                  setFormData({ ...formData, titulo: value });
                }
              }}
              maxLength={30}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.25rem', textAlign: 'right' }}>
              {formData.titulo.length}/30
            </div>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Contacto (WhatsApp)
            </label>
            <input
              type="tel"
              value={formData.contacto}
              onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
              required
              placeholder="+51 987 654 321"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '0.625rem',
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-primary)',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Publicar Gratis
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrarFormulario(false);
                setFormData({ categoria: 'empleos', titulo: '', contacto: '' });
              }}
              style={{
                padding: '0.625rem 1rem',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setMostrarFormulario(true)}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          + Publicar Adiso Gratuito
        </button>
      )}

      {/* Lista de TODOS los adisos (gratuitos + de paga) */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {cargando ? (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>
            Cargando...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Mostrar adisos de paga primero */}
            {todosLosAdisos.map((adiso) => {
              const IconComponent = getCategoriaIcon(adiso.categoria);
              const tituloTruncado = adiso.titulo.length > 50 ? adiso.titulo.substring(0, 50) + '...' : adiso.titulo;
              return (
                <div
                  key={adiso.id}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                    <IconComponent size={12} />
                    <span style={{ textTransform: 'capitalize' }}>{adiso.categoria}</span>
                    {adiso.tamaño && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.65rem', opacity: 0.7, textTransform: 'capitalize' }}>
                        {adiso.tamaño}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {tituloTruncado}
                  </div>
                  {adiso.descripcion && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {adiso.descripcion.length > 100 ? adiso.descripcion.substring(0, 100) + '...' : adiso.descripcion}
                    </div>
                  )}
                  <button
                    onClick={() => window.open(getWhatsAppUrl(adiso.contacto, adiso.titulo, adiso.categoria, adiso.id), '_blank')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: '#25D366',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      width: 'fit-content'
                    }}
                  >
                    <IconWhatsApp size={14} />
                    Contactar
                  </button>
                </div>
              );
            })}
            
            {/* Mostrar adisos gratuitos después */}
            {adisosGratuitos.map((adiso) => {
              const IconComponent = getCategoriaIcon(adiso.categoria);
              const tituloTruncado = adiso.titulo.length > 30 ? adiso.titulo.substring(0, 30) + '...' : adiso.titulo;
              return (
                <div
                  key={adiso.id}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    opacity: 0.9 // Ligeramente más opaco para diferenciarlos
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                    <IconComponent size={12} />
                    <span style={{ textTransform: 'capitalize' }}>{adiso.categoria}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.65rem', opacity: 0.7, color: '#25D366', fontWeight: 600 }}>Gratis</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {tituloTruncado}
                  </div>
                  <button
                    onClick={() => window.open(getWhatsAppUrl(adiso.contacto, adiso.titulo, adiso.categoria, adiso.id), '_blank')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: '#25D366',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      width: 'fit-content'
                    }}
                  >
                    <IconWhatsApp size={14} />
                    Contactar
                  </button>
                </div>
              );
            })}
            
            {/* Mensaje si no hay adisos */}
            {todosLosAdisos.length === 0 && adisosGratuitos.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                <div>No hay adisos aún</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

