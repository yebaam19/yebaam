'use client';
import { FramedImage } from '../header-images/FramedImage';
import type { HeaderImages } from '../../schemas/communityHeaderImage.schema';
import { useTranslations } from 'next-intl';
import { UserGroupIcon, CheckBadgeIcon, DocumentTextIcon, LockClosedIcon, ArrowTrendingUpIcon, MapPinIcon, GlobeAltIcon } from '@/components/icons/heroicons-shim';
import type { Community } from '../../types/community.types';
import { formatMembersCount, getCategoryLabel, COMMUNITY_CATEGORY_BADGE_CLASS, getPrivacyLabel } from '../../utils/communityHelpers';
import { CommunityHeaderImageButton } from '../CommunityHeaderImageButton';
import { safeExternalHref } from '@/lib/safe-href';

export function CommunityIdentity({ community: c, canManageHeader, stacked, headerImages }: { community: Community; canManageHeader: boolean; stacked?: boolean; headerImages?: HeaderImages | null }) {
  const t = useTranslations('communities');
  const websiteHref = safeExternalHref(c.website);
  return (
            <div className={stacked ? "flex flex-col gap-4" : "flex flex-col md:flex-row gap-5"}>
              <div className="shrink-0">
                <div className="relative w-20 h-20">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-neutral-800">
                    {c.profileImageUrl ? (
                      <FramedImage src={c.profileImageUrl} alt={c.name} framing={headerImages?.profile.framing} />
                    ) : (
                      <div className="w-full h-full bg-[var(--community-secondary)] text-[var(--community-primary)] flex items-center justify-center">
                        <span className="font-bold text-2xl">
                          {c.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  {canManageHeader && headerImages && (
                    <div className="absolute bottom-0 right-0">
                      <CommunityHeaderImageButton
                        communityId={c.id}
                        target="profile"
                        images={headerImages} currentUrl={c.profileImageUrl}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-800 text-white shadow-md ring-2 ring-white transition-colors hover:bg-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 disabled:opacity-60 dark:ring-neutral-800"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white wrap-anywhere">
                    {c.name}
                  </h1>
                  {c.isVerified && (
                    <CheckBadgeIcon className="w-6 h-6 text-primary-800 shrink-0" />
                  )}
                </div>

                {c.description && <p className="mb-2 line-clamp-2 max-w-prose text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{c.description}</p>}

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${COMMUNITY_CATEGORY_BADGE_CLASS}`}
                  >
                    {getCategoryLabel(c.category)}
                  </span>
                  {c.privacy !== 'PUBLIC' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-secondary-100 dark:bg-primary-900/30 text-secondary-900 dark:text-secondary-300">
                      <LockClosedIcon className="w-3 h-3" />
                      {getPrivacyLabel(c.privacy)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                  <div className="flex items-center gap-1.5">
                    <UserGroupIcon className="w-4 h-4 text-neutral-400" />
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {formatMembersCount(c.stats.membersCount)}
                    </span>
                    <span className="text-neutral-600 dark:text-neutral-400">{t('detail.members')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DocumentTextIcon className="w-4 h-4 text-neutral-400" />
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {c.stats.postsCount}
                    </span>
                    <span className="text-neutral-600 dark:text-neutral-400">{t('detail.posts')}</span>
                  </div>
                  {c.stats.growthRate > 0 && (
                    <div className="flex items-center gap-1.5 text-primary-800 dark:text-primary-300">
                      <ArrowTrendingUpIcon className="w-4 h-4" />
                      <span className="font-semibold">+{c.stats.growthRate.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                {(c.location || websiteHref) && <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600 dark:text-neutral-300">
                  {c.location && <span className="inline-flex min-w-0 items-center gap-1.5 wrap-anywhere">
                    <MapPinIcon className="size-3.5 shrink-0 text-primary-800 dark:text-primary-300" aria-hidden="true" />{c.location}
                  </span>}
                  {websiteHref && <a href={websiteHref} target="_blank" rel="noopener noreferrer"
                    className="inline-flex min-h-8 items-center gap-1.5 font-medium text-primary-800 hover:underline focus-visible:outline-2 focus-visible:outline-primary-800 dark:text-primary-300">
                    <GlobeAltIcon className="size-3.5 shrink-0" aria-hidden="true" />{t('detail.websiteLabel')}
                  </a>}
                </div>}
              </div>
            </div>
  );
}
