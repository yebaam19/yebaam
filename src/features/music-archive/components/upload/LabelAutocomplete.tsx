'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { searchLabelsAction } from '../../actions/search.actions';
import type { MusicLabelRow } from '../../types/music.types';
import { inputCls } from './constants';

export interface LabelSelection {
  /** Existing row id, or null if the user wants to create a new label. */
  existingId: string | null;
  name: string;
}

interface Props {
  value: LabelSelection;
  onChange: (next: LabelSelection) => void;
}

export function LabelAutocomplete({ value, onChange }: Props) {
  const [hits, setHits] = useState<MusicLabelRow[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.name.trim();
    if (trimmed.length < 2 || value.existingId) {
      setHits([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await searchLabelsAction(trimmed);
        if (res.ok) {
          setHits(res.data);
          setOpen(true);
        }
      });
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value.name, value.existingId]);

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
        onChange={(e) => onChange({ existingId: null, name: e.target.value })}
        onFocus={() => hits.length > 0 && setOpen(true)}
        placeholder="Documental"
        className={inputCls}
        autoComplete="off"
      />
      {value.existingId && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          Existente
        </span>
      )}
      {open && hits.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          {hits.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => {
                  onChange({ existingId: l.id, name: l.name });
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <span className="truncate text-zinc-900 dark:text-zinc-100">{l.name}</span>
                {l.country && (
                  <span className="shrink-0 text-xs text-zinc-500">{l.country}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
