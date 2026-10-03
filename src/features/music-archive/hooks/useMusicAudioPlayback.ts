'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { usePlayerStore } from '../components/PlayerStore';
import { AUDIO_REFRESH_MARGIN_MS } from '../lib/audio-url-cache';
import { musicAudioUrls } from '../lib/audio-url-session';

/** Owns the element's source so a late signature never replaces a newer track. */
export function useMusicAudioPlayback(audioRef: RefObject<HTMLAudioElement | null>, ready: boolean) {
  const current = usePlayerStore((s) => s.queue[s.currentIndex]);
  const serial = usePlayerStore((s) => s.playSerial);
  const volume = usePlayerStore((s) => s.volume);
  const [error, setError] = useState(false);
  const run = useRef(0);
  const failedTrack = useRef<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [audioRef, volume, current?.trackId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current || !ready) return;
    const generation = ++run.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let recovering = false;
    let recoveryUsed = false;
    let loading = false;
    let pendingSeek: number | null = null;
    const active = () => generation === run.current &&
      usePlayerStore.getState().queue[usePlayerStore.getState().currentIndex]?.trackId === current.trackId;
    const fail = () => {
      if (!active()) return;
      audio.pause();
      usePlayerStore.getState().setIsPlaying(false);
      failedTrack.current = current.trackId;
      setError(true);
      clearTimeout(timer);
    };
    const play = async () => {
      if (!active()) return;
      if (usePlayerStore.getState().isPlaying) {
        const source = audio.src;
        try { await audio.play(); } catch {
          if (audio.src === source && usePlayerStore.getState().isPlaying) fail();
        }
      } else audio.pause();
    };
    const loaded = () => {
      if (!active()) return;
      if (pendingSeek !== null) {
        audio.currentTime = Number.isFinite(audio.duration)
          ? Math.min(pendingSeek, Math.max(0, audio.duration)) : pendingSeek;
        pendingSeek = null;
      }
      void play();
    };
    const load = async (force = false) => {
      if (loading) return;
      loading = true;
      try {
        if (force) musicAudioUrls.invalidate(current.trackId);
        const signed = await musicAudioUrls.get(current.trackId);
        if (!active()) return;
        failedTrack.current = null;
        setError(false);
        const state = usePlayerStore.getState();
        if (force || audio.getAttribute('src') !== signed.url) {
          pendingSeek = state.currentTime;
          audio.pause();
          audio.src = signed.url; // R2 or its edge cache serves bytes outside Next.js.
          audio.load();
        } else if (Math.abs(audio.currentTime - state.currentTime) > 0.5) {
          audio.currentTime = state.currentTime;
        }
        void play();
        if (active() && usePlayerStore.getState().isPlaying) {
          clearTimeout(timer);
          timer = setTimeout(() => { void load(); }, Math.max(1,
            musicAudioUrls.remaining(current.trackId) - AUDIO_REFRESH_MARGIN_MS));
        }
      } catch { fail(); }
      finally { loading = false; }
    };
    const recover = () => {
      if (!active() || recovering) return;
      if (recoveryUsed) { fail(); return; }
      recoveryUsed = true;
      recovering = true;
      void load(true).finally(() => { recovering = false; });
    };
    // Timers may be throttled in background tabs: recheck before resuming or
    // issuing another range request after focus/network recovery.
    const recheck = () => {
      if (document.visibilityState !== 'hidden' && usePlayerStore.getState().isPlaying) void load();
    };
    audio.addEventListener('loadedmetadata', loaded);
    audio.addEventListener('error', recover);
    window.addEventListener('focus', recheck);
    window.addEventListener('online', recheck);
    document.addEventListener('visibilitychange', recheck);
    if (!usePlayerStore.getState().isPlaying) audio.pause();
    // A failed element can reject play() without emitting another error event.
    // Retry both the signature and the media load, even if the URL is identical.
    void load(failedTrack.current === current.trackId);
    return () => {
      run.current += 1;
      clearTimeout(timer);
      audio.removeEventListener('loadedmetadata', loaded);
      audio.removeEventListener('error', recover);
      window.removeEventListener('focus', recheck);
      window.removeEventListener('online', recheck);
      document.removeEventListener('visibilitychange', recheck);
      audio.pause();
    };
  }, [audioRef, current, serial, ready]);

  // Unmount/logout/close releases the bearer URL and any buffered audio.
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
    };
  }, [audioRef, current?.trackId]);
  return error;
}
