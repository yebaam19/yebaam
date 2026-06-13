'use client';

import { useTranslations } from 'next-intl';

interface Props {
  onContinue: () => void;
  onConfirm: () => void;
}

/** Confirmation modal shown when the user tries to leave the composer with
 *  unsaved work. Emits continue / confirm-discard via callbacks. */
export function DiscardModal({ onContinue, onConfirm }: Props) {
  const t = useTranslations('stories.create');

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-neutral-800">
        {/* Header del modal */}
        <div className="p-6 border-b border-neutral-800">
          <h3 className="text-xl font-bold text-white">{t('discardModalTitle')}</h3>
          <p className="text-neutral-400 mt-2">
            {t('discardModalDescription')}
          </p>
        </div>

        {/* Botones de acción */}
        <div className="p-6 flex gap-3">
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl transition-colors"
          >
            {t('continueEditing')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
          >
            {t('discard')}
          </button>
        </div>
      </div>
    </div>
  );
}
