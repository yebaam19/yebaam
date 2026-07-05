'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import {
  UserGroupIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ArrowLeftIcon,
  Cog6ToothIcon,
  UsersIcon,
} from '@/components/icons/heroicons-shim';
import { resolveImageRef } from '@/lib/media/urls';
import type { Group } from '@/features/groups/types/group.types';
import { GroupDetailTabs, type GroupDetailTab } from './GroupDetailTabs';

interface Props {
  group: Group;
  activeTab: GroupDetailTab;
  onTabChange: (tab: GroupDetailTab) => void;
  /** Route prefix for the back + settings links (`/grupos` or `/feed/grupos`). */
  basePath: Route;
  /** Render the creator identity block. Off on the `/feed/grupos` variant. */
  showCreator?: boolean;
}

/** Cover image, group identity (name, creator, privacy, member count), admin /
 *  join actions, and the tab bar — the top card of the group detail page. */
export function GroupDetailHero({
  group,
  activeTab,
  onTabChange,
  basePath,
  showCreator = true,
}: Props) {
  const t = useTranslations('grupos');
  // Rows store either a bare Cloudflare id (new) or a full URL (legacy).
  const coverSrc = resolveImageRef(group.coverImageUrl, 'hero');

  return (
    <>
      {/* Cover Image */}
      <div className="relative h-44 min-h-[11rem] bg-linear-to-br from-blue-500 to-purple-600 sm:h-64">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={group.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <UserGroupIcon className="h-24 w-24 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />

        {/* Back button */}
        <Link
          href={basePath}
          className="absolute top-[max(1rem,env(safe-area-inset-top,0px))] left-4 rounded-full bg-black/40 p-2 backdrop-blur-sm transition-colors hover:bg-black/60"
        >
          <ArrowLeftIcon className="h-6 w-6 text-white" />
        </Link>
      </div>

      {/* Group Info */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="container mx-auto max-w-5xl min-w-0 px-3 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="mb-2 text-2xl font-bold break-words text-neutral-900 sm:text-3xl dark:text-white">
                  {group.name}
                </h1>

                {/* Creator Info */}
                {showCreator && group.creatorName && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative h-8 w-8 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                      {group.creatorAvatar ? (
                        <Image
                          src={group.creatorAvatar}
                          alt={group.creatorName}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-sm font-medium text-neutral-600 dark:text-neutral-400">
                          {group.creatorName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {group.creatorName}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {t('detail.creatorRole')}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600 sm:gap-4 dark:text-neutral-400">
                  <div className="flex items-center gap-1">
                    {group.privacy === 'public' ? (
                      <>
                        <GlobeAltIcon className="h-4 w-4" />
                        <span>{t('detail.publicGroup')}</span>
                      </>
                    ) : (
                      <>
                        <LockClosedIcon className="h-4 w-4" />
                        <span>{t('detail.privateGroup')}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <UsersIcon className="h-4 w-4" />
                    <span>{t('detail.members', { count: group.memberCount.toLocaleString() })}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                {group.isAdmin && (
                  <Link
                    href={`${basePath}/${group.id}/configuracion` as Route}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <Cog6ToothIcon className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
                  </Link>
                )}
                {!group.isMember && (
                  <button className="w-full rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 sm:w-auto">
                    {t('detail.join')}
                  </button>
                )}
              </div>
            </div>

            <GroupDetailTabs activeTab={activeTab} onChange={onTabChange} />
          </div>
        </div>
      </div>
    </>
  );
}
