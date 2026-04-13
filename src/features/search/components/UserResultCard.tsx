'use client';

import Link from 'next/link';
import { CheckBadgeIcon, UserPlusIcon, UserMinusIcon } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import { cn } from '@/lib/utils';
import type { UserSearchResult, SearchUserResult } from '../interfaces/search.interfaces';

interface UserResultCardProps {
  user: UserSearchResult | SearchUserResult;
  onFollowToggle?: (userId: string) => void;
  className?: string;
  showScore?: boolean; // Mostrar score de relevancia (nuevo)
}

/**
 * Card de resultado de usuario en búsqueda
 * Muestra: Avatar, nombre, username, bio, mutual friends, botón follow
 * 
 * @example
 * <UserResultCard
 *   user={userResult}
 *   onFollowToggle={(id) => handleFollow(id)}
 * />
 */
export function UserResultCard({
  user,
  onFollowToggle,
  className = '',
  showScore = false,
}: UserResultCardProps) {
  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onFollowToggle?.(user.id);
  };

  // Compatibilidad con ambas interfaces
  const isFollowing = 'isFollowing' in user ? user.isFollowing : false;
  const displayName = 'displayName' in user && user.displayName ? user.displayName : `${user.firstName} ${user.lastName}`;
  const mutualFriends = 'mutualFriendsCount' in user ? user.mutualFriendsCount : 0;
  const score = 'score' in user ? user.score : undefined;

  return (
    <Link
      href={`/${user.username}`}
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg',
        'hover:bg-gray-50 dark:hover:bg-neutral-800/50',
        'transition-colors',
        className
      )}
    >
      {/* Avatar */}
      <Avatar
        src={user.avatar || undefined}
        alt={displayName}
        className="h-12 w-12 shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {displayName}
          </h3>
          {user.isVerified && (
            <CheckBadgeIcon className="h-4 w-4 text-primary-600 dark:text-primary-500 shrink-0" />
          )}
          {showScore && score !== undefined && (
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              {score.toFixed(1)}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          @{user.username}
        </p>

        {user.bio && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
            {user.bio}
          </p>
        )}

        {/* Mutual friends */}
        {mutualFriends !== undefined && mutualFriends > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {mutualFriends} {mutualFriends === 1 ? 'amigo' : 'amigos'} en común
          </p>
        )}

        {/* Followers count */}
        {user.followersCount !== undefined && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {user.followersCount} {user.followersCount === 1 ? 'seguidor' : 'seguidores'}
          </p>
        )}
      </div>

      {/* Follow button */}
      {onFollowToggle && (
        <button
          onClick={handleFollowClick}
          className={cn(
            'px-4 py-2 rounded-lg font-medium text-sm transition-colors shrink-0',
            isFollowing
              ? 'bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-neutral-600'
              : 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'
          )}
        >
          {isFollowing ? (
            <>
              <UserMinusIcon className="h-4 w-4 inline mr-1" />
              Siguiendo
            </>
          ) : (
            <>
              <UserPlusIcon className="h-4 w-4 inline mr-1" />
              Seguir
            </>
          )}
        </button>
      )}
    </Link>
  );
}
