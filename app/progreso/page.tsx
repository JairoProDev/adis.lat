'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes, FaRocket, FaCheckCircle, FaBug, FaStar, FaCog, FaLightbulb, FaExclamationTriangle, FaArrowLeft, FaHeart } from 'react-icons/fa';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { enviarFeedbackInmediato, enviarFeedbacksAAPI } from '@/lib/feedback';

interface ProgresoEntry {
  version: string;
  date: string;
  time: string;
  type: 'feature' | 'improvement' | 'fix' | 'ui';
  title: string;
  description: string;
  userBenefits: string[];
  technicalDetails: string[];
  impact: 'major' | 'minor' | 'patch';
}

const progresoData: ProgresoEntry[] = [
  {
    version: '2.2.0',
    date: '2025-01-27',
    time: '20:00',
    type: 'improvement',
    title: 'Auditoría Completa: Accesibilidad, SEO, Rendimiento y Seguridad',
    description: 'Implementación masiva de mejoras críticas en accesibilidad WCAG 2.1 AA, SEO avanzado, optimización de rendimiento, validación robusta y seguridad',
    userBenefits: [
      'Mejor accesibilidad: navegación por teclado completa, screen readers compatibles, contraste mejorado',
      'Mejor SEO: sitemap dinámico, robots.txt, structured data, metadata mejorada',
      'Rendimiento optimizado: imágenes con next/image, code splitting, cache LRU inteligente',
      'Mayor seguridad: validación robusta con Zod, sanitización de entrada, rate limiting',
      'Mejor experiencia offline: detección de conexión, mensajes claros, fallbacks',
      'Código más robusto: ErrorBoundary, manejo de errores mejorado, loading states',
      'Mejor UX: spinners de carga, mensajes de error claros, feedback visual mejorado',
    ],
    technicalDetails: [
      'Accesibilidad: ARIA labels en todos los iconos, htmlFor en labels, skip links, focus visible, contraste WCAG AA',
      'SEO: sitemap.ts dinámico con todos los adisos, robots.ts configurado, structured data JSON-LD, metadata Open Graph y Twitter Cards',
      'Rendimiento: migración completa a next/image con lazy loading, dynamic imports para componentes pesados, cache LRU en localStorage',
      'Seguridad: validación con Zod en todas las rutas API, sanitización de HTML/texto, rate limiting por IP',
      'Componentes nuevos: LoadingSpinner, ErrorBoundary, lib/offline.ts para detección de conexión',
      'Validaciones: lib/validations.ts con schemas Zod, sanitización de XSS, validación de imágenes',
      'Health check: endpoint /api/health para monitoreo de servicios',
      'Mejoras de código: iconos con aria-hidden, botones con aria-label, mejor estructura',
      'Configuración: next.config.js con remotePatterns para imágenes de Supabase',
      'Manejo de errores: mensajes específicos y amigables, detección de tipos de error',
      'Estados de carga: spinners animados, aria-busy, feedback visual consistente',
    ],
    impact: 'major'
  },
  {
    version: '2.1.0',
    date: '2025-11-29',
    time: '19:30',
    type: 'improvement',
    title: 'Mejoras en UX del Modal Móvil y Sidebar Desktop',
    description: 'Optimización completa de la experiencia móvil y desktop con overlay parcial, reorganización de botones y eliminación de elementos redundantes',
    userBenefits: [
      'Overlay móvil más intuitivo: ocupa solo 85% de la pantalla, dejando ver el contenido de fondo',
      'Botones de acción organizados: flechas de navegación en extremos, botones de copiar/compartir centrados',
      'Interfaz más limpia: eliminación de botones de cerrar redundantes',
      'Sidebar inteligente: se expande automáticamente al seleccionar un adiso estando minimizado',
      'Mejor aprovechamiento del espacio: el contenido no se siente abrumador',
      'Navegación más natural: puedes ver el contexto mientras revisas un adiso',
    ],
    technicalDetails: [
      'Modal móvil ajustado a `maxHeight: 85vh` en lugar de fullscreen',
      'Indicador visual superior (handle) para mejor affordance de interacción',
      'Overlay semitransparente que permite ver el contenido de fondo',
      'Reorganización de botones: layout flex con flechas en extremos y acciones centradas',
      'Botones de acción más compactos: padding ajustado para dar espacio a navegación',
      'Eliminación de botón de cerrar en `ModalAdiso` cuando está dentro del sidebar',
      'Eliminación de botón de cerrar en `FormularioPublicar` cuando está dentro del sidebar',
      'Lógica de auto-expansión: sidebar se expande automáticamente al abrir adiso minimizado',
      'Mejoras en scroll: contenido visible completamente sin solapamientos',
      'Ajustes de padding: espacio correcto para botones de navegación sin tapar contenido',
      'Simplificación del header: solo un botón de cerrar en mobile (header del modal)',
      'Transiciones suaves: animaciones mejoradas para mejor sensación de fluidez',
    ],
    impact: 'major'
  },
  {
    version: '2.0.0',
    date: '2025-11-29',
    time: '15:00',
    type: 'feature',
    title: 'Sistema de Paquetes de Publicación',
    description: 'Sistema completo de tamaños de publicaciones según el precio pagado, incentivando a los usuarios a pagar más por mayor visibilidad',
    userBenefits: [
      '5 tamaños diferentes de publicaciones: Miniatura (S/15), Pequeño (S/25), Mediano (S/45), Grande (S/85), Gigante (S/125)',
      'Mayor visibilidad = mayor tamaño: mientras más pagues, más grande y destacado será tu adiso',
      'Miniaturas sin imágenes: el paquete básico no permite imágenes para incentivar upgrades',
      'Límites de imágenes escalonados: Pequeño (1), Mediano (3), Grande (5), Gigante (10)',
      'Selector visual de paquetes en el formulario con precios y descripciones claras',
      'Validación automática: no puedes subir más imágenes de las permitidas por tu paquete',
      'Grid responsive: los adisos se adaptan automáticamente según su tamaño en mobile y desktop',
    ],
    technicalDetails: [
      'Nuevo tipo `TamañoPaquete` con 5 opciones: miniatura, pequeño, mediano, grande, gigante',
      'Constante `PAQUETES` con información completa de cada paquete (precio, dimensiones, límites)',
      'Campo `tamaño` agregado a la interfaz `Adiso` y tabla `adisos` en Supabase',
      'CSS Grid con `grid-column: span` y `grid-row: span` para diferentes tamaños',
      'Validación en tiempo real: el formulario previene subir más imágenes de las permitidas',
      'Selector de paquetes con diseño visual atractivo y feedback inmediato',
      'Miniaturas nunca muestran imágenes (validación en `GrillaAdisos`)',
      'Altura de imágenes adaptativa según el tamaño del paquete',
      'Tamaños de fuente y líneas de texto escalables según el paquete',
      'Script SQL `supabase-adisos-tamaño.sql` para agregar el campo a la base de datos',
      'Compatibilidad hacia atrás: adisos sin tamaño se tratan como "miniatura"',
    ],
    impact: 'major'
  },
  {
    version: '1.7.0',
    date: '2025-11-29',
    time: '13:30',
    type: 'feature',
    title: 'Ampliación de Imágenes y Nueva Paleta de Colores',
    description: 'Las imágenes ahora se pueden ampliar para verlas mejor, y nueva paleta de colores más atractiva',
    userBenefits: [
      'Haz click en cualquier imagen para verla en tamaño completo',
      'Navega entre múltiples imágenes con flechas o teclado',
      'Nueva paleta de colores: azul principal (#3c6997) y amarillo secundario (#ffdd4a)',
      'Fondo beige claro (#f7f6f2) para una experiencia visual más agradable',
      'Cierra la imagen ampliada con ESC, click fuera o botón X',
      'Contador de imágenes para saber cuál estás viendo',
    ],
    technicalDetails: [
      'Modal de imagen ampliada con z-index 3000 para estar sobre todo',
      'Navegación entre imágenes con flechas izquierda/derecha',
      'Soporte de teclado: ESC para cerrar, flechas para navegar',
      'Click fuera de la imagen o en botón X para cerrar',
      'Variables CSS actualizadas: --text-primary (#3c6997), --bg-secondary (#f7f6f2), --color-secondary (#ffdd4a)',
      'Imágenes clickeables con cursor pointer y efecto hover',
      'Modal responsive con botones adaptados para móvil y desktop',
      'object-fit: contain para mantener proporciones de imagen',
    ],
    impact: 'major'
  },
  {
    version: '1.6.0',
    date: '2025-11-29',
    time: '11:45',
    type: 'feature',
    title: 'Múltiples Imágenes y Preview Local Instantáneo',
    description: 'Soporte para múltiples imágenes por adiso con preview local inmediato, sin esperas',
    userBenefits: [
      'Sube múltiples imágenes para mostrar mejor tu producto o servicio',
      'Las imágenes aparecen instantáneamente al publicar (preview local)',
      'No más esperas: las imágenes se suben en background sin bloquear',
      'Ahorro de costos: solo se suben a Supabase cuando es necesario',
      'Experiencia ultra fluida: todo se siente instantáneo',
    ],
    technicalDetails: [
      'Soporte para múltiples imágenes: array `imagenesUrls` en tipo `Adiso`',
      'Preview local inmediato usando `FileReader` y `URL.createObjectURL`',
      'Columna `imagenes_urls` (TEXT/JSON) agregada a tabla `adisos` en Supabase',
      'Subida de imágenes en paralelo usando `Promise.all`',
      'Actualización automática del adiso cuando las imágenes terminan de subirse',
      'Compatibilidad hacia atrás: adisos antiguos con `imagen_url` siguen funcionando',
      'Grid responsive para mostrar múltiples imágenes en el modal',
      'Validación de tamaño (5MB por imagen) y tipo de archivo',
      'Gestión de memoria: revocación de URLs de preview cuando se eliminan',
    ],
    impact: 'major'
  },
  {
    version: '1.5.1',
    date: '2025-11-29',
    time: '11:15',
    type: 'improvement',
    title: 'Optimización de Velocidad de Publicación',
    description: 'Mejora crítica de UX: publicación instantánea sin esperar la subida de imágenes',
    userBenefits: [
      'Publicación instantánea: tu adiso aparece inmediatamente al hacer clic en "Publicar"',
      'No más esperas: la imagen se sube en segundo plano sin bloquear la publicación',
      'Experiencia fluida: sientes que todo es instantáneo',
      'Si hay imagen, aparece automáticamente cuando termine de subirse',
    ],
    technicalDetails: [
      'Publicación optimista: el adiso se muestra inmediatamente sin esperar la API',
      'Subida de imágenes en background: no bloquea la UI',
      'Actualización automática: cuando la imagen termina de subirse, el adiso se actualiza',
      'Eliminado estado "subiendoImagen" que bloqueaba el botón',
      'Flujo asíncrono: publicación → mostrar → subir imagen → actualizar',
      'Mejora en handlePublicar para manejar actualizaciones de adisos existentes',
    ],
    impact: 'major'
  },
  {
    version: '1.5.0',
    date: '2025-11-29',
    time: '11:00',
    type: 'feature',
    title: 'Soporte para Imágenes en Adisos',
    description: 'Los usuarios ahora pueden agregar imágenes a sus adisos para hacerlos más atractivos e informativos',
    userBenefits: [
      'Agrega imágenes a tus adisos para mostrar mejor tus productos o servicios',
      'Las imágenes aparecen tanto en la grilla como en el detalle del adiso',
      'Sistema opcional: puedes publicar con o sin imagen',
      'Validación automática de tamaño (máximo 5MB) y tipo de archivo',
      'Preview de imagen antes de publicar',
      'Almacenamiento seguro en Supabase Storage',
    ],
    technicalDetails: [
      'Campo `imagenUrl` agregado al tipo `Adiso` y `AdisoFormData`',
      'Columna `imagen_url` agregada a la tabla `adisos` en Supabase',
      'Input de imagen con preview en `FormularioPublicar`',
      'Validación de tamaño (5MB) y tipo de archivo',
      'Endpoint `/api/upload-image` actualizado para soportar adisos y feedback',
      'Bucket `adisos-images` en Supabase Storage con políticas RLS',
      'Imágenes mostradas en `GrillaAdisos` (thumbnail) y `ModalAdiso` (completa)',
      'Sistema de fallback: si falla la subida, el adiso se publica sin imagen',
    ],
    impact: 'major'
  },
  {
    version: '1.4.0',
    date: '2025-11-29',
    time: '10:40',
    type: 'feature',
    title: 'Sistema de Feedback Funcional',
    description: 'Implementación completa de sistema de feedback con integración a Supabase, notificaciones por email y dashboard de gestión',
    userBenefits: [
      'Envía sugerencias y reporta problemas fácilmente desde cualquier página',
      'Tu feedback se guarda de forma segura y se revisa periódicamente',
      'Sistema robusto con fallback automático si hay problemas de conexión',
      'Notificaciones por email al equipo cuando recibes feedback',
      'Dashboard interno para gestionar y responder feedbacks',
      'Estadísticas de feedbacks para entender mejor a los usuarios',
    ],
    technicalDetails: [
      'Tabla de feedback en Supabase con Row Level Security (RLS) configurado',
      'API route `/api/feedback` para recibir y guardar feedbacks',
      'Sistema de fallback a localStorage si falla la conexión',
      'Reintento automático cada 30 segundos para feedbacks pendientes',
      'Integración con Resend para notificaciones por email',
      'Dashboard interno en `/admin/feedback` para gestionar feedbacks',
      'Estadísticas de feedbacks: totales, por tipo, no leídos',
      'Soporte opcional para imágenes/capturas de pantalla en feedbacks',
      'Políticas RLS correctamente configuradas para INSERT y SELECT',
    ],
    impact: 'major'
  },
  {
    version: '1.3.0',
    date: '2025-11-29',
    time: '09:48',
    type: 'feature',
    title: 'Sistema de Notificaciones y Validación Avanzada',
    description: 'Implementación de sistema de notificaciones toast y validación en tiempo real del formulario',
    userBenefits: [
      'Notificaciones elegantes en lugar de ventanas emergentes molestas',
      'Validación instantánea mientras escribes (sin esperar a enviar)',
      'Contadores visibles para saber cuántos caracteres puedes usar',
      'Formato automático del teléfono para evitar errores',
      'Mensajes claros cuando algo está mal',
    ],
    technicalDetails: [
      'Sistema de notificaciones toast profesional (reemplazo de alerts)',
      'Validación en tiempo real con mensajes de error inline',
      'Contadores de caracteres visibles en todos los campos',
      'Formato automático de teléfono mientras se escribe',
      'Límites de caracteres: Título (100), Descripción (1000), Ubicación (100)',
      'Validación de formato de teléfono (mínimo 8 dígitos)',
    ],
    impact: 'major'
  },
  {
    version: '1.2.0',
    date: '2025-11-29',
    time: '08:30',
    type: 'feature',
    title: 'Ordenamiento y Contador de Resultados',
    description: 'Nuevas funcionalidades para mejorar la experiencia de búsqueda',
    userBenefits: [
      'Ordena los adisos como prefieras (más nuevos o más antiguos)',
      'Ve cuántos adisos encontraste de un vistazo',
      'Búsqueda más rápida y fluida',
    ],
    technicalDetails: [
      'Ordenamiento por fecha: Más recientes / Más antiguos',
      'Contador de resultados con información contextual',
      'Debounce en búsqueda (300ms) para mejor rendimiento',
      'Interfaz unificada para contador y ordenamiento',
    ],
    impact: 'minor'
  },
  {
    version: '1.1.0',
    date: '2025-11-29',
    time: '07:15',
    type: 'ui',
    title: 'Iconografía Profesional',
    description: 'Actualización completa del sistema de iconos',
    userBenefits: [
      'Iconos más claros y fáciles de reconocer',
      'Diseño más profesional y moderno',
      'Mejor identificación visual de cada categoría',
    ],
    technicalDetails: [
      'Migración a react-icons con Font Awesome',
      'Iconos únicos y reconocibles para cada categoría',
      'Iconos en todos los campos del formulario',
      'Iconos de navegación, acciones y estados',
      'Diseño consistente en toda la aplicación',
    ],
    impact: 'minor'
  },
  {
    version: '1.0.1',
    date: '2025-11-29',
    time: '06:45',
    type: 'fix',
    title: 'Corrección de Ordenamiento',
    description: 'Arreglo del sistema de ordenamiento que no funcionaba correctamente',
    userBenefits: [
      'El ordenamiento ahora funciona correctamente',
    ],
    technicalDetails: [
      'Corrección de lógica de ordenamiento en useEffect',
      'Aplicación correcta de sort antes de mostrar resultados',
    ],
    impact: 'patch'
  },
  {
    version: '1.0.0',
    date: '2025-11-28',
    time: '16:00',
    type: 'feature',
    title: 'Lanzamiento Inicial - MVP Completo',
    description: 'Primera versión funcional de buscadis.com',
    userBenefits: [
      'Publica tus adisos de forma rápida y sencilla',
      'Busca entre todos los adisos en tiempo real',
      'Filtra por categoría para encontrar exactamente lo que buscas',
      'Navega entre adisos fácilmente (teclado, botones o deslizando)',
      'Comparte adisos por WhatsApp con un solo clic',
      'Diseño limpio y fácil de usar',
      'Funciona perfecto en móvil y computadora',
    ],
    technicalDetails: [
      'Sistema de publicación de adisos con categorías',
      'Búsqueda en tiempo real por título, descripción y ubicación',
      'Filtrado por categorías (8 categorías disponibles)',
      'Vista modal responsive (mobile y desktop)',
      'Navegación entre adisos con teclado, botones y swipe',
      'Compartir por WhatsApp con mensaje personalizado',
      'Compartir nativo y copiar link',
      'Integración con Supabase para persistencia de datos',
      'Sistema de cache local para carga instantánea',
      'Carga optimista para mejor UX',
      'Diseño minimalista en escala de grises',
      'Responsive design (2 columnas mobile, 4 desktop)',
    ],
    impact: 'major'
  }
];

