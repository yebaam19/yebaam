'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { searchArtistsAction } from '../../actions/search.actions';
import type { MusicArtistRow } from '../../types/music.types';
import { useDebouncedMusicSearch } from '../../hooks/useDebouncedMusicSearch';
import { inputCls } from './constants';

export interface ArtistSelection {
  /** Existing row id, or null if the user wants to create a new artist. */
  existingId: string | null;
  name: string;
}

interface Props {
  value: ArtistSelection;
  onChange: (next: ArtistSelection) => void;
  placeholder?: string;
}

/** Debounced typeahead for `music_artists`. On selection, populates the parent
 *  with either an existing row id (reuse) or a fresh name (create). The parent
 *  decides whether to call `findOrCreateArtistAction` or to show extra
 *  inline-create fields (país, born/died years, photo). */
export function ArtistAutocomplete({ value, onChange, placeholder }: Props) {
  const t = useTranslations('musica');
  const { results: hits } = useDebouncedMusicSearch<MusicArtistRow>(value.existingId ? '' : value.name, searchArtistsAction, 250);
  const [open, setOpen] = useState(!value.existingId && value.name.trim().length >= 2);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value.name}
        onChange={(e) => { onChange({ existingId: null, name: e.target.value }); setOpen(true); }}
        onFocus={() => hits.length > 0 && setOpen(true)}
        placeholder={placeholder ?? t('upload.artistPlaceholder')}
        className={inputCls}
        autoComplete="off"
      />
      {value.existingId && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          {t('upload.existingBadge')}
        </span>
      )}
      {open && hits.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          {hits.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => {
                  onChange({ existingId: a.id, name: a.name });
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <span className="truncate text-zinc-900 dark:text-zinc-100">{a.name}</span>
                {a.country && (
                  <span className="shrink-0 text-xs text-zinc-500">{a.country}</span>
                )}
              </button>
            </li>
          ))}
          <li className="border-t border-zinc-100 px-3 py-2 text-[11px] text-zinc-500 dark:border-zinc-800">
            {t('upload.artistCreateHint')}
          </li>
        </ul>
      )}
    </div>
  );
}
