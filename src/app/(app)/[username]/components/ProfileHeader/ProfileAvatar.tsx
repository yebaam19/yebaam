'use client';

import { useState } from 'react';
import { CameraIcon } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';

interface ProfileAvatarProps {
  displayName: string;
  profilePhoto?: string | null;
  isOwnProfile: boolean;
}

export default function ProfileAvatar({ displayName, profilePhoto, isOwnProfile }: ProfileAvatarProps) {
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);

  return (
    <div
      className="relative group/avatar shrink-0"
      onMouseEnter={() => setIsHoveringAvatar(true)}
      onMouseLeave={() => setIsHoveringAvatar(false)}
    >
      {/* Avatar with ring effect */}
      <div className="relative">
        <div className="absolute inset-0 bg-linear-to-br from-purple-500 to-pink-500 rounded-full blur-xl opacity-40 group-hover/avatar:opacity-60 transition-opacity" />
        <div className="relative w-44 h-44 rounded-full border-[6px] border-white dark:border-neutral-900 shadow-2xl overflow-hidden bg-white dark:bg-neutral-800">
          <Avatar
            className="w-full h-full transform group-hover/avatar:scale-110 transition-transform duration-500"
            src={profilePhoto}
            initials={displayName.slice(0, 2).toUpperCase()}
          />
        </div>
      </div>

      {/* Edit Avatar Button */}
      {isOwnProfile && (
        <button
          className={`
            absolute bottom-2 right-2
            w-12 h-12
            bg-white dark:bg-neutral-800
            border-2 border-neutral-100 dark:border-neutral-700
            rounded-full
            flex items-center justify-center
            shadow-xl
            hover:bg-primary-50 dark:hover:bg-primary-900
            hover:border-primary-200 dark:hover:border-primary-700
            hover:scale-110
            transform transition-all duration-300
            ${isHoveringAvatar ? 'opacity-100 rotate-0' : 'opacity-0 rotate-45'}
          `}
        >
          <CameraIcon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
        </button>
      )}

      {/* Online indicator si es tu perfil */}
      {isOwnProfile && (
        <div className="absolute bottom-4 left-4 w-6 h-6 bg-green-500 border-4 border-white dark:border-neutral-900 rounded-full shadow-lg" />
      )}
    </div>
  );
}
