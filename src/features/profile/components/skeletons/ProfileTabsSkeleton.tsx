/**
 * Profile Tabs Skeleton Component
 *
 * Skeleton para las pestañas de navegación del perfil
 */

import { Skeleton } from '@/components/skeletons/Skeleton';

export function ProfileTabsSkeleton() {
  return (
    <div className="sticky top-0 z-10 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-2 py-4">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
