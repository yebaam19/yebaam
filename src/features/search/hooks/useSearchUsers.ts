'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { SEARCH_USERS_QUERY } from '../graphql/search.queries';
import type {
  SearchUsersInput,
  SearchUsersResponse,
  SearchSortBy,
} from '../interfaces/search.interfaces';

/**
 * Variables de la query GraphQL
 */
interface SearchUsersQueryVariables {
  input: SearchUsersInput;
}

/**
 * Respuesta de la query GraphQL
 */
interface SearchUsersQueryResponse {
  searchUsers: SearchUsersResponse;
}

/**
 * Hook para búsqueda de usuarios con GraphQL + Redis
 * Compatible con el nuevo backend NestJS
 * 
 * Features:
 * - Debounce automático (500ms)
 * - Paginación cursor-based
 * - Filtros (verified, friends, sortBy)
 * - Loading states
 * - Error handling
 * 
 * @example
 * ```tsx
 * const { users, loading, search, loadMore, hasMore } = useSearchUsers();
 * 
 * // Buscar usuarios
 * search('juan', { verifiedOnly: true });
 * 
 * // Cargar más resultados
 * if (hasMore) loadMore();
 * ```
 */
export function useSearchUsers() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [result, setResult] = useState<SearchUsersResponse | null>(null);

  const [executeSearch, { loading, error, data, fetchMore }] = useLazyQuery<
    SearchUsersQueryResponse,
    SearchUsersQueryVariables
  >(SEARCH_USERS_QUERY, {
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
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
      console.log(' [useSearchUsers] Buscando:', debouncedQuery);
      executeSearch({
        variables: {
          input: {
            query: debouncedQuery,
            limit: 10,
            sortBy: 'RELEVANCE',
          },
        },
      });
    } else {
      setResult(null);
    }
  }, [debouncedQuery, executeSearch]);

  // Actualizar resultado cuando llega la data
  useEffect(() => {
    if (data?.searchUsers) {
      setResult(data.searchUsers);
      console.log(' [useSearchUsers] Resultados:', {
        total: data.searchUsers.pageInfo.total,
        items: data.searchUsers.items.length,
        took: data.searchUsers.took + 'ms',
      });
    }
  }, [data]);

  /**
   * Buscar usuarios con query y filtros
   */
  const search = useCallback(
    (
      searchQuery: string,
      options?: {
        limit?: number;
        verifiedOnly?: boolean;
        friendsOnly?: boolean;
        sortBy?: SearchSortBy;
      }
    ) => {
      setQuery(searchQuery);

      if (searchQuery.trim().length >= 2) {
        executeSearch({
          variables: {
            input: {
              query: searchQuery,
              limit: options?.limit || 10,
              verifiedOnly: options?.verifiedOnly || false,
              friendsOnly: options?.friendsOnly || false,
              sortBy: options?.sortBy || 'RELEVANCE',
            },
          },
        });
      } else {
        setResult(null);
      }
    },
    [executeSearch]
  );

  /**
   * Cargar más resultados (paginación)
   */
  const loadMore = useCallback(async () => {
    if (!result?.pageInfo.hasNextPage || !result?.pageInfo.endCursor || !fetchMore) {
      return;
    }

    try {
      const { data: moreData } = await fetchMore({
        variables: {
          input: {
            query: debouncedQuery,
            limit: 10,
            cursor: result.pageInfo.endCursor,
            sortBy: 'RELEVANCE',
          },
        },
      });

      if (moreData?.searchUsers) {
        // Combinar resultados anteriores con nuevos
        setResult({
          ...moreData.searchUsers,
          items: [...result.items, ...moreData.searchUsers.items],
        });
      }
    } catch (error) {
      console.error(' [useSearchUsers] Error loading more:', error);
    }
  }, [result, debouncedQuery, fetchMore]);

  /**
   * Limpiar búsqueda
   */
  const clear = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setResult(null);
  }, []);

  return {
    // State
    query,
    setQuery,
    users: result?.items || [],
    pageInfo: result?.pageInfo,
    took: result?.took,
    loading,
    error,

    // Actions
    search,
    loadMore,
    clear,

    // Computed
    hasResults: result !== null && result.items.length > 0,
    hasMore: result?.pageInfo.hasNextPage || false,
    totalCount: result?.pageInfo.total || 0,
  };
}
