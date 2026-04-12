'use client';

import { TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface DangerZoneSectionProps {
  onDelete: () => void;
}

export function DangerZoneSection({ onDelete }: DangerZoneSectionProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border-2 border-red-200 dark:border-red-900/50 overflow-hidden">
      <div className="p-6 border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10">
        <h2 className="text-xl font-semibold text-red-900 dark:text-red-400 mb-1">
          Zona de peligro
        </h2>
        <p className="text-sm text-red-700 dark:text-red-500">
          Acciones irreversibles
        </p>
      </div>
      <div className="p-6">
        <button
          onClick={onDelete}
          className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-red-300 dark:border-red-900/50 hover:border-red-500 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
              <TrashIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-red-900 dark:text-red-400">
                Eliminar grupo
              </h3>
              <p className="text-sm text-red-700 dark:text-red-500">
                Esta acción no se puede deshacer
              </p>
            </div>
          </div>
          <ArrowLeftIcon className="h-5 w-5 text-red-400 rotate-180" />
        </button>
      </div>
    </div>
  );
}
