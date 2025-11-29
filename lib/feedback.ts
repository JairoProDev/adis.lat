import { generarIdUnico } from './utils';

export interface Feedback {
  id: string;
  tipo: 'sugerencia' | 'problema';
  texto: string;
  fecha: string;
  hora: string;
  userAgent?: string;
  url?: string;
  imagenUrl?: string; // URL de la imagen si se subió una captura
}

const FEEDBACK_STORAGE_KEY = 'adis_feedback_pendientes';

export function guardarFeedbackLocal(feedback: Omit<Feedback, 'id' | 'fecha' | 'hora'>): void {
  if (typeof window === 'undefined') return;

  const nuevoFeedback: Feedback = {
    ...feedback,
    id: generarIdUnico(),
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    url: window.location.href,
    userAgent: navigator.userAgent
  };

  const feedbacksPendientes = obtenerFeedbacksPendientes();
  feedbacksPendientes.push(nuevoFeedback);
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedbacksPendientes));
}

export function obtenerFeedbacksPendientes(): Feedback[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function limpiarFeedbacksEnviados(ids: string[]): void {
  if (typeof window === 'undefined') return;
  const feedbacks = obtenerFeedbacksPendientes();
  const feedbacksRestantes = feedbacks.filter(f => !ids.includes(f.id));
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedbacksRestantes));
}

// Función para enviar feedbacks a API
export async function enviarFeedbacksAAPI(): Promise<void> {
  const feedbacks = obtenerFeedbacksPendientes();
  if (feedbacks.length === 0) return;

  console.log(`📤 Enviando ${feedbacks.length} feedback(s) pendiente(s) a la API...`);

  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbacks })
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ ${result.saved} feedback(s) guardado(s) correctamente:`, result);
      limpiarFeedbacksEnviados(feedbacks.map(f => f.id));
    } else {
      console.error('❌ Error al enviar feedbacks:', {
        status: response.status,
        statusText: response.statusText,
        error: result
      });
      // No limpiar si falló, para reintentar después
    }
  } catch (error: any) {
    console.error('❌ Error de red al enviar feedbacks:', {
      message: error.message,
      error
    });
    // No limpiar si falló, para reintentar después
  }
}

// Función para enviar un feedback inmediatamente (sin esperar al batch)
export async function enviarFeedbackInmediato(feedback: Omit<Feedback, 'id' | 'fecha' | 'hora'>): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const nuevoFeedback: Feedback = {
    ...feedback,
    id: generarIdUnico(),
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    url: window.location.href,
    userAgent: navigator.userAgent,
    imagenUrl: feedback.imagenUrl
  };

  console.log('📤 Enviando feedback inmediato:', nuevoFeedback);

  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbacks: [nuevoFeedback] })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Feedback enviado inmediatamente:', result);
      return true;
    } else {
      console.error('❌ Error al enviar feedback inmediato:', {
        status: response.status,
        error: result
      });
      // Si falla, guardar localmente para enviar después
      guardarFeedbackLocal(feedback);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Error de red al enviar feedback inmediato:', {
      message: error.message,
      error
    });
    // Si falla, guardar localmente para enviar después
    guardarFeedbackLocal(feedback);
    return false;
  }
}

