import { FC } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

type EmptyStateType = 'search' | 'my-pages' | 'followed' | 'discover';

interface PaginasEmptyStateProps {
  type: EmptyStateType;
  onCreateClick?: () => void;
  onClearSearch?: () => void;
  onDiscoverClick?: () => void;
}

export const PaginasEmptyState: FC<PaginasEmptyStateProps> = ({
  type,
  onCreateClick,
  onClearSearch,
  onDiscoverClick,
}) => {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
      </div>

      {type === 'search' && (
        <>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No se encontraron páginas
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Intenta ajustar tu búsqueda o filtros
          </p>
          <button
            onClick={onClearSearch}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-sm"
          >
            Limpiar búsqueda
          </button>
        </>
      )}

      {type === 'my-pages' && (
        <>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No tienes páginas aún
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Crea tu primera página para comenzar
          </p>
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Crear página
          </button>
        </>
      )}

      {type === 'followed' && (
        <>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No sigues ninguna página
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Explora páginas en la sección Descubrir
          </p>
          <button
            onClick={onDiscoverClick}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-sm"
          >
            Ver páginas sugeridas
          </button>
        </>
      )}

      {type === 'discover' && (
        <>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No hay páginas sugeridas
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vuelve más tarde para ver nuevas recomendaciones
          </p>
        </>
      )}
    </div>
  );
};
