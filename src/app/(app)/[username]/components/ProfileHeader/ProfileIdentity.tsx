import { CheckBadgeIcon } from '@/components/icons/heroicons-shim';

interface ProfileIdentityProps {
  username: string;
  displayName: string;
  isVerified: boolean;
  friendsCount: number;
  mutualFriendsCount: number;
}

export default function ProfileIdentity({
  username,
  displayName,
  isVerified,
  friendsCount,
  mutualFriendsCount,
}: ProfileIdentityProps) {
  return (
    <div className="text-center sm:text-left">
      <div className="flex items-center gap-2.5 justify-center sm:justify-start mb-1">
        <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight">
          {displayName}
        </h1>
        {isVerified && (
          <div className="relative group/badge">
            <CheckBadgeIcon className="w-9 h-9 text-blue-500 drop-shadow-lg group-hover/badge:scale-110 transition-transform" />
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium rounded-lg opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Cuenta verificada
            </div>
          </div>
        )}
      </div>
      <p className="text-neutral-600 dark:text-neutral-400 text-lg font-medium mb-3">
        @{username}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <div>
          <span className="font-bold text-xl text-neutral-900 dark:text-white">
            {friendsCount.toLocaleString()}
          </span>
          <span className="text-neutral-500 dark:text-neutral-400 ml-1.5">
            amigos
          </span>
        </div>
        {mutualFriendsCount > 0 && (
          <>
            <div className="w-1 h-1 rounded-full bg-neutral-400" />
            <div>
              <span className="font-bold text-lg text-neutral-900 dark:text-white">
                {mutualFriendsCount}
              </span>
              <span className="text-neutral-500 dark:text-neutral-400 ml-1.5">
                en común
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
