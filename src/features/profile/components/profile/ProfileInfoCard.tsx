'use client';

import { useState } from 'react';
import type { UserProfile } from '../../interfaces/profile.interfaces';
import { useProfileStore } from '../../store/profile.store';
import PersonalDialog from '../dialogs/PersonalDialog';

interface ProfileInfoCardProps {
  user: UserProfile;
  loggedInUserId: string;
}

export default function ProfileInfoCard({ user, loggedInUserId }: ProfileInfoCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const { currentProfile } = useProfileStore();
  const displayUser = currentProfile && currentProfile.userId === user.userId ? currentProfile : user;

  const isOwner = displayUser.userId === loggedInUserId;
  const firstName = displayUser.firstName || displayUser.username;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
      <h2 className="mb-3 text-lg font-bold">Información</h2>

      {displayUser.bio ? (
        <p className="line-clamp-3 text-sm text-gray-700 wrap-break-word whitespace-pre-line dark:text-gray-300">
          {displayUser.bio}
        </p>
      ) : (
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {isOwner
            ? 'Aún no has agregado información a tu perfil.'
            : `${firstName} aún no ha agregado información a su perfil.`}
        </p>
      )}

      {isOwner && (
        <button
          onClick={() => setEditOpen(true)}
          className="mt-4 w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        >
          Editar información
        </button>
      )}

      <PersonalDialog user={displayUser} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
