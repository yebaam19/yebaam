import { FunnelIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { EVENT_CATEGORIES } from '@/config/socket-events';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  eventCounts: Record<string, number>;
  totalEvents: number;
}

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  eventCounts,
  totalEvents,
}: CategoryFilterProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FunnelIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Filtrar por Categoría
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange('all')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-colors',
            selectedCategory === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
          )}
        >
           Todos ({totalEvents})
        </button>
        {EVENT_CATEGORIES.map((category) => {
          const count = eventCounts[category.id] || 0;
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                selectedCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
              )}
            >
              {category.icon} {category.label} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
