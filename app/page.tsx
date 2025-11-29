'use client';

// Forzar renderizado dinámico para evitar errores de prerender con useSearchParams en Vercel
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Aviso, Categoria } from '@/types';
import { getAvisos, getAvisoById, saveAviso, getAvisosCache } from '@/lib/storage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import Header from '@/components/Header';
import Buscador from '@/components/Buscador';
import FiltrosCategoria from '@/components/FiltrosCategoria';
import GrillaAvisos from '@/components/GrillaAvisos';
import ModalAviso from '@/components/ModalAviso';
import BotonPublicar from '@/components/BotonPublicar';
import FormularioPublicar from '@/components/FormularioPublicar';
import SkeletonAvisos from '@/components/SkeletonAvisos';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const avisoId = searchParams.get('aviso');
  const cargadoInicialmente = useRef(false);
  
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [avisosFiltrados, setAvisosFiltrados] = useState<Aviso[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<Categoria | 'todos'>('todos');
  const [avisoAbierto, setAvisoAbierto] = useState<Aviso | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [indiceAvisoActual, setIndiceAvisoActual] = useState(0);
  const [cargando, setCargando] = useState(true);
  const isDesktop = useMediaQuery('(min-width: 768px)');

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
          setAvisos(avisosDesdeAPI.length > 0 ? avisosDesdeAPI : cache);
          setAvisosFiltrados(avisosDesdeAPI.length > 0 ? avisosDesdeAPI : cache);
          
          // Si hay avisoId, buscar en la lista actualizada
          if (avisoId) {
            const avisosActualizados = avisosDesdeAPI.length > 0 ? avisosDesdeAPI : cache;
            const avisoEncontrado = avisosActualizados.find(a => a.id === avisoId);
            if (avisoEncontrado) {
              setAvisoAbierto(avisoEncontrado);
              const indice = avisosActualizados.findIndex(a => a.id === avisoId);
              setIndiceAvisoActual(indice >= 0 ? indice : 0);
            }
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

  // Manejar cambios en avisoId cuando ya está cargado
  useEffect(() => {
    if (cargando || !avisoId) {
      if (!avisoId) setAvisoAbierto(null);
      return;
    }

    const avisoLocal = avisos.find(a => a.id === avisoId);
    if (avisoLocal) {
      setAvisoAbierto(avisoLocal);
      const indice = avisosFiltrados.findIndex(a => a.id === avisoId);
      setIndiceAvisoActual(indice >= 0 ? indice : avisos.findIndex(a => a.id === avisoId));
      return;
    }

    // Si no está en local, cargarlo
    getAvisoById(avisoId).then(aviso => {
      if (aviso) {
        setAvisoAbierto(aviso);
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
        setIndiceAvisoActual(0);
      }
    }).catch(console.error);
  }, [avisoId, avisos, avisosFiltrados, cargando]);

  // Filtrado
  useEffect(() => {
    let filtrados = avisos;

    if (categoriaFiltro !== 'todos') {
      filtrados = filtrados.filter(a => a.categoria === categoriaFiltro);
    }

    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      filtrados = filtrados.filter(
        a =>
          a.titulo.toLowerCase().includes(busquedaLower) ||
          a.descripcion.toLowerCase().includes(busquedaLower) ||
          a.ubicacion.toLowerCase().includes(busquedaLower)
      );
    }

    setAvisosFiltrados(filtrados);
    
    // Actualizar índice si el aviso abierto sigue visible
    if (avisoAbierto) {
      const nuevoIndice = filtrados.findIndex(a => a.id === avisoAbierto.id);
      if (nuevoIndice >= 0) {
        setIndiceAvisoActual(nuevoIndice);
      }
    }
  }, [busqueda, categoriaFiltro, avisos, avisoAbierto]);

  const handlePublicar = (nuevoAviso: Aviso) => {
    // Optimistic update: mostrar inmediatamente
    const avisosActualizados = [nuevoAviso, ...avisos];
    setAvisos(avisosActualizados);
    setAvisosFiltrados(avisosActualizados);
    setMostrarFormulario(false);
    setAvisoAbierto(nuevoAviso);
    setIndiceAvisoActual(0);
    router.push(`/?aviso=${nuevoAviso.id}`, { scroll: false });
  };

  const handleAbrirAviso = (aviso: Aviso) => {
    const indice = avisosFiltrados.findIndex(a => a.id === aviso.id);
    setIndiceAvisoActual(indice >= 0 ? indice : 0);
    setAvisoAbierto(aviso);
    router.push(`/?aviso=${aviso.id}`, { scroll: false });
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
      router.push(`/?aviso=${aviso.id}`, { scroll: false });
    }
  };

  const handleSiguiente = () => {
    if (indiceAvisoActual < avisosFiltrados.length - 1) {
      const nuevoIndice = indiceAvisoActual + 1;
      const aviso = avisosFiltrados[nuevoIndice];
      setIndiceAvisoActual(nuevoIndice);
      setAvisoAbierto(aviso);
      router.push(`/?aviso=${aviso.id}`, { scroll: false });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
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
          <Buscador value={busqueda} onChange={setBusqueda} />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <FiltrosCategoria
            categoriaSeleccionada={categoriaFiltro}
            onChange={setCategoriaFiltro}
          />
        </div>
        {cargando ? (
          <SkeletonAvisos />
        ) : (
          <>
            <GrillaAvisos
              avisos={avisosFiltrados}
              onAbrirAviso={handleAbrirAviso}
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
      {mostrarFormulario && (
        <FormularioPublicar
          onPublicar={handlePublicar}
          onCerrar={() => setMostrarFormulario(false)}
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
    </div>
  );
}
