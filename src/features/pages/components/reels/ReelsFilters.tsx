import { FC } from 'react';

interface ReelsFiltersProps {
  activeFilter: 'all' | 'popular' | 'recent';
  onFilterChange: (filter: 'all' | 'popular' | 'recent') => void;
}

export const ReelsFilters: FC<ReelsFiltersProps> = ({ activeFilter, onFilterChange }) => {
  return (
    <div className="flex gap-2 overflow-x-auto">
      <button
        onClick={() => onFilterChange('all')}
        className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
          activeFilter === 'all'
            ? 'text-white bg-gray-900 dark:bg-gray-700'
            : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
        }`}
      >
        Todos
      </button>
      <button
        onClick={() => onFilterChange('popular')}
        className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
          activeFilter === 'popular'
            ? 'text-white bg-gray-900 dark:bg-gray-700'
            : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
        }`}
      >
        Más populares
      </button>
      <button
        onClick={() => onFilterChange('recent')}
        className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
          activeFilter === 'recent'
            ? 'text-white bg-gray-900 dark:bg-gray-700'
            : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
        }`}
      >
        Más recientes
      </button>
    </div>
  );
};
