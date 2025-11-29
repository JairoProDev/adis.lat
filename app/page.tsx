'use client';

// Forzar renderizado dinámico para evitar errores de prerender con useSearchParams en Vercel
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Aviso, Categoria } from '@/types';
import { getAvisos, getAvisoById, saveAviso, getAvisosCache } from '@/lib/storage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { getBusquedaUrl } from '@/lib/utils';
import Header from '@/components/Header';
import Buscador from '@/components/Buscador';
import FiltrosCategoria from '@/components/FiltrosCategoria';
import GrillaAvisos from '@/components/GrillaAvisos';
import ModalAviso from '@/components/ModalAviso';
import BotonPublicar from '@/components/BotonPublicar';
import FormularioPublicar from '@/components/FormularioPublicar';
import SkeletonAvisos from '@/components/SkeletonAvisos';
import { ToastContainer } from '@/components/Toast';
import FeedbackButton from '@/components/FeedbackButton';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const avisoId = searchParams.get('aviso');
  const categoriaUrl = searchParams.get('categoria') as Categoria | null;
  const buscarUrl = searchParams.get('buscar') || '';
  const cargadoInicialmente = useRef(false);
  
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [avisosFiltrados, setAvisosFiltrados] = useState<Aviso[]>([]);
  const [busqueda, setBusqueda] = useState(buscarUrl);
  const busquedaDebounced = useDebounce(busqueda, 300);
  const [categoriaFiltro, setCategoriaFiltro] = useState<Categoria | 'todos'>(categoriaUrl && ['empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad'].includes(categoriaUrl) ? categoriaUrl : 'todos');
  const [avisoAbierto, setAvisoAbierto] = useState<Aviso | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [indiceAvisoActual, setIndiceAvisoActual] = useState(0);
  const [cargando, setCargando] = useState(true);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { toasts, removeToast, success, error } = useToast();

  // Carga inicial: mostrar cache primero (instantáneo), luego actualizar desde API
  useEffect(() => {
    if (cargadoInicialmente.current) return;
    cargadoInicialmente.current = true;

    const cargarTodo = async () => {
      // Mostrar cache primero (instantáneo, síncrono)
      const cache = getAvisosCache();
      if (cache.length > 0) {
        setAvisos(cache);
        setAvisosFiltrados(cache);
        setCargando(false);
        
        // Si hay avisoId, buscarlo en cache
        if (avisoId) {
          const avisoCache = cache.find(a => a.id === avisoId);
          if (avisoCache) {
            setAvisoAbierto(avisoCache);
            const indice = cache.findIndex(a => a.id === avisoId);
            setIndiceAvisoActual(indice >= 0 ? indice : 0);
          } else {
            // Si no está en cache, cargarlo primero
            const avisoEspecifico = await getAvisoById(avisoId);
            if (avisoEspecifico) {
              setAvisoAbierto(avisoEspecifico);
              setAvisos(prev => [avisoEspecifico, ...prev]);
              setAvisosFiltrados(prev => [avisoEspecifico, ...prev]);
              setIndiceAvisoActual(0);
            }
          }
        }
      }
      
      // Actualizar desde API en background
      try {
        const avisosDesdeAPI = await getAvisos();
        if (avisosDesdeAPI.length > 0 || cache.length === 0) {
          // Merge inteligente: mantener avisos locales que no están en API (avisos recién publicados)
          setAvisos(prev => {
            const avisosMergeados = [...avisosDesdeAPI];
            // Agregar avisos locales que no están en API (pueden ser recién publicados)
            prev.forEach(avisoLocal => {
              if (!avisosDesdeAPI.find(a => a.id === avisoLocal.id)) {
                avisosMergeados.unshift(avisoLocal);
              }
            });
            return avisosMergeados;
          });
          
          setAvisosFiltrados(prev => {
            const avisosMergeados = [...avisosDesdeAPI];
            // Agregar avisos locales que no están en API
            prev.forEach(avisoLocal => {
              if (!avisosDesdeAPI.find(a => a.id === avisoLocal.id)) {
                avisosMergeados.unshift(avisoLocal);
              }
            });
            return avisosMergeados;
          });
          
          // Si hay avisoId, buscar en la lista actualizada
          if (avisoId) {
            setAvisos(prev => {
              const avisoEncontrado = prev.find(a => a.id === avisoId);
              if (avisoEncontrado) {
                setAvisoAbierto(avisoEncontrado);
                const indice = prev.findIndex(a => a.id === avisoId);
                setIndiceAvisoActual(indice >= 0 ? indice : 0);
              }
              return prev;
            });
          }
        }
      } catch (error) {
        console.error('Error al actualizar desde API:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarTodo();
  }, []);

  // Manejar cambios en avisoId cuando ya está cargado (solo actualizar modal, no recargar página)
  useEffect(() => {
    if (cargando) return; // Esperar a que termine la carga inicial
    
    if (!avisoId) {
      setAvisoAbierto(null);
      return;
    }

    // Buscar en avisos actuales primero (más rápido)
    const avisoLocal = avisos.find(a => a.id === avisoId);
    if (avisoLocal) {
      setAvisoAbierto(avisoLocal);
      const indice = avisosFiltrados.findIndex(a => a.id === avisoId);
      setIndiceAvisoActual(indice >= 0 ? indice : avisos.findIndex(a => a.id === avisoId));
      return;
    }

    // Si no está en local, cargarlo en background (sin bloquear UI)
    getAvisoById(avisoId).then(aviso => {
      if (aviso) {
        setAvisoAbierto(aviso);
        // Agregar a la lista si no existe
        setAvisos(prev => {
          if (!prev.find(a => a.id === avisoId)) {
            return [aviso, ...prev];
          }
          return prev;
        });
        setAvisosFiltrados(prev => {
          if (!prev.find(a => a.id === avisoId)) {
            return [aviso, ...prev];
          }
          return prev;
        });
        const indice = avisosFiltrados.findIndex(a => a.id === avisoId);
        setIndiceAvisoActual(indice >= 0 ? indice : 0);
      }
    }).catch(console.error);
  }, [avisoId, avisos, avisosFiltrados, cargando]);

  // Filtrado y ordenamiento (siempre más recientes primero, sin opción de cambiar)
  useEffect(() => {
    let filtrados = [...avisos]; // Crear copia para no mutar

    // Filtrar por categoría
    if (categoriaFiltro !== 'todos') {
      filtrados = filtrados.filter(a => a.categoria === categoriaFiltro);
    }

    // Filtrar por búsqueda
    if (busquedaDebounced.trim()) {
      const busquedaLower = busquedaDebounced.toLowerCase();
      filtrados = filtrados.filter(
        a =>
          a.titulo.toLowerCase().includes(busquedaLower) ||
          a.descripcion.toLowerCase().includes(busquedaLower) ||
          a.ubicacion.toLowerCase().includes(busquedaLower)
      );
    }

    // Ordenar siempre por más recientes primero
    filtrados.sort((a, b) => {
      // Parsear fechas de forma simple
      const fechaA = new Date(`${a.fechaPublicacion}T${a.horaPublicacion}:00`).getTime();
      const fechaB = new Date(`${b.fechaPublicacion}T${b.horaPublicacion}:00`).getTime();
      
      // Si alguna fecha es inválida, ponerla al final
      if (isNaN(fechaA)) return 1;
      if (isNaN(fechaB)) return -1;

      // Más recientes primero: mayor timestamp primero
      return fechaB - fechaA;
    });

    setAvisosFiltrados(filtrados);
    
    // Actualizar índice si el aviso abierto sigue visible
    if (avisoAbierto) {
      const nuevoIndice = filtrados.findIndex(a => a.id === avisoAbierto.id);
      if (nuevoIndice >= 0) {
        setIndiceAvisoActual(nuevoIndice);
      }
    }
  }, [busquedaDebounced, categoriaFiltro, avisos, avisoAbierto]);

  // Actualizar URL cuando cambian búsqueda o categoría (después del debounce)
  useEffect(() => {
    const params = new URLSearchParams();
    
    // Agregar categoría si no es "todos"
    if (categoriaFiltro !== 'todos') {
      params.set('categoria', categoriaFiltro);
    }
    
    // Agregar búsqueda si existe
    if (busquedaDebounced.trim()) {
      params.set('buscar', busquedaDebounced.trim());
    }
    
    // Mantener aviso si está abierto
    if (avisoId) {
      params.set('aviso', avisoId);
    }
    
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    const currentUrl = window.location.search;
    const currentParams = new URLSearchParams(currentUrl);
    
    // Solo actualizar si hay cambios
    const hasChanges = 
      (categoriaFiltro === 'todos' ? currentParams.has('categoria') : currentParams.get('categoria') !== categoriaFiltro) ||
      (busquedaDebounced.trim() ? currentParams.get('buscar') !== busquedaDebounced.trim() : currentParams.has('buscar'));
    
    if (hasChanges) {
      router.replace(newUrl, { scroll: false });
    }
  }, [busquedaDebounced, categoriaFiltro, avisoId, router]);

  const handlePublicar = (nuevoAviso: Aviso) => {
    // Optimistic update: mostrar inmediatamente
    // Prevenir duplicados: verificar si el aviso ya existe
    const avisoExiste = avisos.find(a => a.id === nuevoAviso.id);
    
    let avisosActualizados: Aviso[];
    if (avisoExiste) {
      // Actualización: reemplazar el aviso existente
      avisosActualizados = avisos.map(a => a.id === nuevoAviso.id ? nuevoAviso : a);
    } else {
      // Nuevo aviso: agregar al inicio
      avisosActualizados = [nuevoAviso, ...avisos];
    }
    
    setAvisos(avisosActualizados);
    
    // El useEffect se encargará de recalcular filtrados y ordenamiento (más recientes primero) automáticamente
    
    // Solo cerrar formulario y abrir modal si es un aviso nuevo
    if (!avisoExiste) {
      setMostrarFormulario(false);
      setAvisoAbierto(nuevoAviso);
      setIndiceAvisoActual(0);
      // Actualizar URL sin recargar la página
      const params = new URLSearchParams(searchParams.toString());
      params.set('aviso', nuevoAviso.id);
      router.replace(`/?${params.toString()}`, { scroll: false });
      success('¡Aviso publicado exitosamente!');
    } else {
      // Si es una actualización (con imagen), actualizar el modal si está abierto
      if (avisoAbierto?.id === nuevoAviso.id) {
        setAvisoAbierto(nuevoAviso);
      }
    }
  };

  const handleAbrirAviso = (aviso: Aviso) => {
    const indice = avisosFiltrados.findIndex(a => a.id === aviso.id);
    setIndiceAvisoActual(indice >= 0 ? indice : 0);
    setAvisoAbierto(aviso);
    // Actualizar URL sin recargar la página
    const params = new URLSearchParams(searchParams.toString());
    params.set('aviso', aviso.id);
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const handleCerrarAviso = () => {
    setAvisoAbierto(null);
    router.push('/', { scroll: false });
  };

  const handleAnterior = () => {
    if (indiceAvisoActual > 0) {
      const nuevoIndice = indiceAvisoActual - 1;
      const aviso = avisosFiltrados[nuevoIndice];
      setIndiceAvisoActual(nuevoIndice);
      setAvisoAbierto(aviso);
      // Actualizar URL sin recargar la página
      const params = new URLSearchParams(searchParams.toString());
      params.set('aviso', aviso.id);
      router.replace(`/?${params.toString()}`, { scroll: false });
    }
  };

  const handleSiguiente = () => {
    if (indiceAvisoActual < avisosFiltrados.length - 1) {
      const nuevoIndice = indiceAvisoActual + 1;
      const aviso = avisosFiltrados[nuevoIndice];
      setIndiceAvisoActual(nuevoIndice);
      setAvisoAbierto(aviso);
      // Actualizar URL sin recargar la página
      const params = new URLSearchParams(searchParams.toString());
      params.set('aviso', aviso.id);
      router.replace(`/?${params.toString()}`, { scroll: false });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header onChangelogClick={() => router.push('/progreso')} />
      <main style={{
        flex: 1,
        padding: '1rem',
        maxWidth: avisoAbierto && isDesktop ? 'calc(100% - 420px)' : '1400px',
        margin: '0 auto',
        width: '100%',
        transition: 'max-width 0.3s ease',
        ...(avisoAbierto && isDesktop && { marginRight: '420px' })
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Buscador 
            value={busqueda} 
            onChange={(value) => {
              setBusqueda(value);
              // Actualizar URL cuando el usuario deja de escribir (debounce)
              // Esto se hace en un useEffect separado para evitar demasiadas actualizaciones
            }} 
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <FiltrosCategoria
            categoriaSeleccionada={categoriaFiltro}
            onChange={(categoria) => {
              setCategoriaFiltro(categoria);
              // Actualizar URL sin recargar
              const params = new URLSearchParams(searchParams.toString());
              if (categoria === 'todos') {
                params.delete('categoria');
              } else {
                params.set('categoria', categoria);
              }
              // Mantener búsqueda si existe
              if (busqueda.trim()) {
                params.set('buscar', busqueda.trim());
              } else {
                params.delete('buscar');
              }
              // Mantener aviso si está abierto
              if (avisoId) {
                params.set('aviso', avisoId);
              } else {
                params.delete('aviso');
              }
              const newUrl = params.toString() ? `/?${params.toString()}` : '/';
              router.push(newUrl, { scroll: false });
            }}
          />
        </div>
        {cargando ? (
          <SkeletonAvisos />
        ) : (
            <>
              {avisosFiltrados.length > 0 && (
                <div style={{
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  padding: '0.5rem 0',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <span>
                    Mostrando {avisosFiltrados.length} {avisosFiltrados.length === 1 ? 'aviso' : 'avisos'}
                    {(busqueda || categoriaFiltro !== 'todos') && ` (de ${avisos.length} total)`}
                  </span>
                  {(busqueda.trim() || categoriaFiltro !== 'todos') && (
                    <button
                      onClick={async () => {
                        const url = getBusquedaUrl(categoriaFiltro, busqueda);
                        try {
                          await navigator.clipboard.writeText(url);
                          success('Link de búsqueda copiado');
                        } catch (err) {
                          console.error('Error al copiar:', err);
                          error('Error al copiar link');
                        }
                      }}
                      style={{
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                      }}
                    >
                      📋 Compartir búsqueda
                    </button>
                  )}
                </div>
              )}
              <GrillaAvisos
                avisos={avisosFiltrados}
                onAbrirAviso={handleAbrirAviso}
                avisoSeleccionadoId={avisoAbierto?.id}
              />
              {avisosFiltrados.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: 'var(--text-secondary)'
                }}>
                  {busqueda || categoriaFiltro !== 'todos'
                    ? 'No se encontraron avisos con esos filtros'
                    : 'Aún no hay avisos publicados'}
                </div>
              )}
            </>
        )}
      </main>
      <BotonPublicar onClick={() => setMostrarFormulario(true)} />
      <FeedbackButton />
        {mostrarFormulario && (
          <FormularioPublicar
            onPublicar={handlePublicar}
            onCerrar={() => setMostrarFormulario(false)}
            onError={(msg) => error(msg)}
            onSuccess={(msg) => success(msg)}
          />
        )}
      {avisoAbierto && (
        <ModalAviso
          aviso={avisoAbierto}
          onCerrar={handleCerrarAviso}
          onAnterior={handleAnterior}
          onSiguiente={handleSiguiente}
          puedeAnterior={indiceAvisoActual > 0}
          puedeSiguiente={indiceAvisoActual < avisosFiltrados.length - 1}
        />
      )}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando...</div>}>
      <HomeContent />
    </Suspense>
  );
}
