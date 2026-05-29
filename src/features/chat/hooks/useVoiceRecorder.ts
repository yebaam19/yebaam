'use client';

import { useCallback, useRef, useState } from 'react';

export interface RecordedAudio {
  blob: Blob;
  /** Base mime (no codecs), e.g. "audio/webm". */
  mime: string;
  /** Seconds. */
  duration: number;
}

function pickMime(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      /* keep trying */
    }
  }
  return '';
}

const baseMime = (m: string) => m.split(';')[0].trim().toLowerCase();

/**
 * Minimal MediaRecorder wrapper for WhatsApp-style voice notes: start on press,
 * stop on release. `stop()` resolves with the recorded blob + duration (or null
 * if nothing usable was captured). Always releases the mic stream.
 */
export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolveRef = useRef<((r: RecordedAudio | null) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      return false;
    }
    const mime = pickMime();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const fullMime = rec.mimeType || mime || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: fullMime });
        const duration = (Date.now() - startedAtRef.current) / 1000;
        const resolve = resolveRef.current;
        resolveRef.current = null;
        cleanup();
        setIsRecording(false);
        setSeconds(0);
        resolve?.(blob.size > 0 ? { blob, mime: baseMime(fullMime), duration } : null);
      };
      startedAtRef.current = Date.now();
      rec.start();
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      return true;
    } catch {
      cleanup();
      setIsRecording(false);
      return false;
    }
  }, [cleanup]);

  const stop = useCallback((): Promise<RecordedAudio | null> => {
    return new Promise((resolve) => {
      const rec = recorderRef.current;
      if (!rec || rec.state === 'inactive') {
        resolve(null);
        return;
      }
      resolveRef.current = resolve;
      try {
        rec.stop();
      } catch {
        resolveRef.current = null;
        cleanup();
        setIsRecording(false);
        setSeconds(0);
        resolve(null);
      }
    });
  }, [cleanup]);

  const cancel = useCallback(() => {
    resolveRef.current = null;
    const rec = recorderRef.current;
    try {
      if (rec && rec.state !== 'inactive') rec.stop();
    } catch {
      /* noop */
    }
    cleanup();
    setIsRecording(false);
    setSeconds(0);
  }, [cleanup]);

  return { isRecording, seconds, start, stop, cancel };
}
