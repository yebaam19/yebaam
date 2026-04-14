'use client';

import type { SearchSuggestion } from '../interfaces/search.interfaces';

/**
 * Trending-searches hook — currently a no-op stub.
 *
 * The previous implementation called a GraphQL server that no longer
 * exists. Replace with a Supabase query when a real trending endpoint
 * lands (e.g. a table that tracks search_events or a materialized view
 * of post hashtags ranked by recency × frequency).
 */
export function useSearchSuggestions(_limit: number = 5) {
  const suggestions: SearchSuggestion[] = [];
  return {
    suggestions,
    loading: false,
    error: null as Error | null,
    hasSuggestions: false,
  };
}
