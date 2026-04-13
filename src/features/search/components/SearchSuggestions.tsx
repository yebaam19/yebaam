'use client';

import { FireIcon, HashtagIcon, UserIcon, DocumentTextIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import type { SearchResultType } from '../interfaces/search.interfaces';

interface SearchSuggestionsProps {
  onSuggestionClick: (query: string, type?: SearchResultType) => void;
  className?: string;
}

/**
 * Componente que muestra sugerencias de búsqueda (trending)
 * Obtiene las sugerencias desde el backend vía GraphQL
 * 
 * @example
 * <SearchSuggestions onSuggestionClick={(query) => handleSearch(query)} />
 */
export function SearchSuggestions({
  onSuggestionClick,
  className = '',
}: SearchSuggestionsProps) {
  const { suggestions, loading, error } = useSearchSuggestions();

  if (loading) {
    return (
      <div className={cn('py-4 px-4', className)}>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-5 w-5 bg-gray-200 dark:bg-neutral-700 rounded" />
              <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !suggestions || suggestions.length === 0) {
    return null;
  }

  const handleSuggestionClick = (query: string, type?: SearchResultType) => {
    onSuggestionClick(query, type);
  };

  return (
    <div className={cn('py-2', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2">
        <FireIcon className="h-4 w-4 text-orange-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Tendencias
        </h3>
      </div>

      {/* Suggestions */}
      <div className="space-y-1">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => handleSuggestionClick(suggestion.query, suggestion.type)}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-left"
          >
            {/* Icon based on type */}
            <div className="shrink-0">
              {getTypeIcon(suggestion.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-white truncate">
                {suggestion.query}
              </p>
              {suggestion.count && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCount(suggestion.count)} búsquedas
                </p>
              )}
            </div>

            {/* Trending score indicator */}
            {suggestion.score && suggestion.score > 80 && (
              <div className="flex items-center gap-1 shrink-0">
                <FireIcon className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-medium text-orange-600 dark:text-orange-500">
                  HOT
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Helper: Obtener icono según el tipo de búsqueda
 */
function getTypeIcon(type?: SearchResultType) {
  const iconClass = 'h-5 w-5 text-gray-400 dark:text-gray-500';

  switch (type) {
    case 'users':
      return <UserIcon className={iconClass} />;
    case 'hashtags':
      return <HashtagIcon className={iconClass} />;
    case 'posts':
      return <DocumentTextIcon className={iconClass} />;
    default:
      return <FireIcon className={iconClass} />;
  }
}

/**
 * Helper: Formatear número de búsquedas
 */
function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
