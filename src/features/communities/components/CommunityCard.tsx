'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Community } from '../types/community.types';
import { formatMembersCount, getCategoryLabel, COMMUNITY_CATEGORY_BADGE_CLASS } from '../utils/communityHelpers';
import {
  UserGroupIcon, CheckBadgeIcon, LockClosedIcon, ArrowTrendingUpIcon, DocumentTextIcon,
} from '@/components/icons/heroicons-shim';

interface CommunityCardProps {
  community: Community;
  onJoinClick?: (community: Community) => void;
  isLoading?: boolean;
}

export function CommunityCard({ community, onJoinClick, isLoading = false }: CommunityCardProps) {
  const t = useTranslations('communities');

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-colors hover:border-primary-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-primary-700">
      <Link href={`/feed/comunidades/${community.slug}`} className="block flex-1 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-800">
        <div className={`relative h-28 ${community.coverImageUrl ? 'bg-secondary-100' : 'bg-primary-900'}`}>
          {community.coverImageUrl ? (
            <Image src={community.coverImageUrl} alt="" fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover" unoptimized />
          ) : (
            <span aria-hidden="true" className="absolute bottom-2 right-4 text-7xl font-bold leading-none text-primary-700/70">
              {community.name.charAt(0)}
            </span>
          )}
          {community.privacy !== 'PUBLIC' && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-1 text-xs font-semibold text-primary-900 shadow-sm">
              <LockClosedIcon className="size-3" aria-hidden="true" />
              {community.privacy === 'PRIVATE' ? t('card.privacyPrivate') : t('card.privacySecret')}
            </span>
          )}
        </div>

        <div className="px-4 pb-3">
          <div className="relative -mt-7 mb-3 flex size-14 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-secondary-100 text-primary-900 dark:border-neutral-900">
            {community.profileImageUrl ? (
              <Image src={community.profileImageUrl} alt="" fill sizes="56px" className="object-cover" unoptimized />
            ) : (
              <span aria-hidden="true" className="text-xl font-bold">{community.name.charAt(0)}</span>
            )}
          </div>

          <h3 className="flex min-w-0 items-center gap-1.5 text-base font-semibold leading-snug text-neutral-900 group-hover:text-primary-800 dark:text-white dark:group-hover:text-primary-300">
            <span className="line-clamp-2">{community.name}</span>
            {community.isVerified && <CheckBadgeIcon className="size-4 shrink-0 text-primary-800 dark:text-primary-300" aria-label={t('card.verified')} />}
          </h3>
          <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${COMMUNITY_CATEGORY_BADGE_CLASS}`}>
            {getCategoryLabel(community.category)}
          </span>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-neutral-600 dark:text-neutral-300">
            {community.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600 dark:text-neutral-300">
            <span className="inline-flex items-center gap-1">
              <UserGroupIcon className="size-4" aria-hidden="true" />
              <strong className="text-neutral-900 dark:text-white">{formatMembersCount(community.stats.membersCount)}</strong>
              {t('card.members')}
            </span>
            <span className="inline-flex items-center gap-1">
              <DocumentTextIcon className="size-4" aria-hidden="true" />
              <strong className="text-neutral-900 dark:text-white">{community.stats.postsCount}</strong>
              {t('card.posts')}
            </span>
            {community.stats.growthRate > 0 && (
              <span className="inline-flex items-center gap-1 text-primary-800 dark:text-primary-300">
                <ArrowTrendingUpIcon className="size-4" aria-hidden="true" />
                +{community.stats.growthRate.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </Link>

      {(community.isMember || onJoinClick) && (
        <div className="px-4 pb-4">
          {community.isMember ? (
            <span className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-neutral-100 px-3 text-sm font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              {t('card.member')}
            </span>
          ) : (
            <button type="button" onClick={() => onJoinClick?.(community)} disabled={isLoading}
              className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-primary-800 px-3 text-sm font-semibold text-white transition-colors hover:bg-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 disabled:cursor-wait disabled:opacity-60">
              {isLoading ? t('card.processing') : community.requireApproval ? t('card.requestAccess') : t('card.join')}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
