"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getPreferredRecordingMimeType,
  VOICE_INTAKE_MAX_FOLLOW_UP_MS,
  VOICE_INTAKE_MAX_INITIAL_MS,
  VOICE_INTAKE_MIN_RECORDING_MS,
} from "@/features/voice-intake/lib/audio-constraints";

export function useMediaRecorder(input: {
  maxDurationMs: number;
  onAutoStop?: (blob: Blob, durationMs: number) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<"mic_denied" | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const onAutoStopRef = useRef(input.onAutoStop);

  useEffect(() => {
    onAutoStopRef.current = input.onAutoStop;
  }, [input.onAutoStop]);

  const cleanupStream = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    analyserRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => cleanupStream, [cleanupStream]);

  const stopRecording = useCallback((): Promise<{ blob: Blob; durationMs: number } | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;

      if (!recorder || recorder.state === "inactive") {
        cleanupStream();
        setIsRecording(false);
        resolve(null);
        return;
      }

      const elapsed = Date.now() - startedAtRef.current;

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || getPreferredRecordingMimeType(),
        });
        chunksRef.current = [];
        cleanupStream();
        setIsRecording(false);
        resolve({ blob, durationMs: elapsed });
      };

      recorder.stop();
    });
  }, [cleanupStream]);

  const startRecording = useCallback(async () => {
    setError(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = getPreferredRecordingMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        void audioContext.close();
      };

      startedAtRef.current = Date.now();
      setDurationMs(0);
      recorder.start(250);
      setIsRecording(true);

      if (typeof navigator.vibrate === "function") {
        navigator.vibrate(10);
      }

      const tick = () => {
        const elapsed = Date.now() - startedAtRef.current;
        setDurationMs(elapsed);

        if (analyserRef.current) {
          const data = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(data);
          const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
          setAudioLevel(avg / 255);
        }

        if (elapsed >= input.maxDurationMs) {
          void stopRecording().then((result) => {
            if (result && onAutoStopRef.current) {
              onAutoStopRef.current(result.blob, result.durationMs);
            }
          });
          return;
        }

        animationRef.current = requestAnimationFrame(tick);
      };

      animationRef.current = requestAnimationFrame(tick);
    } catch {
      cleanupStream();
      setError("mic_denied");
      setIsRecording(false);
    }
  }, [cleanupStream, input.maxDurationMs, stopRecording]);

  return {
    isRecording,
    durationMs,
    audioLevel,
    error,
    startRecording,
    stopRecording,
    minDurationMs: VOICE_INTAKE_MIN_RECORDING_MS,
    maxInitialMs: VOICE_INTAKE_MAX_INITIAL_MS,
    maxFollowUpMs: VOICE_INTAKE_MAX_FOLLOW_UP_MS,
  };
}

export function formatRecordingTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
