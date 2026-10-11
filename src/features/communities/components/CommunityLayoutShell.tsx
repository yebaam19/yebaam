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
import type { CommunityTheme } from '../types/communityTheme.types';
import { communityThemeStyle } from '../lib/community-theme';

interface CommunityLayoutShellProps {
  community: Community;
  viewerState: ViewerJoinState;
  children: ReactNode;
  institutionalNavigation?: ReactNode;
  profileHeader: ReactNode;
  headerImages: HeaderImages | null;
  canManageHeader: boolean;
  theme: CommunityTheme;
}

export function CommunityLayoutShell({
  community: c,
  viewerState,
  children,
  institutionalNavigation,
  profileHeader,
  headerImages,
  canManageHeader,
  theme,
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
        if (!window.confirm(t('detail.joinButton.leaveConfirm'))) return;
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
    if (viewerState.kind === 'member' || c.isMember) return t('detail.joinButton.leave');
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

  const joinAction = viewerState.kind === 'guest' ? (
    <Link
      href={`/login?redirect=${encodeURIComponent(`/feed/comunidades/${c.slug}`)}`}
      className="inline-flex min-h-10 items-center rounded-lg bg-primary-800 px-5 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800"
    >
      {joinButtonLabel}
    </Link>
  ) : viewerState.kind !== 'owner' ? (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleJoinClick}
        disabled={joinButtonDisabled}
        className={`rounded-lg px-5 py-2 text-sm font-medium shadow-md transition-colors ${
          viewerState.kind === 'member' || c.isMember
            ? 'bg-white text-neutral-700 hover:bg-neutral-100'
            : viewerState.kind === 'request_pending'
              ? 'bg-secondary-500 text-neutral-900 hover:bg-secondary-400'
              : 'bg-primary-800 text-white hover:bg-primary-900'
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {joinButtonLabel}
      </button>
      {joinError && <p className="max-w-xs rounded bg-white/90 px-2 py-1 text-right text-xs text-red-600">{joinError}</p>}
    </div>
  ) : null;

  return (
    <div style={communityThemeStyle(theme)} className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {!isArticleRoute && <div className="bg-[var(--community-primary)]"><div className={`relative mx-auto w-full max-w-[90rem] overflow-hidden ${c.coverImageUrl ? 'h-40 sm:h-56 lg:h-72' : 'h-32 sm:h-44'}`}>
        {c.coverImageUrl && (
          <FramedImage src={c.coverImageUrl} alt={c.name} framing={headerImages?.cover.framing} priority />
        )}
        {canManageHeader && headerImages && (
          <div className="absolute right-4 top-4 z-10">
            <CommunityHeaderImageButton communityId={c.id} target="cover" images={headerImages} currentUrl={c.coverImageUrl} />
          </div>
        )}
        {joinAction && <div className="absolute right-4 bottom-20 z-10 hidden sm:block">{joinAction}</div>}
      </div></div>}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {isArticleRoute ? <nav aria-label="Contexto de la comunidad" className="flex min-w-0 items-center gap-2 py-4 text-sm">
          <Link href={`/feed/comunidades/${c.slug}` as Route} className="truncate font-semibold text-primary-800 hover:underline focus-visible:outline-2 dark:text-primary-300">{c.name}</Link>
          <span aria-hidden="true" className="text-neutral-400">/</span>
          <span className="shrink-0 text-neutral-600 dark:text-neutral-300">Artículos</span>
        </nav> : <>
          <div className="relative -mt-10 pb-3 sm:-mt-14 sm:pb-5">{profileHeader}</div>
          {joinAction && <div className="flex justify-end pb-4 sm:hidden">{joinAction}</div>}
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
