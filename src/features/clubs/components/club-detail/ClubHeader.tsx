'use client';

import Image from 'next/image';
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

function privacyLabel(p: Club['privacy']): { icon: typeof GlobeAltIcon; label: string } {
  switch (p) {
    case 'PUBLIC':
      return { icon: GlobeAltIcon, label: 'Público' };
    case 'PRIVATE':
      return { icon: LockClosedIcon, label: 'Privado' };
    case 'SECRET':
      return { icon: LockClosedIcon, label: 'Secreto' };
    case 'AFFILIATION':
      return { icon: LockClosedIcon, label: 'Afiliación' };
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
  const { icon: PrivIcon, label: privLabel } = privacyLabel(club.privacy);

  return (
    <div className="relative">
      {/* Cover */}
      <div className="relative h-56 w-full overflow-hidden bg-linear-to-r from-blue-500 to-purple-500 md:h-72">
        {club.coverImageUrl && (
          <Image
            src={club.coverImageUrl}
            alt={`Portada de ${club.name}`}
            fill
            className="object-cover"
            unoptimized
            priority
          />
        )}
        {/* Invitar (top-right over cover) */}
        <button
          onClick={onInvite}
          className="absolute top-4 right-4 inline-flex items-center gap-2 rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-gray-900 shadow hover:bg-white dark:bg-gray-900/80 dark:text-white"
        >
          <UserPlusIcon className="h-4 w-4" />
          Invitar
        </button>
      </div>

      {/* Name + actions row */}
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700 dark:bg-gray-800">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 border-white bg-white shadow dark:border-gray-800 dark:bg-gray-700">
            {club.profileImageUrl ? (
              <Image
                src={club.profileImageUrl}
                alt={club.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary-500 to-primary-700 text-2xl font-bold text-white">
                {(club.name || '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-xl font-bold text-gray-900 md:text-2xl dark:text-white">
                {club.name}
              </h1>
              {club.isVerified && (
                <CheckBadgeIcon className="h-5 w-5 shrink-0 text-primary-500" />
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full px-2 py-0.5 font-medium ${getCategoryColor(club.category)}`}>
                {getCategoryLabel(club.category)}
              </span>
              <span className="text-gray-400">•</span>
              <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <PrivIcon className="h-3.5 w-3.5" />
                {privLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onMembershipToggle}
            disabled={isLoading}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isMember
                ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                : 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {isLoading ? '...' : isMember ? 'Abandonar' : 'Unirse'}
          </button>
          <button
            onClick={onMessage}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <EnvelopeIcon className="h-4 w-4" />
            Enviar Mensaje
          </button>
        </div>
      </div>
    </div>
  );
}
