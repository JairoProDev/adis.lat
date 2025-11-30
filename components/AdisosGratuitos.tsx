'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

// Tipo unificado para adisos mezclados
type AdisoUnificado = 
  | { tipo: 'paga'; adiso: Adiso }
  | { tipo: 'gratuito'; adiso: AdisoGratuito };

export default function AdisosGratuitos({ onPublicarGratuito, todosLosAdisos = [] }: AdisosGratuitosProps) {
  const [adisosGratuitos, setAdisosGratuitos] = useState<AdisoGratuito[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCargandoGratuitos, setErrorCargandoGratuitos] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [publicando, setPublicando] = useState(false);
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

  // Función para parsear fecha de adiso de paga
  const parsearFechaPaga = (adiso: Adiso): number => {
    const fechaStr = `${adiso.fechaPublicacion}T${adiso.horaPublicacion || '00:00'}:00`;
    const fecha = new Date(fechaStr).getTime();
    return isNaN(fecha) ? 0 : fecha;
  };

  // Función para parsear fecha de adiso gratuito
  const parsearFechaGratuito = (adiso: AdisoGratuito): number => {
    const fecha = new Date(adiso.fechaCreacion).getTime();
    return isNaN(fecha) ? 0 : fecha;
  };

  // Combinar y ordenar todos los adisos por fecha (más recientes primero)
  const adisosOrdenados = useMemo(() => {
    const unificados: AdisoUnificado[] = [
      ...todosLosAdisos.map(adiso => ({ tipo: 'paga' as const, adiso })),
      ...adisosGratuitos.map(adiso => ({ tipo: 'gratuito' as const, adiso }))
    ];

    return unificados.sort((a, b) => {
      const fechaA = a.tipo === 'paga' 
        ? parsearFechaPaga(a.adiso) 
        : parsearFechaGratuito(a.adiso);
      const fechaB = b.tipo === 'paga' 
        ? parsearFechaPaga(b.adiso) 
        : parsearFechaGratuito(b.adiso);
      
      // Más recientes primero (fecha mayor primero)
      return fechaB - fechaA;
    });
  }, [todosLosAdisos, adisosGratuitos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.titulo.trim().length === 0 || formData.titulo.length > 30) {
      return;
    }
    if (formData.contacto.trim().length === 0) {
      return;
    }

    // Guardar valores antes de limpiar el formulario
    const datosParaEnviar = {
      categoria: formData.categoria,
      titulo: formData.titulo.trim(),
      contacto: formData.contacto.trim()
    };

    // Optimistic update: crear adiso temporal inmediatamente
    const ahora = new Date();
    const fechaCreacion = ahora.toISOString();
    const fechaExpiracion = new Date(ahora.getTime() + 24 * 60 * 60 * 1000).toISOString();
    
    const adisoTemporal: AdisoGratuito = {
      id: generarIdUnico(),
      categoria: datosParaEnviar.categoria,
      titulo: datosParaEnviar.titulo,
      contacto: datosParaEnviar.contacto,
      fechaCreacion,
      fechaExpiracion
    };

    // Agregar inmediatamente al estado (optimistic update)
    setAdisosGratuitos(prev => [adisoTemporal, ...prev]);
    setPublicando(true);
    setFormData({ categoria: 'empleos', titulo: '', contacto: '' });
    setMostrarFormulario(false);

    try {
      // Llamada API en background
      const nuevoAdiso = await createAdisoGratuito(datosParaEnviar);

      // Reemplazar el temporal con el real (con el ID correcto del servidor)
      setAdisosGratuitos(prev => 
        prev.map(a => a.id === adisoTemporal.id ? nuevoAdiso : a)
      );
      
      onPublicarGratuito?.(nuevoAdiso);
    } catch (error: any) {
      console.error('Error al publicar adiso gratuito:', error);
      
      // Revertir optimistic update si falla
      setAdisosGratuitos(prev => prev.filter(a => a.id !== adisoTemporal.id));
      
      // Restaurar formulario
      setFormData({
        categoria: datosParaEnviar.categoria,
        titulo: datosParaEnviar.titulo,
        contacto: datosParaEnviar.contacto
      });
      setMostrarFormulario(true);
      
      alert(error.message || 'Error al publicar el adiso gratuito. Por favor intenta nuevamente.');
    } finally {
      setPublicando(false);
    }
  };

  const handleClickTitulo = (adisoUnificado: AdisoUnificado) => {
    if (adisoUnificado.tipo === 'paga') {
      const url = getWhatsAppUrl(
        adisoUnificado.adiso.contacto,
        adisoUnificado.adiso.titulo,
        adisoUnificado.adiso.categoria,
        adisoUnificado.adiso.id
      );
      window.open(url, '_blank');
    } else {
      const url = getWhatsAppUrl(
        adisoUnificado.adiso.contacto,
        adisoUnificado.adiso.titulo,
        adisoUnificado.adiso.categoria,
        adisoUnificado.adiso.id
      );
      window.open(url, '_blank');
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
              disabled={publicando}
              style={{
                flex: 1,
                padding: '0.625rem',
                backgroundColor: publicando ? 'var(--text-tertiary)' : 'var(--text-primary)',
                color: 'var(--bg-primary)',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: publicando ? 'not-allowed' : 'pointer',
                opacity: publicando ? 0.6 : 1
              }}
            >
              {publicando ? 'Publicando...' : 'Publicar Gratis'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrarFormulario(false);
                setFormData({ categoria: 'empleos', titulo: '', contacto: '' });
              }}
              disabled={publicando}
              style={{
                padding: '0.625rem 1rem',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '0.875rem',
                cursor: publicando ? 'not-allowed' : 'pointer',
                opacity: publicando ? 0.6 : 1
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

      {/* Lista compacta de TODOS los adisos (paga + gratis) ordenados por fecha */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {cargando ? (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>
            Cargando...
          </div>
        ) : adisosOrdenados.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
            <div>No hay adisos aún</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {adisosOrdenados.map((adisoUnificado) => {
              const IconComponent = adisoUnificado.tipo === 'paga'
                ? getCategoriaIcon(adisoUnificado.adiso.categoria)
                : getCategoriaIcon(adisoUnificado.adiso.categoria);
              
              const esPaga = adisoUnificado.tipo === 'paga';
              const titulo = esPaga ? adisoUnificado.adiso.titulo : adisoUnificado.adiso.titulo;
              const descripcion = esPaga ? adisoUnificado.adiso.descripcion : undefined;
              const tamaño = esPaga ? adisoUnificado.adiso.tamaño : undefined;
              const contacto = esPaga ? adisoUnificado.adiso.contacto : adisoUnificado.adiso.contacto;
              const categoria = esPaga ? adisoUnificado.adiso.categoria : adisoUnificado.adiso.categoria;
              const id = esPaga ? adisoUnificado.adiso.id : adisoUnificado.adiso.id;

              return (
                <div
                  key={id}
                  style={{
                    padding: '0.625rem 0.75rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    opacity: esPaga ? 1 : 0.75,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                    e.currentTarget.style.borderColor = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                  onClick={() => handleClickTitulo(adisoUnificado)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleClickTitulo(adisoUnificado);
                    }
                  }}
                  aria-label={`Contactar sobre ${titulo} por WhatsApp`}
                >
                  {/* Línea principal: Icono + Título + Badge */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    minHeight: '24px'
                  }}>
                    <IconComponent size={16} color={esPaga ? undefined : 'var(--text-tertiary)'} />
                    <span 
                      style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 500, 
                        color: esPaga ? 'var(--text-primary)' : 'var(--text-secondary)',
                        flex: 1,
                        lineHeight: '1.4',
                        wordBreak: 'break-word'
                      }}
                      title={titulo}
                    >
                      {titulo}
                    </span>
                    {esPaga && tamaño && (
                      <span 
                        style={{ 
                          fontSize: '0.7rem',
                          padding: '0.125rem 0.375rem',
                          backgroundColor: 'var(--text-primary)',
                          color: 'var(--bg-primary)',
                          borderRadius: '4px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}
                      >
                        {tamaño}
                      </span>
                    )}
                    {!esPaga && (
                      <span 
                        style={{ 
                          fontSize: '0.65rem',
                          padding: '0.125rem 0.375rem',
                          backgroundColor: '#25D366',
                          color: 'white',
                          borderRadius: '4px',
                          fontWeight: 600,
                          opacity: 0.8,
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}
                      >
                        Gratis
                      </span>
                    )}
                    <IconWhatsApp 
                      size={14} 
                      style={{ 
                        color: '#25D366', 
                        opacity: 0.7,
                        flexShrink: 0
                      }} 
                    />
                  </div>
                  
                  {/* Descripción solo para adisos de paga */}
                  {esPaga && descripcion && (
                    <div 
                      style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-secondary)', 
                        lineHeight: '1.4',
                        paddingLeft: '1.5rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%'
                      }}
                      title={descripcion}
                    >
                      {descripcion}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
