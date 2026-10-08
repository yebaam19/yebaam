'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
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
  canManageHeader: boolean;
}

export function CommunityLayoutShell({
  community: c,
  viewerState,
  children,
  institutionalNavigation,
  profileHeader,
  headerImages,
  canManageHeader,
}: CommunityLayoutShellProps) {
  const t = useTranslations('communities');
  const router = useRouter();
  const pathname = usePathname();
  const isArticleRoute = pathname?.startsWith(`/feed/comunidades/${c.slug}/articulos`) ?? false;
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
      {!isArticleRoute && <div className="relative aspect-video overflow-hidden sm:aspect-[3/1] bg-primary-900">
        {c.coverImageUrl && (
          <FramedImage src={c.coverImageUrl} alt={c.name} framing={headerImages?.cover.framing} priority />
        )}
        {canManageHeader && headerImages && (
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
      </div>}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {isArticleRoute ? <nav aria-label="Contexto de la comunidad" className="flex min-w-0 items-center gap-2 py-4 text-sm">
          <Link href={`/feed/comunidades/${c.slug}` as Route} className="truncate font-semibold text-primary-800 hover:underline focus-visible:outline-2 dark:text-primary-300">{c.name}</Link>
          <span aria-hidden="true" className="text-neutral-400">/</span>
          <span className="shrink-0 text-neutral-600 dark:text-neutral-300">Artículos</span>
        </nav> : <>
          <div className="relative -mt-16 pb-6">{profileHeader}</div>
          {institutionalNavigation}
        </>}
        <div className={`grid grid-cols-1 gap-6 pb-12 lg:grid-cols-[240px_1fr] ${isArticleRoute ? 'lg:pt-2' : ''}`}>
          <aside className={`${isArticleRoute ? 'hidden lg:block ' : ''}lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem-env(safe-area-inset-bottom,0px))] lg:self-start lg:overflow-y-auto lg:overscroll-y-contain`}>
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
