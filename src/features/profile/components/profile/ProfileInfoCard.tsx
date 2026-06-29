'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { UserProfile } from '../../interfaces/profile.interfaces';
import { getUserDisplayName } from '@/lib/user-helpers';
import { useProfileStore } from '../../store/profile.store';
import PersonalDialog from '../dialogs/PersonalDialog';

interface ProfileInfoCardProps {
  user: UserProfile;
  loggedInUserId: string;
}

export default function ProfileInfoCard({ user, loggedInUserId }: ProfileInfoCardProps) {
  const t = useTranslations('profile.sidebar');
  const [editOpen, setEditOpen] = useState(false);
  const { currentProfile } = useProfileStore();
  const displayUser = currentProfile && currentProfile.userId === user.userId ? currentProfile : user;

  const isOwner = displayUser.userId === loggedInUserId;
  const firstName = getUserDisplayName(displayUser);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
      <h2 className="mb-3 text-lg font-bold">{t('info')}</h2>

      {displayUser.bio ? (
        <p className="line-clamp-3 text-sm text-gray-700 wrap-break-word whitespace-pre-line dark:text-gray-300">
          {displayUser.bio}
        </p>
      ) : (
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {isOwner ? t('infoEmptyOwn') : t('infoEmptyOther', { name: firstName })}
        </p>
      )}

      {isOwner && (
        <button
          onClick={() => setEditOpen(true)}
          className="mt-4 w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        >
          {t('editInfo')}
        </button>
      )}

      <PersonalDialog user={displayUser} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
