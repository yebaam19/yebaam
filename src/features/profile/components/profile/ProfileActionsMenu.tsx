'use client';

import {
  EllipsisHorizontalIcon,
  FlagIcon,
  LockClosedIcon,
  UserMinusIcon,
} from '@/components/icons/heroicons-shim';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useFriendshipsStore } from '@/features/friendships/store/friendships.store';

interface ProfileActionsMenuProps {
  userId: string;
  isFriends?: boolean;
}

export default function ProfileActionsMenu({ userId, isFriends = false }: ProfileActionsMenuProps) {
  const t = useTranslations('profile.actions');
  const [open, setOpen] = useState(false);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const [isUnfriending, setIsUnfriending] = useState(false);

  const friends = useFriendshipsStore((state) => state.friends);
  const removeFriend = useFriendshipsStore((state) => state.removeFriend);

  const friendshipId = useMemo(
    () => (isFriends ? friends.find((f) => f.friendId === userId)?.friendshipId : undefined),
    [isFriends, friends, userId],
  );

  const handleBlock = () => {
    setOpen(false);
    // TODO: wire to moderation API
    toast.info(t('blockComingSoon'));
  };

  const handleReport = () => {
    setOpen(false);
    // TODO: wire to moderation API
    toast.info(t('reportComingSoon'));
  };

  const handleAskUnfriend = () => {
    setOpen(false);
    setShowUnfriendConfirm(true);
  };

  const handleConfirmUnfriend = async () => {
    if (!friendshipId) return;
    setIsUnfriending(true);
    try {
      await removeFriend(friendshipId);
      setShowUnfriendConfirm(false);
    } finally {
      setIsUnfriending(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={t('moreActions')}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
      >
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
            {isFriends && (
              <button
                onClick={handleAskUnfriend}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <UserMinusIcon className="h-4 w-4" />
                {t('removeFriend')}
              </button>
            )}
            <button
              onClick={handleBlock}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <LockClosedIcon className="h-4 w-4" />
              {t('blockUser')}
            </button>
            <button
              onClick={handleReport}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <FlagIcon className="h-4 w-4" />
              {t('reportUser')}
            </button>
          </div>
        </>
      )}

      {showUnfriendConfirm && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => !isUnfriending && setShowUnfriendConfirm(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
            <div className="mx-4 rounded-lg bg-white p-6 shadow-2xl dark:bg-gray-800">
              <div className="mb-4 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <UserMinusIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('unfriendTitle')}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {t('unfriendDescription')}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnfriendConfirm(false)}
                  disabled={isUnfriending}
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleConfirmUnfriend}
                  disabled={isUnfriending || !friendshipId}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isUnfriending ? t('removing') : t('remove')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
