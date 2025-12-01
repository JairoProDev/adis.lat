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
import { useAuth } from '@/hooks/useAuth';
import { registrarBusqueda } from '@/lib/analytics';
import { onOnlineStatusChange, getOfflineMessage } from '@/lib/offline';
import dynamicImport from 'next/dynamic';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import Buscador from '@/components/Buscador';
import FiltrosCategoria from '@/components/FiltrosCategoria';
import Ordenamiento, { TipoOrdenamiento } from '@/components/Ordenamiento';
import GrillaAdisos from '@/components/GrillaAdisos';
import SkeletonAdisos from '@/components/SkeletonAdisos';
import { ToastContainer } from '@/components/Toast';
import FeedbackButton from '@/components/FeedbackButton';
import NavbarMobile from '@/components/NavbarMobile';

// Lazy load componentes pesados
const ModalAdiso = dynamicImport(() => import('@/components/ModalAdiso'), {
  loading: () => <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando adiso...</div>,
  ssr: false,
});

const FormularioPublicar = dynamicImport(() => import('@/components/FormularioPublicar'), {
  loading: () => <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando formulario...</div>,
  ssr: false,
});

const SidebarDesktop = dynamicImport(() => import('@/components/SidebarDesktop').then(mod => ({ default: mod.default })), {
  loading: () => null,
  ssr: false,
});

const ModalNavegacionMobile = dynamicImport(() => import('@/components/ModalNavegacionMobile'), {
  loading: () => null,
  ssr: false,
});

import type { SeccionSidebar } from '@/components/SidebarDesktop';

