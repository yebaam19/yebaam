'use client';

import { useQuery } from '@apollo/client/react';
import { GET_TRENDING_SEARCHES_QUERY } from '../graphql/search.queries';
import type { SearchSuggestion } from '../interfaces/search.interfaces';

interface TrendingSearchesResponse {
  trendingSearches: SearchSuggestion[];
}

// Mock data como fallback
const MOCK_SUGGESTIONS: SearchSuggestion[] = [
  {
    id: '1',
    query: 'JavaScript',
    type: 'hashtags',
    count: 15420,
    score: 95,
  },
  {
    id: '2',
    query: 'React',
    type: 'hashtags',
    count: 12350,
    score: 88,
  },
  {
    id: '3',
    query: 'Tutorial de Next.js',
    type: 'posts',
    count: 8900,
    score: 75,
  },
  {
    id: '4',
    query: 'Desarrollo Web',
    type: 'hashtags',
    count: 6700,
    score: 68,
  },
  {
    id: '5',
    query: 'TypeScript Tips',
    type: 'posts',
    count: 5400,
    score: 62,
  },
];

/**
 * Hook para obtener las búsquedas trending/populares
 * Usa datos del backend, con fallback a mock data
 * 
 * @example
 * const { suggestions, loading } = useSearchSuggestions(5);
 */
export function useSearchSuggestions(limit: number = 5) {
  const { data, loading, error } = useQuery<TrendingSearchesResponse>(
    GET_TRENDING_SEARCHES_QUERY,
    {
      variables: { limit },
      fetchPolicy: 'cache-first',
      // No mostrar errores en consola, usar fallback silenciosamente
      errorPolicy: 'ignore',
    }
  );

  // Si hay error o no hay datos del backend, usar mock data
  const suggestions = data?.trendingSearches || (error ? MOCK_SUGGESTIONS.slice(0, limit) : []);

  return {
    suggestions,
    loading,
    error: null, // No exponer el error, usamos fallback
    hasSuggestions: suggestions.length > 0,
  };
}
