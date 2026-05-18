'use client';

import { useTranslations } from 'next-intl';
import { UserMinusIcon } from '@/components/icons/heroicons-shim';

/** Modal confirmation before removing a friend. Mounted by `FriendsButton`
 *  via the hook's `dropdown.showUnfriendConfirm` flag. */
export function UnfriendConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('friendships.friendButton');
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200"
        onClick={onCancel}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-4 rounded-lg bg-white p-6 shadow-2xl dark:bg-gray-800">
          <div className="mb-4 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <UserMinusIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('unfriendConfirmTitle')}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {t('unfriendConfirmDescription')}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 active:scale-95 transition-all duration-150 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 cursor-pointer"
            >
              {t('unfriendCancel')}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 active:scale-95 transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer"
            >
              {t('unfriendConfirm')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
