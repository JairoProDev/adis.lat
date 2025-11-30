'use client';

// Forzar renderizado dinámico para evitar errores de prerender con useSearchParams en Vercel
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Adiso, Categoria } from '@/types';
import { getAdisos, getAdisoById, saveAdiso, getAdisosCache } from '@/lib/storage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { getBusquedaUrl } from '@/lib/utils';
import Header from '@/components/Header';
import Buscador from '@/components/Buscador';
import FiltrosCategoria from '@/components/FiltrosCategoria';
import GrillaAdisos from '@/components/GrillaAdisos';
import ModalAdiso from '@/components/ModalAdiso';
import FormularioPublicar from '@/components/FormularioPublicar';
import SkeletonAdisos from '@/components/SkeletonAdisos';
import { ToastContainer } from '@/components/Toast';
import FeedbackButton from '@/components/FeedbackButton';
import SidebarDesktop, { SeccionSidebar } from '@/components/SidebarDesktop';
import ModalNavegacionMobile from '@/components/ModalNavegacionMobile';
import NavbarMobile from '@/components/NavbarMobile';

type SeccionMobile = 'adiso' | 'mapa' | 'publicar' | 'chatbot' | 'gratuitos';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adisoId = searchParams.get('adiso');
  const categoriaUrl = searchParams.get('categoria') as Categoria | null;
  const buscarUrl = searchParams.get('buscar') || '';
  const cargadoInicialmente = useRef(false);
  
  const [adisos, setAdisos] = useState<Adiso[]>([]);
  const [adisosFiltrados, setAdisosFiltrados] = useState<Adiso[]>([]);
  const [busqueda, setBusqueda] = useState(buscarUrl);
  const busquedaDebounced = useDebounce(busqueda, 300);
  const [categoriaFiltro, setCategoriaFiltro] = useState<Categoria | 'todos'>(categoriaUrl && ['empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad'].includes(categoriaUrl) ? categoriaUrl : 'todos');
  const [adisoAbierto, setAdisoAbierto] = useState<Adiso | null>(null);
  const [indiceAdisoActual, setIndiceAdisoActual] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [modalMobileAbierto, setModalMobileAbierto] = useState(false);
  const [seccionMobileInicial, setSeccionMobileInicial] = useState<SeccionMobile>('adiso');
  const [seccionMobileActiva, setSeccionMobileActiva] = useState<SeccionSidebar | null>(null);
  const [seccionSidebarInicial, setSeccionSidebarInicial] = useState<SeccionSidebar | undefined>(undefined);
  const [isSidebarMinimizado, setIsSidebarMinimizado] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { toasts, removeToast, success, error } = useToast();

  // Carga inicial: mostrar cache primero (instantáneo), luego actualizar desde API
  useEffect(() => {
    if (cargadoInicialmente.current) return;
    cargadoInicialmente.current = true;

    const cargarTodo = async () => {
      // Mostrar cache primero (instantáneo, síncrono)
      const cache = getAdisosCache();
      if (cache.length > 0) {
        setAdisos(cache);
        setAdisosFiltrados(cache);
        setCargando(false);
        
        // Si hay adisoId, buscarlo en cache
        if (adisoId) {
          const adisoCache = cache.find(a => a.id === adisoId);
          if (adisoCache) {
            setAdisoAbierto(adisoCache);
            const indice = cache.findIndex(a => a.id === adisoId);
            setIndiceAdisoActual(indice >= 0 ? indice : 0);
            // En mobile, abrir sección de adiso si no es desktop
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              setSeccionMobileActiva('adiso');
            }
          } else {
            // Si no está en cache, cargarlo primero
            const adisoEspecifico = await getAdisoById(adisoId);
            if (adisoEspecifico) {
              setAdisoAbierto(adisoEspecifico);
              setAdisos(prev => [adisoEspecifico, ...prev]);
              setAdisosFiltrados(prev => [adisoEspecifico, ...prev]);
              setIndiceAdisoActual(0);
              // En mobile, abrir sección de adiso si no es desktop
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setSeccionMobileActiva('adiso');
              }
            }
          }
        }
      }
      
      // Actualizar desde API en background
      try {
        const adisosDesdeAPI = await getAdisos();
        if (adisosDesdeAPI.length > 0 || cache.length === 0) {
          // Merge inteligente usando Map para evitar duplicados
          setAdisos(prev => {
            const adisosMap = new Map<string, Adiso>();
            // Primero agregar adisos desde API
            adisosDesdeAPI.forEach(adiso => {
              adisosMap.set(adiso.id, adiso);
            });
            // Luego agregar adisos locales que no están en API (pueden ser recién publicados)
            prev.forEach(adisoLocal => {
              if (!adisosMap.has(adisoLocal.id)) {
                adisosMap.set(adisoLocal.id, adisoLocal);
              }
            });
            return Array.from(adisosMap.values());
          });
          
          setAdisosFiltrados(prev => {
            const adisosMap = new Map<string, Adiso>();
            // Primero agregar adisos desde API
            adisosDesdeAPI.forEach(adiso => {
              adisosMap.set(adiso.id, adiso);
            });
            // Luego agregar adisos locales que no están en API
            prev.forEach(adisoLocal => {
              if (!adisosMap.has(adisoLocal.id)) {
                adisosMap.set(adisoLocal.id, adisoLocal);
              }
            });
            return Array.from(adisosMap.values());
          });
          
          // Si hay adisoId, buscar en la lista actualizada
          if (adisoId) {
            setAdisos(prev => {
              const adisoEncontrado = prev.find(a => a.id === adisoId);
              if (adisoEncontrado) {
                setAdisoAbierto(adisoEncontrado);
                const indice = prev.findIndex(a => a.id === adisoId);
                setIndiceAdisoActual(indice >= 0 ? indice : 0);
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

  // Manejar cambios en adisoId cuando ya está cargado (solo actualizar modal, no recargar página)
  useEffect(() => {
    if (cargando) return; // Esperar a que termine la carga inicial
    
    if (!adisoId) {
      setAdisoAbierto(null);
      return;
    }

    // Buscar en adisos actuales primero (más rápido)
    const adisoLocal = adisos.find(a => a.id === adisoId);
    if (adisoLocal) {
      setAdisoAbierto(adisoLocal);
      const indice = adisosFiltrados.findIndex(a => a.id === adisoId);
      setIndiceAdisoActual(indice >= 0 ? indice : adisos.findIndex(a => a.id === adisoId));
      // En mobile, abrir sección de adiso
      if (!isDesktop) {
        setSeccionMobileActiva('adiso');
      }
      return;
    }

    // Si no está en local, cargarlo en background (sin bloquear UI)
        getAdisoById(adisoId).then(adiso => {
          if (adiso) {
            setAdisoAbierto(adiso);
            // Agregar a la lista si no existe
            setAdisos(prev => {
              if (!prev.find(a => a.id === adisoId)) {
                return [adiso, ...prev];
              }
              return prev;
            });
            setAdisosFiltrados(prev => {
              if (!prev.find(a => a.id === adisoId)) {
                return [adiso, ...prev];
              }
              return prev;
            });
            const indice = adisosFiltrados.findIndex(a => a.id === adisoId);
            setIndiceAdisoActual(indice >= 0 ? indice : 0);
            // En mobile, abrir sección de adiso si no es desktop
            if (!isDesktop) {
              setSeccionMobileActiva('adiso');
            }
          }
        }).catch(console.error);
  }, [adisoId, adisos, adisosFiltrados, cargando]);

  // Filtrado y ordenamiento (siempre más recientes primero, sin opción de cambiar)
  useEffect(() => {
    let filtrados = [...adisos]; // Crear copia para no mutar

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

    setAdisosFiltrados(filtrados);
    
    // Actualizar índice si el adiso abierto sigue visible
    if (adisoAbierto) {
      const nuevoIndice = filtrados.findIndex(a => a.id === adisoAbierto.id);
      if (nuevoIndice >= 0) {
        setIndiceAdisoActual(nuevoIndice);
      }
    }
  }, [busquedaDebounced, categoriaFiltro, adisos, adisoAbierto]);

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
    
    // Mantener adiso si está abierto
    if (adisoId) {
      params.set('adiso', adisoId);
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
  }, [busquedaDebounced, categoriaFiltro, adisoId, router]);

  const handlePublicar = (nuevoAdiso: Adiso) => {
    // Optimistic update: mostrar inmediatamente
    // Prevenir duplicados: verificar si el adiso ya existe
    const adisoExiste = adisos.find(a => a.id === nuevoAdiso.id);
    
    let adisosActualizados: Adiso[];
    if (adisoExiste) {
      // Actualización: reemplazar el adiso existente
      adisosActualizados = adisos.map(a => a.id === nuevoAdiso.id ? nuevoAdiso : a);
    } else {
      // Nuevo adiso: agregar al inicio
      adisosActualizados = [nuevoAdiso, ...adisos];
    }
    
    setAdisos(adisosActualizados);
    
    // El useEffect se encargará de recalcular filtrados y ordenamiento (más recientes primero) automáticamente
    
    // Solo abrir modal si es un adiso nuevo
    if (!adisoExiste) {
      setAdisoAbierto(nuevoAdiso);
      setIndiceAdisoActual(0);
      // En mobile, abrir sección de adiso automáticamente
      if (!isDesktop) {
        setSeccionMobileActiva('adiso');
      }
      // Actualizar URL sin recargar la página
      const params = new URLSearchParams(searchParams.toString());
      params.set('adiso', nuevoAdiso.id);
      router.replace(`/?${params.toString()}`, { scroll: false });
      success('¡Adiso publicado exitosamente!');
    } else {
      // Si es una actualización (con imagen), actualizar el modal si está abierto
      if (adisoAbierto?.id === nuevoAdiso.id) {
        setAdisoAbierto(nuevoAdiso);
      }
    }
  };

  const handleAbrirAdiso = (adiso: Adiso) => {
    const indice = adisosFiltrados.findIndex(a => a.id === adiso.id);
    setIndiceAdisoActual(indice >= 0 ? indice : 0);
    setAdisoAbierto(adiso);
    
    // En mobile, abrir sección de adiso automáticamente
    if (!isDesktop) {
      setSeccionMobileActiva('adiso');
    }
    
    // Actualizar URL sin recargar la página
    const params = new URLSearchParams(searchParams.toString());
    params.set('adiso', adiso.id);
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const handleCambiarSeccionMobile = (seccion: SeccionSidebar) => {
    // Si selecciona la misma sección que está activa, cerrarla (toggle)
    if (seccionMobileActiva === seccion) {
      setSeccionMobileActiva(null);
      return;
    }
    
    // Cambiar a la nueva sección
    setSeccionMobileActiva(seccion);
    
    // Si selecciona adiso y hay adiso abierto, mantenerlo visible
    // Si selecciona otra sección, el overlay mostrará esa sección
  };

  const handleCerrarSeccionMobile = () => {
    setSeccionMobileActiva(null);
    // No cerrar el adiso, solo cerrar el overlay
    // El adiso puede seguir abierto y el usuario puede volver a verlo tocando "Adiso" en el navbar
  };

  const handleCerrarAdiso = () => {
    setAdisoAbierto(null);
    // En mobile, si estaba en sección de adiso, cerrarla también
    if (!isDesktop && seccionMobileActiva === 'adiso') {
      setSeccionMobileActiva(null);
    }
    router.push('/', { scroll: false });
  };

  const handleAnterior = () => {
    if (indiceAdisoActual > 0) {
      const nuevoIndice = indiceAdisoActual - 1;
      const adiso = adisosFiltrados[nuevoIndice];
      setIndiceAdisoActual(nuevoIndice);
      setAdisoAbierto(adiso);
      // Actualizar URL sin recargar la página
      const params = new URLSearchParams(searchParams.toString());
      params.set('adiso', adiso.id);
      router.replace(`/?${params.toString()}`, { scroll: false });
    }
  };

  const handleSiguiente = () => {
    if (indiceAdisoActual < adisosFiltrados.length - 1) {
      const nuevoIndice = indiceAdisoActual + 1;
      const adiso = adisosFiltrados[nuevoIndice];
      setIndiceAdisoActual(nuevoIndice);
      setAdisoAbierto(adiso);
      // Actualizar URL sin recargar la página
      const params = new URLSearchParams(searchParams.toString());
      params.set('adiso', adiso.id);
      router.replace(`/?${params.toString()}`, { scroll: false });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header onChangelogClick={() => router.push('/progreso')} />
      <main id="main-content" style={{
        flex: 1,
        padding: '1rem',
        paddingBottom: isDesktop ? '1rem' : '5rem', // Espacio para navbar mobile permanente
        maxWidth: isDesktop 
          ? `calc(100% - ${isSidebarMinimizado ? 60 : 420}px)` 
          : '1400px',
        margin: '0 auto',
        width: '100%',
        transition: 'max-width 0.3s ease, margin-right 0.3s ease, padding-bottom 0.3s ease',
        ...(isDesktop && { marginRight: `${isSidebarMinimizado ? 60 : 420}px` })
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
              // Mantener adiso si está abierto
              if (adisoId) {
                params.set('adiso', adisoId);
              } else {
                params.delete('adiso');
              }
              const newUrl = params.toString() ? `/?${params.toString()}` : '/';
              router.push(newUrl, { scroll: false });
            }}
          />
        </div>
        {cargando ? (
          <SkeletonAdisos />
        ) : (
            <>
              {adisosFiltrados.length > 0 && (
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
                    Mostrando {adisosFiltrados.length} {adisosFiltrados.length === 1 ? 'adiso' : 'adisos'}
                    {(busqueda || categoriaFiltro !== 'todos') && ` (de ${adisos.length} total)`}
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
              <GrillaAdisos
                adisos={adisosFiltrados}
                onAbrirAdiso={handleAbrirAdiso}
                adisoSeleccionadoId={adisoAbierto?.id}
                espacioAdicional={isSidebarMinimizado ? 360 : 0}
              />
              {adisosFiltrados.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: 'var(--text-secondary)'
                }}>
                  {busqueda || categoriaFiltro !== 'todos'
                    ? 'No se encontraron adisos con esos filtros'
                    : 'Aún no hay adisos publicados'}
                </div>
              )}
            </>
        )}
      </main>
      <FeedbackButton />
      
      {/* Sidebar Desktop - siempre visible */}
      {isDesktop && (
        <SidebarDesktop
          adisoAbierto={adisoAbierto}
          onCerrarAdiso={handleCerrarAdiso}
          onAnterior={handleAnterior}
          onSiguiente={handleSiguiente}
          puedeAnterior={indiceAdisoActual > 0}
          puedeSiguiente={indiceAdisoActual < adisosFiltrados.length - 1}
          onPublicar={handlePublicar}
          onError={(msg) => error(msg)}
          onSuccess={(msg) => success(msg)}
          seccionInicial={seccionSidebarInicial}
          onMinimizadoChange={setIsSidebarMinimizado}
        />
      )}

      {/* Navbar Mobile - siempre visible en mobile */}
      {!isDesktop && (
        <NavbarMobile
          seccionActiva={seccionMobileActiva || (adisoAbierto ? 'adiso' : null)}
          onCambiarSeccion={handleCambiarSeccionMobile}
          tieneAdisoAbierto={!!adisoAbierto}
        />
      )}

      {/* Modal Mobile Overlay - solo cuando hay sección activa */}
      {!isDesktop && seccionMobileActiva && (
        <ModalNavegacionMobile
          abierto={!!seccionMobileActiva}
          onCerrar={handleCerrarSeccionMobile}
          seccionInicial={seccionMobileActiva}
          adisoAbierto={adisoAbierto}
          onCerrarAdiso={handleCerrarAdiso}
          onAnterior={handleAnterior}
          onSiguiente={handleSiguiente}
          puedeAnterior={indiceAdisoActual > 0}
          puedeSiguiente={indiceAdisoActual < adisosFiltrados.length - 1}
          onPublicar={handlePublicar}
          onError={(msg) => error(msg)}
          onSuccess={(msg) => success(msg)}
          onCambiarSeccion={handleCambiarSeccionMobile}
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
