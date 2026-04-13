'use client';

import { MagnifyingGlassIcon, FaceFrownIcon, ExclamationTriangleIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  type: 'no-query' | 'no-results' | 'error';
  query?: string;
  className?: string;
}

/**
 * Estados vacíos para la búsqueda
 * - no-query: Usuario no ha buscado nada aún
 * - no-results: No se encontraron resultados
 * - error: Error en la búsqueda
 * 
 * @example
 * <SearchEmptyState type="no-results" query="test" />
 */
export function SearchEmptyState({
  type,
  query,
  className = '',
}: EmptyStateProps) {
  const config = {
    'no-query': {
      icon: MagnifyingGlassIcon,
      title: 'Busca en Yebaam',
      description: 'Encuentra personas, publicaciones, hashtags y grupos',
      iconColor: 'text-gray-400 dark:text-gray-500',
    },
    'no-results': {
      icon: FaceFrownIcon,
      title: 'No se encontraron resultados',
      description: query
        ? `No hay resultados para "${query}". Intenta con otras palabras clave.`
        : 'Intenta buscar algo diferente',
      iconColor: 'text-gray-400 dark:text-gray-500',
    },
    error: {
      icon: ExclamationTriangleIcon,
      title: 'Algo salió mal',
      description: 'No pudimos completar tu búsqueda. Por favor, intenta de nuevo.',
      iconColor: 'text-red-500 dark:text-red-400',
    },
  };

  const { icon: Icon, title, description, iconColor } = config[type];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <Icon className={cn('h-16 w-16 mb-4', iconColor)} />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        {description}
      </p>
    </div>
  );
}
