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
  const [results, setResults] = useState<AggregatedSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debouncedQuery = useDebouncedValue(query, 300);

  const search = useCallback((searchQuery: string, filters?: SearchFilters) => {
    setQuery(searchQuery);
    setType(filters?.type ?? 'all');
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setType('all');
    setResults(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const q = debouncedQuery.trim();
    // Mismo umbral que los route handlers: con <2 chars devuelven vacío.
    if (q.length < 2) {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchSearchResults(q, type, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) setResults(res);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setResults(null);
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [debouncedQuery, type]);

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
