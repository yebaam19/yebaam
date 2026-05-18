'use client';

import { useTranslations } from 'next-intl';
import { UserMinusIcon } from '@/components/icons/heroicons-shim';

/** Floating dropdown shown next to the FriendsButton when `showDropdown`
 *  is enabled. Today it holds a single "unfriend" action — extend here. */
export function FriendsDropdown({
  onUnfriend,
  onClose,
}: {
  onUnfriend: () => void;
  onClose: () => void;
}) {
  const t = useTranslations('friendships.friendButton');
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="ring-opacity-5 absolute top-full right-0 z-20 mt-2 w-56 rounded-lg bg-white py-1.5 shadow-xl ring-1 ring-black/10 dark:bg-gray-800 dark:ring-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
        <button
          onClick={onUnfriend}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors duration-150 cursor-pointer"
        >
          <UserMinusIcon className="h-4 w-4 shrink-0" />
          <span>{t('unfriend')}</span>
        </button>
      </div>
    </>
  );
}
