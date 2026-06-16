'use client';

import { useState, useRef } from 'react';
import type { BusinessProfile } from '@/types/business';

interface BusinessProfileChatEditorProps {
  profile: Partial<BusinessProfile>;
  onUpdate: (patch: Partial<BusinessProfile>) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function BusinessProfileChatEditor({
  profile,
  onUpdate,
}: BusinessProfileChatEditorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Soy tu asistente de perfil. Puedo actualizar campos, reordenar bloques o aplicar plantillas. ¿Qué quieres cambiar?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || !profile.id || loading) return;

    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setLoading(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`/api/business/${profile.id}/edit-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, profile }),
        signal: abortRef.current.signal,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');

      if (data.patch) onUpdate(data.patch);
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: data.reply || 'Listo, actualicé tu perfil.' },
      ]);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: 'No pude procesar eso. Intenta de nuevo.' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-80 border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm rounded-xl px-3 py-2 max-w-[90%] ${
              msg.role === 'user'
                ? 'ml-auto bg-[var(--brand-color)] text-white'
                : 'bg-white border border-slate-100 text-slate-700'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <p className="text-xs text-slate-400 animate-pulse">Pensando...</p>
        )}
      </div>
      <div className="flex gap-2 p-2 border-t bg-white">
        <input
          className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none"
          placeholder="Ej: Cambia el tagline a..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          disabled={loading}
        />
        <button
          type="button"
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-xl bg-[var(--brand-color)] text-white text-sm font-bold disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
