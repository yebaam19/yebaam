import { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckBadgeIcon, UserGroupIcon } from '@heroicons/react/24/solid';
import type { Page } from '../types/page.types';
import { formatFollowersCount, getCategoryLabel, truncateText } from '../utils/pageHelpers';

interface PageCardProps {
  page: Page;
  showFollowButton?: boolean;
  onFollowToggle?: (pageId: string, isFollowing: boolean) => void;
  isFollowLoading?: boolean;
}

export const PageCard: FC<PageCardProps> = ({
  page,
  showFollowButton = true,
  onFollowToggle,
  isFollowLoading = false,
}) => {
  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFollowToggle?.(page.id, page.isFollowing || false);
  };

  // Log para debug de imágenes
  console.log('PageCard:', {
    name: page.name,
    profileImageUrl: page.profileImageUrl,
    coverImageUrl: page.coverImageUrl,
  });

  return (
    <Link href={`/feed/paginas/${page.slug}`}>
      <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Cover Image */}
        {page.coverImageUrl && (
          <div className="relative h-24 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
            <Image
              src={page.coverImageUrl}
              alt={`${page.name} cover`}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}

        {!page.coverImageUrl && (
          <div className="h-24 bg-gradient-to-br from-blue-500 to-purple-600" />
        )}

        {/* Content */}
        <div className="p-4 -mt-8 relative">
          {/* Avatar */}
          <div className="flex items-start justify-between mb-3">
            <div className="relative">
              {page.profileImageUrl ? (
                <Image
                  src={page.profileImageUrl}
                  alt={page.name}
                  width={64}
                  height={64}
                  unoptimized
                  className="rounded-lg border-4 border-white dark:border-gray-800 shadow-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg border-4 border-white dark:border-gray-800 bg-gray-300 dark:bg-gray-600 flex items-center justify-center shadow-lg">
                  <span className="text-xl font-bold text-gray-600 dark:text-gray-300">
                    {page.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {page.isVerified && (
                <CheckBadgeIcon className="absolute -bottom-1 -right-1 w-5 h-5 text-blue-500" />
              )}
            </div>

            {/* Follow Button */}
            {showFollowButton && (
              <button
                onClick={handleFollowClick}
                disabled={isFollowLoading}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  page.isFollowing
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isFollowLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : page.isFollowing ? (
                  'Siguiendo'
                ) : (
                  'Seguir'
                )}
              </button>
            )}
          </div>

          {/* Page Info */}
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
              {page.name}
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getCategoryLabel(page.category)}
            </p>

            {page.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-2">
                {truncateText(page.description, 100)}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <UserGroupIcon className="w-4 h-4" />
              <span>{formatFollowersCount(page.followerCount)} seguidores</span>
            </div>

            {page.userRole && (
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {page.userRole === 'owner' && 'Propietario'}
                {page.userRole === 'admin' && 'Admin'}
                {page.userRole === 'editor' && 'Editor'}
                {page.userRole === 'moderator' && 'Moderador'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
