'use client';

import { ClockIcon, UserIcon } from '@/components/icons/heroicons-shim';
import type { RequestProfile } from './types';

interface ProfileHeaderProps {
  profile: RequestProfile;
  timeAgo: string;
}

export function ProfileHeader({ profile, timeAgo }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center mb-6">
      <div className="relative mb-4">
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.username}
            className="w-24 h-24 rounded-full object-cover border-4 border-primary-100 dark:border-primary-900"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-linear-to-br from-primary-400 to-primary-600 flex items-center justify-center border-4 border-primary-100 dark:border-primary-900">
            <UserIcon className="w-12 h-12 text-white" />
          </div>
        )}
      </div>

      <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
        {profile.firstName} {profile.lastName}
      </h3>

      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
        @{profile.username}
      </p>

      {/* Badge de tipo de solicitud */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-medium">
        <ClockIcon className="w-3 h-3" />
        {timeAgo}
      </div>
    </div>
  );
}
