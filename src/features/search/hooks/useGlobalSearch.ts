'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { SEARCH_GLOBAL_QUERY, QUICK_SEARCH_QUERY } from '../graphql/search.queries';
import type {
  GlobalSearchInput,
  GlobalSearchResponse,
  SearchEntityType,
} from '../interfaces/search.interfaces';

/**
 * Variables de la query GraphQL
 */
interface SearchGlobalQueryVariables {
  input: GlobalSearchInput;
}

interface SearchGlobalQueryResponse {
  searchGlobal: GlobalSearchResponse;
}

interface QuickSearchQueryVariables {
  query: string;
}

interface QuickSearchQueryResponse {
  quickSearch: GlobalSearchResponse;
}

/**
 * Hook para búsqueda global inteligente
 * 
 * Características:
 * - Auto-detección de tipo: @usuario, #hashtag, texto
 * - Búsqueda en usuarios, posts, hashtags y comentarios
 * - Soporte para autocomplete con quickSearch
 * - Debouncing automático
 * 
 * @example
 * const { results, loading, search, quickSearch } = useGlobalSearch();
 * 
 * // Búsqueda normal
 * search('juan perez');
 * 
 * // Búsqueda con auto-detección
 * search('@maria'); // Busca solo usuarios
 * search('#trending'); // Busca solo hashtags
 * 
 * // Búsqueda rápida para autocomplete
 * quickSearch('@car');
 */
export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [executeSearch, { loading, error, data }] = useLazyQuery<
    SearchGlobalQueryResponse,
    SearchGlobalQueryVariables
  >(SEARCH_GLOBAL_QUERY, {
    fetchPolicy: 'network-only',
  });

  const [executeQuickSearch, { loading: quickLoading, data: quickData }] = useLazyQuery<
    QuickSearchQueryResponse,
    QuickSearchQueryVariables
  >(QUICK_SEARCH_QUERY, {
    fetchPolicy: 'network-only',
  });

  // Actualizar resultados cuando llega data de búsqueda normal
  useEffect(() => {
    if (data?.searchGlobal) {
      setResults(data.searchGlobal);
      console.log(' [useGlobalSearch] Resultados:', {
        users: data.searchGlobal.users?.total || 0,
        posts: data.searchGlobal.posts?.total || 0,
        hashtags: data.searchGlobal.hashtags?.total || 0,
        total: data.searchGlobal.metadata.totalResults,
        time: data.searchGlobal.metadata.searchTime + 'ms',
        cached: data.searchGlobal.metadata.fromCache,
      });
    }
  }, [data]);

  // Actualizar resultados cuando llega data de quick search
  useEffect(() => {
    if (quickData?.quickSearch) {
      setResults(quickData.quickSearch);
      console.log('⚡ [useGlobalSearch] Quick search results:', quickData.quickSearch.metadata.totalResults);
    }
  }, [quickData]);

  // Log de errores
  useEffect(() => {
    if (error) {
      console.error('[useGlobalSearch] Error:', error);
    }
  }, [error]);

  // Debounce del query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Ejecutar búsqueda cuando cambia el debounced query
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      console.log(' [useGlobalSearch] Buscando:', debouncedQuery);
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

  /**
   * Buscar con query y opciones
   */
  const search = useCallback(
    (searchQuery: string, options?: {
      type?: SearchEntityType;
      limit?: number;
      verifiedOnly?: boolean;
    }) => {
      setQuery(searchQuery);
      
      if (searchQuery.trim().length >= 2) {
        executeSearch({
          variables: {
            input: {
              query: searchQuery,
              type: options?.type,
              limit: options?.limit || 10,
              filters: options?.verifiedOnly ? { isVerified: true } : undefined,
            },
          },
        });
      }
    },
    [executeSearch]
  );

  /**
   * Búsqueda rápida para autocomplete (máx 5 resultados)
   */
  const quickSearch = useCallback(
    (searchQuery: string) => {
      if (searchQuery.trim().length >= 2) {
        executeQuickSearch({
          variables: {
            query: searchQuery,
          },
        });
      } else {
        setResults(null);
      }
    },
    [executeQuickSearch]
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
    (type: SearchEntityType): number => {
      if (!results) return 0;
      
      switch (type) {
        case 'USERS':
          return results.users?.total || 0;
        case 'POSTS':
          return results.posts?.total || 0;
        case 'HASHTAGS':
          return results.hashtags?.total || 0;
        case 'COMMENTS':
          return results.comments?.total || 0;
        case 'ALL':
          return results.metadata.totalResults;
        default:
          return 0;
      }
    },
    [results]
  );

  /**
   * Verificar si hay resultados de un tipo específico
   */
  const hasResultsOfType = useCallback(
    (type: SearchEntityType): boolean => {
      if (!results) return false;
      
      switch (type) {
        case 'USERS':
          return (results.users?.results.length || 0) > 0;
        case 'POSTS':
          return (results.posts?.results.length || 0) > 0;
        case 'HASHTAGS':
          return (results.hashtags?.results.length || 0) > 0;
        case 'COMMENTS':
          return (results.comments?.results.length || 0) > 0;
        case 'ALL':
          return results.metadata.totalResults > 0;
        default:
          return false;
      }
    },
    [results]
  );

  return {
    query,
    setQuery,
    results,
    loading: loading || quickLoading,
    error,
    search,
    quickSearch,
    clear,
    getCountByType,
    hasResultsOfType,
    hasResults: results !== null && results.metadata.totalResults > 0,
    searchTime: results?.metadata.searchTime,
    isFromCache: results?.metadata.fromCache,
  };
}
