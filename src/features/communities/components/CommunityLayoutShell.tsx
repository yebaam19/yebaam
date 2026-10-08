'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { FramedImage } from './header-images/FramedImage';
import type { HeaderImages } from '../schemas/communityHeaderImage.schema';
import { useTranslations } from 'next-intl';
import {
  cancelJoinRequest,
  joinCommunity,
} from '@/features/communities/actions/members.actions';
import { useLeaveCommunity } from '@/features/communities/hooks/useCommunities';
import type { ViewerJoinState } from '@/features/communities/server/communities.server';
import type { Community } from '@/features/communities/types/community.types';
import { CommunitySidebar } from './CommunitySidebar';
import { CommunityHeaderImageButton } from './CommunityHeaderImageButton';

interface CommunityLayoutShellProps {
  community: Community;
  viewerState: ViewerJoinState;
  children: ReactNode;
  institutionalNavigation?: ReactNode;
  profileHeader: ReactNode;
  headerImages: HeaderImages | null;
}

export function CommunityLayoutShell({
  community: c,
  viewerState,
  children,
  institutionalNavigation,
  profileHeader,
  headerImages,
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
      <div className="relative aspect-video overflow-hidden sm:aspect-[3/1] bg-primary-900">
        {c.coverImageUrl && (
          <FramedImage src={c.coverImageUrl} alt={c.name} framing={headerImages?.cover.framing} priority />
        )}
        {viewerState.kind === 'owner' && headerImages && (
          <div className="absolute right-4 top-4 z-10">
            <CommunityHeaderImageButton communityId={c.id} target="cover" images={headerImages} currentUrl={c.coverImageUrl} />
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
        <div className="relative -mt-16 pb-6">{profileHeader}</div>

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