type SeccionMobile = 'adiso' | 'mapa' | 'publicar' | 'chatbot' | 'gratuitos';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const adisoId = searchParams.get('adiso');
  const categoriaUrl = searchParams.get('categoria') as Categoria | null;
  const buscarUrl = searchParams.get('buscar') || '';
  const cargadoInicialmente = useRef(false);
  
  const [adisos, setAdisos] = useState<Adiso[]>([]);
  const [adisosFiltrados, setAdisosFiltrados] = useState<Adiso[]>([]);
  const [busqueda, setBusqueda] = useState(buscarUrl);
  const busquedaDebounced = useDebounce(busqueda, 300);
  const [categoriaFiltro, setCategoriaFiltro] = useState<Categoria | 'todos'>(categoriaUrl && ['empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad'].includes(categoriaUrl) ? categoriaUrl : 'todos');
  const [ordenamiento, setOrdenamiento] = useState<TipoOrdenamiento>('recientes');
  const [adisoAbierto, setAdisoAbierto] = useState<Adiso | null>(null);
  const [indiceAdisoActual, setIndiceAdisoActual] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [modalMobileAbierto, setModalMobileAbierto] = useState(false);
  const [seccionMobileInicial, setSeccionMobileInicial] = useState<SeccionMobile>('gratuitos');
  const [seccionMobileActiva, setSeccionMobileActiva] = useState<SeccionSidebar | null>(null);
  const [seccionSidebarInicial, setSeccionSidebarInicial] = useState<SeccionSidebar | undefined>('gratuitos');
  const [isSidebarMinimizado, setIsSidebarMinimizado] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { toasts, removeToast, success, error } = useToast();
  const [isOnlineState, setIsOnlineState] = useState(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  // Detectar cambios en el estado de conexión
  useEffect(() => {
    const cleanup = onOnlineStatusChange((online) => {
      setIsOnlineState(online);
      if (!online) {
        error(getOfflineMessage());
      } else {
        success('Conexión restablecida');
      }
    });
    return cleanup;
  }, [error, success]);

  // Carga inicial: mostrar cache primero (instantáneo), luego actualizar desde API
  useEffect(() => {
    if (cargadoInicialmente.current) return;
    cargadoInicialmente.current = true;

    const cargarTodo = async () => {
      // Mostrar cache primero (instantáneo, síncrono)
      const cache = getAdisosCache();
      if (cache.length > 0) {
        // Solo actualizar adisos - el useEffect de ordenamiento se encargará de adisosFiltrados
        setAdisos(cache);
        setCargando(false);
        
        // Si hay adisoId, buscarlo en cache
        if (adisoId) {
          const adisoCache = cache.find(a => a.id === adisoId);
          if (adisoCache) {
            setAdisoAbierto(adisoCache);
            // En mobile, abrir sección de adiso si no es desktop
            if (!isDesktop) {
              setSeccionMobileActiva('adiso');
            }
          } else {
            // Si no está en cache, cargarlo primero
            const adisoEspecifico = await getAdisoById(adisoId);
            if (adisoEspecifico) {
              setAdisoAbierto(adisoEspecifico);
              setAdisos(prev => [adisoEspecifico, ...prev]);
              // En mobile, abrir sección de adiso si no es desktop
              if (!isDesktop) {
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
          // Solo actualizar adisos - el useEffect de ordenamiento se encargará de adisosFiltrados
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
          
          // Si hay adisoId, buscar en la lista actualizada
          if (adisoId) {
            setAdisos(prev => {
              const adisoEncontrado = prev.find(a => a.id === adisoId);
              if (adisoEncontrado) {
                setAdisoAbierto(adisoEncontrado);
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
        // Agregar a la lista si no existe - el useEffect de ordenamiento se encargará de adisosFiltrados
        setAdisos(prev => {
          if (!prev.find(a => a.id === adisoId)) {
            return [adiso, ...prev];
          }
          return prev;
        });
        // En mobile, abrir sección de adiso si no es desktop
        if (!isDesktop) {
          setSeccionMobileActiva('adiso');
        }
      }
    }).catch(console.error);
  }, [adisoId, adisos, cargando, isDesktop]);

  // Filtrado y ordenamiento
  useEffect(() => {
    // Si no hay adisos, no hacer nada
    if (adisos.length === 0) {
      setAdisosFiltrados([]);
      return;
    }

    // Función auxiliar para parsear fechas - DEFINIDA DENTRO del useEffect
    const parsearFecha = (fechaPublicacion: string, horaPublicacion: string): number => {
      if (!fechaPublicacion) return 0;
      
      try {
        // Formato esperado: "YYYY-MM-DD" y "HH:MM"
        let hora = horaPublicacion || '00:00';
        
        // Normalizar formato de hora
        if (hora.length === 4) {
          // Si es "HHMM" sin los dos puntos, agregarlos
          hora = `${hora.substring(0, 2)}:${hora.substring(2)}`;
        } else if (hora.length !== 5) {
          // Si no tiene el formato correcto, intentar parsearlo
          hora = '00:00';
        }
        
        // Construir fecha completa en formato ISO
        const fechaStr = `${fechaPublicacion}T${hora}:00`;
        const fecha = new Date(fechaStr);
        
        // Verificar que la fecha sea válida
        if (isNaN(fecha.getTime())) {
          console.warn(`[Ordenamiento] Fecha inválida: ${fechaStr}`);
          return 0;
        }
        
        return fecha.getTime();
      } catch (error) {
        console.warn(`[Ordenamiento] Error parseando fecha: ${fechaPublicacion} ${horaPublicacion}`, error);
        return 0;
      }
    };

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
      
      // Registrar búsqueda (solo una vez por término)
      registrarBusqueda(user?.id, busquedaDebounced.trim(), filtrados.length);
    }

    // Ordenar según el tipo seleccionado
    // IMPORTANTE: Crear una nueva copia del array para que React detecte el cambio
    const filtradosOrdenados = [...filtrados].sort((a, b) => {
      switch (ordenamiento) {
        case 'recientes': {
          const fechaA = parsearFecha(a.fechaPublicacion, a.horaPublicacion);
          const fechaB = parsearFecha(b.fechaPublicacion, b.horaPublicacion);
          // Más recientes primero (fecha mayor primero)
          const comparacion = fechaB - fechaA;
          // Si las fechas son iguales, usar ID como desempate para orden consistente
          return comparacion !== 0 ? comparacion : a.id.localeCompare(b.id);
        }
        case 'antiguos': {
          const fechaA = parsearFecha(a.fechaPublicacion, a.horaPublicacion);
          const fechaB = parsearFecha(b.fechaPublicacion, b.horaPublicacion);
          // Más antiguos primero (fecha menor primero)
          const comparacion = fechaA - fechaB;
          // Si las fechas son iguales, usar ID como desempate para orden consistente
          return comparacion !== 0 ? comparacion : a.id.localeCompare(b.id);
        }
        case 'titulo-asc':
          return a.titulo.localeCompare(b.titulo, 'es', { sensitivity: 'base' });
        case 'titulo-desc':
          return b.titulo.localeCompare(a.titulo, 'es', { sensitivity: 'base' });
        default:
          return 0;
      }
    });

    // Debug: log para verificar que el ordenamiento funciona
    console.log(`[Ordenamiento] Tipo: ${ordenamiento}, Total: ${filtradosOrdenados.length}`);
    if (filtradosOrdenados.length > 0) {
      const primero = filtradosOrdenados[0];
      const ultimo = filtradosOrdenados[filtradosOrdenados.length - 1];
      const fechaPrimero = parsearFecha(primero.fechaPublicacion, primero.horaPublicacion);
      const fechaUltimo = parsearFecha(ultimo.fechaPublicacion, ultimo.horaPublicacion);
      console.log(`[Ordenamiento] Primero: ${primero.titulo} (${primero.fechaPublicacion} ${primero.horaPublicacion || '00:00'}) - timestamp: ${fechaPrimero}`);
      if (filtradosOrdenados.length > 1) {
        console.log(`[Ordenamiento] Último: ${ultimo.titulo} (${ultimo.fechaPublicacion} ${ultimo.horaPublicacion || '00:00'}) - timestamp: ${fechaUltimo}`);
      }
    }

    setAdisosFiltrados(filtradosOrdenados);
  }, [busquedaDebounced, categoriaFiltro, ordenamiento, adisos]);

  // Actualizar índice del adiso abierto cuando cambian los filtrados o el adiso abierto
  useEffect(() => {
    if (adisoAbierto && adisosFiltrados.length > 0) {
      const nuevoIndice = adisosFiltrados.findIndex(a => a.id === adisoAbierto.id);
      if (nuevoIndice >= 0) {
        setIndiceAdisoActual(nuevoIndice);
      }
    }
  }, [adisoAbierto, adisosFiltrados]);

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

  // Prefetch de imágenes de adisos relacionados cuando se abre un adiso
  useEffect(() => {
    if (!adisoAbierto || adisosFiltrados.length === 0) return;

    // Prefetch anterior si existe
    if (indiceAdisoActual > 0) {
      const anterior = adisosFiltrados[indiceAdisoActual - 1];
      if (anterior) {
        // Pre-cargar imágenes del adiso anterior
        if (anterior.imagenesUrls && anterior.imagenesUrls.length > 0) {
          anterior.imagenesUrls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.as = 'image';
            link.href = url;
            document.head.appendChild(link);
          });
        } else if (anterior.imagenUrl) {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.as = 'image';
          link.href = anterior.imagenUrl;
          document.head.appendChild(link);
        }
      }
    }

    // Prefetch siguiente si existe
    if (indiceAdisoActual < adisosFiltrados.length - 1) {
      const siguiente = adisosFiltrados[indiceAdisoActual + 1];
      if (siguiente) {
        // Pre-cargar imágenes del adiso siguiente
        if (siguiente.imagenesUrls && siguiente.imagenesUrls.length > 0) {
          siguiente.imagenesUrls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.as = 'image';
            link.href = url;
            document.head.appendChild(link);
          });
        } else if (siguiente.imagenUrl) {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.as = 'image';
          link.href = siguiente.imagenUrl;
          document.head.appendChild(link);
        }
      }
    }
  }, [adisoAbierto?.id, indiceAdisoActual, adisosFiltrados]);

  // Structured data para SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Buscadis',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://buscadis.com',
    description: 'Publica y encuentra adisos clasificados en Perú',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: typeof window !== 'undefined' ? `${window.location.origin}/?buscar={search_term_string}` : 'https://buscadis.com/?buscar={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
        <Header 
          onChangelogClick={() => router.push('/progreso')}
        />
        {([
          { label: 'Inicio', href: '/' },
          ...(categoriaFiltro !== 'todos' ? [{ label: categoriaFiltro, href: `/?categoria=${categoriaFiltro}` }] : []),
          ...(adisoAbierto ? [{ label: adisoAbierto.titulo }] : []),
        ].length > 1 || adisoAbierto) && (
          <div style={{
            padding: isDesktop ? '0.5rem 1.5rem' : '0.5rem 1rem',
            paddingRight: isDesktop ? 'calc(1.5rem + 80px)' : '1rem',
            maxWidth: '1400px',
            margin: '0 auto',
          }}>
            <Breadcrumbs items={[
              { label: 'Inicio', href: '/' },
              ...(categoriaFiltro !== 'todos' ? [{ label: categoriaFiltro, href: `/?categoria=${categoriaFiltro}` }] : []),
              ...(adisoAbierto ? [{ label: adisoAbierto.titulo }] : []),
            ]} />
          </div>
        )}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                  <Ordenamiento
                    valor={ordenamiento}
                    onChange={setOrdenamiento}
                  />
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
          todosLosAdisos={adisosFiltrados}
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
          todosLosAdisos={adisosFiltrados}
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
