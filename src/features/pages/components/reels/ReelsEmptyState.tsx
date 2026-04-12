import { FC } from 'react';
import { VideoCameraIcon, PlayIcon } from '@heroicons/react/24/outline';

interface ReelsEmptyStateProps {
  isOwner: boolean;
  onCreateClick: () => void;
}

export const ReelsEmptyState: FC<ReelsEmptyStateProps> = ({ isOwner, onCreateClick }) => {
  return (
    <>
      {/* Empty State Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
          <VideoCameraIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Sin reels aún
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {isOwner
            ? 'Crea tu primer reel para mostrar tu negocio de forma creativa.'
            : 'Esta página aún no ha compartido ningún reel.'}
        </p>
        {isOwner && (
          <button
            onClick={onCreateClick}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all"
          >
            Crear mi primer Reel
          </button>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <PlayIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-purple-900 dark:text-purple-300 font-medium mb-1">
              💡 Crea contenido en video
            </p>
            <p className="text-sm text-purple-700 dark:text-purple-400">
              Los reels son perfectos para mostrar tu negocio de forma creativa y llegar a más
              personas. Videos cortos (hasta 90 segundos), verticales y atractivos.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
