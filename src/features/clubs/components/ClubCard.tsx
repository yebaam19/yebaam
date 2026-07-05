'use client';

import { FC } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  UsersIcon,
  CheckBadgeIcon,
  GlobeAltIcon,
  LockClosedIcon,
} from '@/components/icons/heroicons-shim';
import { resolveImageRef } from '@/lib/media/urls';
import type { Club } from '../types/club.types';
import {
  getCategoryLabel,
  getCategoryColor,
  formatMembersCount,
} from '../utils/clubHelpers';

interface ClubCardProps {
  club: Club;
  onJoin?: (clubId: string) => void;
  onLeave?: (clubId: string) => void;
  isLoading?: boolean;
}

const AVATAR_PALETTE = [
  'from-emerald-400 to-teal-500',
  'from-purple-500 to-indigo-600',
  'from-cyan-400 to-sky-500',
  'from-orange-400 to-amber-500',
  'from-pink-500 to-rose-500',
  'from-blue-400 to-indigo-500',
  'from-fuchsia-500 to-pink-500',
  'from-lime-400 to-emerald-500',
];

function pickAvatarGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export const ClubCard: FC<ClubCardProps> = ({ club }) => {
  const t = useTranslations('clubes');
  // Anything other than PUBLIC (PRIVATE / SECRET / AFFILIATION) is gated, so it
  // gets the lock badge rather than falling through to "Público".
  const isPrivate = club.privacy !== 'PUBLIC';
  const avatarGradient = pickAvatarGradient(club.id || club.slug || club.name);
  // Rows store either a bare Cloudflare id (new) or a full URL (legacy).
  const coverSrc = resolveImageRef(club.coverImageUrl, 'cover');
  const profileSrc = resolveImageRef(club.profileImageUrl, 'avatar');

  return (
    <Link href={`/feed/clubs/${club.slug}`} className="group block h-full">
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:ring-emerald-200 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-700 dark:hover:ring-emerald-900/40">
        {/* Cover */}
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500">
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Privacy Badge */}
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {isPrivate ? (
              <>
                <LockClosedIcon className="h-3 w-3" />
                {t('card.private')}
              </>
            ) : (
              <>
                <GlobeAltIcon className="h-3 w-3" />
                {t('card.public')}
              </>
            )}
          </span>

          {/* Profile image */}
          <div className="absolute -bottom-6 left-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md dark:border-neutral-900 dark:bg-neutral-800">
              {profileSrc ? (
                <Image
                  src={profileSrc}
                  alt={club.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div
                  aria-label={club.name}
                  className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${avatarGradient}`}
                >
                  <span className="text-xl font-bold text-white">
                    {club.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col px-4 pb-4 pt-10">
          {/* Title + verification */}
          <div className="mb-2 flex items-start gap-1.5">
            <h3 className="line-clamp-2 min-h-[2.75rem] flex-1 text-[15px] font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-400">
              {club.name}
            </h3>
            {club.isVerified && (
              <CheckBadgeIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            )}
          </div>

          {/* Category */}
          <div className="mb-2">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${getCategoryColor(
                club.category,
              )}`}
            >
              {getCategoryLabel(club.category)}
            </span>
          </div>

          {/* Description */}
          <p className="mb-3 line-clamp-2 min-h-[2.5rem] text-sm text-neutral-600 dark:text-neutral-400">
            {club.description}
          </p>

          {/* Stats row */}
          <div className="mb-4 flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <div className="inline-flex items-center gap-1.5">
              <UsersIcon className="h-4 w-4" />
              <span>{t('card.members', { count: formatMembersCount(club.stats.membersCount) })}</span>
            </div>
            <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              {t('card.free')}
            </span>
          </div>

          {/* Action */}
          <span className="mt-auto inline-flex w-full items-center justify-center rounded-lg border border-emerald-500/70 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-all group-hover:border-emerald-600 group-hover:bg-emerald-50 dark:border-emerald-600/70 dark:bg-transparent dark:text-emerald-400 dark:group-hover:bg-emerald-900/20">
            {t('card.viewDetails')}
          </span>
        </div>
      </article>
    </Link>
  );
};
