'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { SEARCH_GLOBAL_QUERY } from '../graphql/search.queries';
import type {
  SearchResults,
  SearchFilters,
  SearchResultType,
  GlobalSearchInput,
  GlobalSearchResponse,
} from '../interfaces/search.interfaces';

/**
 * Variables de la query GraphQL (actualizado para usar searchGlobal)
 */
interface SearchGlobalQueryVariables {
  input: GlobalSearchInput;
}

interface SearchGlobalQueryResponse {
  searchGlobal: GlobalSearchResponse;
}

/**
 * Hook para búsqueda con GraphQL
 * ACTUALIZADO para usar searchGlobal (nuevo sistema con Redis)
 * 
 * @example
 * const { results, loading, search, clear } = useSearch();
 * search('john doe', { type: 'users' });
 */
export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [executeSearch, { loading, error, data }] = useLazyQuery<
    SearchGlobalQueryResponse,
    SearchGlobalQueryVariables
  >(SEARCH_GLOBAL_QUERY, {
    fetchPolicy: 'network-only',
  });

  // Debounce del query (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // Ejecutar búsqueda cuando cambia el debounced query
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      console.log('[useSearch] Buscando:', debouncedQuery);
      executeSearch({
        variables: {
          input: {
            query: debouncedQuery,
            limit: 10,
          },
        },
      });
    } else {
      setResults(null);
    }
  }, [debouncedQuery, executeSearch]);

  // Actualizar resultados cuando llega la data
  useEffect(() => {
    if (data?.searchGlobal) {
      // Convertir respuesta de searchGlobal al formato legacy
      const legacyResults: SearchResults = {
        users: (data.searchGlobal.users?.results || []).map(item => ({
          id: item.id,
          username: item.username,
          firstName: item.firstName,
          lastName: item.lastName,
          avatar: item.avatar || null,
          bio: item.bio || null,
          isVerified: item.isVerified,
          followersCount: item.followersCount,
          mutualFriendsCount: item.mutualFriendsCount,
          isFollowing: false, // No disponible en el nuevo schema
        })),
        posts: [],
        hashtags: [],
        groups: [],
        totalCount: data.searchGlobal.metadata.totalResults,
        hasMore: data.searchGlobal.users?.hasMore || false,
      };
      
      setResults(legacyResults);
      console.log('[useSearch] Resultados:', {
        users: legacyResults.users.length,
        total: legacyResults.totalCount,
        time: data.searchGlobal.metadata.searchTime + 'ms',
      });
    }
  }, [data]);

  /**
   * Buscar con query y filtros opcionales
   */
  const search = useCallback(
    (searchQuery: string, filters?: SearchFilters) => {
      setQuery(searchQuery);
      
      if (searchQuery.trim().length >= 2) {
        executeSearch({
          variables: {
            input: {
              query: searchQuery,
              limit: filters?.limit || 10,
            },
          },
        });
      }
    },
    [executeSearch]
  );

  /**
   * Limpiar búsqueda
   */
  const clear = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setResults(null);
  }, []);

  /**
   * Obtener total de resultados por tipo
   */
  const getCountByType = useCallback(
    (type: SearchResultType): number => {
      if (!results) return 0;
      
      switch (type) {
        case 'users':
          return results.users.length;
        case 'posts':
          return results.posts.length;
        case 'hashtags':
          return results.hashtags.length;
        case 'groups':
          return results.groups.length;
        case 'all':
          return results.totalCount;
        default:
          return 0;
      }
    },
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
    hasResults: results !== null && results.totalCount > 0,
  };
}
