'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import {
  MusicalNoteIcon,
  UserGroupIcon,
  RectangleStackIcon,
} from '@/components/icons/heroicons-shim';
import { searchMusicTopHitsAction } from '../actions/music.actions';
import type { MusicSearchHit } from '../types/music.types';

const ICON_BY_TYPE = {
  artist: UserGroupIcon,
  album: RectangleStackIcon,
  track: MusicalNoteIcon,
} as const;

const TYPE_LABEL = {
  artist: 'Artista',
  album: 'Álbum',
  track: 'Canción',
} as const;

interface Props {
  initialValue?: string;
  size?: 'hero' | 'compact';
  autoFocus?: boolean;
}

export function MusicSearchBar({ initialValue = '', size = 'hero', autoFocus = false }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [hits, setHits] = useState<MusicSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Debounced top-hits fetch.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setHits([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await searchMusicTopHitsAction(trimmed);
        if (res.ok) {
          setHits(res.data);
          setOpen(true);
        }
      });
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setOpen(false);
    router.push(`/musica/buscar?q=${encodeURIComponent(trimmed)}` as Route);
  }

  const heroStyles =
    size === 'hero'
      ? 'h-14 rounded-2xl border-zinc-300 px-5 text-base shadow-sm focus:border-amber-500 focus:ring-amber-500'
      : 'h-10 rounded-lg border-zinc-200 px-3 text-sm focus:border-amber-500 focus:ring-amber-500';

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={submit} className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            className={size === 'hero' ? 'h-5 w-5' : 'h-4 w-4'}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
          </svg>
        </span>
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => hits.length > 0 && setOpen(true)}
          placeholder="Buscar canciones, artistas o álbumes…"
          autoFocus={autoFocus}
          className={`w-full border bg-white pl-12 pr-4 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${heroStyles}`}
          aria-label="Buscar en el archivo musical"
        />
      </form>

      {open && hits.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <ul className="max-h-96 overflow-auto py-1">
            {hits.map((h) => {
              const Icon = ICON_BY_TYPE[h.type];
              return (
                <li key={`${h.type}-${h.id}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push(h.href as Route);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <Icon className="h-4 w-4 flex-shrink-0 text-zinc-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-900 dark:text-zinc-100">{h.label}</p>
                      {h.sublabel && (
                        <p className="truncate text-xs text-zinc-500">{h.sublabel}</p>
                      )}
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800">
                      {TYPE_LABEL[h.type]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
            <button
              type="button"
              onClick={submit}
              className="text-xs font-medium text-amber-700 hover:underline dark:text-amber-400"
            >
              Ver todos los resultados →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
