'use client';

import { useState, useCallback } from 'react';
import type {
  SearchResults,
  SearchFilters,
  SearchResultType,
} from '../interfaces/search.interfaces';

/**
 * Search hook — currently a no-op stub.
 *
 * The previous implementation called a GraphQL server that no longer
 * exists. When the backend grows a real search endpoint (full-text on
 * profiles/posts/hashtags/groups, or pg_trgm / Postgres `websearch_to_tsquery`),
 * replace the body of `search()` with a Supabase call and populate `results`.
 *
 * Keeping the exported shape means every consumer (SearchPageContent etc.)
 * still compiles and renders — they just get empty results.
 */
export function useSearch() {
  const [query, setQuery] = useState('');
  const [results] = useState<SearchResults | null>(null);

  const search = useCallback((searchQuery: string, _filters?: SearchFilters) => {
    setQuery(searchQuery);
    // No-op until real search is implemented.
  }, []);

  const clear = useCallback(() => {
    setQuery('');
  }, []);

  const getCountByType = useCallback((_type: SearchResultType): number => 0, []);

  return {
    query,
    setQuery,
    results,
    loading: false,
    error: null as Error | null,
    search,
    clear,
    getCountByType,
    hasResults: false,
  };
}
