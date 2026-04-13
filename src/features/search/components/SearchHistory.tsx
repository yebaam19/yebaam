'use client';

import { ClockIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import { useSearchHistory } from '../hooks/useSearchHistory';
import type { SearchResultType } from '../interfaces/search.interfaces';

interface SearchHistoryProps {
  onSearchClick: (query: string, type?: SearchResultType) => void;
  className?: string;
}

/**
 * Componente que muestra el historial de búsquedas recientes
 * Máximo 10 items, guardados en localStorage
 * 
 * @example
 * <SearchHistory onSearchClick={(query) => handleSearch(query)} />
 */
export function SearchHistory({
  onSearchClick,
  className = '',
}: SearchHistoryProps) {
  const { history, removeFromHistory, clearHistory } = useSearchHistory();

  if (history.length === 0) {
    return null;
  }

  const handleItemClick = (query: string, type?: SearchResultType) => {
    onSearchClick(query, type);
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFromHistory(id);
  };

  const handleClearAll = () => {
    clearHistory();
  };

  return (
    <div className={cn('py-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Búsquedas recientes
        </h3>
        <button
          onClick={handleClearAll}
          className="text-xs text-primary-600 dark:text-primary-500 hover:underline"
        >
          Limpiar todo
        </button>
      </div>

      {/* History items */}
      <div className="space-y-1">
        {history.map((item) => (
          <div
            key={item.id}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors group relative"
          >
            {/* Clickable area for search */}
            <button
              onClick={() => handleItemClick(item.query, item.type)}
              className="absolute inset-0 z-0"
              aria-label={`Buscar: ${item.query}`}
            />

            {/* Icon */}
            <ClockIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0 relative z-10 pointer-events-none" />

            {/* Content */}
            <div className="flex-1 min-w-0 relative z-10 pointer-events-none">
              <p className="text-sm text-gray-900 dark:text-white truncate">
                {item.query}
              </p>
              {item.type && item.type !== 'all' && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  en {getTypeLabel(item.type)}
                </p>
              )}
            </div>

            {/* Remove button */}
            <button
              onClick={(e) => handleRemove(e, item.id)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-full transition-opacity shrink-0 relative z-10"
              aria-label="Eliminar de historial"
            >
              <XMarkIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Helper: Obtener label en español del tipo
 */
function getTypeLabel(type: SearchResultType): string {
  const labels: Record<SearchResultType, string> = {
    all: 'Todo',
    users: 'Usuarios',
    posts: 'Publicaciones',
    hashtags: 'Hashtags',
    groups: 'Grupos',
  };
  return labels[type] || type;
}
