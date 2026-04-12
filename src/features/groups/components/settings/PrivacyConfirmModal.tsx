'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface PrivacyConfirmModalProps {
  isOpen: boolean;
  newPrivacy: 'public' | 'private';
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PrivacyConfirmModal({
  isOpen,
  newPrivacy,
  isLoading,
  onConfirm,
  onCancel,
}: PrivacyConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              Cambiar privacidad del grupo
            </h3>
          </div>
          
          <p className="text-neutral-700 dark:text-neutral-300 mb-6">
            ¿Estás seguro de que quieres cambiar la privacidad del grupo a{' '}
            <span className="font-semibold">
              {newPrivacy === 'public' ? 'público' : 'privado'}
            </span>?
          </p>

          {newPrivacy === 'public' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg mb-6">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                 Al hacer el grupo público, cualquier persona podrá ver todo el contenido y unirse sin aprobación.
              </p>
            </div>
          )}

          {newPrivacy === 'private' && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                🔒 Al hacer el grupo privado, solo los miembros actuales podrán ver el contenido. Los nuevos miembros necesitarán aprobación.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Cambiando...
                </>
              ) : (
                'Confirmar cambio'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
