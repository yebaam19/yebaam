import Image from 'next/image';
import Link from 'next/link';
import { Community } from '../types/community.types';
import {
  formatMembersCount,
  getCategoryLabel,
  getCategoryColor,
  getPrivacyLabel,
} from '../utils/communityHelpers';
import {
  UserGroupIcon,
  CheckBadgeIcon,
  LockClosedIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
} from '@/components/icons/heroicons-shim';

interface CommunityCardProps {
  community: Community;
  onJoinClick?: (community: Community) => void;
  isLoading?: boolean;
}

export function CommunityCard({ community, onJoinClick, isLoading = false }: CommunityCardProps) {
  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onJoinClick?.(community);
  };

  return (
    <Link href={`/feed/comunidades/${community.slug}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
        {/* Cover Image */}
        <div className="relative h-32 bg-linear-to-r from-blue-500 to-purple-500">
          {community.coverImageUrl && (
            <Image
              src={community.coverImageUrl}
              alt={community.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          )}

          {/* Privacy Badge */}
          {community.privacy === 'PRIVATE' && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 text-xs font-medium px-2 py-1 rounded-full">
              <LockClosedIcon className="w-3 h-3" />
              {getPrivacyLabel(community.privacy)}
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Profile Image */}
          <div className="relative -mt-10 mb-3">
            <div className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-700">
              {community.profileImageUrl ? (
                <Image
                  src={community.profileImageUrl}
                  alt={community.name}
                  width={64}
                  height={64}
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {community.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Community Info */}
          <div className="mb-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-1 flex items-center gap-1">
                {community.name}
                {community.isVerified && (
                  <CheckBadgeIcon className="w-5 h-5 text-blue-500 shrink-0" />
                )}
              </h3>
            </div>

            <span
              className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${getCategoryColor(
                community.category
              )}`}
            >
              {getCategoryLabel(community.category)}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
            {community.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-1">
              <UserGroupIcon className="w-4 h-4" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatMembersCount(community.stats.membersCount)}
              </span>
              <span>miembros</span>
            </div>

            <div className="flex items-center gap-1">
              <DocumentTextIcon className="w-4 h-4" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {community.stats.postsCount}
              </span>
              <span>posts</span>
            </div>

            {community.stats.growthRate > 0 && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <ArrowTrendingUpIcon className="w-4 h-4" />
                <span className="font-semibold">+{community.stats.growthRate.toFixed(1)}%</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleJoinClick}
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              community.isMember
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Procesando...
              </span>
            ) : community.isMember ? (
              'Miembro'
            ) : community.requireApproval ? (
              'Solicitar Acceso'
            ) : (
              'Unirse'
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
