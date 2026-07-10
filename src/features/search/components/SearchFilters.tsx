'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { SearchResultType } from '../interfaces/search.interfaces';
import {
  CalendarDaysIcon,
  DocumentTextIcon,
  FlagIcon,
  MicrophoneIcon,
  NewspaperIcon,
  Squares2X2Icon,
  UserIcon,
} from '@/components/icons/heroicons-shim';

interface SearchFiltersProps {
  activeFilter: SearchResultType;
  onFilterChange: (filter: SearchResultType) => void;
  counts?: Partial<Record<SearchResultType, number>>;
  className?: string;
}

// Facets con backend real: personas (/api/search/users) + los cinco facets
// agregados de /api/search. hashtags/groups quedaron fuera hasta tener datos.
const FILTERS = [
  {
    value: 'all' as SearchResultType,
    labelKey: 'all',
    icon: Squares2X2Icon,
  },
  {
    value: 'users' as SearchResultType,
    labelKey: 'users',
    icon: UserIcon,
  },
  {
    value: 'pages' as SearchResultType,
    labelKey: 'pages',
    icon: FlagIcon,
  },
  {
    value: 'posts' as SearchResultType,
    labelKey: 'posts',
    icon: DocumentTextIcon,
  },
  {
    value: 'articles' as SearchResultType,
    labelKey: 'articles',
    icon: NewspaperIcon,
  },
  {
    value: 'events' as SearchResultType,
    labelKey: 'events',
    icon: CalendarDaysIcon,
  },
  {
    value: 'auditions' as SearchResultType,
    labelKey: 'auditions',
    icon: MicrophoneIcon,
  },
] as const;

/**
 * Filtros de búsqueda con tabs horizontales
 * Muestra contadores de resultados por tipo
 * 
 * @example
 * <SearchFilters
 *   activeFilter={filter}
 *   onFilterChange={setFilter}
 *   counts={{ all: 100, users: 20, posts: 80 }}
 * />
 */
export function SearchFilters({
  activeFilter,
  onFilterChange,
  counts,
  className = '',
}: SearchFiltersProps) {
  const t = useTranslations('search.filters');
  return (
    <div className={cn('border-b border-gray-200 dark:border-neutral-800', className)}>
      <div className="flex gap-1 overflow-x-auto scrollbar-hide px-4 md:px-0">
        {FILTERS.map((filter) => {
          const Icon = filter.icon;
          const count = counts?.[filter.value] || 0;
          const isActive = activeFilter === filter.value;

          return (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap',
                'hover:bg-gray-50 dark:hover:bg-neutral-800/50',
                isActive
                  ? 'border-primary-600 text-primary-600 dark:text-primary-500 font-semibold'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm">{t(filter.labelKey)}</span>
              {counts && count > 0 && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    isActive
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400'
                  )}
                >
                  {count > 999 ? '999+' : count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
