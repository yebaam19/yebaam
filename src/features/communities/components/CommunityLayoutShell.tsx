'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  cancelJoinRequest,
  joinCommunity,
} from '@/features/communities/actions/members.actions';
import { useLeaveCommunity } from '@/features/communities/hooks/useCommunities';
import type { ViewerJoinState } from '@/features/communities/server/communities.server';
import type { Community } from '@/features/communities/types/community.types';
import {
  UserGroupIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  LockClosedIcon,
  ArrowTrendingUpIcon,
} from '@/components/icons/heroicons-shim';
import {
  formatMembersCount,
  getCategoryLabel,
  getCategoryColor,
  getPrivacyLabel,
} from '@/features/communities/utils/communityHelpers';
import { CommunitySidebar } from './CommunitySidebar';
import { CommunityHeaderImageButton } from './CommunityHeaderImageButton';

interface CommunityLayoutShellProps {
  community: Community;
  viewerState: ViewerJoinState;
  children: ReactNode;
  institutionalNavigation?: ReactNode;
}

export function CommunityLayoutShell({
  community: c,
  viewerState,
  children,
  institutionalNavigation,
}: CommunityLayoutShellProps) {
  const t = useTranslations('communities');
  const router = useRouter();
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinTransition, startJoinTransition] = useTransition();
  const leaveMutation = useLeaveCommunity();

  const handleJoinClick = async () => {
    setJoinError(null);
    startJoinTransition(async () => {
      if (viewerState.kind === 'member' || (c.isMember && viewerState.kind !== 'owner')) {
        try {
          await leaveMutation.mutateAsync(c.id);
        } catch (err) {
          setJoinError(err instanceof Error ? err.message : t('detail.joinErrorDefault'));
          return;
        }
        router.refresh();
        return;
      }

      if (viewerState.kind === 'request_pending') {
        const result = await cancelJoinRequest(c.id);
        if (!result.ok) setJoinError(result.error);
        else router.refresh();
        return;
      }

      const result = await joinCommunity(c.id);
      if (!result.ok) {
        setJoinError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const joinButtonLabel = (() => {
    if (joinTransition || leaveMutation.isPending) return t('detail.joinButton.processing');
    if (viewerState.kind === 'guest') return t('detail.joinButton.guest');
    if (viewerState.kind === 'member' || c.isMember) return t('detail.joinButton.member');
    if (viewerState.kind === 'request_pending') return t('detail.joinButton.requestPending');
    if (viewerState.kind === 'request_declined') return t('detail.joinButton.requestDeclined');
    if (viewerState.kind === 'invited') return t('detail.joinButton.invited');
    if (c.privacy === 'PRIVATE') return t('detail.joinButton.requestAccess');
    if (c.privacy === 'SECRET') return t('detail.joinButton.secretOnlyInvite');
    return t('detail.joinButton.join');
  })();

  const joinButtonDisabled =
    joinTransition ||
    leaveMutation.isPending ||
    viewerState.kind === 'guest' ||
    viewerState.kind === 'request_declined' ||
    (viewerState.kind === 'none' && c.privacy === 'SECRET');

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="relative h-56 md:h-72 bg-primary-900">
        {c.coverImageUrl && (
          <Image
            src={c.coverImageUrl}
            alt={c.name}
            fill
            sizes="100vw"
            className="object-cover"
            unoptimized
            priority
          />
        )}
        {viewerState.kind === 'owner' && (
          <div className="absolute right-4 top-4 z-10">
            <CommunityHeaderImageButton communityId={c.id} target="cover" />
          </div>
        )}
        {viewerState.kind !== 'owner' && (
          <div className="absolute right-4 bottom-4 z-10 flex flex-col items-end gap-1">
            <button
              onClick={handleJoinClick}
              disabled={joinButtonDisabled}
              className={`px-5 py-2 rounded-lg font-medium text-sm shadow-md transition-colors ${
                viewerState.kind === 'member' || c.isMember
                  ? 'bg-white text-neutral-700 hover:bg-neutral-100'
                  : viewerState.kind === 'request_pending'
                    ? 'bg-secondary-500 text-neutral-900 hover:bg-secondary-400'
                    : 'bg-primary-800 text-white hover:bg-primary-900'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {joinButtonLabel}
            </button>
            {joinError && (
              <p className="text-xs text-red-600 bg-white/90 rounded px-2 py-1 max-w-xs text-right">
                {joinError}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 pb-6">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-5 shadow-sm">
            <div className="flex flex-col md:flex-row gap-5">
              <div className="shrink-0">
                <div className="relative w-20 h-20">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-neutral-800">
                    {c.profileImageUrl ? (
                      <Image
                        src={c.profileImageUrl}
                        alt={c.name}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary-500 text-primary-900 flex items-center justify-center">
                        <span className="text-primary-900 font-bold text-2xl">
                          {c.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  {viewerState.kind === 'owner' && (
                    <div className="absolute bottom-0 right-0">
                      <CommunityHeaderImageButton
                        communityId={c.id}
                        target="profile"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-800 text-white shadow-md ring-2 ring-white transition-colors hover:bg-primary-900 disabled:opacity-60 dark:ring-neutral-800"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white truncate">
                    {c.name}
                  </h1>
                  {c.isVerified && (
                    <CheckBadgeIcon className="w-6 h-6 text-primary-800 shrink-0" />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${getCategoryColor(c.category)}`}
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
              </div>
            </div>
          </div>
        </div>

        {institutionalNavigation}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 pb-12">
          <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem-env(safe-area-inset-bottom,0px))] lg:self-start lg:overflow-y-auto lg:overscroll-y-contain">
            <CommunitySidebar
              slug={c.slug}
              isOwner={viewerState.kind === 'owner'}
              communityId={c.id}
              communityName={c.name}
            />
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
