'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import {
  SearchInput,
  SearchFilters,
  SearchHistory,
  SearchSuggestions,
  SearchEmptyState,
  SearchResultsSkeleton,
  UserResultCard,
  PostResultCard,
  HashtagResultCard,
} from '@/features/search/components';
import { useSearch } from '@/features/search/hooks/useSearch';
import { useSearchHistory } from '@/features/search/hooks/useSearchHistory';
import type { SearchResultType } from '@/features/search/interfaces/search.interfaces';

interface SearchPageContentProps {
  initialQuery: string;
  initialType: SearchResultType;
}

/**
 * Contenido principal de la página de búsqueda
 * Maneja estado, filtros, y renderizado de resultados
 */
export function SearchPageContent({
  initialQuery,
  initialType,
}: SearchPageContentProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<SearchResultType>(initialType);

  const { addToHistory } = useSearchHistory();
  const {
    query: searchQuery,
    results,
    loading,
    error,
    search,
    clear,
    getCountByType,
  } = useSearch();

  // Ejecutar búsqueda inicial si hay query en URL
  useEffect(() => {
    if (initialQuery && initialQuery !== searchQuery) {
      search(initialQuery, initialType !== 'all' ? { type: initialType } : undefined);
    }
  }, [initialQuery, initialType]);

  const handleSearch = (newQuery: string, type?: SearchResultType) => {
    if (!newQuery.trim()) {
      clear();
      setQuery('');
      router.push('/search');
      return;
    }

    setQuery(newQuery);
    search(newQuery, type && type !== 'all' ? { type } : undefined);
    addToHistory(newQuery, type);

    // Actualizar URL
    const params = new URLSearchParams();
    params.set('q', newQuery);
    if (type && type !== 'all') {
      params.set('type', type);
    }
    router.push(`/search?${params.toString()}`);
  };

  const handleFilterChange = (type: SearchResultType) => {
    setActiveFilter(type);
    if (query) {
      handleSearch(query, type !== 'all' ? type : undefined);
    }
  };

  const handleClear = () => {
    setQuery('');
    clear();
    router.push('/search');
  };

  // Determinar qué mostrar
  const showHistory = !query && !loading;
  const showResults = query && results && !loading;
  const showEmpty = query && !loading && results && !hasResults(results, activeFilter);
  // Solo mostrar error si hay error Y no hay resultados
  const showError = error !== null && (!results || !hasResults(results, activeFilter));

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header with Close Button */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/feed')}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Volver al feed"
          >
            <XMarkIcon className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
          </button>

          {/* Search Input */}
          <div className="flex-1">
            <SearchInput
              value={query}
              onChange={setQuery}
              onSearch={handleSearch}
              onClear={handleClear}
              placeholder="Buscar en Yebaam..."
              autoFocus
            />
          </div>
        </div>

        {/* Filters - Solo mostrar si hay query o resultados */}
        {(query || results) && (
          <div className="mb-6">
            <SearchFilters
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
              counts={{
                all: getCountByType('all'),
                users: getCountByType('users'),
                posts: getCountByType('posts'),
                hashtags: getCountByType('hashtags'),
                groups: getCountByType('groups'),
              }}
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <SearchResultsSkeleton
            count={6}
            type={activeFilter === 'users' ? 'user' : activeFilter === 'posts' ? 'post' : 'hashtag'}
          />
        )}

        {/* Error */}
        {showError && <SearchEmptyState type="error" />}

        {/* Empty state - No results */}
        {showEmpty && <SearchEmptyState type="no-results" query={query} />}

        {/* History & Suggestions */}
        {showHistory && (
          <div className="space-y-6">
            <SearchHistory onSearchClick={handleSearch} />
            <SearchSuggestions onSuggestionClick={handleSearch} />
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="space-y-3">
            {/* Users */}
            {(activeFilter === 'all' || activeFilter === 'users') &&
              results.users?.map((user) => (
                <UserResultCard key={user.id} user={user} />
              ))}

            {/* Posts */}
            {(activeFilter === 'all' || activeFilter === 'posts') &&
              results.posts?.map((post) => (
                <PostResultCard key={post.id} post={post} />
              ))}

            {/* Hashtags */}
            {(activeFilter === 'all' || activeFilter === 'hashtags') &&
              results.hashtags?.map((hashtag) => (
                <HashtagResultCard key={hashtag.name} hashtag={hashtag} />
              ))}

            {/* Groups - TODO: Implementar cuando tengas GroupResultCard */}
            {/* {(activeFilter === 'all' || activeFilter === 'groups') &&
              results.groups?.map((group) => (
                <GroupResultCard key={group.id} group={group} />
              ))} */}
          </div>
        )}

        {/* Empty state - No query yet */}
        {!query && !results && !loading && (
          <SearchEmptyState type="no-query" />
        )}
      </div>
    </div>
  );
}

/**
 * Helper: Verificar si hay resultados para el filtro activo
 */
function hasResults(results: any, filter: SearchResultType): boolean {
  if (filter === 'all') {
    return (
      (results.users?.length || 0) +
      (results.posts?.length || 0) +
      (results.hashtags?.length || 0) +
      (results.groups?.length || 0) >
      0
    );
  }

  return (results[filter]?.length || 0) > 0;
}
