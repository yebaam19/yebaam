'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef(0);

  function refresh() {
    const myTick = ++tickRef.current;
    setError(null);
    startTransition(async () => {
      const res = await fetcher(query.trim() || undefined);
      if (tickRef.current !== myTick) return; // a newer query already started
      if (res.ok) setRows(res.data);
      else setError(res.error);
    });
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      refresh();
    }, debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return { query, setQuery, rows, setRows, pending, error, refresh };
}
