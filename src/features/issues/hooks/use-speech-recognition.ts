"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";

import type { Locale } from "@/lib/locale";

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: {
    resultIndex: number;
    results: Array<{ isFinal: boolean; [index: number]: { transcript?: string } }>;
  }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };

  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function localeToSpeechLang(locale: Locale): string {
  return locale === "pl" ? "pl-PL" : "en-US";
}

function getSpeechSupportSnapshot(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function useSpeechRecognition(locale: Locale) {
  const isSupported = useSyncExternalStore(
    () => () => {},
    getSpeechSupportSnapshot,
    () => false,
  );
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (onTranscript: (text: string) => void) => {
      const Ctor = getSpeechRecognitionCtor();

      if (!Ctor) {
        return;
      }

      const recognition = new Ctor();
      recognition.lang = localeToSpeechLang(locale);
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event: {
        resultIndex: number;
        results: Array<{ isFinal: boolean; [index: number]: { transcript?: string } }>;
      }) => {
        const parts: string[] = [];

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          if (result.isFinal) {
            parts.push(result[0]?.transcript ?? "");
          }
        }

        const text = parts.join(" ").trim();
        if (text.length > 0) {
          onTranscript(text);
        }
      };

      recognition.onerror = () => {
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    },
    [locale, stopListening],
  );

  const toggleListening = useCallback(
    (onTranscript: (text: string) => void) => {
      if (isListening) {
        stopListening();
        return;
      }

      startListening(onTranscript);
    },
    [isListening, startListening, stopListening],
  );

  return {
    isListening,
    isSupported,
    toggleListening,
    stopListening,
  };
}
