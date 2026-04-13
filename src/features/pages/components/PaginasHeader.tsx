import { FC } from 'react';
import { PlusIcon } from '@/components/icons/heroicons-shim';

interface PaginasHeaderProps {
  onCreateClick: () => void;
}

export const PaginasHeader: FC<PaginasHeaderProps> = ({ onCreateClick }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Páginas</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Descubre y sigue páginas de tu interés
        </p>
      </div>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
      >
        <PlusIcon className="w-5 h-5" />
        Crear página
      </button>
    </div>
  );
};
