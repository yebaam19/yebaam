'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useDebouncedCallback } from '@/lib/hooks/useScheduledCallback';

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

interface Options<T> {
  initial: T[];
  /** Server action that takes the search query (or undefined for "all") and
   *  returns the filtered list. */
  fetcher: (q?: string) => Promise<ActionResult<T[]>>;
  /** Debounce window in ms before re-querying on input change. */
  debounceMs?: number;
}

interface State<T> {
  query: string;
  setQuery: (q: string) => void;
  rows: T[];
  setRows: React.Dispatch<React.SetStateAction<T[]>>;
  pending: boolean;
  error: string | null;
  refresh: () => void;
}

/** Shared search-and-list state for the three admin entity lists (albums,
 *  artists, labels). Keeps the debounce + transition + error handling in one
 *  place so the three list components only have to render their columns. */
export function useAdminEntitySearch<T>({ initial, fetcher, debounceMs = 250 }: Options<T>): State<T> {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<T[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const firstRender = useRef(true);
  const tickRef = useRef(0);
  const invalidate = useCallback(() => { ++tickRef.current; }, []);

  function run(value: string) {
    const myTick = ++tickRef.current;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetcher(value.trim() || undefined);
        if (tickRef.current !== myTick) return;
        if (res.ok) setRows(res.data); else setError(res.error);
      } catch (cause) {
        if (tickRef.current === myTick) setError(cause instanceof Error ? cause.message : 'Error de búsqueda');
      }
    });
  }
  const schedule = useDebouncedCallback(run, debounceMs);
  const refresh = () => { schedule.cancel(); run(query); };
  useEffect(() => {
    if (firstRender.current) firstRender.current = false;
    else schedule(query);
    return () => { schedule.cancel(); invalidate(); };
  }, [query, schedule, debounceMs, invalidate]);

  return { query, setQuery, rows, setRows, pending, error, refresh };
}
