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

  const isPrivate = club.privacy === 'PRIVATE';

  return (
    <Link href={`/feed/clubs/${club.slug}`} className="group block h-full">
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:ring-emerald-200 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-700 dark:hover:ring-emerald-900/40">
        {/* Cover */}
        <div className="relative h-24 overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500">
          {club.coverImageUrl ? (
            <Image
              src={club.coverImageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

          {/* Privacy Badge */}
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            {isPrivate ? (
              <>
                <LockClosedIcon className="h-3 w-3" />
                Privado
              </>
            ) : (
              <>
                <GlobeAltIcon className="h-3 w-3" />
                Público
              </>
            )}
          </span>

          {/* Profile image */}
          <div className="absolute -bottom-7 left-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-xl border-2 border-white bg-white shadow-md dark:border-neutral-900 dark:bg-neutral-800">
              {club.profileImageUrl ? (
                <Image
                  src={club.profileImageUrl}
                  alt={club.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-400 to-sky-500">
                  <span className="text-lg font-bold text-white">
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
          <div className="mb-3 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
            <div className="inline-flex items-center gap-1.5">
              <UsersIcon className="h-4 w-4" />
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {formatMembersCount(club.stats.membersCount)}
              </span>
              <span>miembros</span>
            </div>
            {club.stats.growthRate && club.stats.growthRate > 0 && (
              <span className="inline-flex items-center gap-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                ↑ {club.stats.growthRate.toFixed(1)}%
              </span>
            )}
          </div>

          {/* Membership tier */}
          {club.isMember && club.currentUserTier && (
            <div className="mb-3">
              <span
                className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${getTierBadgeColor(
                  club.currentUserTier,
                )}`}
              >
                {getMembershipTierLabel(club.currentUserTier)}
              </span>
            </div>
          )}

          {/* Action */}
          <button
            onClick={handleMembershipClick}
            disabled={isLoading}
            className={`mt-auto w-full rounded-lg px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
              club.isMember
                ? 'border border-neutral-200 bg-white text-neutral-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:border-red-900/40 dark:hover:bg-red-900/20 dark:hover:text-red-300'
                : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 hover:shadow-md dark:bg-emerald-500 dark:hover:bg-emerald-400'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
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
                Procesando…
              </span>
            ) : club.isMember ? (
              'Miembro'
            ) : (
              'Unirse'
            )}
          </button>
        </div>
      </article>
    </Link>
  );
};
