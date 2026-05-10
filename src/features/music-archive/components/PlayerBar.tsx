'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useRef } from 'react';
import {
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  MusicalNoteIcon,
} from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import { incrementPlayCount } from '../actions/music.actions';
import { usePlayerStore } from './PlayerStore';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlayerBar() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playCountFiredRef = useRef<Set<string>>(new Set());

  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const playSerial = usePlayerStore((s) => s.playSerial);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);

  const current = queue[currentIndex];

  // Sync isPlaying ↔ audio element via the playSerial heartbeat.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playSerial, current?.audioUrl]);

  // Sync seek requests.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (Math.abs(audio.currentTime - currentTime) > 0.5) {
      audio.currentTime = currentTime;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playSerial]);

  // Sync volume.
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  if (!current) return null;

  const cover = current.coverCfId ? imageUrl(current.coverCfId, 'avatar') : null;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <audio
        ref={audioRef}
        src={current.audioUrl}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => {
          const d = (e.target as HTMLAudioElement).duration;
          if (Number.isFinite(d) && d > 0) setDuration(Math.round(d));
        }}
        onTimeUpdate={(e) => {
          const t = (e.target as HTMLAudioElement).currentTime;
          setCurrentTime(t);
          // Fire incrementPlayCount once per track when the listener crosses 30s.
          if (t > 30 && !playCountFiredRef.current.has(current.trackId)) {
            playCountFiredRef.current.add(current.trackId);
            void incrementPlayCount(current.trackId);
          }
        }}
        onEnded={() => next()}
      />

      <div className="mx-auto flex max-w-6xl items-center gap-3">
        {/* Cover + meta */}
        <Link
          href={`/musica/albumes/${current.albumSlug}` as Route}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
            {cover ? (
              <img src={cover} alt="" className="h-full w-full object-cover" aria-hidden />
            ) : (
              <MusicalNoteIcon className="h-5 w-5 text-zinc-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {current.title}
            </p>
            <p className="truncate text-xs text-zinc-500">{current.artistName}</p>
          </div>
        </Link>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prev}
            className="rounded p-1.5 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Anterior"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={next}
            disabled={currentIndex >= queue.length - 1}
            className="rounded p-1.5 text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Siguiente"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Scrub */}
        <div className="hidden flex-1 items-center gap-2 sm:flex">
          <span className="w-10 text-right text-[10px] tabular-nums text-zinc-500">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(duration, 1)}
            step={1}
            value={Math.min(currentTime, duration)}
            onChange={(e) => seek(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900 dark:bg-zinc-800 dark:accent-zinc-100"
            aria-label="Posición"
            style={{
              background: `linear-gradient(to right, currentColor ${progress}%, transparent ${progress}%)`,
            }}
          />
          <span className="w-10 text-[10px] tabular-nums text-zinc-500">
            {formatTime(duration)}
          </span>
        </div>

        {/* Volume */}
        <div className="hidden items-center gap-1 md:flex">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900 dark:bg-zinc-800 dark:accent-zinc-100"
            aria-label="Volumen"
          />
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={() => usePlayerStore.setState({ queue: [], isPlaying: false, currentIndex: 0 })}
          className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          aria-label="Cerrar reproductor"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
