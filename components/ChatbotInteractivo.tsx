'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Adiso, Categoria } from '@/types';
import { FaSpinner, FaTrash, FaTimes, FaBullhorn, FaSearch } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { getAdisoUrl } from '@/lib/url';
import { useNavigation } from '@/contexts/NavigationContext';
import { DraftListingCard } from '@/components/ai/DraftListingCard';

interface Mensaje {
    id: string;
    tipo: 'usuario' | 'asistente' | 'botones';
    contenido: string;
    timestamp: Date;
    resultados?: Adiso[];
    botones?: BotonOpcion[];
    component?: React.ReactNode;
}

interface BotonOpcion {
    label: string;
    emoji?: string;
    valor: string;
    color?: string;
}

interface EstadoBusqueda {
    categoria?: Categoria;
    subcategoria?: string;
    ubicacion?: string;
    tipo?: string;
    accion?: string;
}

interface ChatbotIAProps {
    onPublicar?: (adiso: Adiso) => void;
    onError?: (message: string) => void;
    onSuccess?: (message: string) => void;
    onMinimize?: () => void;
}

// Opciones de categorías
const CATEGORIAS: BotonOpcion[] = [
    { label: 'Inmuebles', emoji: '🏠', valor: 'inmuebles' },
    { label: 'Empleos', emoji: '💼', valor: 'empleos' },
    { label: 'Vehículos', emoji: '🚗', valor: 'vehiculos' },
    { label: 'Servicios', emoji: '🔧', valor: 'servicios' },
    { label: 'Productos', emoji: '📦', valor: 'productos' },
    { label: 'Eventos', emoji: '🎉', valor: 'eventos' },
    { label: 'Negocios', emoji: '💰', valor: 'negocios' },
    { label: 'Comunidad', emoji: '👥', valor: 'comunidad' }
];

// Opciones de empleos
const EMPLEOS_TIPOS: BotonOpcion[] = [
    { label: 'Cocinero', emoji: '👨‍🍳', valor: 'cocinero' },
    { label: 'Mozo', emoji: '🍽️', valor: 'mozo' },
    { label: 'Limpieza', emoji: '🧹', valor: 'limpieza' },
    { label: 'Construcción', emoji: '🏗️', valor: 'construccion' },
    { label: 'Oficina', emoji: '💻', valor: 'oficina' },
    { label: 'Ventas', emoji: '🏪', valor: 'ventas' },
    { label: 'Marketing', emoji: '📱', valor: 'marketing' },
    { label: 'Educación', emoji: '📚', valor: 'educacion' },
    { label: 'Salud', emoji: '🏥', valor: 'salud' },
    { label: 'Todos', emoji: '✨', valor: 'todos' }
];

// Opciones de inmuebles - tipo
const INMUEBLES_TIPOS: BotonOpcion[] = [
    { label: 'Casa', emoji: '🏠', valor: 'casa' },
    { label: 'Departamento', emoji: '🏢', valor: 'departamento' },
    { label: 'Terreno', emoji: '🏞️', valor: 'terreno' },
    { label: 'Local', emoji: '🏪', valor: 'local' },
    { label: 'Oficina', emoji: '🏢', valor: 'oficina' },
    { label: 'Habitación', emoji: '🛏️', valor: 'habitacion' },
    { label: 'Todos', emoji: '✨', valor: 'todos' }
];

// Opciones de inmuebles - acción
const INMUEBLES_ACCIONES: BotonOpcion[] = [
    { label: 'Comprar', emoji: '💰', valor: 'venta' },
    { label: 'Alquilar', emoji: '🔑', valor: 'alquiler' },
    { label: 'Anticresis', emoji: '🤝', valor: 'anticresis' },
    { label: 'Todos', emoji: '✨', valor: 'todos' }
];

// Opciones de vehículos
const VEHICULOS_TIPOS: BotonOpcion[] = [
    { label: 'Auto', emoji: '🚗', valor: 'auto' },
    { label: 'Moto', emoji: '🏍️', valor: 'moto' },
    { label: 'Camioneta', emoji: '🚐', valor: 'camioneta' },
    { label: 'Camión', emoji: '🚚', valor: 'camion' },
    { label: 'Todos', emoji: '✨', valor: 'todos' }
];

