import { FC } from 'react';

export const PaginasLoadingSkeleton: FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden animate-pulse"
        >
          <div className="h-24 bg-gray-300 dark:bg-gray-700" />
          <div className="p-4 space-y-3">
            <div className="h-16 w-16 rounded-lg bg-gray-300 dark:bg-gray-700" />
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
};
