'use client';

// Forzar renderizado dinámico para evitar errores de prerender con useSearchParams en Vercel
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Adiso, Categoria } from '@/types';
import { getAdisos, getAdisoById, saveAdiso, getAdisosCache } from '@/lib/storage';
import { getAdisosFromSupabase } from '@/lib/supabase';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { getBusquedaUrl } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { UbicacionDetallada } from '@/types';
import { useNavigation } from '@/contexts/NavigationContext';

// Función para calcular distancia entre dos puntos (Haversine)
function calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
import { registrarBusqueda } from '@/lib/analytics';
import { onOnlineStatusChange, getOfflineMessage } from '@/lib/offline';
import dynamicImport from 'next/dynamic';
import Header from '@/components/Header';
import {
  IconEmpleos,
  IconInmuebles,
  IconVehiculos,
  IconServicios,
  IconProductos,
  IconEventos,
  IconNegocios,
  IconComunidad
} from '@/components/Icons';
import Buscador from '@/components/Buscador';
import Ordenamiento, { TipoOrdenamiento } from '@/components/Ordenamiento';
import FiltroUbicacion from '@/components/FiltroUbicacion';
import GrillaAdisos from '@/components/GrillaAdisos';
import SkeletonAdisos from '@/components/SkeletonAdisos';
import { SkeletonAdisosGrid } from '@/components/SkeletonAdiso';
import { ToastContainer } from '@/components/Toast';
import FeedbackButton from '@/components/FeedbackButton';
import NavbarMobile from '@/components/NavbarMobile';
import LeftSidebar from '@/components/LeftSidebar';

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
  const { profile } = useUser();
  const adisoId = searchParams.get('adiso');
  const categoriaUrl = searchParams.get('categoria') as Categoria | null;
  const buscarUrl = searchParams.get('buscar') || '';
  const seccionUrl = searchParams.get('seccion') as SeccionSidebar | null;
  const cargadoInicialmente = useRef(false);

  const [adisos, setAdisos] = useState<Adiso[]>([]);
  const [adisosFiltrados, setAdisosFiltrados] = useState<Adiso[]>([]);
  const [busqueda, setBusqueda] = useState(buscarUrl);
  const busquedaDebounced = useDebounce(busqueda, 300);
  const [categoriaFiltro, setCategoriaFiltro] = useState<Categoria | 'todos'>(categoriaUrl && ['empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad'].includes(categoriaUrl) ? categoriaUrl : 'todos');
  const [ordenamiento, setOrdenamiento] = useState<TipoOrdenamiento>('recientes');
  const [filtroUbicacion, setFiltroUbicacion] = useState<{
    departamento?: string;
    provincia?: string;
    distrito?: string;
    radioKm?: number;
  } | undefined>(undefined);
  const [adisoAbierto, setAdisoAbierto] = useState<Adiso | null>(null);
  const [indiceAdisoActual, setIndiceAdisoActual] = useState(0);
  const [cargando, setCargando] = useState(true);
  // Estados para scroll infinito
  const [cargandoMas, setCargandoMas] = useState(false);
  const [hayMasAdisos, setHayMasAdisos] = useState(true);
  const ITEMS_POR_PAGINA = 100;
  const [modalMobileAbierto, setModalMobileAbierto] = useState(false);
  const [seccionMobileInicial, setSeccionMobileInicial] = useState<SeccionMobile>('gratuitos');
  const [seccionMobileActiva, setSeccionMobileActiva] = useState<SeccionSidebar | null>(seccionUrl === 'publicar' ? 'publicar' : null);
  const [seccionDesktopActiva, setSeccionDesktopActiva] = useState<SeccionSidebar>(seccionUrl === 'publicar' ? 'publicar' : 'adiso');
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
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

      // Actualizar desde API en background - cargar primera página
      try {
        const adisosDesdeAPI = await getAdisosFromSupabase({
          limit: ITEMS_POR_PAGINA,
          offset: 0,
          soloActivos: false // Mostrar todos, incluyendo históricos
        });

        if (adisosDesdeAPI.length > 0 || cache.length === 0) {
          // Si hay menos de ITEMS_POR_PAGINA, no hay más páginas
          setHayMasAdisos(adisosDesdeAPI.length === ITEMS_POR_PAGINA);

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
        } else {
          setHayMasAdisos(false);
        }
      } catch (error) {
        // Solo mostrar errores en desarrollo
        if (process.env.NODE_ENV === 'development') {
          console.error('Error al actualizar desde API:', error);
        }
        setHayMasAdisos(false);
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
          return 0;
        }

        return fecha.getTime();
      } catch (error) {
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
        a => {
          const tituloMatch = a.titulo.toLowerCase().includes(busquedaLower);
          const descripcionMatch = a.descripcion.toLowerCase().includes(busquedaLower);

          // Buscar en ubicación (string o UbicacionDetallada)
          let ubicacionMatch = false;
          if (typeof a.ubicacion === 'string') {
            ubicacionMatch = a.ubicacion.toLowerCase().includes(busquedaLower);
          } else if (typeof a.ubicacion === 'object' && a.ubicacion !== null) {
            const ubi = a.ubicacion as any;
            ubicacionMatch =
              (ubi.departamento?.toLowerCase().includes(busquedaLower)) ||
              (ubi.provincia?.toLowerCase().includes(busquedaLower)) ||
              (ubi.distrito?.toLowerCase().includes(busquedaLower)) ||
              (ubi.direccion?.toLowerCase().includes(busquedaLower));
          }

          return tituloMatch || descripcionMatch || ubicacionMatch;
        }
      );

      // Registrar búsqueda (solo una vez por término)
      registrarBusqueda(user?.id, busquedaDebounced.trim(), filtrados.length);
    }

    // Filtrar por ubicación
    if (filtroUbicacion) {
      filtrados = filtrados.filter(a => {
        // Solo filtrar adisos que tienen ubicación detallada
        if (typeof a.ubicacion !== 'object' || a.ubicacion === null || !('departamento' in a.ubicacion)) {
          return false; // Excluir adisos sin ubicación detallada
        }

        const ubi = a.ubicacion as any;

        // Filtrar por distrito (más específico)
        if (filtroUbicacion.distrito) {
          if (ubi.distrito !== filtroUbicacion.distrito) {
            // Si hay radio de búsqueda y coordenadas, verificar distancia
            if (filtroUbicacion.radioKm && ubi.latitud && ubi.longitud &&
              profile?.latitud && profile?.longitud) {
              const distancia = calcularDistanciaKm(
                profile.latitud,
                profile.longitud,
                ubi.latitud,
                ubi.longitud
              );
              return distancia <= (filtroUbicacion.radioKm || 5);
            }
            return false;
          }
        }

        // Filtrar por provincia
        if (filtroUbicacion.provincia && !filtroUbicacion.distrito) {
          if (ubi.provincia !== filtroUbicacion.provincia) return false;
        }

        // Filtrar por departamento
        if (filtroUbicacion.departamento && !filtroUbicacion.provincia) {
          if (ubi.departamento !== filtroUbicacion.departamento) return false;
        }

        // Si hay radio de búsqueda y coordenadas del usuario, verificar distancia
        if (filtroUbicacion.radioKm && ubi.latitud && ubi.longitud &&
          profile?.latitud && profile?.longitud) {
          const distancia = calcularDistanciaKm(
            profile.latitud,
            profile.longitud,
            ubi.latitud,
            ubi.longitud
          );
          return distancia <= (filtroUbicacion.radioKm || 5);
        }

        return true;
      });
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


    setAdisosFiltrados(filtradosOrdenados);
  }, [busquedaDebounced, categoriaFiltro, ordenamiento, adisos, filtroUbicacion, profile]);

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

  const { registrarOpener, desregistrarOpener } = useNavigation();

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

  // Registrar el manejador de apertura para componentes globales (como el Chatbot)
  useEffect(() => {
    registrarOpener((id: string) => {
      // Intentar encontrar el adiso en memoria primero
      const adisoLocal = adisos.find(a => a.id === id);
      if (adisoLocal) {
        handleAbrirAdiso(adisoLocal);
      } else {
        // En este caso, cambiamos el URL y dejamos que el useEffect de adisoId lo cargue
        // Esto mantiene la UI responsiva mientras carga
        const params = new URLSearchParams(window.location.search); // Usar window.location para asegurar estado actual
        params.set('adiso', id);
        router.replace(`/?${params.toString()}`, { scroll: false });
      }
    });

    return () => {
      desregistrarOpener();
    };
  }, [adisos, registrarOpener, desregistrarOpener, router]);

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

  // Estado para paginación
  const [paginaActual, setPaginaActual] = useState(1);

  // Función optimizada para cargar más anuncios (scroll infinito)
  const cargarMasAdisos = useCallback(async () => {
    if (cargandoMas || !hayMasAdisos) return;

    setCargandoMas(true);
    try {
      const siguientePagina = paginaActual + 1;
      const nuevosAdisos = await getAdisosFromSupabase({
        limit: ITEMS_POR_PAGINA,
        offset: adisos.length,
        soloActivos: false
      });

      if (nuevosAdisos.length > 0) {
        setAdisos(prev => {
          const adisosMap = new Map<string, Adiso>();
          // Agregar adisos existentes
          prev.forEach(adiso => adisosMap.set(adiso.id, adiso));
          // Agregar nuevos adisos
          nuevosAdisos.forEach(adiso => adisosMap.set(adiso.id, adiso));
          return Array.from(adisosMap.values());
        });

        // Si hay menos de ITEMS_POR_PAGINA, no hay más páginas
        const tieneMas = nuevosAdisos.length === ITEMS_POR_PAGINA;
        setHayMasAdisos(tieneMas);
        if (tieneMas) {
          setPaginaActual(siguientePagina);
        }
      } else {
        setHayMasAdisos(false);
      }
    } catch (error) {
      console.error('Error al cargar más adisos:', error);
      setHayMasAdisos(false);
    } finally {
      setCargandoMas(false);
    }
  }, [cargandoMas, hayMasAdisos, adisos.length, paginaActual]);

  // Usar hook profesional para infinite scroll
  const { sentinelRef } = useInfiniteScroll({
    hasMore: hayMasAdisos,
    isLoading: cargandoMas,
    onLoadMore: cargarMasAdisos,
    threshold: 200, // Cargar cuando queden 200px para el final
    enabled: !cargando && adisosFiltrados.length > 0
  });

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

  // Structured data para SEO - usar URL base consistente
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com';
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Buscadis',
    url: siteUrl,
    description: 'Publica y encuentra adisos clasificados en Perú',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/?buscar={search_term_string}`
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
        seccionActiva={seccionDesktopActiva}
        onSeccionChange={(seccion) => {
          setSeccionDesktopActiva(seccion);
          setIsSidebarMinimizado(false); // Expand sidebar when changing section via header
        }}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
      />
      {/* Category Bar - Horizontal Scroll */}
      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          justifyContent: isDesktop ? 'center' : 'flex-start',
          overflowX: 'auto',
          gap: '1rem',
          padding: '1rem',
          paddingBottom: '0.5rem',
          backgroundColor: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-color)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          alignItems: 'center',
          maxWidth: '100%',
        }}
      >
        {[
          { id: 'empleos', label: 'Empleos', Icon: IconEmpleos },
          { id: 'inmuebles', label: 'Inmuebles', Icon: IconInmuebles },
          { id: 'vehiculos', label: 'Vehículos', Icon: IconVehiculos },
          { id: 'servicios', label: 'Servicios', Icon: IconServicios },
          { id: 'productos', label: 'Productos', Icon: IconProductos },
          { id: 'eventos', label: 'Eventos', Icon: IconEventos },
          { id: 'negocios', label: 'Negocios', Icon: IconNegocios },
          { id: 'comunidad', label: 'Comunidad', Icon: IconComunidad },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => {
              const nuevaCategoria = categoriaFiltro === id ? 'todos' : (id as Categoria);
              setCategoriaFiltro(nuevaCategoria);

              // Actualizar URL sin recargar
              const params = new URLSearchParams(searchParams.toString());
              if (nuevaCategoria === 'todos') {
                params.delete('categoria');
              } else {
                params.set('categoria', nuevaCategoria);
              }
              // Mantener búsqueda si existe
              if (busqueda.trim()) {
                params.set('buscar', busqueda.trim());
              } else {
                params.delete('buscar');
              }
              router.push(`/?${params.toString()}`, { scroll: false });
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              minWidth: '72px',
              flexShrink: 0,
              opacity: categoriaFiltro === id ? 1 : 0.7,
              color: categoriaFiltro === id ? 'var(--brand-blue)' : 'var(--text-secondary)',
              transition: 'transform 0.2s, color 0.2s',
            }}
            className="hover:opacity-100 hover:scale-105"
          >
            <div style={{
              padding: '0.75rem',
              borderRadius: '50%',
              backgroundColor: categoriaFiltro === id ? 'var(--brand-yellow)' : 'var(--bg-secondary)',
              color: categoriaFiltro === id ? 'var(--brand-blue)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: categoriaFiltro === id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
              width: '48px',
              height: '48px',
            }}
              className={categoriaFiltro !== id ? 'group-hover:bg-gray-200 dark:group-hover:bg-zinc-700' : ''}
            >
              <Icon size={22} color={categoriaFiltro === id ? 'var(--brand-blue)' : undefined} />
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: categoriaFiltro === id ? 700 : 500,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              color: categoriaFiltro === id ? 'var(--brand-blue)' : 'var(--text-secondary)'
            }}>
              {label}
            </span>
          </button>
        ))}
      </div>
      <main id="main-content" style={{
        flex: 1,
        padding: '1rem',
        paddingBottom: isDesktop ? '1rem' : '5rem', // Espacio para navbar mobile permanente
        maxWidth: isDesktop
          ? 'calc(100% - var(--sidebar-width, 60px))'
          : '1400px',
        margin: '0 auto',
        width: '100%',
        transition: 'max-width 0.3s ease, margin-right 0.3s ease, padding-bottom 0.3s ease',
        ...(isDesktop && { marginRight: 'var(--sidebar-width, 60px)' })
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Buscador
            value={busqueda}
            onChange={(value) => {
              setBusqueda(value);
              // Actualizar URL cuando el usuario deja de escribir (debounce)
              // Esto se hace en un useEffect separado para evitar demasiadas actualizaciones
            }}
            categoriaSeleccionada={categoriaFiltro}
            onCategoriaChange={(categoria) => {
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
                    {(busqueda || categoriaFiltro !== 'todos' || filtroUbicacion) && ` (de ${adisos.length} total)`}
                  </span>
                  {(busqueda.trim() || categoriaFiltro !== 'todos' || filtroUbicacion) && (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <FiltroUbicacion
                    value={filtroUbicacion}
                    onChange={setFiltroUbicacion}
                    ubicacionUsuario={profile?.latitud && profile?.longitud ? {
                      pais: 'Perú',
                      departamento: '', // Se puede extraer de reverse geocoding si es necesario
                      provincia: '',
                      distrito: '',
                      latitud: profile.latitud,
                      longitud: profile.longitud
                    } : undefined}
                  />
                  <Ordenamiento
                    valor={ordenamiento}
                    onChange={setOrdenamiento}
                  />
                </div>
              </div>
            )}
            {cargando && adisosFiltrados.length === 0 ? (
              <div
                className="grilla-adisos"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${isDesktop ? 4 : 2}, 1fr)`,
                  gap: '0.5rem',
                  gridAutoRows: 'minmax(80px, auto)'
                }}
              >
                <SkeletonAdisosGrid count={isDesktop ? 8 : 4} />
              </div>
            ) : (
              <>
                <GrillaAdisos
                  adisos={adisosFiltrados}
                  onAbrirAdiso={handleAbrirAdiso}
                  adisoSeleccionadoId={adisoAbierto?.id}
                  espacioAdicional={isSidebarMinimizado ? 360 : 0}
                  cargandoMas={cargandoMas}
                  sentinelRef={sentinelRef}
                />
                {adisosFiltrados.length === 0 && !cargando && (
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
          </>
        )}
      </main>
      <FeedbackButton />

      {/* Sidebar Desktop - siempre visible */}
      {/* Sidebar Desktop - Controlled via Header */}
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
          seccionActiva={seccionDesktopActiva}
          minimizado={isSidebarMinimizado}
          onMinimizadoChange={setIsSidebarMinimizado}
          todosLosAdisos={adisosFiltrados}
        />
      )}

      {/* Left Sidebar (Desktop/Mobile if requested) */}
      <LeftSidebar
        isOpen={isLeftSidebarOpen}
        onClose={() => setIsLeftSidebarOpen(false)}
      />

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
          seccionInicial={seccionMobileActiva || undefined}
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
