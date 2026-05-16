'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { Club } from '@/features/clubs/types/club.types';
import { getCategoryColor, getCategoryLabel } from '@/features/clubs/utils/clubHelpers';
import {
  CheckBadgeIcon,
  GlobeAltIcon,
  LockClosedIcon,
  EnvelopeIcon,
  UserPlusIcon,
} from '@/components/icons/heroicons-shim';

interface ClubHeaderProps {
  club: Club;
  isMember: boolean;
  isLoading: boolean;
  onMembershipToggle: () => void;
  onInvite: () => void;
  onMessage: () => void;
}

function privacyIcon(p: Club['privacy']): typeof GlobeAltIcon {
  return p === 'PUBLIC' ? GlobeAltIcon : LockClosedIcon;
}

function privacyKey(p: Club['privacy']): 'public' | 'private' | 'secret' | 'affiliation' {
  switch (p) {
    case 'PUBLIC':
      return 'public';
    case 'PRIVATE':
      return 'private';
    case 'SECRET':
      return 'secret';
    case 'AFFILIATION':
      return 'affiliation';
  }
}

export function ClubHeader({
  club,
  isMember,
  isLoading,
  onMembershipToggle,
  onInvite,
  onMessage,
}: ClubHeaderProps) {
  const t = useTranslations('clubes');
  const PrivIcon = privacyIcon(club.privacy);
  const privLabel = t(`detail.privacy.${privacyKey(club.privacy)}`);

  return (
    <div className="relative">
      {/* Cover */}
      <div className="relative h-40 w-full overflow-hidden bg-linear-to-br from-blue-500 via-indigo-500 to-purple-600 sm:h-52 md:h-64">
        {club.coverImageUrl && (
          <Image
            src={club.coverImageUrl}
            alt={t('detail.coverAlt', { name: club.name })}
            fill
            sizes="100vw"
            className="object-cover"
            unoptimized
            priority
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" />
      </div>

      {/* Identity: avatar overlaps cover; title + chips + actions sit fully on the white surface below */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 sm:pb-5">
          {/* Avatar — the only element that overlaps the cover */}
          <div className="relative -mt-10 h-20 w-20 shrink-0 overflow-hidden rounded-xl border-4 border-white bg-white shadow-md sm:-mt-12 sm:h-24 sm:w-24 dark:border-gray-800 dark:bg-gray-700">
            {club.profileImageUrl ? (
              <Image
                src={club.profileImageUrl}
                alt={club.name}
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary-500 to-primary-700 text-3xl font-bold text-white">
                {(club.name || '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Title + chips + actions — fully below the cover */}
          <div className="mt-3 flex flex-col gap-3 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl md:text-2xl dark:text-white">
                  {club.name}
                </h1>
                {club.isVerified && (
                  <CheckBadgeIcon className="h-5 w-5 shrink-0 text-primary-500" />
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-medium ${getCategoryColor(club.category)}`}>
                  {getCategoryLabel(club.category)}
                </span>
                <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <PrivIcon className="h-3.5 w-3.5" />
                  {privLabel}
                </span>
              </div>
            </div>

            {/* Actions: full-width on mobile, inline on sm+ */}
            <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
              <button
                onClick={onMembershipToggle}
                disabled={isLoading}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-initial ${
                  isMember
                    ? 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                    : 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {isLoading
                  ? t('detail.actions.loading')
                  : isMember
                    ? t('detail.actions.member')
                    : t('detail.actions.join')}
              </button>
              <button
                onClick={onMessage}
                aria-label={t('detail.actions.messageAria')}
                title={t('detail.actions.messageTitle')}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <EnvelopeIcon className="h-4 w-4" />
              </button>
              <button
                onClick={onInvite}
                aria-label={t('detail.actions.inviteAria')}
                title={t('detail.actions.inviteTitle')}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <UserPlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
