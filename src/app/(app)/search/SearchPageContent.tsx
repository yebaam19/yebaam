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
  SearchResultsList,
} from '@/features/search/components';
import { useSearch } from '@/features/search/hooks/useSearch';
import { useSearchHistory } from '@/features/search/hooks/useSearchHistory';
import type { SearchResultType } from '@/features/search/interfaces/search.interfaces';

interface SearchPageContentProps {
  initialQuery: string;
  initialType: SearchResultType;
}

/**
 * hashtags/groups sólo sobreviven en entradas viejas del historial: no tienen
 * backend, así que cualquier click sobre ellas cae al filtro "all".
 */
function sanitizeFilter(type: SearchResultType): SearchResultType {
  return type === 'hashtags' || type === 'groups' ? 'all' : type;
}

/**
 * Contenido principal de la página de búsqueda
 * Maneja estado, filtros, y renderizado de resultados (facets de /api/search
 * + personas de /api/search/users vía useSearch)
 */
export function SearchPageContent({
  initialQuery,
  initialType,
}: SearchPageContentProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<SearchResultType>(() =>
    sanitizeFilter(initialType)
  );

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
      const type = sanitizeFilter(initialType);
      search(initialQuery, type !== 'all' ? { type } : undefined);
    }
  }, [initialQuery, initialType]);

  // Búsqueda en vivo mientras se teclea — el hook debouncea el fetch. Enter,
  // historial y sugerencias siguen pasando por handleSearch (historial + URL).
  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      clear();
      return;
    }
    search(value, activeFilter !== 'all' ? { type: activeFilter } : undefined);
  };

  const handleSearch = (newQuery: string, type?: SearchResultType) => {
    if (!newQuery.trim()) {
      clear();
      setQuery('');
      router.push('/search');
      return;
    }

    const safeType = type ? sanitizeFilter(type) : undefined;
    setQuery(newQuery);
    if (safeType) setActiveFilter(safeType);
    search(newQuery, safeType && safeType !== 'all' ? { type: safeType } : undefined);
    addToHistory(newQuery, safeType);

    // Actualizar URL
    const params = new URLSearchParams();
    params.set('q', newQuery);
    if (safeType && safeType !== 'all') {
      params.set('type', safeType);
    }
    router.push(`/search?${params.toString()}`);
  };

  const handleFilterChange = (type: SearchResultType) => {
    setActiveFilter(type);
    if (query) {
      search(query, type !== 'all' ? { type } : undefined);
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
  const showEmpty = query && !loading && results && getCountByType(activeFilter) === 0;
  // Solo mostrar error si hay error Y no hay resultados
  const showError = error !== null && (!results || getCountByType(activeFilter) === 0);

  return (
    <div className="min-h-dvh min-w-0 bg-white dark:bg-neutral-900">
      <div className="mx-auto max-w-4xl min-w-0 px-3 py-5 sm:px-4 sm:py-6">
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
              onChange={handleQueryChange}
              onSearch={handleSearch}
              onClear={handleClear}
              loading={loading}
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
                pages: getCountByType('pages'),
                posts: getCountByType('posts'),
                articles: getCountByType('articles'),
                events: getCountByType('events'),
                auditions: getCountByType('auditions'),
              }}
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <SearchResultsSkeleton
            count={6}
            type={
              activeFilter === 'users' || activeFilter === 'pages'
                ? 'user'
                : activeFilter === 'posts'
                  ? 'post'
                  : 'hashtag'
            }
          />
        )}

        {/* Error */}
        {showError && <SearchEmptyState type="error" />}

        {/* Empty state - No results */}
        {!showError && showEmpty && <SearchEmptyState type="no-results" query={query} />}

        {/* History & Suggestions */}
        {showHistory && (
          <div className="space-y-6">
            <SearchHistory onSearchClick={handleSearch} />
            <SearchSuggestions onSuggestionClick={handleSearch} />
          </div>
        )}

        {/* Results */}
        {showResults && <SearchResultsList results={results} activeFilter={activeFilter} />}

        {/* Empty state - No query yet */}
        {!query && !results && !loading && (
          <SearchEmptyState type="no-query" />
        )}
      </div>
    </div>
  );
}
