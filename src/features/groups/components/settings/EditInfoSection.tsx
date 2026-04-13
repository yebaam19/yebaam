'use client';

import { PencilIcon, ArrowLeftIcon } from '@/components/icons/heroicons-shim';

interface EditInfoSectionProps {
  onEdit: () => void;
}

export function EditInfoSection({ onEdit }: EditInfoSectionProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">
          Información del grupo
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Edita el nombre, descripción y categoría
        </p>
      </div>
      <div className="p-6">
        <button
          onClick={onEdit}
          className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 hover:border-primary-600 dark:hover:border-primary-600 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
              <PencilIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                Editar información
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Nombre, descripción y categoría
              </p>
            </div>
          </div>
          <ArrowLeftIcon className="h-5 w-5 text-neutral-400 rotate-180" />
        </button>
      </div>
    </div>
  );
}
