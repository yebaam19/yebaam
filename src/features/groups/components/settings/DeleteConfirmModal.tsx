'use client';

import { useTranslations } from 'next-intl';
import { TrashIcon } from '@/components/icons/heroicons-shim';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  groupName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  groupName,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const t = useTranslations('grupos.settings.deleteConfirm');
  if (!isOpen) return null;

  const items = t.raw('removalItems') as string[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              {t('title')}
            </h3>
          </div>

          <p className="text-neutral-700 dark:text-neutral-300 mb-4">
            {t('questionPrefix')}
            <span className="font-semibold">{groupName}</span>
            {t('questionSuffix')}
          </p>

          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-6">
            <p className="text-sm text-red-800 dark:text-red-200 mb-2">
              {t('warningLine')} <strong>{t('irreversible')}</strong>
              {t('warningTail')}
            </p>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 ml-4 list-disc">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg font-medium transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <TrashIcon className="h-4 w-4" />
              {t('delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