// Opciones de ubicación
const UBICACIONES: BotonOpcion[] = [
    { label: 'Wanchaq', emoji: '📍', valor: 'wanchaq' },
    { label: 'San Sebastián', emoji: '📍', valor: 'san sebastian' },
    { label: 'San Jerónimo', emoji: '📍', valor: 'san jeronimo' },
    { label: 'Santiago', emoji: '📍', valor: 'santiago' },
    { label: 'Centro', emoji: '📍', valor: 'centro' },
    { label: 'Todas', emoji: '🌍', valor: 'todas' }
];

export default function ChatbotInteractivo({ onPublicar, onError, onSuccess, onMinimize }: ChatbotIAProps) {
    const router = useRouter();
    const { abrirAdiso } = useNavigation();
    const [modo, setModo] = useState<'buscar' | 'publicar'>('buscar');

    // Mensaje inicial por defecto
    const MENSAJE_INICIAL: Mensaje[] = [
        {
            id: '1',
            tipo: 'asistente',
            contenido: '¡Hola! Te ayudaré a encontrar lo que buscas. ¿Qué tipo de aviso te interesa?',
            timestamp: new Date()
        },
        {
            id: '2',
            tipo: 'botones',
            contenido: '',
            timestamp: new Date(),
            botones: CATEGORIAS
        }
    ];

    const [mensajes, setMensajes] = useState<Mensaje[]>(MENSAJE_INICIAL);
    const [isLoaded, setIsLoaded] = useState(false);

    // Cargar historial al montar
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('adis_chat_mensajes');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // Restaurar fechas
                    const restored = parsed.map((m: any) => ({
                        ...m,
                        timestamp: new Date(m.timestamp)
                    }));
                    if (restored.length > 0) {
                        setMensajes(restored);
                    }
                } catch (e) {
                    console.error('Error restaurando chat', e);
                }
            }
            setIsLoaded(true);
        }
    }, []);

    // Guardar historial al actualizar
    useEffect(() => {
        if (isLoaded && typeof window !== 'undefined') {
            // Remove sensitive or too large objects before saving if needed, but for now it's fine
            // We should filter out components as they can't be serialized
            const saveableMensajes = mensajes.map(m => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { component, ...rest } = m;
                return rest;
            });
            localStorage.setItem('adis_chat_mensajes', JSON.stringify(saveableMensajes));
        }
    }, [mensajes, isLoaded]);

    const limpiarHistorial = () => {
        if (window.confirm('¿Borrar toda la conversación?')) {
            setMensajes(MENSAJE_INICIAL);
            setEstadoBusqueda({});
            localStorage.removeItem('adis_chat_mensajes');
        }
    };

    const [procesando, setProcesando] = useState(false);
    const [estadoBusqueda, setEstadoBusqueda] = useState<EstadoBusqueda>({});
    const [inputTexto, setInputTexto] = useState('');
    const mensajesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isLoaded) {
            scrollToBottom();
        }
    }, [mensajes, isLoaded]);

    const agregarMensaje = (tipo: 'usuario' | 'asistente' | 'botones', contenido: string, opciones?: { resultados?: Adiso[]; botones?: BotonOpcion[]; component?: React.ReactNode }) => {
        const nuevoMensaje: Mensaje = {
            id: Date.now().toString(),
            tipo,
            contenido,
            timestamp: new Date(),
            ...opciones
        };
        setMensajes(prev => [...prev, nuevoMensaje]);
    };

    const buscarAvisos = async (estado: EstadoBusqueda) => {
        setProcesando(true);

        try {
            if (!supabase) {
                throw new Error('Supabase no configurado');
            }

            let query = supabase
                .from('adisos')
                .select('*')
                .eq('esta_activo', true);

            if (estado.categoria) {
                query = query.eq('categoria', estado.categoria);
            }

            if (estado.ubicacion && estado.ubicacion !== 'todas') {
                query = query.ilike('ubicacion', `%${estado.ubicacion}%`);
            }

            const terminos: string[] = [];

            if (estado.subcategoria && estado.subcategoria !== 'todos') {
                terminos.push(estado.subcategoria);
            }

            if (estado.tipo && estado.tipo !== 'todos') {
                terminos.push(estado.tipo);
            }

            if (estado.accion && estado.accion !== 'todos') {
                terminos.push(estado.accion);
            }

            if (terminos.length > 0) {
                const condiciones = terminos.map(termino =>
                    `titulo.ilike.%${termino}%,descripcion.ilike.%${termino}%`
                ).join(',');
                query = query.or(condiciones);
            }

            const { data, error } = await query.limit(20);

            if (error) throw error;

            const { dbToAdiso } = await import('@/lib/supabase');
            const resultados = (data || []).map(dbToAdiso);

            if (resultados.length > 0) {
                agregarMensaje('asistente', `✨ Encontré ${resultados.length} aviso${resultados.length !== 1 ? 's' : ''} que te pueden interesar:`, { resultados });

                agregarMensaje('botones', '', {
                    botones: [
                        { label: 'Nueva Búsqueda', emoji: '🔄', valor: 'nueva_busqueda' }
                    ]
                });
            } else {
                agregarMensaje('asistente', '😕 No encontré avisos con esos filtros. Intenta con otros criterios.');
                agregarMensaje('botones', '', {
                    botones: [
                        { label: 'Intentar de Nuevo', emoji: '🔄', valor: 'nueva_busqueda' }
                    ]
                });
            }

        } catch (error) {
            console.error('Error en búsqueda:', error);
            agregarMensaje('asistente', '❌ Hubo un error al buscar. Por favor intenta nuevamente.');
        } finally {
            setProcesando(false);
        }
    };

    const handleModoChange = (nuevoModo: 'buscar' | 'publicar') => {
        setModo(nuevoModo);
        setProcesando(false);
        if (nuevoModo === 'publicar') {
            agregarMensaje('asistente', '📢 Modo Publicación Activado.\n\n¿Qué te gustaría publicar hoy? Puedo ayudarte a crear un aviso para empleos, inmuebles o productos.\n\n📸 Sube una foto o simplemente dime "Vendo mi bicicleta".');
        } else {
            agregarMensaje('asistente', '🔍 Modo Búsqueda Activado.\n\n¿Qué estás buscando hoy?');
            agregarMensaje('botones', '', { botones: CATEGORIAS });
        }
    };

    const procesarPublicacion = async (texto: string) => {
        setProcesando(true);
        agregarMensaje('usuario', texto);

        // Simular "pensando"
        setTimeout(() => {
            const draftData = {
                imageUrl: '', // No image yet
                categoria: 'productos' as const,
                titulo: texto.length > 4 ? texto : `Aviso de ${texto}`,
                descripcion: `Vendo ${texto}. Contactar para más detalles.`,
                precio: 0,
                condicion: 'usado',
                confidence: 'media' as const,
            };

            agregarMensaje('asistente', 'He preparado un borrador provisional. Edítalo y publícalo:', {
                component: (
                    <DraftListingCard
                        data={draftData}
                        onPublish={(data) => {
                            console.log('Publicado simulado:', data);
                        }}
                    />
                )
            });
            setProcesando(false);
            setInputTexto('');
        }, 1000);
    };

    const handleSeleccion = async (valor: string) => {
        const nuevoEstado = { ...estadoBusqueda };

        if (valor === 'nueva_busqueda') {
            setEstadoBusqueda({});
            agregarMensaje('asistente', '¿Qué tipo de aviso te interesa?');
            agregarMensaje('botones', '', { botones: CATEGORIAS });
            return;
        }

        if (CATEGORIAS.find(c => c.valor === valor)) {
            nuevoEstado.categoria = valor as Categoria;
            setEstadoBusqueda(nuevoEstado);

            const categoriaSeleccionada = CATEGORIAS.find(c => c.valor === valor);
            agregarMensaje('usuario', `${categoriaSeleccionada?.emoji} ${categoriaSeleccionada?.label}`);

            if (valor === 'empleos') {
                agregarMensaje('asistente', '¿Qué tipo de empleo buscas?');
                agregarMensaje('botones', '', { botones: EMPLEOS_TIPOS });
            } else if (valor === 'inmuebles') {
                agregarMensaje('asistente', '¿Qué tipo de inmueble?');
                agregarMensaje('botones', '', { botones: INMUEBLES_TIPOS });
            } else if (valor === 'vehiculos') {
                agregarMensaje('asistente', '¿Qué tipo de vehículo?');
                agregarMensaje('botones', '', { botones: VEHICULOS_TIPOS });
            } else {
                agregarMensaje('asistente', '¿En qué zona?');
                agregarMensaje('botones', '', { botones: UBICACIONES });
            }
            return;
        }

        if (nuevoEstado.categoria === 'empleos' && EMPLEOS_TIPOS.find(t => t.valor === valor)) {
            nuevoEstado.subcategoria = valor;
            setEstadoBusqueda(nuevoEstado);
            const tipoSeleccionado = EMPLEOS_TIPOS.find(t => t.valor === valor);
            agregarMensaje('usuario', `${tipoSeleccionado?.emoji} ${tipoSeleccionado?.label}`);
            agregarMensaje('asistente', '¿En qué zona?');
            agregarMensaje('botones', '', { botones: UBICACIONES });
            return;
        }

        if (nuevoEstado.categoria === 'inmuebles' && INMUEBLES_TIPOS.find(t => t.valor === valor)) {
            nuevoEstado.tipo = valor;
            setEstadoBusqueda(nuevoEstado);
            const tipoSeleccionado = INMUEBLES_TIPOS.find(t => t.valor === valor);
            agregarMensaje('usuario', `${tipoSeleccionado?.emoji} ${tipoSeleccionado?.label}`);
            agregarMensaje('asistente', '¿Qué buscas hacer?');
            agregarMensaje('botones', '', { botones: INMUEBLES_ACCIONES });
            return;
        }

        if (nuevoEstado.categoria === 'inmuebles' && INMUEBLES_ACCIONES.find(a => a.valor === valor)) {
            nuevoEstado.accion = valor;
            setEstadoBusqueda(nuevoEstado);
            const accionSeleccionada = INMUEBLES_ACCIONES.find(a => a.valor === valor);
            agregarMensaje('usuario', `${accionSeleccionada?.emoji} ${accionSeleccionada?.label}`);
            agregarMensaje('asistente', '¿En qué zona?');
            agregarMensaje('botones', '', { botones: UBICACIONES });
            return;
        }

        if (nuevoEstado.categoria === 'vehiculos' && VEHICULOS_TIPOS.find(t => t.valor === valor)) {
            nuevoEstado.subcategoria = valor;
            setEstadoBusqueda(nuevoEstado);
            const tipoSeleccionado = VEHICULOS_TIPOS.find(t => t.valor === valor);
            agregarMensaje('usuario', `${tipoSeleccionado?.emoji} ${tipoSeleccionado?.label}`);
            agregarMensaje('asistente', '¿En qué zona?');
            agregarMensaje('botones', '', { botones: UBICACIONES });
            return;
        }

        if (UBICACIONES.find(u => u.valor === valor)) {
            nuevoEstado.ubicacion = valor;
            setEstadoBusqueda(nuevoEstado);
            const ubicacionSeleccionada = UBICACIONES.find(u => u.valor === valor);
            agregarMensaje('usuario', `${ubicacionSeleccionada?.emoji} ${ubicacionSeleccionada?.label}`);
            agregarMensaje('asistente', '🔍 Buscando las mejores opciones para ti...');
            await buscarAvisos(nuevoEstado);
        }
    };

    const handleClickAdiso = (adiso: Adiso) => {
        if (onMinimize) onMinimize();
        abrirAdiso(adiso.id);
    };

    const buscarPorTexto = async (texto: string) => {
        if (!texto.trim()) return;

        setProcesando(true);
        agregarMensaje('usuario', texto);
        agregarMensaje('asistente', '🔍 Buscando...');

        try {
            const { analizarBusqueda } = await import('@/lib/chatbot-nlu');
            const { buscarMejorada } = await import('@/lib/busqueda-mejorada');

            const analisis = analizarBusqueda(texto);
            const resultados = await buscarMejorada(analisis, 20);

            if (resultados.length > 0) {
                agregarMensaje('asistente', `✨ Encontré ${resultados.length} aviso${resultados.length !== 1 ? 's' : ''} relacionados con "${texto}":`, { resultados });
                agregarMensaje('botones', '', {
                    botones: [
                        { label: 'Nueva Búsqueda', emoji: '🔄', valor: 'nueva_busqueda' }
                    ]
                });
            } else {
                agregarMensaje('asistente', `😕 No encontré avisos relacionados con "${texto}". Intenta con otros términos o usa los botones para una búsqueda guiada.`);
                agregarMensaje('botones', '', {
                    botones: [
                        { label: 'Búsqueda Guiada', emoji: '🎯', valor: 'nueva_busqueda' }
                    ]
                });
            }
        } catch (error) {
            console.error('Error en búsqueda por texto:', error);
            agregarMensaje('asistente', '❌ Hubo un error al buscar. Intenta con los botones de búsqueda guiada.');
            agregarMensaje('botones', '', { botones: CATEGORIAS });
        } finally {
            setProcesando(false);
            setInputTexto('');
        }
    };

    const handleSubmitTexto = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputTexto.trim() && !procesando) {
            if (modo === 'publicar') {
                procesarPublicacion(inputTexto);
            } else {
                buscarPorTexto(inputTexto);
            }
        }
    };

    const getCategoriaNombre = (categoria: Categoria): string => {
        const nombres: Record<Categoria, string> = {
            empleos: 'Empleos',
            inmuebles: 'Inmuebles',
            vehiculos: 'Vehículos',
            servicios: 'Servicios',
            productos: 'Productos',
            eventos: 'Eventos',
            negocios: 'Negocios',
            comunidad: 'Comunidad'
        };
        return nombres[categoria] || categoria;
    };

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--bg-primary)',
                position: 'relative'
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                }}
            >
                <div
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                    }}
                >
                    AI
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        Asistente Interactivo
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {modo === 'publicar' ? 'Asistente de Publicación' : 'Encuentra lo que buscas'}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                        onClick={limpiarHistorial}
                        title="Limpiar historial"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-tertiary)',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <FaTrash size={14} />
                    </button>

                    {onMinimize && (
                        <button
                            onClick={onMinimize}
                            title="Cerrar chat"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-tertiary)',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '50%',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <FaTimes size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Mensajes */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}
            >
                {mensajes.map((mensaje) => (
                    <div key={mensaje.id}>
                        {mensaje.contenido && (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: mensaje.tipo === 'usuario' ? 'flex-end' : 'flex-start',
                                    animation: 'fadeIn 0.4s ease-out'
                                }}
                            >
                                {mensaje.tipo === 'asistente' && (
                                    <div
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '0.9rem',
                                            fontWeight: 'bold',
                                            marginRight: '0.5rem',
                                            flexShrink: 0,
                                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                                        }}
                                    >
                                        AI
                                    </div>
                                )}
                                <div
                                    style={{
                                        maxWidth: '85%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: mensaje.tipo === 'usuario' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                                        backgroundColor: mensaje.tipo === 'usuario'
                                            ? 'var(--accent-color)'
                                            : 'var(--bg-secondary)',
                                        color: mensaje.tipo === 'usuario'
                                            ? 'white'
                                            : 'var(--text-primary)',
                                        boxShadow: mensaje.tipo === 'usuario'
                                            ? '0 2px 8px rgba(0,0,0,0.15)'
                                            : '0 2px 6px rgba(0,0,0,0.08)',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        lineHeight: 1.6
                                    }}
                                >
                                    {mensaje.contenido}
                                </div>
                            </div>
                        )}

                        {mensaje.component && (
                            <div style={{ marginTop: '0.5rem', width: '100%', paddingLeft: mensaje.tipo === 'asistente' ? '3rem' : 0 }}>
                                {mensaje.component}
                            </div>
                        )}

                        {mensaje.botones && mensaje.botones.length > 0 && (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                    gap: '0.5rem',
                                    marginTop: '0.5rem',
                                    paddingLeft: '3rem',
                                    animation: 'slideUp 0.3s ease-out'
                                }}
                            >
                                {mensaje.botones.map((boton, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSeleccion(boton.valor)}
                                        disabled={procesando}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            backgroundColor: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            cursor: procesando ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.2s',
                                            fontSize: '0.9rem',
                                            fontWeight: 500,
                                            opacity: procesando ? 0.5 : 1
                                        }}
                                    >
                                        {boton.emoji && <span style={{ fontSize: '1.2rem' }}>{boton.emoji}</span>}
                                        <span>{boton.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {mensaje.resultados && mensaje.resultados.length > 0 && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem',
                                    marginTop: '0.5rem',
                                    paddingLeft: '3rem'
                                }}
                            >
                                {mensaje.resultados.slice(0, 10).map((adiso) => (
                                    <div
                                        key={adiso.id}
                                        onClick={() => handleClickAdiso(adiso)}
                                        style={{
                                            padding: '1rem',
                                            backgroundColor: 'var(--bg-secondary)',
                                            borderRadius: '0.75rem',
                                            border: '1px solid var(--border-color)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', flex: 1 }}>
                                                {adiso.titulo}
                                            </div>
                                            <span
                                                style={{
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '0.5rem',
                                                    fontSize: '0.75rem',
                                                    backgroundColor: 'var(--accent-color)',
                                                    color: 'white',
                                                    marginLeft: '0.5rem',
                                                    flexShrink: 0
                                                }}
                                            >
                                                {getCategoriaNombre(adiso.categoria)}
                                            </span>
                                        </div>
                                        {adiso.descripcion && (
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                                {adiso.descripcion.substring(0, 100)}
                                                {adiso.descripcion.length > 100 ? '...' : ''}
                                            </div>
                                        )}
                                        {adiso.ubicacion && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                📍 {typeof adiso.ubicacion === 'string' ? adiso.ubicacion : `${adiso.ubicacion.distrito || ''}, ${adiso.ubicacion.provincia || ''}`}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                <div ref={mensajesEndRef} />
            </div>

            {/* Input de texto libre */}
            <div
                style={{
                    padding: '1rem',
                    borderTop: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)'
                }}
            >
                {/* Mode Toggles */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button
                        type="button"
                        onClick={() => handleModoChange('buscar')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: modo === 'buscar' ? 'var(--accent-color)' : 'transparent',
                            background: modo === 'buscar' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                            color: modo === 'buscar' ? 'var(--accent-color)' : 'var(--text-secondary)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FaSearch /> Buscar
                    </button>
                    <button
                        type="button"
                        onClick={() => handleModoChange('publicar')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: modo === 'publicar' ? 'var(--accent-color)' : 'transparent',
                            background: modo === 'publicar' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                            color: modo === 'publicar' ? 'var(--accent-color)' : 'var(--text-secondary)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FaBullhorn /> Publicar
                    </button>
                </div>

                <form onSubmit={handleSubmitTexto} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputTexto}
                        onChange={(e) => setInputTexto(e.target.value)}
                        placeholder={modo === 'publicar' ? "Ej: Vendo consola de juegos..." : "O escribe tu búsqueda aquí..."}
                        disabled={procesando}
                        style={{
                            flex: 1,
                            padding: '0.75rem 1rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: '1.5rem',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            outline: 'none',
                            transition: 'all 0.2s'
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-color)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!inputTexto.trim() || procesando}
                        style={{
                            padding: '0.75rem 1.25rem',
                            border: 'none',
                            borderRadius: '1.5rem',
                            backgroundColor: procesando || !inputTexto.trim() ? 'var(--border-color)' : 'var(--accent-color)',
                            color: 'white',
                            cursor: procesando || !inputTexto.trim() ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s',
                            fontWeight: 600,
                            fontSize: '0.9rem'
                        }}
                    >
                        {procesando ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : (modo === 'publicar' ? <FaBullhorn /> : '🔍')}
                        {procesando ? '...' : (modo === 'publicar' ? 'Crear' : 'Buscar')}
                    </button>
                </form>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                    💡 {modo === 'publicar' ? 'Describe tu artículo y crearé un borrador gratis.' : 'Usa los botones para búsqueda rápida o escribe tu consulta'}
                </div>
            </div>

            <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
        </div>
    );
}
