'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchSearchResults } from '../services/search.service';
import { useDebouncedValue } from './useDebouncedValue';
import type {
  AggregatedSearchResults,
  SearchFilters,
  SearchResultType,
} from '../interfaces/search.interfaces';

/** Facets con datos reales; `hashtags`/`groups` legacy siempre cuentan 0. */
const FACET_KEYS = ['users', 'pages', 'posts', 'articles', 'events', 'auditions'] as const;

function countResults(results: AggregatedSearchResults | null, type: SearchResultType): number {
  if (!results) return 0;
  if (type === 'all') return FACET_KEYS.reduce((sum, key) => sum + results[key].length, 0);
  if (type === 'hashtags' || type === 'groups') return 0;
  return results[type].length;
}

/**
 * Búsqueda global contra /api/search (+ /api/search/users para personas).
 *
 * `search()` sólo fija query/tipo; el fetch real corre debounced (300 ms) en un
 * efecto con AbortController, así que teclear rápido o cambiar de filtro no
 * dispara una petición por pulsación ni deja llegar respuestas fuera de orden.
 */
export function useSearch() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<SearchResultType>('all');
  const [response, setResponse] = useState<{
    key: string; results: AggregatedSearchResults | null; error: Error | null;
  } | null>(null);
  const debouncedQuery = useDebouncedValue(query, 300);
  const q = debouncedQuery.trim();
  const key = JSON.stringify([q, type]);
  const valid = query.trim().length >= 2 && q.length >= 2;
  const current = valid && response?.key === key ? response : null;
  const results = current?.results ?? null;
  const error = current?.error ?? null;
  const loading = valid && !current;

  const search = useCallback((searchQuery: string, filters?: SearchFilters) => {
    setQuery(searchQuery);
    setType(filters?.type ?? 'all');
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setType('all');
    setResponse(null);
  }, []);

  useEffect(() => {
    if (!valid) return;
    const controller = new AbortController();
    fetchSearchResults(q, type, controller.signal)
      .then((results) => {
        if (!controller.signal.aborted) setResponse({ key, results, error: null });
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setResponse({
          key, results: null, error: err instanceof Error ? err : new Error(String(err)),
        });
      });
    return () => controller.abort();
  }, [q, type, key, valid]);

  const getCountByType = useCallback(
    (t: SearchResultType): number => countResults(results, t),
    [results]
  );

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    search,
    clear,
    getCountByType,
    hasResults: countResults(results, 'all') > 0,
  };
}
