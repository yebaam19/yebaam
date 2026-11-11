'use client';

import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';

type SearchResult<T> = { ok: true; data: T[] } | { ok: false; error: string };

/** Keep results tied to their query and discard responses after edits/unmount. */
export function useDebouncedMusicSearch<T>(
  query: string,
  search: (query: string) => Promise<SearchResult<T>>,
  debounceMs = 300,
  minLength = 2,
) {
  const normalized = query.trim();
  const hasQuery = normalized.length >= minLength;
  const settled = useDebouncedValue(normalized, debounceMs, '');
  const [result, setResult] = useState<{
    query: string;
    data: T[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!hasQuery || settled !== normalized) return;
    let cancelled = false;
    void search(normalized).then((response) => {
        if (cancelled) return;
        setResult({
          query: normalized,
          data: response.ok ? response.data : [],
          error: response.ok ? null : response.error,
        });
      }).catch((error: unknown) => {
        if (cancelled) return;
        setResult({
          query: normalized,
          data: [],
          error: error instanceof Error ? error.message : 'Error de búsqueda',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [normalized, hasQuery, search, settled]);

  const current = hasQuery && result?.query === normalized ? result : null;
  return {
    results: current?.data ?? [],
    error: current?.error ?? null,
    loading: hasQuery && current === null,
    hasQuery,
  };
}
