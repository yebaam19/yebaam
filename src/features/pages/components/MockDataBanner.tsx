import { FC } from 'react';
import { BeakerIcon } from '@/components/icons/heroicons-shim';

export const MockDataBanner: FC = () => {
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <BeakerIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
              Modo Mock Activo
            </h4>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
              Usando datos de ejemplo para desarrollo. No se conecta al backend.
            </p>
            <button
              onClick={() => {
                window.open(
                  '/features/pages/mocks/README.md',
                  '_blank'
                );
              }}
              className="text-xs text-yellow-800 dark:text-yellow-200 underline hover:no-underline"
            >
              Ver documentación →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