export default function ProgresoPage() {
  const router = useRouter();
  const { toasts, removeToast, success } = useToast();
  
  // Enviar feedbacks pendientes periódicamente (cada 30 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      enviarFeedbacksAAPI();
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  const [mostrarFeedback, setMostrarFeedback] = useState(false);
  const [feedbackTipo, setFeedbackTipo] = useState<'sugerencia' | 'problema'>('sugerencia');
  const [feedbackTexto, setFeedbackTexto] = useState('');
  const [enviado, setEnviado] = useState(false);

  const getTypeIcon = (type: ProgresoEntry['type']) => {
    switch (type) {
      case 'feature':
        return <FaRocket size={18} color="#3b82f6" />;
      case 'improvement':
        return <FaStar size={18} color="#10b981" />;
      case 'fix':
        return <FaBug size={18} color="#ef4444" />;
      case 'ui':
        return <FaCog size={18} color="#f59e0b" />;
      default:
        return <FaCheckCircle size={18} color="#6b7280" />;
    }
  };

  const getTypeLabel = (type: ProgresoEntry['type']) => {
    switch (type) {
      case 'feature':
        return 'Nueva Funcionalidad';
      case 'improvement':
        return 'Mejora';
      case 'fix':
        return 'Corrección';
      case 'ui':
        return 'Interfaz';
      default:
        return 'Actualización';
    }
  };

  const getImpactBadge = (impact: ProgresoEntry['impact']) => {
    const styles = {
      major: { bg: '#3b82f6', label: 'Mayor' },
      minor: { bg: '#10b981', label: 'Menor' },
      patch: { bg: '#6b7280', label: 'Parche' }
    };
    const style = styles[impact];
    return (
      <span style={{
        fontSize: '0.75rem',
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        backgroundColor: style.bg,
        color: 'white',
        fontWeight: 500
      }}>
        {style.label}
      </span>
    );
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackTexto.trim()) return;
    
    setEnviado(true);
    
    // Intentar enviar inmediatamente
    const enviado = await enviarFeedbackInmediato({
      tipo: feedbackTipo,
      texto: feedbackTexto.trim()
    });

    if (enviado) {
      success('¡Gracias por tu feedback! Lo revisaremos pronto.');
    } else {
      success('¡Gracias por tu feedback! Se guardó localmente y se enviará pronto.');
    }
    
    setTimeout(() => {
      setFeedbackTexto('');
      setMostrarFeedback(false);
      setEnviado(false);
      setFeedbackTipo('sugerencia');
    }, 2000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)' }}>
      <Header />
      <main style={{
        flex: 1,
        padding: '2rem 1rem',
        maxWidth: '1000px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Header de la página */}
        <div style={{
          marginBottom: '3rem',
          textAlign: 'center'
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              background: 'none',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '0.5rem 1rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <FaArrowLeft size={14} />
            Volver al inicio
          </button>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            Nuestro Progreso
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Registro de nuestras mejoras continuas, avances e implementaciones. 
            Cada día trabajamos para hacer buscadis.com mejor para ti.
          </p>
        </div>

        {/* Botón de Feedback */}
        <div style={{
          marginBottom: '3rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setMostrarFeedback(true)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-primary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <FaLightbulb size={16} />
            Sugerir una mejora
          </button>
          <button
            onClick={() => {
              setFeedbackTipo('problema');
              setMostrarFeedback(true);
            }}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
            }}
          >
            <FaExclamationTriangle size={16} />
            Reportar un problema
          </button>
        </div>

        {/* Entradas de Progreso */}
        <div>
          {progresoData.map((entry, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem',
                border: '1px solid var(--border-color)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}
            >
              {/* Header de entrada */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  flexShrink: 0
                }}>
                  {getTypeIcon(entry.type)}
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <h2 style={{
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: 0
                    }}>
                      {entry.title}
                    </h2>
                    <span style={{
                      fontSize: '0.875rem',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontFamily: 'monospace'
                    }}>
                      v{entry.version}
                    </span>
                    {getImpactBadge(entry.impact)}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)'
                    }}>
                      {new Date(`${entry.date}T${entry.time}`).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} a las {entry.time}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)'
                    }}>
                      {getTypeLabel(entry.type)}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '0.9375rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    margin: 0
                  }}>
                    {entry.description}
                  </p>
                </div>
              </div>

              {/* Beneficios para el usuario */}
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                borderLeft: '4px solid #10b981'
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FaHeart size={14} color="#10b981" />
                  Beneficios para ti
                </h3>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {entry.userBenefits.map((benefit, i) => (
                    <li key={i} style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem',
                      paddingLeft: '1.5rem',
                      position: 'relative',
                      lineHeight: 1.6
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        color: '#10b981'
                      }}>
                        ✓
                      </span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Detalles técnicos */}
              <details style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1rem'
              }}>
                <summary style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}>
                  Detalles técnicos (para desarrolladores)
                </summary>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '1rem 0 0 0'
                }}>
                  {entry.technicalDetails.map((detail, i) => (
                    <li key={i} style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem',
                      paddingLeft: '1.5rem',
                      position: 'relative',
                      lineHeight: 1.6
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        color: 'var(--text-tertiary)'
                      }}>
                        •
                      </span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
      </main>

      {/* Modal de Feedback */}
      {mostrarFeedback && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => !enviado && setMostrarFeedback(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '12px',
              padding: '2rem',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!enviado ? (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    {feedbackTipo === 'problema' ? '🚨 Reportar un problema' : '✨ Sugerir una mejora'}
                  </h3>
                  <button
                    onClick={() => setMostrarFeedback(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '1rem',
                  lineHeight: 1.6
                }}>
                  {feedbackTipo === 'problema'
                    ? 'Ayúdanos a mejorar reportando cualquier problema que encuentres.'
                    : 'Tu opinión es valiosa. ¿Qué te gustaría ver en la plataforma?'
                  }
                </p>

                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  {(['sugerencia', 'problema'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFeedbackTipo(t)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: `1px solid ${feedbackTipo === t ? 'var(--text-primary)' : 'var(--border-color)'}`,
                        backgroundColor: feedbackTipo === t ? 'var(--text-primary)' : 'var(--bg-primary)',
                        color: feedbackTipo === t ? 'var(--bg-primary)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        transition: 'all 0.2s'
                      }}
                    >
                      {t === 'sugerencia' ? '💡 Sugerencia' : '🚨 Problema'}
                    </button>
                  ))}
                </div>

                <textarea
                  value={feedbackTexto}
                  onChange={(e) => setFeedbackTexto(e.target.value)}
                  placeholder={feedbackTipo === 'problema' 
                    ? 'Describe el problema que encontraste...' 
                    : 'Cuéntanos tu sugerencia...'}
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    marginBottom: '1rem'
                  }}
                />
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => setMostrarFeedback(false)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={!feedbackTexto.trim()}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: feedbackTexto.trim() ? 'var(--text-primary)' : 'var(--bg-secondary)',
                      color: feedbackTexto.trim() ? 'var(--bg-primary)' : 'var(--text-tertiary)',
                      cursor: feedbackTexto.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    Enviar
                  </button>
                </div>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '2rem 0'
              }}>
                <FaCheckCircle size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  ¡Gracias!
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  Tu feedback ha sido guardado. Lo revisaremos pronto.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

