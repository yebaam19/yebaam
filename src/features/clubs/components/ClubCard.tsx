import { FC } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  UsersIcon,
  CheckBadgeIcon,
  GlobeAltIcon,
  LockClosedIcon,
} from '@/components/icons/heroicons-shim';
import type { Club } from '../types/club.types';
import {
  getCategoryLabel,
  getCategoryColor,
  formatMembersCount,
  getTierBadgeColor,
  getMembershipTierLabel,
} from '../utils/clubHelpers';

interface ClubCardProps {
  club: Club;
  onJoin?: (clubId: string) => void;
  onLeave?: (clubId: string) => void;
  isLoading?: boolean;
}

export const ClubCard: FC<ClubCardProps> = ({
  club,
  onJoin,
  onLeave,
  isLoading = false,
}) => {
  const handleMembershipClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    if (club.isMember) {
      onLeave?.(club.id);
    } else {
      onJoin?.(club.id);
    }
  };

  return (
    <Link href={`/clubs/${club.slug}`}>
      <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Cover Image */}
        <div className="relative h-32 bg-linear-to-r from-blue-500 to-purple-500">
          {club.coverImageUrl ? (
            <Image
              src={club.coverImageUrl}
              alt={club.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : null}
          
          {/* Privacy Badge */}
          <div className="absolute top-2 right-2">
            {club.privacy === 'PRIVATE' ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-900/70 backdrop-blur-sm rounded-full text-xs text-white">
                <LockClosedIcon className="w-3 h-3" />
                <span>Privado</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-900/70 backdrop-blur-sm rounded-full text-xs text-white">
                <GlobeAltIcon className="w-3 h-3" />
                <span>Público</span>
              </div>
            )}
          </div>

          {/* Profile Image */}
          <div className="absolute -bottom-8 left-4">
            <div className="relative w-16 h-16 rounded-lg border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-700 overflow-hidden">
              {club.profileImageUrl ? (
                <Image
                  src={club.profileImageUrl}
                  alt={club.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-400 to-purple-500">
                  <span className="text-white font-bold text-xl">
                    {club.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-10 px-4 pb-4">
          {/* Title and Verification */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {club.name}
                </h3>
                {club.isVerified && (
                  <CheckBadgeIcon className="w-5 h-5 text-blue-500 shrink-0" />
                )}
              </div>
              
              {/* Category */}
              <span
                className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryColor(club.category)}`}
              >
                {getCategoryLabel(club.category)}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {club.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
            <div className="flex items-center gap-1">
              <UsersIcon className="w-4 h-4" />
              <span className="font-medium">
                {formatMembersCount(club.stats.membersCount)}
              </span>
              <span className="text-xs">miembros</span>
            </div>
            
            {club.stats.growthRate && club.stats.growthRate > 0 && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <span className="text-xs">↑ {club.stats.growthRate.toFixed(1)}%</span>
              </div>
            )}
          </div>

          {/* User Membership Status */}
          {club.isMember && club.currentUserTier && (
            <div className="mb-3">
              <span
                className={`inline-block text-xs font-medium px-2 py-1 rounded ${getTierBadgeColor(club.currentUserTier)}`}
              >
                {getMembershipTierLabel(club.currentUserTier)}
              </span>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleMembershipClick}
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              club.isMember
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Procesando...
              </span>
            ) : club.isMember ? (
              'Miembro'
            ) : (
              'Unirse'
            )}
          </button>
        </div>
      </div>
    </Link>
  );
};
