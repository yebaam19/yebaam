import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface StatisticsHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  onClose: () => void;
}

/**
 * Header reutilizable para páginas de estadísticas
 * Sticky top con botones de navegación
 */
export function StatisticsHeader({ title, subtitle, onBack, onClose }: StatisticsHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
              aria-label="Volver"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <XMarkIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
