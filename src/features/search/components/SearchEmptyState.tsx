'use client';

import { MagnifyingGlassIcon, FaceFrownIcon, ExclamationTriangleIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('search.empty');
  const config = {
    'no-query': {
      icon: MagnifyingGlassIcon,
      title: t('noQueryTitle'),
      description: t('noQueryDescription'),
      iconColor: 'text-gray-400 dark:text-gray-500',
    },
    'no-results': {
      icon: FaceFrownIcon,
      title: t('noResultsTitle'),
      description: query
        ? t('noResultsWithQuery', { query })
        : t('noResultsGeneric'),
      iconColor: 'text-gray-400 dark:text-gray-500',
    },
    error: {
      icon: ExclamationTriangleIcon,
      title: t('errorTitle'),
      description: t('errorDescription'),
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
