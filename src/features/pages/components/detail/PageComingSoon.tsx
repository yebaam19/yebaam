import { FC } from 'react';
import { ClockIcon } from '@/components/icons/heroicons-shim';

interface PageComingSoonProps {
  title: string;
  description?: string;
}

/** Intentional placeholder for org-page sections whose backend isn't built yet. */
export const PageComingSoon: FC<PageComingSoonProps> = ({ title, description }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-10 text-center">
    <ClockIcon className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
    <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
      {title}
    </h3>
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
      {description ?? 'Esta sección estará disponible próximamente.'}
    </p>
    <span className="inline-block mt-4 text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
      Próximamente
    </span>
  </div>
);
