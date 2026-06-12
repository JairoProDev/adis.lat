'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface BrowserSpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  onstart: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onend: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: BrowserSpeechRecognition, ev: { error: string }) => void) | null;
  onresult: ((this: BrowserSpeechRecognition, ev: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(lang = 'es-PE') {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognitionCtor()));
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const start = useCallback(
    (onResult: (transcript: string) => void, onError?: (message: string) => void) => {
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) {
        onError?.('Tu navegador no soporta búsqueda por voz. Prueba con Chrome o Edge.');
        return;
      }

      recognitionRef.current?.stop();

      const recognition = new Ctor();
      recognitionRef.current = recognition;
      recognition.lang = lang;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          onError?.('Permite el acceso al micrófono para usar búsqueda por voz.');
          return;
        }
        if (event.error === 'no-speech') {
          onError?.('No escuché nada. Intenta de nuevo.');
          return;
        }
        onError?.('No se pudo usar el micrófono. Intenta de nuevo.');
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim();
        if (transcript) onResult(transcript);
      };

      try {
        recognition.start();
      } catch {
        onError?.('El micrófono está ocupado. Espera un momento e intenta de nuevo.');
        setIsListening(false);
      }
    },
    [lang]
  );

  useEffect(() => () => recognitionRef.current?.stop(), []);

  return { isListening, isSupported, start, stop };
}
